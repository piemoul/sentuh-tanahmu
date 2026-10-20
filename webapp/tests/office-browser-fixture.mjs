// Isolated office/calendar browser fixture. No production transport is available.
// Preparation is refreshed at launch; importing this module never starts a server.
import { createHash, createCipheriv } from 'node:crypto';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer, publicRoot } from '../server.mjs';
import { createCalendarOfficeIdDecoder } from '../private/calendar-reference.mjs';

const workspace = path.resolve(publicRoot, '..');
const fixtureRoot = path.join(workspace, 'analysis/webapp/office-browser-fixture');
const reportPath = path.join(workspace, 'analysis/webapp/office-fixture-transport.json');
const manifestPath = path.join(workspace, 'analysis/webapp/office-fixture-source.json');
const hash = value => createHash('sha256').update(value).digest('hex');
const fixtureKey = Buffer.from('0123456789abcdef');
const fixtureIv = Buffer.from('fedcba9876543210');
const decodeOfficeId = createCalendarOfficeIdDecoder(fixtureKey, fixtureIv);
const encryptOfficeId = value => {
  const cipher = createCipheriv('aes-128-cbc', fixtureKey, fixtureIv);
  return Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]).toString('base64');
};
const dateText = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const officePlainIds = Array.from({ length: 26 }, (_, index) => index === 25 ? ''
  : index === 0 ? "fixture-office: A +%!'()*~é" : `fixture-office-${index}`);
const offices = officePlainIds.map((id, index) => ({
  kantorId: id ? encryptOfficeId(id) : '',
  namaKantor: index === 25 ? 'Kantor Tanpa Referensi UJI' : index === 24 ? 'Nama Umum UJI'
    : `Kantor Pertanahan UJI ${String(index + 1).padStart(2, '0')}${index === 0 ? ' <img src=x onerror=alert(1)>' : ''}`,
  alamat: index === 24 ? 'CARIHANYAALAMAT UJI' : `Alamat kantor sintetis ${index + 1}`,
  latitude: -6.1 + index * 0.001, longitude: 106.8 + index * 0.001, jarak: index / 10 + 0.25,
  statusPeralihanEl: index < 24 ? index & 1 : 0,
  statusAntrian: index < 24 ? (index >> 1) & 1 : 0,
  statusKiosk: index < 24 ? (index >> 2) & 1 : 0,
}));

function calendarRows(year) {
  const now = new Date(); const month = now.getMonth();
  const following = new Date(year, month + 1, 1);
  const currentDay = offset => dateText(year, month, Math.min(new Date(year, month + 1, 0).getDate(), now.getDate() + offset));
  return [
    { tanggal: currentDay(0), keterangan: 'Libur Nasional UJI', tipe: 'LIBUR NASIONAL', tipeLiburId: '1' },
    { tanggal: `${currentDay(1)}T00:00:00`, keterangan: 'Hari Libur UJI', tipe: 'HARI LIBUR', tipeLiburId: '2' },
    { tanggal: currentDay(2), keterangan: 'Pelayanan Libur UJI', tipe: 'PELAYANAN HARI LIBUR', tipeLiburId: '3' },
    { tanggal: currentDay(3), keterangan: '<img src=x onerror=alert(1)> <script>UJI INERT</script>', tipe: 'TIPE SUMBER UJI', tipeLiburId: '9' },
    { tanggal: currentDay(4), keterangan: null, tipe: null, tipeLiburId: null },
    { tanggal: dateText(following.getFullYear(), following.getMonth(), 2), keterangan: 'Agenda Bulan Berikut UJI', tipe: 'LIBUR NASIONAL', tipeLiburId: '1' },
    { tanggal: null, keterangan: 'TANGGAL NULL UJI', tipe: null, tipeLiburId: null },
    { tanggal: 'TANGGAL-TIDAK-VALID', keterangan: 'TANGGAL BURUK UJI', tipe: null, tipeLiburId: '2' },
  ];
}

