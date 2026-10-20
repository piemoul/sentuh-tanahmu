// Coordinate preparation only. This module never changes device/browser location.
const MAX_POINTS = 500;
const MAX_BYTES = 2 * 1024 * 1024;
const SOURCES = new Set(['external_gnss', 'survey', 'browser']);
const OPTIONAL = value => value === undefined || value === null || value === '';
const number = (value, label) => {
  if (!['string', 'number'].includes(typeof value) || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(String(value).trim()) || !Number.isFinite(Number(value))) {
    throw new Error(`${label} harus berupa angka yang valid.`);
  }
  return Number(value);
};
const shortText = (value, limit) => String(value ?? '').slice(0, limit);
function validateCrs(crs) {
  if (OPTIONAL(crs)) return 'EPSG:4326';
  const normalized = String(crs).trim().toUpperCase().replace(/\s/g, '');
  if (!['EPSG:4326', 'WGS84', 'WGS-84', 'OGC:CRS84', 'URN:OGC:DEF:CRS:OGC:1.3:CRS84', 'URN:OGC:DEF:CRS:EPSG::4326'].includes(normalized)) {
    throw new Error('Gunakan koordinat geografis WGS84 / EPSG:4326 dalam derajat desimal. Proyeksi lain harus ditransformasikan terlebih dahulu.');
  }
  return 'EPSG:4326';
}
function timestamp(value) {
  if (OPTIONAL(value)) return null;
  // Require an explicit timezone; never silently infer the survey's timezone.
  const raw = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i.test(raw) || !Number.isFinite(Date.parse(raw))) {
    throw new Error('Waktu pengukuran harus berupa ISO 8601 dengan zona waktu, misalnya 2026-10-18T09:30:00+07:00.');
  }
  const year = Number(raw.slice(0, 4)), month = Number(raw.slice(5, 7)), day = Number(raw.slice(8, 10));
  if (month < 1 || month > 12 || day < 1 || day > new Date(Date.UTC(year, month, 0)).getUTCDate()) throw new Error('Tanggal pengukuran tidak valid.');
  if (Number(raw.slice(11, 13)) > 23 || Number(raw.slice(14, 16)) > 59 || (raw[16] === ':' && Number(raw.slice(17, 19)) > 59)) throw new Error('Jam pengukuran tidak valid.');
  return new Date(raw).toISOString();
}

export function normalizePoint(input) {
  if (!input || typeof input !== 'object') throw new Error('Data titik tidak valid.');
  const latitude = number(input.latitude, 'Lintang'), longitude = number(input.longitude, 'Bujur');
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) throw new Error('Lintang harus -90 sampai 90, dan bujur -180 sampai 180.');
  const source = input.source ?? 'survey';
  if (!SOURCES.has(source)) throw new Error('Pilih sumber koordinat: GNSS eksternal, hasil pengukuran, atau lokasi browser.');
  const crs = validateCrs(input.crs);
  const accuracy = OPTIONAL(input.accuracy) ? null : number(input.accuracy, 'Akurasi horizontal');
  if (accuracy !== null && accuracy < 0) throw new Error('Akurasi horizontal tidak boleh negatif.');
  const measuredAt = timestamp(input.measuredAt);
  const warnings = [];
  if (accuracy === null) warnings.push('Akurasi horizontal tidak disertakan; banyak angka desimal tidak membuktikan akurasi.');
  if (accuracy === 0) warnings.push('Akurasi nol dilaporkan oleh sumber; periksa kembali hasil pengukuran.');
  if (!measuredAt) warnings.push('Waktu pengukuran belum disertakan.');
  if (measuredAt && new Date(measuredAt).getTime() > Date.now() + 5 * 60_000) warnings.push('Waktu pengukuran berada di masa depan; periksa jam sumber.');
  if (source === 'browser') warnings.push('Lokasi browser dapat berasal dari GPS, Wi-Fi, atau jaringan. Periksa kecocokannya di lapangan.');
  return {
    id: shortText(input.id || globalThis.crypto?.randomUUID?.() || `point-${Date.now()}-${Math.random().toString(36).slice(2)}`, 100),
    latitude, longitude, source, accuracy, measuredAt, crs,
    name: shortText(input.name || 'Titik pengukuran', 100), note: shortText(input.note, 1000),
    original: { latitude: shortText(input.original?.latitude ?? input.latitude, 100), longitude: shortText(input.original?.longitude ?? input.longitude, 100) },
    warnings,
  };
}

