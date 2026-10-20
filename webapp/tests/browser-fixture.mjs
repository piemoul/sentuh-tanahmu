// Browser QA harness. Responses are generated in this process; no upstream network calls.
// Start separately from the real local adapter. Never use a real account here.
import { createServer } from '../server.mjs';
const configuration = {
  configured: true,
  origin: 'https://sentuh.atrbpn.go.id/',
  reason: 'UJI LOKAL: semua respons berasal dari fixture dalam proses; tidak ada koneksi ATR/BPN.',
  applicationAuthorization: () => 'AtrBpn fixture-application-only',
};
const user = { username: 'fixture-local-only', email: 'fixture@example.invalid', nomorIndukKependudukan: '0000000000000000', roleUser: 'PERORANGAN', userLevel: 1, statusVerifikasi: 1, isIkd: false };
const token = { tokenType: 'Bearer', accessToken: 'fixture-access-never-real', refreshToken: 'fixture-refresh-never-real', expiredAt: Math.floor(Date.now() / 1000) + 3600 };
function fixturePdf(title) {
const pdfObjects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
const pdfText = `BT /F1 18 Tf 45 780 Td (${title}) Tj 0 -32 Td /F1 11 Tf (Data sintetis. Bukan dokumen pertanahan resmi.) Tj ET`;
pdfObjects.push(`<< /Length ${Buffer.byteLength(pdfText)} >>\nstream\n${pdfText}\nendstream`);
let pdfSource='%PDF-1.4\n', pdfOffsets=[0];
for(const [index,object] of pdfObjects.entries()){pdfOffsets.push(Buffer.byteLength(pdfSource));pdfSource+=`${index+1} 0 obj\n${object}\nendobj\n`;}
const pdfXref=Buffer.byteLength(pdfSource);pdfSource+=`xref\n0 ${pdfOffsets.length}\n0000000000 65535 f \n${pdfOffsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size ${pdfOffsets.length} /Root 1 0 R >>\nstartxref\n${pdfXref}\n%%EOF\n`;
return Buffer.from(pdfSource);
}
const spsPdf=fixturePdf('DOKUMEN SPS - UJI LOKAL');
const kkprPdf=fixturePdf('DOKUMEN KKPR - UJI LOKAL');
const activityPdf=fixturePdf('DOKUMEN AKTIVITAS - UJI LOKAL');
const certificatePdf=fixturePdf('DOKUMEN SERTIPIKAT - UJI LOKAL');
const activityDocumentId="fixture-activity-document: A +%!'()*~é";
let documentGeoCalls=0;
let certificateDocumentCalls=0;
let profileCalls=0;
let mitraPpatCalls=0;
let searchFileOfficeCalls=0;
let informationListCalls=0;
let informationDetailCalls=0;
const informationSimulationCalls=new Map();
const informationProvinceId="fixture-province: A +%!'()*~é";
const informationFixtureId="fixture-information: A +%!'()*~é";
const informationRows=Array.from({length:26},(_,index)=>({layananId:index===25?null:index===0?informationFixtureId:`fixture-information-${index}`,nama:`Layanan UJI ${String(index+1).padStart(2,'0')}`,deskripsi:index===0?'Deskripsi daftar UJI <img src=x onerror=alert(1)>':`Deskripsi pilihan ${index+1}`,grup:index===0||index===3?'Grup pertama':index===1?'Grup kedua':index===2?null:index===4?'':'Grup lainnya',tipeSimulasi:0}));
const searchFileOfficeId="fixture-search-office: A +%!'()*~é";
const searchFileOffices=[...Array.from({length:24},(_,i)=>({KantorId:i===23?searchFileOfficeId:`fixture-search-office-${i}`,Nama:`Kantor Pertanahan UJI ${String(i+1).padStart(2,'0')}`,TipeKantorId:3})),{KantorId:null,Nama:'Kantor tanpa referensi UJI',TipeKantorId:null},{KantorId:'fixture-null-office-name',Nama:null}];
const mitraOfficeId="fixture-office: A +%!'()*~é";
const mitraRegionId="fixture-region: A +%!'()*~é";
const mitraOffices=Array.from({length:24},(_,i)=>({kantorId:i===0?mitraOfficeId:`fixture-office-${i}`,nama:`Kantor Pertanahan Kota UJI ${String(i+1).padStart(2,'0')}`,kode:`UJI-${i}`}));
const requests = [];
const server = createServer({ configuration, transport: async (url, init) => {
  requests.push({ method: init.method, path: url.pathname });
  if (url.pathname === '/account/account_summary') {
    profileCalls++;
    if (process.env.FIXTURE_PROFILE_SEQUENCE === '1' && profileCalls === 3) return Response.json({error:true,message:'Profil UJI sementara tidak tersedia'}, {status:503});
  }
  if (process.env.FIXTURE_INVALID_DOCUMENT_PROFILE === '1' && url.pathname === '/account/account_summary') return Response.json({error:null,data:{nama:'Nama akun UJI LOKAL & +'}});
  if (process.env.FIXTURE_EMPTY_NATIVE_LISTS === '1' && ['/activity/GetUserActivity', '/KKPR/GetKKPRList'].includes(url.pathname)) return Response.json({ error: false, message: '-' });
  let data;
  if (url.pathname === '/auth/signin') data = { ...user, token };
  else if (url.pathname === '/account/account_summary') data = { ...user, nama: 'Nama akun UJI LOKAL & +', status: 'UJI LOKAL', message: '<img src=x onerror=alert(1)>', token: 'fixture-sensitive-value', ...(process.env.FIXTURE_SEARCHFILE_SEQUENCE==='1'?{kantorId:searchFileOfficeId}:{}) };
  else if (url.pathname === '/legacy/Kantah') {
    if(init.method!=='GET'||url.searchParams.get('nama')!==''||url.searchParams.get('tipeKantor')!=='3,2,1'||init.body!==undefined)throw new Error('Unexpected synthetic Cari Berkas office query');
    searchFileOfficeCalls++;
    if(process.env.FIXTURE_SEARCHFILE_SEQUENCE==='1'&&searchFileOfficeCalls===1)return Response.json({error:true,message:'Daftar kantor UJI sementara tidak tersedia'},{status:503});
    return Response.json(searchFileOffices);
  }
  else if (url.pathname === '/InfoLayanan/GetInfoLayanan') {
    if(init.method!=='GET'||url.search||init.body!==undefined)throw new Error('Unexpected synthetic Info Layanan list request');
    informationListCalls++;
    if(process.env.FIXTURE_INFORMATION_SEQUENCE==='1'&&informationListCalls===1)return Response.json({error:true,message:'Daftar UJI sementara tidak tersedia'},{status:503});
    data=process.env.FIXTURE_INFORMATION_SEQUENCE==='1'?informationRows:[{layananId:'fixture-service',nama:'Layanan UJI LOKAL',deskripsi:'Respons buatan untuk memeriksa antarmuka.',grup:'Informasi',tipeSimulasi:0}];
  }
  else if (url.pathname === '/InfoLayanan/GetInfoLayananDetail') {
    informationDetailCalls++;
    if(init.method!=='GET'||init.body!==undefined)throw new Error('Unexpected synthetic Info Layanan detail request');
    if(process.env.FIXTURE_INFORMATION_SEQUENCE==='1'){
      if(!informationRows.some(item=>item.layananId===url.searchParams.get('id')))throw new Error('Unexpected synthetic Info Layanan selected ID');
      if(informationDetailCalls===1)return Response.json({error:true,message:'Detail UJI sementara tidak tersedia'},{status:503});
    }
    data={layananId:url.searchParams.get('id'),nama:'Judul detail dari layanan UJI',persayaratan:['Syarat pertama UJI','', '<script>teks inert UJI</script>'],penyelesaian:['Waktu simulasi'],keterangan:[],tarif:'',tipeSimulasi:0};
    if(process.env.FIXTURE_INFORMATION_SIMULATION==='1'){
      const index=informationRows.findIndex(item=>item.layananId===url.searchParams.get('id'));
      data={...data,layananId:`${url.searchParams.get('id')}:returned`,nama:`Detail layanan UJI ${index+1}`,tipeSimulasi:index>=0&&index<6?index+1:0};
    }
  }
  else if (url.pathname === '/InfoLayanan/GetProvinsi') {
    if(init.method!=='GET'||url.search||init.body!==undefined)throw new Error('Unexpected synthetic province request');
    data=[{wilayahId:informationProvinceId,namaWilayah:'Provinsi UJI'},{wilayahId:null,namaWilayah:'Referensi kosong UJI'}];
  }
  else if (/^\/InfoLayanan\/SimulasiTipe[1-6]$/.test(url.pathname)) {
    if(init.method!=='POST'||init.headers['Content-Type']!=='application/json')throw new Error('Unexpected synthetic simulation transport');
    const type=Number(url.pathname.at(-1)),values=JSON.parse(init.body),keys=type===2?['WilayahId','data']:type===4?['NilaiPerMeter','Luas']:['WilayahId','Luas','Penggunaan',...[1,6].includes(type)?['Prosedur']:type===3?['LayananId']:['Kewenangan']];
    if(JSON.stringify(Object.keys(values).sort())!==JSON.stringify(keys.sort()))throw new Error('Unexpected synthetic simulation keys');
    if(type!==4&&values.WilayahId!==informationProvinceId)throw new Error('Unexpected synthetic selected province');
    if(type===3&&values.LayananId!=='fixture-information-2:returned')throw new Error('Simulation type3 must use returned detail ID');
    if(type===2&&(!values.data.length||values.data.some(row=>JSON.stringify(Object.keys(row).sort())!==JSON.stringify(['Jumlah','Luas','Penggunaan']))))throw new Error('Unexpected synthetic parcel model');
    const count=(informationSimulationCalls.get(type)||0)+1;informationSimulationCalls.set(type,count);
    if(process.env.FIXTURE_INFORMATION_SIMULATION==='1'&&type===4&&count===1)return Response.json({error:true,message:'Hitungan UJI sementara tidak tersedia'},{status:503});
    data={pengukuran:type===4?null:'1.250',pemeriksaanTanah:'',pendaftaran:'100',totalBiaya:`${type}.350`};
  }
  else if (url.pathname === '/Berkas/GetBerkas') data = [{ berkasId: 'fixture-berkas', nama: 'Berkas UJI LOKAL', namaProsedur: 'Prosedur uji', nomor: 'FIXTURE-001', status: 'Data simulasi', statusPengurusan: 'Uji lokal', allowGeotag: 0, readyToRating: false }];
  else if (url.pathname === '/Legacy/SertifikatTanahNew') data = [{ SertifikatId: 'fixture-analog', Nomor: 'FIXTURE-002', Nama: 'Sertipikat analog UJI LOKAL', JenisHak: 'DATA UJI', StatusEl: 0, StatusProses: 0, ProsesInfo: 'Respons simulasi lokal' }, { SertifikatId: 'fixture-electronic', Nomor: 'FIXTURE-003', Nama: 'Sertipikat elektronik UJI LOKAL', JenisHak: 'DATA UJI', StatusEl: 1, Dibagikan: false }, { SertifikatId: 'fixture-electronic-shared', Nomor: 'FIXTURE-004', Nama: 'Sertipikat elektronik dibagikan UJI LOKAL', JenisHak: 'DATA UJI', StatusEl: 1, Dibagikan: true, DibagikanSampai: '2026-12-31T00:00:00' }];
  else if (url.pathname === '/Legacy/GetSertipikatWakaf') return Response.json([
    { SertifikatId: null, sertifikatId: 'fixture-wakaf-analog', Nama: null, nama: 'Wakaf analog UJI LOKAL', Nomor: null, nomor: 'WAKAF-UJI-001', JenisHak: null, jenisHak: 'WAKAF UJI', StatusEl: null, statusEl: 0, StatusProses: null, Dibagikan: false, StatusHT: '-' },
    { SertifikatId: 'fixture-wakaf-electronic', Nama: 'Wakaf elektronik dibagikan UJI LOKAL', Nomor: 'WAKAF-UJI-002', JenisHak: 'WAKAF UJI', StatusEl: 1, StatusProses: 1, Dibagikan: true, DibagikanSampai: '2026-12-31T00:00:00', StatusHT: 'STATUS UJI LOKAL' },
    { SertifikatId: 'fixture-wakaf-blocked', Nama: 'Wakaf sedang diproses UJI LOKAL', Nomor: 'WAKAF-UJI-003', JenisHak: 'WAKAF UJI', StatusEl: 1, StatusProses: 0, ProsesInfo: 'PROSES UJI LOKAL <img src=x onerror=alert(1)>' },
    ...Array.from({length:20},(_,i)=>({SertifikatId:`fixture-wakaf-extra-${i}`,Nama:`Wakaf tambahan ${i+4} UJI LOKAL`,Nomor:`WAKAF-UJI-${String(i+4).padStart(3,'0')}`,JenisHak:'WAKAF UJI',StatusEl:0,StatusProses:null})),
  ]);
  else if (url.pathname === '/Akta/GetAktaList') return Response.json({message:[
    { aktaId:'fixture-akta-a',nomor:'AKTA-UJI-001',tipe:'AKTA UJI LOKAL',jenisPihak:'PIHAK UJI',tglAkta:'2026-01-02',tglLapor:'2026-02-03',namaPPAT:'PPAT UJI LOKAL',readyToRatingPPAT:false,sertipikatAkta:[
      {nomorHak:'AKTA-HAK-UJI-001',statusEl:'0',wilayah:[{tipeWilayah:'DESA',nama:'DESA UJI LOKAL'},{tipeWilayah:'KABUPATEN',nama:'KOTA UJI LOKAL'}]},
      {nomorHak:'AKTA-HAK-UJI-002 <img src=x onerror=alert(1)>',statusEl:'1',wilayah:[]},
      ...Array.from({length:11},(_,i)=>({nomorHak:`AKTA-HAK-UJI-${String(i+3).padStart(3,'0')}`,statusEl:i%2?'0':'1',wilayah:[{tipeWilayah:'KECAMATAN',nama:`WILAYAH UJI ${i+3}`}]})),
    ]},
    {aktaId:'fixture-akta-empty',nomor:'AKTA-UJI-KOSONG',tipe:'AKTA UJI KOSONG',jenisPihak:null,tglAkta:'TANGGAL SUMBER UJI',tglLapor:null,namaPPAT:null,readyToRatingPPAT:true,sertipikatAkta:[]},
    {aktaId:'fixture-akta-rating',nomor:'AKTA-UJI-NILAI',tipe:'AKTA UJI PENILAIAN',jenisPihak:'PIHAK UJI',tglAkta:'2026-03-04',tglLapor:'2026-04-05',namaPPAT:'PPAT UJI',readyToRatingPPAT:true,sertipikatAkta:[{nomorHak:null,statusEl:null,wilayah:null}]},
  ]});
  else if (url.pathname === '/legacy/GetSertipikatHT') return Response.json([
    { HaktanggunganId: 'fixture-ht', NomorHT: 'HT-UJI-001', TahunHT: '2026', Nilai: '1000000', Nikr: '0000000000000000' },
    { HaktanggunganId: null, haktanggunganId: 'fixture-ht-empty', NomorHT: 'HT-UJI-KOSONG', TahunHT: '2026', Nilai: null, Nikr: null },
  ]);
  else if (url.pathname === '/legacy/GetSertipikatHTDetail') {
    const htId=url.searchParams.get('haktanggunganId');
    if(htId==='fixture-ht-empty')return Response.json([]);
    if(htId!=='fixture-ht')throw new Error('Unexpected synthetic HT reference');
    return Response.json([
      { HaktanggunganId: 'fixture-ht', Nama: 'Nama HT UJI LOKAL A', NomorHak: 'HAK-UJI-001', Nibel: 'NIB-TIDAK-DITAMPILKAN', JenisHak: 'HAK UJI ANALOG' },
      { HaktanggunganId: 'fixture-ht', Nama: 'Nama HT UJI LOKAL E <img src=x onerror=alert(1)>', NomorHak: null, Nibel: 'E-NIB-UJI-002', JenisHak: 'HAK UJI ELEKTRONIK' },
      { HaktanggunganId: 'fixture-ht', Nama: 'Nomor kosong UJI LOKAL', NomorHak: '', Nibel: 'NIB-KOSONG-TIDAK-DITAMPILKAN', JenisHak: 'HAK UJI NOMOR KOSONG' },
      { HaktanggunganId: null, haktanggunganId: 'fixture-ht', Nama: null, nama: 'Nama huruf kecil UJI LOKAL', NomorHak: null, nomorHak: 'HAK-HURUF-KECIL', Nibel: null, JenisHak: null, jenisHak: 'HAK UJI HURUF KECIL' },
      ...Array.from({length:28},(_,index)=>({HaktanggunganId:'fixture-ht',Nama:`Nama HT tambahan ${index+5} UJI LOKAL`,NomorHak:`HAK-UJI-${String(index+5).padStart(3,'0')}`,Nibel:null,JenisHak:'HAK UJI TAMBAHAN'})),
    ]);
  }
  else if (url.pathname === '/legacy/GetInfoSertifikat') data = {
    SertifikatId: 'fixture-analog', Nomor: 'FIXTURE-002', JenisHak: 'DATA UJI LOKAL',
    BerakhirHak: null, ValidSejak: '2020-08-17T00:00:00', ValidSampai: null, KodeBlanko: 'BLANKO-UJI-002',
    Wilayah: [
      { WilayahId: 'fixture-provinsi', Kode: '00', Nama: 'Provinsi UJI LOKAL', TipeWilayah: 'Provinsi' },
      { WilayahId: 'fixture-kota', Kode: '00.00', Nama: 'Kota UJI LOKAL', TipeWilayah: 'Kabupaten/Kota' },
      { WilayahId: 'fixture-kecamatan', Kode: '00.00.00', Nama: 'Kecamatan UJI LOKAL', TipeWilayah: 'Kecamatan' },
      { WilayahId: 'fixture-desa', Kode: '00.00.00.00', Nama: 'Desa UJI LOKAL', TipeWilayah: 'Desa/Kelurahan' },
    ],
    Persil: [{ PersilId: 'fixture-persil', NomorIndukBidang: 'INTERNAL-UJI-ONLY', Nomor: 'NIB-UJI-002', Luas: 120.5, NamaWilayah: 'Desa UJI LOKAL', TipeWilayah: 'Desa', BatasPersil: null, BatasPersilLegal: null, Alamat: 'Jalan Simulasi 2 — bukan lokasi sebenarnya' }, { PersilId: 'fixture-persil-second', Nomor: 'NIB-UJI-SECOND', Luas: 75, NamaWilayah: 'Wilayah Simulasi Kedua', TipeWilayah: 'Desa', Alamat: '' }],
    PemilikPertama: [
      { PemilikId: 'fixture-owner-a', TipePemilik: 'Perorangan', Nama: 'Pemilik UJI LOKAL A', TempatTanggalLahir: 'Kota Uji, 1 Januari 1990' },
      { PemilikId: 'fixture-owner-b', TipePemilik: 'Perorangan', Nama: 'Pemilik UJI LOKAL B <img src=x onerror=alert(1)>', TempatTanggalLahir: null },
    ],
    SuratUkur: [
      { DokumenPengukuranId: 'fixture-survey-a', Nomor: 'SU-UJI-001/2020', Luas: 120.5, NamaWilayah: 'Desa UJI LOKAL', TipeWilayah: 'Desa', BerlakuSejak: '2020-08-01T00:00:00' },
      { DokumenPengukuranId: 'fixture-survey-b', Nomor: 'SU-UJI-002/2021', Luas: 120.5, NamaWilayah: 'Desa UJI LOKAL', TipeWilayah: 'Desa', BerlakuSejak: '2021-01-02T00:00:00' },
    ],
    CatatanPendaftaran: [
      { CatatanId: 'fixture-note-a', Kolom1: 'Catatan pertama UJI LOKAL<br>Baris kedua', Kolom2: 'Isi kolom 2 simulasi', Kolom3: 'Isi kolom 3 simulasi', Kolom4: 'Isi kolom 4 simulasi', Status: 0 },
      { CatatanId: 'fixture-note-b', Kolom1: 'Catatan kedua UJI LOKAL', Kolom2: 'Baris satu<BR />Baris dua <script>alert(1)</script>', Kolom3: null, Kolom4: 'Data ini bukan dokumen pertanahan', Status: 1 },
      { CatatanId: 'fixture-note-c', Kolom1: 'Catatan ketiga UJI LOKAL', Kolom2: null, Kolom3: null, Kolom4: null, Status: null },
      ...Array.from({ length: 10 }, (_, index) => ({ CatatanId: `fixture-note-extra-${index}`, Kolom1: `Catatan tambahan ${index + 4} UJI LOKAL`, Kolom2: 'Teks simulasi untuk memeriksa kelompok catatan panjang', Kolom3: null, Kolom4: null, Status: index % 2 })),
    ],
    Kantah: [{ KantorId: 'fixture-kantor', Nama: 'Kantor Pertanahan UJI LOKAL', Kota: 'Kota Uji', Alamat: 'Alamat simulasi' }],
  };
  else if (url.pathname === '/Brankas/DetailSertipikatNew') data = {
    sertipikatId: process.env.FIXTURE_CERTIFICATE_DOCUMENT_SEQUENCE === '1' ? 'fixture-response-id-not-selected' : url.searchParams.get('id'), jenisHak: 'DATA ELEKTRONIK UJI LOKAL',
    kodeHat: 'KODE-SERTIPIKAT-ELEKTRONIK-UJI', nibel: '12345678901234',
    letak: 'Alamat elektronik UJI LOKAL — bukan lokasi sebenarnya', luas: '150.25',
    berakhirHak: '9999-12-31T00:00:00.000', tanggalPenerbitan: '2026-01-02T00:00:00',
    listPemilik: ['Pemilik elektronik UJI LOKAL A', 'Pemilik elektronik UJI LOKAL B <img src=x onerror=alert(1)>'],
    kodeSatker: 'SATKER-UJI', noSk: 'SK-UJI-001', tanggalSk: '2025-12-01T00:00:00',
    catatan: [
      { kolom1: 'Catatan elektronik pertama UJI LOKAL<br>Baris kedua', kolom2: 'Kolom kedua hanya tersedia dalam data catatan', kolom3: null, kolom4: null },
      { kolom1: null, kolom2: 'CATATAN-KOLOM-DUA-SAJA-UJI', kolom3: 'CATATAN-KOLOM-TIGA-UJI', kolom4: 'CATATAN-KOLOM-EMPAT-UJI' },
      { kolom1: null, kolom2: null, kolom3: null, kolom4: null },
      { kolom1: 'Catatan elektronik keempat <script>alert(1)</script><BR />Baris aman', kolom2: null, kolom3: null, kolom4: null },
      ...Array.from({ length: 10 }, (_, index) => ({ kolom1: `Catatan elektronik ${index + 5} UJI LOKAL`, kolom2: `Kolom dua catatan elektronik ${index + 5}`, kolom3: null, kolom4: null })),
    ],
    persilId: 'fixture-electronic-persil', isPrinted: 1, kodeBlanko: null, statusDI301A: false,
    persil: { batasbidang: 'GEOMETRI-TERTANAM-TIDAK-DIGUNAKAN' },
  };
  else if (url.pathname === '/collection/GetUserCollection') data = [{id:'fixture-collection-parcel',type:'PERSIL',contentId:'fixture-parcel',title:'Bidang koleksi UJI LOKAL',subTitle:'Batas simulasi'},{id:'fixture-collection-file',type:'BERKAS',contentId:'fixture-berkas:fixture-office',title:'Berkas koleksi UJI LOKAL',subTitle:'Berkas simulasi'}];
  else if (url.pathname === '/legacy/GetParcelBoundaryById') return Response.json({type:'FeatureCollection',totalFeatures:1,crs:null,features:[{type:'Feature',properties:{NIB:url.searchParams.get('persilid')==='fixture-persil-second'?'NIB-UJI-MAP-SECOND':'NIB-UJI-MAP',LUAS:100,TIPEHAK:'DATA UJI'},geometry:{type:'MultiPolygon',coordinates:[[[[106,-6],[106.001,-6],[106.001,-5.999],[106,-5.999],[106,-6]],[[106.0002,-5.9998],[106.0004,-5.9998],[106.0004,-5.9996],[106.0002,-5.9996],[106.0002,-5.9998]]]]}}]});
  else if (url.pathname === '/berkas/CariBerkas') data = {
    berkasId: 'fixture-berkas', statusBerkas: 1, nomor: 90210, tahun: 2026,
    tanggalDibuat: '2026-01-02T08:30:00', tanggalSelesai: '2026-02-03T10:45:00',
    namaProsedur: 'Prosedur berkas UJI LOKAL', namaPemilik: 'Pemilik data simulasi',
    namaPegawai: 'Petugas UJI LOKAL', namaProfile: 'Profil UJI LOKAL', biaya: 127500.75,
    perjalananBerkas: [
      { taskNodeGroupId: 'fixture-stage-a', tanggalFlow: '2026-01-02T08:30:00', namaGrup: 'Penerimaan UJI LOKAL', isCurrent: false },
      { taskNodeGroupId: 'fixture-stage-b', tanggalFlow: '2026-01-03T09:15:00', namaGrup: 'Pemeriksaan UJI LOKAL', isCurrent: true },
      { taskNodeGroupId: 'fixture-stage-c', tanggalFlow: null, namaGrup: 'Tahap lanjutan UJI LOKAL', isCurrent: false },
    ],
    parapihak: [
      { nama: 'Pemohon UJI LOKAL', tipePemilik: 'P', tempatTanggalLahir: 'Data ini tidak ditampilkan pada kartu pihak' },
      { nama: 'Kuasa UJI LOKAL <img src=x onerror=alert(1)>', tipePemilik: 'K' },
    ],
    kantor: { nama: 'Kantor Pertanahan UJI LOKAL', alamat: 'Alamat kantor simulasi, bukan lokasi sebenarnya', email: 'fixture@example.invalid', telp: '000-UJI-LOKAL', fax: 'FAKS-TIDAK-DITAMPILKAN' },
    fileSop: null, fileSps: null, statusCetak: null, allowGeotag: 0, kodeSPOPP: 'UJI-LOKAL',
  };
  else if (url.pathname === '/berkas/berkassop') data = { lewatTenggat: false, tanggalTenggat: '2026-02-28T00:00:00', berkasDibuat: '2026-01-02T08:30:00', berkasSelesai: null, tipeProduk: 'Rutin' };
  else if (url.pathname === '/berkas/getStatusCetak') return Response.json({ error: false, message: 'Status cetak UJI LOKAL' });
  else if (url.pathname === '/Dokumen/GetSpsDokumen') return Response.json([
    { spsId: 'fixture-sps-a', tipe: 'SPS UJI LOKAL A', alias: 'fixture-sps-alias-a', tanggal: '2026-01-04T09:00:00' },
    { spsId: 'fixture-sps-b', tipe: 'SPS UJI LOKAL B', alias: 'fixture-sps-alias-b', tanggal: '2026-01-05T09:00:00' },
  ]);
  else if (url.pathname === '/dokumen/GetDokumen') {
    const id=url.searchParams.get('id'),alias=url.searchParams.get('tipe');
    if(!['a','b'].some(key=>id===`fixture-sps-${key}`&&alias===`fixture-sps-alias-${key}`))throw new Error('Unexpected synthetic SPS document reference');
    return new Response(spsPdf,{headers:{'Content-Type':'application/octet-stream'}});
  }
  else if (url.pathname === '/Mitra/GetPenilaiList') data = [{nama:'Penilai Uji Lokal <img src=x onerror=alert(1)>',alamat:'JANGAN-CARI-ALAMAT'},{nama:'Penilai Kedua Uji Lokal'},{nama:null}];
  else if (url.pathname === '/Mitra/GetKantorPPAT') data = mitraOffices;
  else if (url.pathname === '/Mitra/GetPPATList') {
    const office=mitraOffices.find(row=>row.kantorId===url.searchParams.get('kantorId'));
    if(!office)throw new Error('Unexpected synthetic PPAT office reference');
    mitraPpatCalls++;
    if(process.env.FIXTURE_MITRA_SEQUENCE==='1'&&mitraPpatCalls===1)return Response.json({error:true,message:'Daftar PPAT UJI sementara tidak tersedia'},{status:503});
    data=[
      {nama:`PPAT Uji ${office.nama}`,alamatKantor:'Alamat UJI <img src=x onerror=alert(1)>',tmtPensiun:'2030-12-31',totalAkta:'10',isPPAT:'1',nomorSK:'SK-UJI-001',tempatKedudukan:null,status:'UJI'},
      {nama:'PPATS Uji Lokal',alamatKantor:'Alamat PPATS UJI',tmtPensiun:null,totalAkta:'31',isPPAT:'0',nomorSK:null},
      {nama:'PPAT Kedua Uji Lokal',alamatKantor:'Jalan Cari Alamat UJI',tmtPensiun:'TEKS TANGGAL ASLI UJI',totalAkta:'101',isPPAT:'1',nomorSK:'SK-UJI-002'},
      {nama:'KATEGORI LAIN TIDAK TAMPIL',isPPAT:'2',totalAkta:'0'},
    ];
  }
  else if (url.pathname === '/Mitra/GetWilayahSurveyor') data = [{wilayahId:mitraRegionId,nama:'Provinsi UJI A'},{wilayahId:'fixture-region-empty',nama:'Provinsi UJI Kosong'},{wilayahId:'fixture-region-malformed',nama:'Provinsi UJI Model Tak Dikenali'},{wilayahId:null,nama:null}];
  else if (url.pathname === '/Mitra/GetSurveyorList') {
    const region=url.searchParams.get('wilayahId');
    if(![mitraRegionId,'fixture-region-empty','fixture-region-malformed'].includes(region))throw new Error('Unexpected synthetic Surveyor region reference');
    data=region==='fixture-region-empty'?[]:region==='fixture-region-malformed'?[{nama:42}]:[
      {nama:'Surveyor Uji Lokal',jenisSurveyor:'Surveyor Kadaster',nomorLisensi:'LISENSI-UJI <img src=x onerror=alert(1)>'},
      {nama:'Asisten Uji Lokal',jenisSurveyor:'Asisten Surveyor Kadaster',nomorLisensi:'LISENSI-ASISTEN-UJI'},
      {nama:'KATEGORI LAIN TIDAK TAMPIL',jenisSurveyor:'Surveyor',nomorLisensi:'LISENSI-LAIN'},
    ];
  }
  else if (url.pathname === '/activity/GetUserActivity') return Response.json({data:[
    {userActivityId:'activity-1',activityType:'CariBerkas',contentId:'fixture-activity-berkas:OFFICE',title:'Berkas UJI LOKAL',subTitle:'Berkas dari aktivitas',createdAt:'2026-01-02T08:30:00',platform:'HIDDEN-PLATFORM',status:'HIDDEN-STATUS'},
    {userActivityId:'activity-2',activityType:'CariBidang',contentId:'fixture-activity-parcel:FULL',title:'Bidang UJI LOKAL',subTitle:'Sketsa dari aktivitas',createdAt:'2026-01-03T08:30:00'},
    {userActivityId:'activity-3',activityType:'SCANDOKUMEN',contentId:'fixture-activity-scan-pbt:FULL',title:'Scan PBT UJI LOKAL',subTitle:'PBT UJI LOKAL',createdAt:'2026-01-04T08:30:00'},
    {userActivityId:'activity-4',activityType:'SCANDOKUMEN',contentId:activityDocumentId,title:'Scan dokumen UJI LOKAL',subTitle:'Dokumen simulasi',createdAt:'2026-01-05T08:30:00'},
    {userActivityId:'activity-5',activityType:'AntrianOnline',contentId:'fixture-activity-queue',title:'Antrian UJI LOKAL',subTitle:'Antrean simulasi',createdAt:'2026-01-06T08:30:00'},
    {userActivityId:'activity-6',activityType:'Login',contentId:null,title:'Login UJI LOKAL',subTitle:'Sesi simulasi',createdAt:'2026-01-07T08:30:00'},
    {userActivityId:'activity-7',activityType:'GEOTAG',contentId:'fixture-activity-geotag:FULL',title:'Geotag UJI LOKAL',subTitle:'Baca berkas yang sudah ada',createdAt:'2026-01-08T08:30:00'},
    {userActivityId:'activity-8',activityType:'AktivasiBerkasGeotag',contentId:'fixture-activity-activation:OFFICE',title:'Aktivasi UJI LOKAL',subTitle:'Berkas terlebih dahulu',createdAt:'2026-01-09T08:30:00'},
    {userActivityId:'activity-9',activityType:'Other',title:'Lainnya UJI LOKAL <img src=x onerror=alert(1)>',subTitle:'Teks <script> tidak dieksekusi',createdAt:null},
    ...Array.from({length:16},(_,i)=>({userActivityId:`activity-${i+10}`,activityType:'CariBerkas',contentId:`fixture-activity-extra-${i}:OFFICE`,title:`Aktivitas tambahan ${i+10} UJI LOKAL`,subTitle:'Data simulasi',createdAt:'2026-02-01T08:30:00'})),
  ],message:[{title:'WRONG-ENVELOPE-ROW'}]});
  else if (url.pathname === '/KKPR/GetKKPRList') return Response.json({ error: false, message: [
    {kkprId:'fixture-kkpr-001',nomor:'KKPR-UJI-001',judulKbli:'Kegiatan UJI LOKAL',jenisKkpr:'JENIS UJI',namaPemilik:'PEMILIK SINTETIS',kategoriKkpr:'KATEGORI UJI',kodeUnik:'KODE UJI',kodeKbli:'KBLI UJI',alamatUsaha:'ALAMAT SIMULASI',tanggalTerbit:'2026-01-02T23:30:00-07:00',luasDimohon:'100,50',luasDisetujui:'80,25',hasilKkpr:'HASIL UJI LOKAL',indikasiZonasi:'RTR/RDTR UJI <img src=x onerror=alert(1)>',jenisManfaatRuang:'PERUNTUKAN UJI',koefDasar:'KDB UJI',koefLantai:'KLB UJI',koefDasarHijau:'KDH UJI',indikasiUtama:'PROGRAM UJI',garisSempadan:'GARIS UJI',jarakBangunan:'JARAK UJI',koefTapak:'BASEMENT UJI',jaringanUtilitas:'UTILITAS UJI',geometry:{type:'Polygon',coordinates:[[[106,-6],[106.001,-6],[106.001,-5.999],[106,-5.999],[106,-6]],[[106.0002,-5.9998],[106.0004,-5.9998],[106.0004,-5.9996],[106.0002,-5.9996],[106.0002,-5.9998]]]},pertimbangan:Array.from({length:14},(_,i)=>({kkprPertimbanganId:`consideration-${i}`,keterangan:`Pertimbangan UJI ${i+1}${i===13?' <img src=x onerror=alert(1)>':''}`}))},
    {kkprId:'fixture-kkpr-null',nomor:null,judulKbli:null,jenisKkpr:null,geometry:null,pertimbangan:null},
    ...Array.from({length:21},(_,i)=>({kkprId:`fixture-kkpr-extra-${i}`,nomor:`KKPR-UJI-${String(i+3).padStart(3,'0')}`,judulKbli:`Kegiatan tambahan ${i+3} UJI LOKAL`,jenisKkpr:'JENIS TAMBAHAN',hasilKkpr:`Hasil sumber ${i+3}`,geometry:null,pertimbangan:[]})),
  ] });
  else if (url.pathname === '/apis/GetDocument') {
    const values = new URLSearchParams(init.body);
    if (values.get('q')?.endsWith(':SERTIPIKATKU')) {
      if (!['fixture-electronic:SERTIPIKATKU','fixture-electronic-shared:SERTIPIKATKU'].includes(values.get('q')) || values.get('name') !== 'Nama akun UJI LOKAL & +') throw new Error('Unexpected synthetic certificate document reference or profile name');
      certificateDocumentCalls++;
      if (process.env.FIXTURE_CERTIFICATE_DOCUMENT_SEQUENCE === '1' && certificateDocumentCalls === 2) return Response.json({error:true,message:'Dokumen sertipikat UJI sementara tidak tersedia'}, {status:503});
      return new Response(certificatePdf, {headers:{'Content-Type':'application/octet-stream'}});
    }
    if (values.get('q') === activityDocumentId) {
      if (values.get('name') !== 'Nama akun UJI LOKAL & +') throw new Error('Unexpected synthetic Activity profile name');
      return new Response(activityPdf, {headers: {'Content-Type': 'application/octet-stream'}});
    }
    if (values.get('q')?.endsWith(':KKPRKU') && values.get('name') !== 'Nama akun UJI LOKAL & +') throw new Error('Unexpected synthetic KKPR profile name');
    if (values.get('q') === 'fixture-kkpr-null:KKPRKU') return Response.json({error: true, message: 'Dokumen uji belum tersedia'}, {status: 403});
    return new Response(kkprPdf, {headers: {'Content-Type': 'application/octet-stream'}});
  }
  else if (url.pathname === '/apis/GetDocumentType') {
    const values = new URLSearchParams(init.body);
    if (values.get('q') !== activityDocumentId) throw new Error('Unexpected synthetic Activity metadata reference');
    if (process.env.FIXTURE_ACTIVITY_METADATA_FAILURE === '1') return Response.json({error:true,message:'Metadata UJI tidak tersedia'}, {status:503});
    return Response.json({error:false,data:{showRoute:1,type:'TYPE-UJI-TIDAK-DITAMPILKAN'}});
  }
  else if (url.pathname === '/apis/getGeoJsonInfo') {
    if (!['?q=fixture-activity-document%253A%2520A%2520%252B%2525%21%27%28%29%2A~%25C3%25A9','?q=fixture-electronic%253ASERTIPIKATKU','?q=fixture-electronic-shared%253ASERTIPIKATKU'].includes(url.search) || init.method !== 'GET' || init.body !== undefined) throw new Error('Unexpected synthetic document geo query');
    documentGeoCalls++;
    if (process.env.FIXTURE_DOCUMENT_GEO_SEQUENCE === '1') {
      if (documentGeoCalls === 1) return Response.json({error:true,message:'Lokasi UJI sementara tidak tersedia'}, {status:503});
      if (documentGeoCalls === 2) return Response.json({geometri:null});
      if (documentGeoCalls === 3) return Response.json({geometri:{type:'Polygon',coordinates:[[[106,-6],[106.001,-6],[106,-6]]]}});
    }
    return Response.json({geometri:{type:'MultiPolygon',coordinates:[
      [[[106,-6],[106.002,-6],[106.002,-5.998],[106,-5.998],[106,-6]],[[106.0005,-5.9995],[106.001,-5.9995],[106.001,-5.999],[106.0005,-5.999],[106.0005,-5.9995]]],
      [[[106.003,-6],[106.004,-6],[106.004,-5.999],[106.003,-5.999],[106.003,-6]]],
    ]},tipeHak:'Hak Milik UJI <img src=x onerror=alert(1)>'});
  }
  else if (url.pathname === '/geotag/GetSuratPernyataanGeotag') return new Response(spsPdf, {headers: {'Content-Type': 'application/pdf'}});
  else if (url.pathname === '/geotag/UploadGeotag') throw new Error('Geotag submission must remain unavailable in the browser adapter');
  else data = { status: 'UJI LOKAL', path: url.pathname };
  return Response.json({ error: false, data });
} });
const port = Number(process.env.FIXTURE_PORT || 4174);
server.listen(port, '127.0.0.1', () => console.log(`LOCAL FIXTURE ONLY http://127.0.0.1:${port} (use 127.0.0.1 to isolate cookies from the real adapter at localhost)`));
function stop() { console.log(JSON.stringify({ fixtureRequests: requests, upstreamNetworkRequests: 0 })); server.close(); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
