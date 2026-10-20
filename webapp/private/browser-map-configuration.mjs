// Public provider metadata only. APK/WMS credentials never enter this object.
// The current OSM+Bhumi stack needs no Google or per-account browser key.
export function browserMapConfiguration() {
  return Object.freeze({provider:'openstreetmap',mapType:'standard',wmsTileTemplate:'/api/maps/bhumi/{z}/{x}/{y}.png'});
}
export const DEFAULT_CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://www.atrbpn.go.id https://tile.openstreetmap.org; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";
