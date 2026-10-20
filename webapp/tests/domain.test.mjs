import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCoordinates, parseGeoJSON, toGeoJSON, estimateCost, escapeHTML } from '../domain.js';

test('coordinates preserve latitude/longitude bounds and reject misleading coercion', () => {
  assert.deepEqual(validateCoordinates('-6.2', '106.816666'), { lat: -6.2, lng: 106.816666 });
  assert.deepEqual(validateCoordinates(-90, 180), { lat: -90, lng: 180 });
  for (const [lat, lng] of [[91, 0], [0, -181], ['', 0], [' ', 0], [null, 0], [true, 0], [[], 0], [{}, 0], [Infinity, 0], ['NaN', 0]]) {
    assert.throws(() => validateCoordinates(lat, lng), `${JSON.stringify([lat, lng])} should be invalid`);
  }
});
test('GeoJSON roundtrip preserves longitude-first coordinate order and user notes', () => {
  const points = [{ name: 'Titik uji', lat: -6.2, lng: 106.8, note: 'Catatan lokal' }];
  const exported = toGeoJSON(points);
  assert.deepEqual(exported.features[0].geometry.coordinates, [106.8, -6.2]);
  assert.deepEqual(parseGeoJSON(JSON.stringify(exported)), points);
});
test('GeoJSON rejects unsupported geometries, malformed objects and oversized collections atomically', () => {
  const point = { type: 'Feature', geometry: { type: 'Point', coordinates: [106.8, -6.2] }, properties: {} };
  const fc = features => ({ type: 'FeatureCollection', features });
  for (const value of [null, {}, fc([]), fc([null]), fc([{ ...point, geometry: { type: 'Polygon', coordinates: [] } }]), fc([{ ...point, geometry: { type: 'Point', coordinates: ['106.8', '-6.2'] } }]), fc([{ ...point, geometry: { type: 'Point', coordinates: [181, 0] } }]), fc(Array(501).fill(point))]) {
    assert.throws(() => parseGeoJSON(value));
  }
  assert.throws(() => parseGeoJSON('{broken'));
  assert.equal(parseGeoJSON(fc([point])).length, 1);
});
test('cost estimator uses only caller rates, rejects overflow and blank/negative values', () => {
  assert.equal(estimateCost(100, 2500, 10000), 260000);
  assert.equal(estimateCost(0, 0, 0), 0);
  for (const values of [[-1, 2, 3], [1, '', 3], [1, ' ', 3], [1, true, 3], [1e308, 1e308, 0], [NaN, 1, 0]]) {
    assert.throws(() => estimateCost(...values));
  }
});
test('user-supplied text is safe in HTML contexts', () => {
  assert.equal(escapeHTML('<img src=x onerror="evil()"> & \'quoted\''), '&lt;img src=x onerror=&quot;evil()&quot;&gt; &amp; &#39;quoted&#39;');
});