const geolocationScript = `// UJI LOKAL ONLY. This file exists only in the public fixture copy.
(() => {
  let calls = 0;
  const banner = document.getElementById('office-fixture-banner');
  const update = state => { banner.textContent = 'UJI LOKAL — DATA SINTETIS — TANPA KONEKSI ATR/BPN. Lokasi simulasi: ' + calls + ' permintaan; ' + state; };
  const fixture = Object.freeze({
    getCurrentPosition(success, failure) {
      calls++;
      const currentCall = calls;
      update(calls === 1 ? 'izin ditolak' : 'koordinat uji tersedia');
      setTimeout(() => {
        if (currentCall === 1) failure?.({code:1,message:'Izin lokasi ditolak oleh fixture lokal.'});
        else success({coords:{latitude:-6.1,longitude:106.8,accuracy:3,altitude:null,altitudeAccuracy:null,heading:null,speed:null},timestamp:Date.now()});
      }, 0);
    },
    watchPosition() { throw new Error('Fixture hanya menyediakan getCurrentPosition.'); },
    clearWatch() {},
  });
  Object.defineProperty(navigator, 'geolocation', {value:fixture,configurable:true});
  update('belum diminta');
})();
`;

export async function prepareOfficeFixture() {
  // Copy only the same public top-level files served by server.mjs and public assets.
  // No private module, environment file, APK, session store, or credentials are copied.
  const files = ['index.html', 'app.js', 'styles.css', 'domain.js', 'gnss.js',
    'coordinate-comparison.js', 'parcel-map.js'];
  const manifest = [];
  await mkdir(fixtureRoot, { recursive: true });
  async function copy(relative) {
    const source = path.join(publicRoot, relative);
    const destination = path.join(fixtureRoot, relative);
    if (!destination.startsWith(fixtureRoot + path.sep)) throw new Error('Fixture path rejected');
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
    const bytes = await readFile(source);
    manifest.push({ path: relative.split(path.sep).join('/'), sha256: hash(bytes), bytes: bytes.length });
  }
  async function assets(relative) {
    for (const entry of await readdir(path.join(publicRoot, relative), { withFileTypes: true })) {
      const child = path.join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Fixture asset symlink rejected');
      if (entry.isDirectory()) await assets(child);
      else if (entry.isFile()) await copy(child);
    }
  }
  for (const file of files) await copy(file);
  await assets('assets');
  const originalIndex = await readFile(path.join(publicRoot, 'index.html'), 'utf8');
  const appTag = '<script type="module" src="app.js"></script>';
  if (!originalIndex.includes(appTag)) throw new Error('Fixture app entry not found');
  const index = originalIndex.replace('<title>', '<title>UJI LOKAL · ')
    .replace('<body>', '<body><aside id="office-fixture-banner" role="status" style="padding:10px;background:#fff0b8;color:#502e00;font:700 13px system-ui;text-align:center">UJI LOKAL — DATA SINTETIS</aside>')
    .replace(appTag, '<script src="data/office-geolocation-fixture.js"></script>' + appTag);
  await writeFile(path.join(fixtureRoot, 'index.html'), index);
  await mkdir(path.join(fixtureRoot, 'data'), { recursive: true });
  await writeFile(path.join(fixtureRoot, 'data/office-geolocation-fixture.js'), geolocationScript);
  const sourceAppSha256 = hash(await readFile(path.join(publicRoot, 'app.js')));
  const copiedAppSha256 = hash(await readFile(path.join(fixtureRoot, 'app.js')));
  if (sourceAppSha256 !== copiedAppSha256) throw new Error('Fixture app copy mismatch');
  const result = { fixtureOnly: true, sourceAppSha256, copiedAppSha256, appCopyExact: true,
    injectedFiles: ['data/office-geolocation-fixture.js'], indexOnlyChangedForFixture: true,
    copiedPublicFiles: manifest, upstreamNetworkRequests: 0, privateFilesCopied: false };
  await writeFile(manifestPath, JSON.stringify(result, null, 2) + '\n');
  return result;
}

