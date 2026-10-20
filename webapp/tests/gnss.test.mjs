import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePoint, parseCoordinateFile, parseNmea, toGeotagFields, toGeoJSON } from '../gnss.js';

const measured = { latitude: '-6.123456789', longitude: '106.987654321', source: 'survey', measuredAt: '2026-10-18T09:30:00+07:00', accuracy: '0.02' };
const sentence = text => `$${text}*${[...text].reduce((a, c) => a ^ c.charCodeAt(0), 0).toString(16).padStart(2, '0').toUpperCase()}`;

test('retains original precision and measurement provenance; geotag mapping uses exact keys and axes', () => {
  const point = normalizePoint(measured);
  assert.equal(point.original.latitude, '-6.123456789');
  assert.equal(point.accuracy, 0.02);
  assert.equal(point.measuredAt, '2026-10-18T02:30:00.000Z');
  assert.deepEqual(toGeotagFields(point), { Lat: '-6.1234568', Longi: '106.9876543' });
  assert.equal(point.latitude, -6.123456789);
});
test('missing accuracy/time are unknown rather than invented; rejects invalid input and untransformed CRS', () => {
  const point = normalizePoint({ latitude: 0, longitude: 0 });
  assert.equal(point.accuracy, null);
  assert.equal(point.measuredAt, null);
  assert.equal(point.warnings.length, 2);
  for (const latitude of ['', ' ', true, null, [], Infinity, 91, '0x10']) assert.throws(() => normalizePoint({ ...measured, latitude }));
  for (const patch of [{ longitude: -181 }, { accuracy: -1 }, { crs: 'EPSG:3857' }, { measuredAt: '2026-02-30T00:00:00Z' }, { measuredAt: '2026-10-18T10:00' }, { measuredAt: '2026-10-18T24:00:00Z' }, { source: 'spoof' }]) assert.throws(() => normalizePoint({ ...measured, ...patch }));
});
test('CSV respects quoted cells, explicit axes and original precision', () => {
  const points = parseCoordinateFile('name,lat,lon,accuracy_m,measured_at\r\n"Patok, A",-6.123456789,106.987654321,0.02,2026-10-18T09:30:00+07:00', 'csv');
  assert.equal(points[0].name, 'Patok, A');
  assert.equal(points[0].longitude, 106.987654321);
  assert.equal(points[0].original.latitude, '-6.123456789');
  assert.equal(points[0].measuredAt, '2026-10-18T02:30:00.000Z');
  assert.throws(() => parseCoordinateFile('lat,latitude,lon\n1,2,3', 'csv'));
  assert.throws(() => parseCoordinateFile('latitude,longitude\n1', 'csv'));
});
test('GeoJSON coordinates use longitude,latitude and exported provenance survives import', () => {
  const geojson = toGeoJSON([normalizePoint(measured)]);
  assert.deepEqual(geojson.features[0].geometry.coordinates, [106.987654321, -6.123456789]);
  const [point] = parseCoordinateFile(JSON.stringify(geojson), 'geojson');
  assert.equal(point.original.latitude, '-6.123456789');
  assert.equal(point.accuracy, 0.02);
  assert.throws(() => parseCoordinateFile(JSON.stringify({ ...geojson, crs: { type: 'name', properties: { name: 'EPSG:3857' } } }), 'json'));
  assert.throws(() => parseCoordinateFile(JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [] } }] }), 'json'));
});
test('NMEA validates checksum and hemispheres; never treats HDOP as accuracy', () => {
  const [point] = parseNmea(sentence('GNGGA,093000.00,0607.407407,S,10659.259259,E,4,12,0.7,30.0,M,0.0,M,,'));
  assert.ok(Math.abs(point.latitude - -6.123456783333333) < 1e-12);
  assert.equal(point.source, 'external_gnss');
  assert.equal(point.measuredAt, null);
  assert.equal(point.accuracy, null);
  assert.match(point.note, /HDOP 0.7/);
  assert.throws(() => parseNmea('$GNGGA,093000.00,0607.407407,S,10659.259259,E,4,12,0.7,30.0,M,0.0,M,,*00'));
});
test('RMC date is UTC and invalid/simulated/estimated fixes are excluded', () => {
  const valid = 'GNRMC,093000.00,A,0607.407407,S,10659.259259,E,0.0,0.0,181026,,,D';
  assert.equal(parseNmea(sentence(valid))[0].measuredAt, '2026-10-18T09:30:00.000Z');
  for (const raw of [valid.replace(',A,', ',V,'), valid.slice(0, -1) + 'S', valid.slice(0, -1) + 'E', 'GNGGA,093000.00,0607.407407,S,10659.259259,E,0,12,0.7,30.0,M,0.0,M,,']) assert.throws(() => parseNmea(sentence(raw)));
  for (const quality of [6, 7, 8]) assert.throws(() => parseNmea(sentence(`GNGGA,093000.00,0607.407407,S,10659.259259,E,${quality},12,0.7,30.0,M,0.0,M,,`)));
});
