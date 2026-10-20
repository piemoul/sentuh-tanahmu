// Local comparison of two supplied coordinates. This neither measures the
// device's current position nor verifies a cadastral boundary or site visit.
import { normalizePoint } from './gnss.js';
const radians = degrees => degrees * Math.PI / 180;
const degrees = radians => radians * 180 / Math.PI;
// Matches the spherical distance radius recovered from APK helper 0x751870.
// This remains an approximate distance, not an ellipsoidal surveying result.
const earthRadiusMeters = 6_378_137;
export function compareCoordinates(reference, measured) {
  const a = normalizePoint(reference), b = normalizePoint(measured);
  const phi1 = radians(a.latitude), phi2 = radians(b.latitude);
  const deltaLatitude = b.latitude - a.latitude;
  const deltaLongitude = ((b.longitude - a.longitude + 540) % 360) - 180;
  const dPhi = radians(deltaLatitude), dLambda = radians(deltaLongitude);
  const haversine = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  const angle = 2 * Math.atan2(Math.sqrt(Math.max(0, Math.min(1, haversine))), Math.sqrt(Math.max(0, 1 - haversine)));
  const distanceMeters = earthRadiusMeters * angle;
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const bearingDegrees = distanceMeters < 0.001 || Math.abs(Math.PI - angle) < 1e-10 ? null : (degrees(Math.atan2(y, x)) + 360) % 360;
  return { distanceMeters, bearingDegrees, deltaLatitude, deltaLongitude,
    reference: { latitude: a.latitude, longitude: a.longitude }, measured: { latitude: b.latitude, longitude: b.longitude },
    method: 'spherical-distance', comparisonOnly: true, provesPresence: false };
}