function limited(points) {
  if (!points.length || points.length > MAX_POINTS) throw new Error(`Impor harus berisi 1–${MAX_POINTS} titik yang valid.`);
  return points;
}
function parseCsvRows(text) {
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') { quoted = false; closed = true; }
      else field += char;
    } else if (char === '"') {
      if (field || closed) throw new Error('Format kutipan CSV tidak valid.');
      quoted = true;
    } else if (char === ',' || char === '\n' || char === '\r') {
      row.push(field); field = ''; closed = false;
      if (char !== ',') {
        if (row.some(cell => cell.trim())) rows.push(row);
        row = [];
        if (char === '\r' && text[i + 1] === '\n') i++;
      }
    } else {
      if (closed && char.trim()) throw new Error('Ada karakter setelah kutipan CSV ditutup.');
      if (!closed) field += char;
    }
  }
  if (quoted) throw new Error('Kutipan CSV belum ditutup.');
  row.push(field);
  if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
}
function parseCsv(text) {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('CSV memerlukan header dan sedikitnya satu baris titik.');
  const aliases = { lat: 'latitude', lintang: 'latitude', lon: 'longitude', lng: 'longitude', bujur: 'longitude', accuracy_m: 'accuracy', measured_at: 'measuredAt', measuredat: 'measuredAt' };
  const headers = rows.shift().map(x => aliases[x.trim().toLowerCase()] || x.trim().toLowerCase());
  if (!headers.includes('latitude') || !headers.includes('longitude')) throw new Error('Header CSV harus memuat latitude,longitude (atau lat,lon).');
  if (new Set(headers).size !== headers.length) throw new Error('Header CSV tidak boleh berulang.');
  return limited(rows.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`Jumlah kolom CSV baris ${index + 2} tidak sesuai header.`);
    const data = Object.fromEntries(headers.map((header, i) => [header, values[i].trim()]));
    return normalizePoint({ ...data, source: data.source || 'survey', name: data.name || `Titik ${index + 1}` });
  }));
}
function parseGeoJson(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Isi GeoJSON bukan JSON yang valid.'); }
  if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('Gunakan GeoJSON FeatureCollection yang berisi Point.');
  if (data.crs) {
    if (data.crs.type !== 'name' || !data.crs.properties?.name) throw new Error('CRS GeoJSON tidak dikenali. Gunakan WGS84 / EPSG:4326.');
    validateCrs(data.crs.properties.name);
  }
  limited(data.features);
  return data.features.map((feature, index) => {
    const coordinates = feature?.geometry?.coordinates;
    if (feature?.type !== 'Feature' || feature.geometry?.type !== 'Point' || !Array.isArray(coordinates) || coordinates.length < 2 || coordinates.slice(0, 2).some(x => typeof x !== 'number')) throw new Error(`Fitur ${index + 1} harus berupa Point dengan urutan [bujur, lintang].`);
    const properties = feature.properties || {};
    return normalizePoint({ ...properties, latitude: coordinates[1], longitude: coordinates[0], source: properties.source || 'survey', name: properties.name || `Titik ${index + 1}`, crs: properties.crs || 'EPSG:4326' });
  });
}

