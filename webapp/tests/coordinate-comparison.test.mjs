import test from 'node:test';
import assert from 'node:assert/strict';
import { compareCoordinates } from '../coordinate-comparison.js';
const point = (latitude, longitude) => ({ latitude, longitude, crs: 'EPSG:4326' });
test('identical coordinates do not establish presence or invent a direction', () => {
  const result = compareCoordinates(point(-6, 106), point(-6, 106));
  assert.equal(result.distanceMeters, 0); assert.equal(result.bearingDegrees, null);
  assert.equal(result.comparisonOnly, true); assert.equal(result.provesPresence, false);
  assert.ok(!Object.hasOwn(result, 'passed')); assert.ok(!Object.hasOwn(result, 'Lat'));
});
test('equatorial distance, cardinal direction and antimeridian use the shortest separation', () => {
  const east = compareCoordinates(point(0, 0), point(0, 1));
  assert.ok(Math.abs(east.distanceMeters - 111319.4908) < 0.001); assert.equal(east.bearingDegrees, 90);
  const cross = compareCoordinates(point(0, 179.999), point(0, -179.999));
  assert.ok(Math.abs(cross.distanceMeters - 222.63898) < 0.001); assert.equal(cross.bearingDegrees, 90);
  const west = compareCoordinates(point(0, 1), point(0, 0)); assert.equal(west.bearingDegrees, 270);
});
test('invalid or projected reference coordinates are not silently interpreted as WGS84', () => {
  for (const reference of [point(91, 0), point('', 0), { ...point(10, 20), crs: 'EPSG:3857' }, point(true, 0)]) assert.throws(() => compareCoordinates(reference, point(0, 0)));
  const antipodal = compareCoordinates(point(0, 0), point(0, 180));
  assert.ok(Number.isFinite(antipodal.distanceMeters)); assert.equal(antipodal.bearingDegrees, null);
});
