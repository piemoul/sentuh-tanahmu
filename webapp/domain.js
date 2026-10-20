export const STORAGE_KEY = 'sentuh-tanahku-local-v1';
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const numericInput = value => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value));
export function validateCoordinates(latitude, longitude) {
  if (!numericInput(latitude) || !numericInput(longitude)) throw new Error('Isi lintang dan bujur dengan angka yang valid.');
  const lat = Number(latitude), lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) throw new Error('Lintang harus -90 sampai 90, dan bujur -180 sampai 180.');
  return { lat, lng };
}
export function parseGeoJSON(input) {
  const data = typeof input === 'string' ? JSON.parse(input) : input;
  if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Gunakan GeoJSON FeatureCollection berisi titik (Point).');
  if (!data.features.length || data.features.length > 500) throw new Error('Impor harus berisi 1–500 titik.');
  return data.features.map((f, i) => {
    if (f?.type !== 'Feature' || f.geometry?.type !== 'Point' || !Array.isArray(f.geometry.coordinates) || f.geometry.coordinates.length < 2 || f.geometry.coordinates.slice(0,2).some(n => typeof n !== 'number')) throw new Error(`Fitur ${i+1} bukan titik koordinat yang valid.`);
    const {lat, lng} = validateCoordinates(f.geometry.coordinates[1], f.geometry.coordinates[0]);
    return {lat, lng, name: String(f.properties?.name || `Lokasi ${i+1}`).slice(0,100), note: String(f.properties?.note || '').slice(0,500)};
  });
}
export function toGeoJSON(points) {
  return {type:'FeatureCollection',features:points.map(p=>{const {lat,lng}=validateCoordinates(p.lat,p.lng);return {type:'Feature',properties:{name:String(p.name||''),note:String(p.note || '')},geometry:{type:'Point',coordinates:[lng,lat]}};})};
}
export function estimateCost(area, rate, fixed) {
  const values = [area,rate,fixed].map(Number);
  if ([area,rate,fixed].some(v=>!numericInput(v)) || values.some(n=>n<0) || !Number.isFinite(values[0]*values[1]+values[2])) throw new Error('Masukkan angka nol atau lebih pada semua kolom.');
  return values[0]*values[1]+values[2];
}