export async function createOfficeFixtureServer() {
  const source = await prepareOfficeFixture();
  const requests = [];
  const assertions = [];
  const counts = { nearby: 0, calendar: 0, rejectedRoute: 0 };
  let reportWrites = Promise.resolve();
  const report = () => ({ fixtureOnly: true, started: true, sourceAppSha256: source.sourceAppSha256,
    appCopyExact: source.appCopyExact, upstreamNetworkRequests: 0, requests: [...requests],
    callCounts: { ...counts }, assertions: [...assertions],
    fixtureCoverage: { nearbyRows: offices.length, blankIdRows: 1, addressOnlySearchSentinel: true,
      flags: 'all eight combinations, AND semantics', firstLocationDenied: true,
      firstNearby503: true, firstCalendar503: true, calendarRows: 8 } });
  const persist = () => {
    const snapshot = JSON.stringify(report(), null, 2) + '\n';
    reportWrites = reportWrites.then(() => writeFile(reportPath, snapshot));
    return reportWrites;
  };
  const check = (id, pass) => { assertions.push({ id, pass: Boolean(pass) }); if (!pass) throw new Error(`Fixture assertion failed: ${id}`); };
  const configuration = Object.freeze({ configured: true, origin: 'https://sentuh.atrbpn.go.id/',
    reason: 'UJI LOKAL: respons sintetis dalam proses; tidak ada koneksi ATR/BPN.',
    applicationAuthorization: () => 'AtrBpn synthetic-fixture-only', calendarOfficeId: decodeOfficeId });
  const server = createServer(fixtureRoot, { configuration, publicOrigin: '', transport: async (url, init) => {
    const entry = { method: init.method, path: url.pathname, status: 500 };
    requests.push(entry);
    try {
      check('fixed-fixture-origin', url.origin === configuration.origin.replace(/\/$/, ''));
      check('post-without-query', init.method === 'POST' && url.search === '');
      let response;
      if (url.pathname === '/kantornearby/getkantornearby') {
        counts.nearby++;
        check('nearby-json-header', new Headers(init.headers).get('content-type') === 'application/json');
        const body = JSON.parse(init.body);
        check('nearby-exact-fields', JSON.stringify(Object.keys(body).sort()) === JSON.stringify(['isKalender','latitude','limit','longitude','radius']));
        check('nearby-synthetic-position-and-native-defaults', body.latitude === -6.1 && body.longitude === 106.8 && body.radius === 0.1 && body.isKalender === 1 && body.limit === null);
        response = counts.nearby === 1
          ? Response.json({ error: true, message: 'Daftar kantor UJI sementara tidak tersedia' }, { status: 503 })
          : Response.json({ error: false, message: null, totalRecords: offices.length, resultsCount: offices.length, pageSize: offices.length, pageNumber: 1, data: offices });
      } else if (url.pathname === '/KantorNearby/GetCalendar') {
        counts.calendar++;
        check('calendar-form-header', new Headers(init.headers).get('content-type') === 'application/x-www-form-urlencoded');
        const body = new URLSearchParams(init.body);
        check('calendar-exact-fields', JSON.stringify([...body.keys()].sort()) === JSON.stringify(['kantorId','tahun']));
        check('calendar-reference-was-decrypted', Boolean(body.get('kantorId')) && officePlainIds.includes(body.get('kantorId')));
        check('calendar-current-year', body.get('tahun') === String(new Date().getFullYear()));
        response = counts.calendar === 1
          ? Response.json({ error: true, message: 'Kalender UJI sementara tidak tersedia' }, { status: 503 })
          : Response.json({ error: false, message: null, data: calendarRows(Number(body.get('tahun'))) });
      } else {
        counts.rejectedRoute++;
        check('route-is-office-or-calendar', false);
      }
      entry.status = response.status;
      return response;
    } finally { await persist(); }
  } });
  await persist();
  return { server, report, persist, source };
}

async function main() {
  const fixture = await createOfficeFixtureServer();
  const port = Number(process.env.OFFICE_FIXTURE_PORT || 4175);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid fixture port');
  fixture.server.listen(port, '127.0.0.1', () => console.log(`UJI LOKAL ONLY http://127.0.0.1:${port}/#/office — synthetic data, no upstream network`));
  const stop = async () => { await fixture.persist(); fixture.server.close(); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