function nmeaDegrees(raw, hemisphere, latitude) {
  const width = latitude ? 2 : 3;
  if (!(latitude ? /^\d{4}(?:\.\d+)?$/ : /^\d{5}(?:\.\d+)?$/).test(raw) || !(latitude ? ['N', 'S'] : ['E', 'W']).includes(hemisphere)) throw new Error('Koordinat atau hemisfer NMEA tidak valid.');
  const minutes = Number(raw.slice(width));
  if (minutes >= 60) throw new Error('Menit koordinat NMEA harus kurang dari 60.');
  const degrees = Number(raw.slice(0, width)) + minutes / 60;
  return ['S', 'W'].includes(hemisphere) ? -degrees : degrees;
}
function nmeaDate(date, time) {
  if (!/^\d{6}$/.test(date) || !/^\d{6}(?:\.\d+)?$/.test(time)) throw new Error('Waktu RMC tidak valid.');
  const year = Number(date.slice(4));
  // NMEA uses a two-digit year; preserve the conventional 1980–2079 window.
  const fullYear = year >= 80 ? 1900 + year : 2000 + year;
  return timestamp(`${fullYear}-${date.slice(2, 4)}-${date.slice(0, 2)}T${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4)}Z`);
}
export function parseNmea(text) {
  if (typeof text !== 'string' || text.length > MAX_BYTES) throw new Error('File NMEA terlalu besar atau tidak valid (maksimum 2 MB).');
  const points = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!/^\$[A-Z]{2}(GGA|RMC),/.test(line)) continue;
    const match = /^\$([^*]+)\*([0-9A-Fa-f]{2})$/.exec(line);
    if (!match) throw new Error('Setiap kalimat GGA/RMC harus memiliki checksum NMEA yang valid.');
    let checksum = 0;
    for (const char of match[1]) checksum ^= char.charCodeAt(0);
    if (checksum !== parseInt(match[2], 16)) throw new Error('Checksum NMEA tidak cocok; periksa file atau koneksi penerima.');
    const parts = match[1].split(','), type = parts[0].slice(-3);
    let latitude, longitude, measuredAt = null, note;
    if (type === 'GGA') {
      if (!/^[1-5]$/.test(parts[6])) continue; // Exclude invalid, estimated, manual, and simulated fixes.
      latitude = nmeaDegrees(parts[2], parts[3], true);
      longitude = nmeaDegrees(parts[4], parts[5], false);
      note = `NMEA ${parts[0]}; kualitas fix ${parts[6]}; satelit ${parts[7] || 'tidak diketahui'}; HDOP ${parts[8] || 'tidak diketahui'}. HDOP bukan akurasi dalam meter. GGA tidak menyertakan tanggal.`;
    } else {
      if (parts[2] !== 'A' || (parts[12] && !['A', 'D', 'F', 'R', 'P'].includes(parts[12]))) continue; // Exclude invalid, estimated, manual, and simulated fixes.
      latitude = nmeaDegrees(parts[3], parts[4], true);
      longitude = nmeaDegrees(parts[5], parts[6], false);
      measuredAt = nmeaDate(parts[9], parts[1]);
      note = `NMEA ${parts[0]}; status fix aktif. RMC tidak menyertakan akurasi horizontal dalam meter.`;
    }
    points.push(normalizePoint({ latitude, longitude, source: 'external_gnss', measuredAt, note, name: `GNSS ${points.length + 1}` }));
    if (points.length > MAX_POINTS) throw new Error(`Impor dibatasi ${MAX_POINTS} titik. Potong rekaman NMEA terlebih dahulu.`);
  }
  return limited(points);
}

export function parseCoordinateFile(text, format) {
  if (typeof text !== 'string' || text.length > MAX_BYTES) throw new Error('File koordinat terlalu besar atau tidak valid (maksimum 2 MB).');
  const type = String(format || '').toLowerCase().replace(/^\./, '');
  if (type === 'csv') return parseCsv(text);
  if (['geojson', 'json'].includes(type)) return parseGeoJson(text);
  if (['nmea', 'nme', 'log', 'txt'].includes(type)) return parseNmea(text);
  throw new Error('Pilih file CSV, GeoJSON, atau NMEA.');
}

export function toGeotagFields(point) {
  const validated = normalizePoint(point);
  return { Lat: validated.latitude.toFixed(7), Longi: validated.longitude.toFixed(7) };
}
export function toGeoJSON(points) {
  limited(points);
  return {
    type: 'FeatureCollection',
    features: points.map(input => {
      const point = normalizePoint(input);
      const { id, name, source, accuracy, measuredAt, crs, note, original } = point;
      return { type: 'Feature', properties: { id, name, source, accuracy, measuredAt, crs, note, original }, geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] } };
    }),
  };
}
