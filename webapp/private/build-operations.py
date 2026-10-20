"""Produce a secret-free registry from 170 shapes and supplemental audited flows."""
from pathlib import Path
import hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
contract_bytes=(ROOT/'analysis/request-contracts.json').read_bytes()
# Pinned before the collection-item action batch; supplemental contracts must
# not rewrite this original 170-shape corpus.
assert hashlib.sha256(contract_bytes).hexdigest()=='c731e68ec6bbf3525f7d6d74f8965c2e3cbf107e91eb38f2b4d605603379cf7f'
contracts=json.loads(contract_bytes)['contracts']
activity_source='analysis/recovered/activity-delete/flow.json'
activity_sha='6b9fe33d129a6919110c1c5bfa4f4ccc1260320946a30d92733395bc846a6c80'
activity_bytes=(ROOT/activity_source).read_bytes()
assert hashlib.sha256(activity_bytes).hexdigest()==activity_sha
activity=json.loads(activity_bytes)
assert activity['contract']['request']['endpoint']=='activity/deleteUserActivity'
assert activity['contract']['request']['body_order']==['userActivityId']
save_proofs={
 '0xd92664':('analysis/recovered/collection-save-berkas/flow.json','c04d52a1cf004e9959fe9d9c006ed52c4b02bc8dda22ac181edf301a597d6573'),
 '0xdaae30':('analysis/recovered/collection-save-persil/flow.json','dcc8abd41209eb741106dda7e88b834b4ba731b8e89838622859ff425767f199'),
}
for save_source,save_sha in save_proofs.values():assert hashlib.sha256((ROOT/save_source).read_bytes()).hexdigest()==save_sha
services={
 'main':{'id':'main','baseUrl':'https://sentuh.atrbpn.go.id/','allowedHost':'sentuh.atrbpn.go.id','label':'Sentuh Tanahku'},
 'directus':{'id':'directus','baseUrl':'https://aplikasi.atrbpn.go.id/konsol/antrian/directus/','allowedHost':'aplikasi.atrbpn.go.id','label':'Referensi antrean'},
 'antrian':{'id':'antrian','baseUrl':'https://antre.atrbpn.go.id/be/api/','allowedHost':'antre.atrbpn.go.id','label':'Antrean'},
 'sipenta':{'id':'sipenta','baseUrl':'https://sipenta.atrbpn.go.id/tatausaha/apis/','allowedHost':'sipenta.atrbpn.go.id','label':'SIPENTA'},
 'notifications':{'id':'notifications','baseUrl':'https://sentuhnotif.atrbpn.go.id/','allowedHost':'sentuhnotif.atrbpn.go.id','label':'Notifikasi'},
 'bhumi':{'id':'bhumi','baseUrl':'https://bhumi.atrbpn.go.id/','allowedHost':'bhumi.atrbpn.go.id','label':'Bhumi'},
}
# Only this explicit allowlist is executable; all other recovered shapes remain visible for inspection.
# These are static-compatible adapters, not claims of tested backend acceptance.
enabled={
 '0xd2f77c':('Daftar layanan pertanahan','optionalSession','none'),
 '0xd2f3c0':('Persyaratan dan detail layanan','optionalSession','none'),
 '0xd2fc78':('Provinsi untuk informasi layanan','optionalSession','none'),
 # JSON serialization and bounded nullable/string form contracts are audited
 # separately in INFORMATION-SERVICES-FLOW.md and simulation-form evidence.
 '0xda2f48':('Simulasi biaya layanan tipe 1','optionalSession','json'),
 '0xda3490':('Simulasi biaya layanan tipe 2','optionalSession','json'),
 '0xda3a30':('Simulasi biaya layanan tipe 3','optionalSession','json'),
 '0xda3f14':('Simulasi biaya layanan tipe 4','optionalSession','json'),
 '0xda4268':('Simulasi biaya layanan tipe 5','optionalSession','json'),
 '0xda474c':('Simulasi biaya layanan tipe 6','optionalSession','json'),
 '0xd61b10':('Daftar provinsi','application','none'),
 '0xd615c8':('Daftar kabupaten/kota','application','form'),
 '0xd60d28':('Daftar kecamatan','application','form'),
 '0xd60928':('Daftar kelurahan/desa','application','form'),
 '0xd2673c':('Wilayah pada koordinat','optionalSession','none'),
 '0xd22854':('Banner layanan','optionalSession','none'),
 '0xd2cb24':('Berita pertanahan','optionalSession','none'),
 '0xd2cf54':('Pengumuman','optionalSession','none'),
 '0xd2d384':('Video informasi','optionalSession','none'),
 '0xd29ef0':('Ketentuan penggunaan peta','optionalSession','none'),
 '0xd10364':('Cari kantor pertanahan','optionalSession','none'),
 '0xd2939c':('Ringkasan akun saya','session','form'),
 '0xd44dc0':('Sertipikat tanah saya','session','none'),
 '0xd45354':('Sertipikat wakaf saya','session','none'),
 '0xd441a4':('Sertipikat hak tanggungan saya','session','none'),
 '0xd446dc':('Detail hak tanggungan','session','none'),
 '0xd43b54':('Detail sertipikat di brankas','session','none'),
 # Analog certificate flow and final session authorization: analysis/CERTIFICATE-DETAIL-FLOW.md.
 '0xd4340c':('Detail sertipikat analog saya','session','none'),
 '0xd1ccc4':('Daftar akta saya','session','none'),
 '0xd15068':('Daftar berkas saya','session','multipart'),
 '0xd25618':('Geotag pada berkas','session','multipart'),
 '0xd88218':('Cari berkas milik saya','session','form'),
 '0xd87ca8':('Status cetak berkas','session','form'),
 '0xd87ea8':('Tahapan layanan berkas','session','form'),
 '0xd2826c':('Tanya jawab pada berkas','session','none'),
 '0xd31a50':('Koleksi saya','session','none'),
 '0xd31fbc':('Grup koleksi bidang saya','session','none'),
 '0xd25250':('Status koleksi berkas','session','none'),
 '0xd1dc68':('Aktivitas akun saya','session','none'),
 '0xda15dc':('Status verifikasi akun saya','session','none'),
 '0xd92664':('Simpan berkas ke koleksi saya','session','multipart'),
 '0xdaae30':('Simpan bidang ke koleksi saya','session','multipart'),
 '0xda8f20':('Buat grup koleksi bidang','session','multipart'),
 '0xda897c':('Masukkan bidang ke grup koleksi','session','multipart'),
 '0xd74ab4':('Catat aktivitas akun saya','session','multipart'),
 '0xde6c94':('Hapus aktivitas akun saya','session','multipart'),
 '0xd0fb64':('Pengumuman yuridis per kantor','optionalSession','none'),
 '0xd10a9c':('Pengumuman sertipikat hilang','optionalSession','none'),
 '0xd3aa20':('Daftar penilai tanah','optionalSession','none'),
 '0xd3af08':('Kantor layanan PPAT','optionalSession','none'),
 '0xd3b428':('Daftar PPAT','optionalSession','none'),
 '0xd3b910':('Wilayah surveyor','optionalSession','none'),
 '0xd3be30':('Daftar surveyor','optionalSession','none'),
 '0xd30c18':('Dokumen KKPR saya','session','none'),
 '0xd94aac':('Dokumen surat perintah setor','session','none'),
 '0xdad6f4':('Lokasi bidang menurut ID','session','none'),
 '0xdbaeb8':('Batas bidang tanah','session','none'),
 '0xd311e8':('Detail dokumen KKPR','session','form'),
 '0xd3d134':('Detail PBT elektronik','session','form'),
 '0xd417d4':('Jenis dokumen dari kode','session','form'),
 '0xd41ee8':('Unduh dokumen dari kode','session','form'),
 # Exact q encoding and direct geometry model: analysis/DOCUMENT-GEO-FLOW.md.
 '0xd39f1c':('Lokasi bidang dari dokumen','session','none'),
 '0xd21a34':('Kantor pertanahan di sekitar lokasi','optionalSession','json'),
 '0xd2127c':('Kalender layanan kantor','optionalSession','form'),
 '0xdd980c':('Detail plot bidang','session','multipart'),
 '0xddbb60':('Daftar plot bidang saya','session','none'),
 '0xd26d20':('Unduh surat pernyataan geotag yang ada','session','multipart'),
}
write_calls={'0xd92664','0xdaae30','0xda8f20','0xda897c','0xd74ab4','0xde6c94','0xd96b98'}
simulation_calls={'0xda2f48','0xda3490','0xda3a30','0xda3f14','0xda4268','0xda474c'}
labels={'BerkasId':'ID berkas','Berkasid':'ID berkas','berkasid':'ID berkas','berkasId':'ID berkas','Lat':'Lintang','Longi':'Bujur','file':'Foto PNG','Lokasi':'Keterangan lokasi','IsOffline':'Berasal dari draf offline','nik':'NIK akun','Nik':'NIK akun','nikr':'NIK akun','tipeuser':'Tipe pengguna akun','appVersion':'Versi kontrak APK','selesai':'Berkas sudah selesai','id':'ID','nomor':'Nomor berkas','tahun':'Tahun','kantorId':'ID kantor','provinsiId':'ID provinsi','kabupatenkotaId':'ID kabupaten/kota','kecamatanId':'ID kecamatan','longitude':'Bujur','latitude':'Lintang','Title':'Judul','Subtitle':'Subjudul','GroupName':'Nama grup','collectionGroupId':'ID grup koleksi','collectionId':'ID koleksi','userActivityId':'ID aktivitas','activityType':'Jenis aktivitas','contentId':'ID konten','title':'Judul','subtitle':'Subjudul','status':'Status'}
inspect_labels={
 'auth/signin':'Masuk dengan akun Sentuh Tanahku',
 'auth/check_authorization':'Periksa sesi akun',
 'auth/check_authorization_ikd':'Periksa sesi identitas digital',
 'auth/refresh_token':'Perbarui sesi akun',
 'auth/resend_activation_otp':'Kirim ulang kode aktivasi',
 'auth/activate_account':'Aktifkan akun',
 'auth/send_reset_password_otp':'Kirim kode pemulihan kata sandi',
 'auth/validate_reset_password_otp':'Validasi kode pemulihan kata sandi',
 'auth/signup':'Daftar akun baru',
 'auth/change_password':'Ganti kata sandi',
 'auth/delete_user':'Hapus akun',
 'auth/resetPasswordUser':'Atur ulang kata sandi',
 'apis/scanDocument':'Pindai dokumen',
 'surveylbtkelasjalan':'Survei kelas jalan',
 'surveylbtfasilitas':'Survei fasilitas',
 'surveylbtzona':'Survei zona penggunaan',
 'surveylbtfaktorresiko':'Survei faktor risiko',
 'surveyfoto':'Foto survei',
 'surveynonpertanian':'Survei tanah nonpertanian',
 'surveypertanian':'Survei tanah pertanian',
 'api/booking/':'Pesan antrean layanan',
 'apis/SwaplottingTerdaftar':'Plot bidang yang sudah terdaftar',
 'apis/SwaplottingBelumTerdaftar':'Plot bidang yang belum terdaftar',
 'PlotBidang/InstansiBelumBersertipikat':'Bidang instansi belum bersertipikat',
 'PlotBidang/InstansiBersertipikat':'Bidang instansi bersertipikat',
 'berkas/BagikanBerkas':'Bagikan berkas',
 'TanyaJawab/SubmitPertanyaan':'Kirim pertanyaan tentang berkas',
 'legacy/BagiSertifikat':'Bagikan sertipikat',
 'berkas/postratingberkas':'Nilai layanan berkas',
 'RatingPPAT/PostRatingPPAT':'Nilai layanan PPAT',
 'common/send_otp_wa':'Kirim kode verifikasi WhatsApp',
 'pub/producer/publish-message/atrbpnlog':'Catat telemetri aplikasi',
 'kantornearby/getkantornearby':'Cari kantor terdekat',
 'ikdv2/resetNIK':'Atur ulang kaitan NIK identitas digital',
 'apis/GetKKPRDetail':'Detail dokumen KKPR',
 'PeruriLivenessSdk/ValidateDukcapilFR':'Validasi kecocokan wajah Dukcapil',
 'apis/GetPBTElDetail':'Detail PBT elektronik',
 'apis/GetDocument':'Ambil dokumen',
 'bukutamu':'Buku tamu kantor',
 'review/all':'Daftar ulasan',
 'Pin/UpdatePin':'Ganti PIN',
 'account/ValidatePassword':'Validasi kata sandi akun',
 'account/AddKantorFavorit':'Tambahkan kantor favorit',
 'legacy/HapusKotakKeluar':'Hapus entri kotak keluar',
 'kiosk/Verification':'Verifikasi layanan kios',
 'review/post':'Kirim ulasan',
 'fcm/opt_out':'Nonaktifkan notifikasi perangkat',
 'fcm/opt_in':'Aktifkan notifikasi perangkat',
 'ikdv2/VerificateAccount':'Verifikasi akun identitas digital',
 'PeruriLivenessSdk/VerificateUser':'Verifikasi data pengguna',
 'PeruriLivenessSdk/GetLivenessPhoto':'Ambil foto verifikasi wajah',
 'apis/VerifyTTE':'Periksa tanda tangan elektronik',
 'review/last_user_review':'Ulasan terakhir pengguna',
 'api/verifikasi/':'Verifikasi pemohon antrean',
 'pub/validasi_nik':'Validasi data NIK',
 'Pin/ValidatePin':'Validasi PIN',
 'account/resetNIKuser':'Atur ulang NIK akun',
 'PlotBidang/GetDetail':'Detail plot bidang',
 'review/berkas':'Ulasan penyelesaian berkas',
 'KantorNearby/GetCalendar':'Kalender layanan kantor',
 'geotag/GetSuratPernyataanGeotag':'Surat pernyataan geotag',
 'login':'Masuk layanan SIPENTA',
 'ikdv2/signinIKD':'Masuk melalui identitas digital',
 'PeruriLivenessSdk/CheckRegisteredNIK':'Periksa NIK terdaftar',
 'review/inAppReview':'Kirim penilaian aplikasi',
 'apis/GetDocumentType':'Periksa jenis dokumen',
 'kiosk/JsonDecryptor':'Baca data terenkripsi kios',
 'api/booking/limit/':'Periksa batas pemesanan antrean',
 'PeruriLivenessSdk/ValidateKTPDataV2':'Validasi data KTP',
 'Pin/Authenticate':'Autentikasi untuk pengaturan PIN',
 'account/GantiNomorHP':'Ganti nomor telepon akun',
 'account/resetNIKIkd':'Atur ulang NIK identitas digital',
 'PlotBidang/DaftarPlot':'Daftar plot bidang',
 'announcement/yuridis_byKantor':'Pengumuman yuridis per kantor',
 'announcement/sertipikat_hilang_byKantor':'Pengumuman sertipikat hilang',
 'Pin/GetPin':'Status PIN akun',
 'RatingPPAT/GetRatingQuestions':'Pertanyaan penilaian PPAT',
 'api/antrian/{path_argument_1}':'Detail antrean',
 'api/antrian/saya':'Antrean saya',
 'items/kantor':'Referensi kantor antrean',
 'api/notifikasi':'Notifikasi antrean',
 'ikdv2/generate_token':'Buat sesi identitas digital',
 'SubyekSosial/GetSubyekSosial':'Data subyek sosial',
 'KKPR/GetKKPRList':'Daftar dokumen KKPR',
 '${Wxb.KYi}':'Status konfigurasi aplikasi',
 'legacy/GetParcelBoundaryById':'Batas bidang tanah',
 'apis/getGeoJsonInfo':'Informasi peta GeoJSON',
 'Map/GetDisclaimer':'Ketentuan penggunaan peta',
 'Mitra/GetPenilaiList':'Daftar penilai',
 'Mitra/GetKantorPPAT':'Daftar kantor PPAT',
 'Mitra/GetPPATList':'Daftar PPAT',
 'Mitra/GetWilayahSurveyor':'Wilayah surveyor',
 'Mitra/GetSurveyorList':'Daftar surveyor',
 'Bhumi/haiiizzzzzzz':'Sesi peta Bhumi',
 'legacy/KotakKeluarSertifikat':'Kotak keluar pembagian sertipikat',
 'legacy/GetInfoSertifikat':'Informasi sertipikat',
 'Dokumen/generateQRValue':'Buat nilai QR dokumen',
 'detailberkas':'Detail berkas SIPENTA',
 'surveydetail':'Detail survei',
 'survey':'Daftar survei',
 'berkas':'Daftar berkas SIPENTA (GET dengan body)',
 'legacy/GetPersilIdByNibel':'Cari bidang dengan NIB elektronik',
 'legacy/GetPersilId':'Cari identitas bidang',
 'legacy/Wilayah':'Referensi wilayah kantor',
 'api/antrian':'Cari jadwal antrean',
 'items/lokasi':'Lokasi layanan antrean',
 'Dokumen/GetSpsDokumen':'Dokumen surat perintah setor',
 'api/geocode':'Cari lokasi di Bhumi',
 'LokasiBidang/GetByPersilId':'Lokasi bidang menurut ID',
 'legacy/PratinjauPengguna':'Pratinjau penerima pembagian',
}
for i in range(1,7):inspect_labels[f'InfoLayanan/SimulasiTipe{i}']=f'Simulasi biaya layanan tipe {i}'
def normalized_type(s):
 s=s.lower()
 if 'list' in s or 'array' in s:return 'array'
 if 'map' in s and not ('value' in s):return 'object'
 if 'bool' in s:return 'boolean'
 if 'double' in s or s=='num':return 'number'
 if re.search(r'\bint\b',s):return 'integer'
 if 'string' in s:return 'string'
 return 'unknown'
def group(p):
 p=p.lower().lstrip('/')
 if p.startswith(('auth/','account/','pin/','ikdv2/','fcm/','kiosk/')):return 'Akun dan verifikasi'
 if p.startswith(('infolayanan/','common/','legacy/kantah','mitra/','kantornearby/')):return 'Layanan dan wilayah'
 if p.startswith(('geotag/','lokasibidang/','plotbidang/','map/','bhumi/')) or 'swaplotting' in p or 'geocode' in p:return 'Peta dan geotag'
 if p.startswith(('survey','detailberkas')) or p=='berkas':return 'Survei SIPENTA'
 if p.startswith(('berkas/','tanyajawab/')):return 'Berkas'
 if p.startswith('collection/'):return 'Koleksi'
 if p.startswith('activity/'):return 'Aktivitas'
 if p.startswith(('legacy/','brankas/','akta/','ratingppat/')):return 'Sertipikat dan akta'
 if p.startswith(('api/','items/')):return 'Antrean'
 if p.startswith(('berita/','pengumuman/','youtube/','announcement/','banner')):return 'Informasi publik'
 if p.startswith('peruri'):return 'Verifikasi identitas'
 return 'Layanan lainnya'
ops=[]
for c in contracts:
 original=c['endpoint'];call=c['call_address'];path=original.split('?')[0];method=c['method']
 if path.startswith('${TRb.AYi}'):path=path.replace('${TRb.AYi}','')
 elif path.startswith('${Wxb.OYi}'):path=path.replace('${Wxb.OYi}','')
 service='main'
 if path.startswith('survey') or path in ('berkas','detailberkas','login'):service='sipenta'
 elif path.startswith('items/'):service='directus'
 elif path.startswith('api/') and 'geocode' not in path:service='antrian'
 elif path.startswith('pub/'):service='notifications' if 'atrbpnlog' in path else 'unmapped'
 elif path=='api/geocode':service='bhumi'
 elif '${' in path:service='unmapped'
 wire=c.get('transport','');low=wire.lower()
 encoding='multipart' if 'multipart' in low or 'formdata' in low else 'json' if 'json' in low else 'none' if method=='GET' else 'form'
 if c.get('argument_status')=='get_body_map':encoding='json'
 auth='session' if service=='main' else 'none'
 if path.startswith('common/'):auth='application'
 spec=enabled.get(call);ready=spec is not None
 if spec:label,auth,encoding=spec
 else:label=inspect_labels.get(path.lstrip('/'),'Periksa kontrak '+(path.split('/')[-1] or path))
 fields=[];query_constants={}
 if '?' in original:
  for pair in original.split('?',1)[1].split('&'):
   key,_,value=pair.partition('=')
   if '{' not in value and '}' not in value:query_constants[key]=value
 for f in c.get('fields',[]):
  key=f.get('path',f.get('name',''));typ=normalized_type(f.get('client_type',''))
  # Nested row fields belong to the single audited type-2 array schema, not
  # to independent top-level inputs with literal `data[].` keys.
  if call=='0xda3490' and key.startswith('data[].'):continue
  loc=f.get('in','query' if method=='GET' and c.get('argument_status')!='get_body_map' else 'body')
  field={'path':key,'label':labels.get(key,key),'type':typ,'location':loc,'required':'unknown','clientRequired':ready,'source':'input','recoveredType':f.get('client_type','unknown')}
  if ready and typ=='unknown':field['type']='string';field['description']='Adapter memakai teks; tipe yang diterima server belum diuji.'
  if ready and key in ('nik','Nik','nikr'):
   field.update(source='session',sessionKey='nik',type='string',description='Diambil dari akun yang sedang masuk; bukan NIK pengguna lain.')
  if call=='0xd30c18' and key=='nomorIdentitas':field.update(source='session',sessionKey='nik',type='string',label='NIK akun',description='Menggunakan nomor identitas dari profil akun yang aktif.')
  if ready and key=='tipeuser':field.update(source='session',sessionKey='tipeuser',type='string',description='Berasal dari roleUser pada respons profil akun; dibuktikan parser dan jalur pemanggil sertipikat.',sessionEvidence={'responseKey':'roleUser','parser':'0x6b1e2c -> model+0x13 at0x6b1e7c','caller':'0xd44b04 -> argumentx3 -> query0xd44d94'})
  if key in query_constants:field.update(source='constant',default=query_constants[key],clientRequired=False,type='string')
  if call=='0xd2939c' and key=='appVersion':field.update(source='constant',default='6.1.5',type='string',clientRequired=False,description='Versi artefak sumber untuk uji kompatibilitas; bukan checksum aplikasi web.')
  if call=='0xd15068' and key=='selesai':field.update(type='boolean',default=False)
  if call=='0xd25250' and key=='type':field.update(source='constant',default='BERKAS',type='string',clientRequired=False,description='Jenis tetap pada builder APK; operasi ini memeriksa status simpan berkas, bukan mengambil detail koleksi.')
  if call=='0xd25250':field.update(type='string',strictString=True,allowEmpty=key=='id',description='Composite ID String dari detail ABb; dipertahankan tanpa trim.' if key=='id' else 'Jenis tetap BERKAS sesuai caller native.')
  # The native shared CariBerkas builder always includes these four nullable
  # keys, including when detail callers supply only berkasId.
  if call=='0xd88218':field.update(clientRequired=False,default=None,preserveNull=True)
  # Cari Berkas initializes the office picker with nama='' and tipeKantor='3,2,1'.
  if call=='0xd10364' and key=='nama':field.update(clientRequired=False,default='',description='Nama kosong memuat daftar kantor; kontrak pemilih Cari Berkas dari APK.')
  if call=='0xd41ee8' and key=='name':field.update(clientRequired=False,default='',label='Nama dari profil akun',description='Field nama pada account/account_summary; bukan username atau nama file. Nilai kosong dipertahankan sesuai fallback client.')
  if call=='0xd39f1c' and key=='q':field.update(type='string',strictString=True,label='Kode dokumen',description='ID dokumen utuh dari aktivitas. Encoding khusus dilakukan oleh adapter; jangan encode atau mengganti dengan ID bidang.')
  if call=='0xd21a34':
   if key in {'latitude','longitude'}:field.update(type='number',strictNumber=True,clientRequired=True,minimum=-90 if key=='latitude' else -180,maximum=90 if key=='latitude' else 180)
   elif key=='limit':field.update(type='number',source='constant',default=None,preserveNull=True,clientRequired=False)
   elif key in {'radius','isKalender'}:field.update(type='number' if key=='radius' else 'integer',source='constant',default=0.1 if key=='radius' else 1,clientRequired=False)
  if call=='0xd2127c':field.update(type='string',strictString=True,clientRequired=True,description='Referensi kantor dari daftar terdekat; backend menerapkan transformasi native.' if key=='kantorId' else 'Tahun kalender yang ditampilkan.')
  if call in simulation_calls:
   if call=='0xda3490' and key=='data':
    field.update(type='array',arraySchema='information-simulation-type2',minItems=1,maxItems=100,clientRequired=True,
     description='Baris simulasi tipe 2. Batas 100 baris adalah batas adapter browser, bukan batas native/server.',
     items={'type':'object','additionalProperties':False,'fields':[
      {'path':name,'label':name,'type':'string','strictString':True,'clientRequired':True,'allowEmpty':name=='Penggunaan'}
      for name in ('Jumlah','Luas','Penggunaan')]})
   else:
    field.update(type='string',strictString=True,clientRequired=True,allowEmpty=call!='0xda3f14',
     description='String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.')
    if key=='Luas' and call!='0xda3f14':field['default']=''
  if call=='0xdaae30' and key=='Subtitle':field.update(source='constant',default='Lokasi Bidang',clientRequired=False,type='string')
  if call in save_proofs:
   field.update(type='string',strictString=True,allowEmpty=True,recoveredType='String',description='String persis dari caller native; service tidak memangkas atau memvalidasi kosong.')
   if key=='Nik':field.update(source='session',sessionKey='storedSignInNik',description="Hanya stored sign-in user.nomorIndukKependudukan; null/missing ditolak, String kosong dipertahankan. Browser tidak menerima input atau pengganti NIK.")
  if call=='0xda897c':field.update(type='string',strictString=True,clientRequired=True,allowEmpty=key=='collectionId',description='ID grup terpilih tanpa trim.' if key=='collectionGroupId' else "row.id ?? '' asli; String kosong dipertahankan sesuai caller native.")
  if call=='0xde6c94':field.update(type='string',strictString=True,clientRequired=True,allowEmpty=True,description="userActivityId asli dari model aktivitas; null/missing model menjadi ''. String kosong dan spasi dipertahankan, bukan contentId.")
  if call=='0xd96b98':
   field['type']='boolean' if key=='IsOffline' else 'file' if key=='file' else 'string'
   if key=='file':field.update(accept='image/png',maxBytes=12*1024*1024,description='Foto PNG dikirim sebagai bagian multipart file; batas adapter lokal 12 MiB.')
   if key=='IsOffline':field['default']=False
   if key in ('Lat','Longi'):field.update(format='decimal-coordinate',description='Nilai pengukuran Anda; teks desimal dipertahankan. Jalur APK tertentu memakai 7 angka desimal, tidak semua jalur.')
  fields.append(field)
 for arg in c.get('path_arguments',[]):
  fields.append({'path':arg.get('path','path_argument_1') if isinstance(arg,dict) else 'path_argument_1','label':'Segmen path','type':'unknown','location':'path','required':'unknown','clientRequired':False,'source':'input'})
 if any('[]' in f['path'] or f['type'] in ('array','object') and not(call=='0xda3490' and f['path']=='data' and f.get('arraySchema')=='information-simulation-type2') for f in fields) and ready:raise RuntimeError('Opaque model erroneously enabled')
 if not ready:
  if path.startswith(('Peruri','ikdv2/','kiosk/')):reason='Alur identitas atau komponen native belum dipetakan untuk browser.'
  elif service!='main':reason='Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.'
  elif any('[]' in f['path'] or f['type'] in ('array','object') for f in fields):reason='Model bertingkat dan aturan serialisasi belum cukup pasti untuk eksekusi.'
  else:reason='Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.'
 else:reason='Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.'
 effect='write' if call in write_calls or (not ready and method=='POST' and not re.search(r'(Get|Check|Cari|Simulasi|/all|last_user_review|account_summary)',path)) else 'read'
 slug=re.sub('[^a-z0-9]+','-',path.lower()).strip('-')
 op={'id':f'{method.lower()}-{slug}-{call[2:]}','label':label,'group':group(path),'method':method,'endpoint':original,'path':path,'serviceId':service,'serviceMapping':'reviewed primary adapter' if ready else 'static service family; execution disabled','encoding':encoding,'recoveredTransport':wire,'auth':auth,'authenticated':auth=='session','effect':effect,'mutates':effect=='write','requiresConfirmation':effect=='write','enabled':ready,'supported':ready,'inspectOnly':not ready,'readiness':'ready_unverified' if ready else 'inspect_only','reason':reason,'fields':fields,'evidence':{'callAddress':call,'source':c['source']},'serverRequiredness':'unknown','serverAcceptance':'untested'}
 if call=='0xd8e744':op.update(label='Masuk akun',uiRoute='/login',dedicatedApi='/api/login',readiness='dedicated_login',enabled=False,supported=True,inspectOnly=False,auth='application',authenticated=False,effect='read',mutates=False,requiresConfirmation=False,reason='Tersedia melalui formulir Masuk akun. Kredensial diproses oleh jalur login khusus, bukan eksekusi katalog.')
 if call in {'0xd2cb24','0xd2cf54'}:
  op.update(serviceMapping='audited cloned main client with LRb/AP',reason='Kontrak daftar dan model nullable dipulihkan dari APK; penerimaan server belum diverifikasi.',evidence={'callAddress':call,'source':'analysis/recovered/news-flow/flow.json','requestSource':c['source'],'nativeProofSha256':'9628b9d094cb486c82a86f8a27d90426a3d15737d32fc2d7e3fd36e1615f6aa9'})
 if call in {'0xd1dc68','0xde6c94'}:
  op.update(serviceMapping='audited main-session activity list/delete',reason='Kontrak aktivitas native dipulihkan; penerimaan server belum diuji. Penghapusan cache lokal mengikuti controller native meski hasil layanan false.' if call=='0xde6c94' else 'Daftar aktivitas bertipe; createdAt dipertahankan sebagai String/null tanpa membuat timestamp browser.',evidence={'callAddress':call,'source':activity_source,'requestSource':c['source'],'nativeProofSha256':activity_sha})
 if call in save_proofs or call=='0xd25250':
  save_source,save_sha=save_proofs['0xd92664' if call=='0xd25250' else call]
  op.update(serviceMapping='audited main-session collection bookmark',reason='Kontrak bookmark native dan typed200 yEb; penerimaan server belum diuji. NIK simpan hanya dari stored sign-in user, bukan profil atau input browser.',evidence={'callAddress':call,'source':save_source,'requestSource':c['source'],'nativeProofSha256':save_sha})
 if call in {'0xd1e130','0xd1eb1c'}:
  op.update(label='Detail antrean' if call=='0xd1e130' else 'Antrean saya',serviceId='directus',serviceMapping='audited FRb +0xb Directus read client',clientProfile='queue-read',auth='session',authenticated=True,effect='read',mutates=False,requiresConfirmation=False,enabled=True,supported=True,inspectOnly=False,readiness='ready_unverified',reason='Pembacaan antrean akun sendiri; identitas dari summary backend dan ID detail dari daftar/aktivitas sesi. Booking dan enrollment belum tersedia.',fields=[] if call=='0xd1eb1c' else [{'path':'path_argument_1','label':'ID antrean terpilih','type':'string','strictString':True,'location':'path','required':'unknown','clientRequired':True,'source':'input','description':'ID utuh yang dikembalikan daftar atau aktivitas akun ini; bukan nomor antrean atau kode booking.'}],evidence={'callAddress':call,'source':'analysis/recovered/queue-flow.json','transportSource':'analysis/recovered/queue-interceptor-followup/flow.json','identitySource':'analysis/recovered/queue-identity-followup/flow.json'})
 if call=='0xd22468':
  op.update(label='Panggilan antrean saya',serviceId='directus',serviceMapping='audited FRb +0xb Directus notifications read',clientProfile='queue-read',auth='session',authenticated=True,effect='read',mutates=False,requiresConfirmation=False,enabled=True,supported=True,inspectOnly=False,readiness='ready_unverified',reason='Panggilan dibaca dari identitas profil backend sesi ini; tidak menerima NIK browser atau melakukan mark-read.',fields=[],evidence={'callAddress':call,'source':'analysis/recovered/queue-calls-flow/flow.json'})
 if call=='0xd96b98':
  op.update(label='Penandaan lokasi geotag',readiness='native_required',reason='Penandaan lokasi membutuhkan pemeriksaan posisi saat kunjungan dan pernyataan kondisi fisik melalui aplikasi resmi. Perbandingan koordinat berkas tidak menggantikan pemeriksaan tersebut.',coordinateNotice='Koordinat referensi berkas hanya untuk perbandingan; tidak dikirim sebagai posisi perangkat atau bukti kunjungan.')
 ops.append(op)
assert len(ops)==170 and len({o['id'] for o in ops})==170
# This separate HttpClient viewer is outside the original Dio request corpus.
# Preserve those 170 records and identify the additional static evidence rather
# than inventing another main-client callsite or silently editing the corpus.
sps_source='analysis/recovered/sps-document-flow.json'
sps=json.loads((ROOT/sps_source).read_text(encoding='utf-8'))
assert sps['request']['method']=='GET' and sps['request']['path']=='dokumen/GetDokumen'
assert sps['request']['query']=={'id':'selected FBb.spsId','tipe':'selected FBb.alias'}
ops.append({
 'id':'get-dokumen-getdokumen-d3e240','label':'Buka dokumen SPS','group':'Berkas',
 'method':'GET','endpoint':'dokumen/GetDokumen','path':'dokumen/GetDokumen',
 'serviceId':'main','serviceMapping':'audited separate document viewer on the fixed main origin',
 'encoding':'none','recoveredTransport':'HttpClient GET; stored token; PDF bytes',
 'clientProfile':'sps-document-viewer','auth':'session','authenticated':True,
 'effect':'read','mutates':False,'requiresConfirmation':False,
 'enabled':True,'supported':True,'inspectOnly':False,'readiness':'ready_unverified',
 'reason':'Kontrak unduhan SPS dipulihkan dari viewer APK; penerimaan server belum diverifikasi.',
 'fields':[
  {'path':'id','label':'ID SPS','type':'string','location':'query','required':'unknown','clientRequired':True,'source':'input','recoveredType':'String?','description':'spsId dari baris metadata SPS yang dipilih.'},
  {'path':'tipe','label':'Alias dokumen SPS','type':'string','location':'query','required':'unknown','clientRequired':True,'source':'input','recoveredType':'String?','description':'alias dari baris metadata SPS, bukan label tipe yang ditampilkan.'},
 ],
 'evidence':{'callAddress':'0xd3e240','source':sps_source,'contractSource':'supplemental separate viewer'},
 'serverRequiredness':'unknown','serverAcceptance':'untested',
})
assert len(ops)==171 and len({o['id'] for o in ops})==171
# These DELETE helpers were recovered after the fixed 170-shape Dio corpus.
# Keep that input corpus immutable and identify each supplemental native proof.
for call,prefix,label,source,proof_sha in [
 ('0xda9450','Collection/DeletePersilCollectionGroup/','Hapus grup koleksi bidang','analysis/recovered/collection-group-delete/flow.json','995bf8791fef83c733f2d13379a24dcc3443ac8be5090c952a7154199e8a1443'),
 ('0xda7d60','Collection/DeletePersilCollectionFromGroup/','Lepas koleksi dari grup','analysis/recovered/collection-group-move/flow.json','43b59a45774524a298232e8dcb667284211bf8481886c54de48ea77ab825425f'),
]:
 proof_bytes=(ROOT/source).read_bytes()
 assert hashlib.sha256(proof_bytes).hexdigest()==proof_sha
 proof=json.loads(proof_bytes)
 assert proof['artifact_sha256']=='bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683'
 path=prefix+'{path_argument_1}'
 slug=re.sub('[^a-z0-9]+','-',path.lower()).strip('-')
 ops.append({
  'id':f'delete-{slug}-{call[2:]}','label':label,'group':'Koleksi',
  'method':'DELETE','endpoint':path,'path':path,'serviceId':'main',
  'serviceMapping':'audited supplemental main-session group action',
  'encoding':'none','recoveredTransport':'DELETE with interpolated ID; no caller body/query; ordinary stored-account main client',
  'auth':'session','authenticated':True,'effect':'write','mutates':True,'requiresConfirmation':True,
  'enabled':True,'supported':True,'inspectOnly':False,'readiness':'ready_unverified',
  'reason':'Kontrak DELETE dan respons bertipe dipulihkan dari APK; penerimaan server belum diverifikasi.',
  'fields':[{'path':'path_argument_1','label':'ID grup' if call=='0xda9450' else 'ID koleksi','type':'string','strictString':True,'location':'path','required':'unknown','clientRequired':True,'allowEmpty':True,'source':'input','recoveredType':"String; nullable UI ID falls back to ''",'description':"ID asli tanpa trim; nilai null model diubah caller menjadi ''. Browser meng-encode sebagai satu segmen dan menolak dot-path; byte escaping transport native belum dibuktikan."}],
  'evidence':{'callAddress':call,'source':source,'nativeProofSha256':proof_sha,'contractSource':'supplemental audited group DELETE'},
  'serverRequiredness':'unknown','serverAcceptance':'untested',
 })
assert len(ops)==173 and len({o['id'] for o in ops})==173
item_delete_source='analysis/recovered/collection-item-delete/flow.json'
item_delete_sha='a88478e6e4865f778b6821062623139f8fcbf516bba4467197f14a6cb734a97d'
item_delete_bytes=(ROOT/item_delete_source).read_bytes()
assert hashlib.sha256(item_delete_bytes).hexdigest()==item_delete_sha
item_delete=json.loads(item_delete_bytes)
assert item_delete['contract']['request']['PERSIL']['callsite']=='0xda7530'
assert item_delete['contract']['request']['otherwise']['callsite']=='0xd92888'
for call,prefix,label in [
 ('0xda7530','Collection/DeleteCollectionPersil/','Hapus koleksi bidang'),
 ('0xd92888','Collection/DeleteCollectionBerkas/','Hapus koleksi berkas'),
]:
 path=prefix+'{path_argument_1}'
 slug=re.sub('[^a-z0-9]+','-',path.lower()).strip('-')
 ops.append({
  'id':f'delete-{slug}-{call[2:]}','label':label,'group':'Koleksi',
  'method':'DELETE','endpoint':path,'path':path,'serviceId':'main',
  'serviceMapping':'audited supplemental main-session collection-item action',
  'encoding':'none','recoveredTransport':'DELETE with interpolated cached collection row ID; no caller body/query/files',
  'auth':'session','authenticated':True,'effect':'write','mutates':True,'requiresConfirmation':True,
  'enabled':True,'supported':True,'inspectOnly':False,'readiness':'ready_unverified',
  'reason':'Kontrak hapus koleksi dan respons bertipe dipulihkan dari APK; penerimaan server belum diverifikasi.',
  'fields':[{'path':'path_argument_1','label':'ID koleksi','type':'string','strictString':True,'location':'path','required':'unknown','clientRequired':True,'allowEmpty':True,'source':'input','recoveredType':'String from first matched cached collection row','description':"ID baris koleksi persis, bukan contentId. String kosong dipertahankan. Browser meng-encode satu segmen dan menolak dot-path; final escaping native belum dibuktikan."}],
  'evidence':{'callAddress':call,'source':item_delete_source,'nativeProofSha256':item_delete_sha,'contractSource':'supplemental audited collection-item DELETE'},
  'serverRequiredness':'unknown','serverAcceptance':'untested',
 })
assert len(ops)==175 and len({o['id'] for o in ops})==175
item_edit_source='analysis/recovered/collection-item-edit/flow.json'
item_edit_sha='eabdaed76d862c8a5dd6a8feb1d927233e18a5755263c25614ff04fe3f86d4c8'
item_edit_bytes=(ROOT/item_edit_source).read_bytes()
assert hashlib.sha256(item_edit_bytes).hexdigest()==item_edit_sha
item_edit=json.loads(item_edit_bytes)
assert item_edit['contract']['request']['method']=='PUT'
assert item_edit['contract']['request']['callsite']=='0xda839c'
assert item_edit['contract']['request']['field_order']==['id','caption']
ops.append({
 'id':'put-collection-editcollectionpersil-da839c','label':'Edit caption koleksi','group':'Koleksi',
 'method':'PUT','endpoint':'Collection/EditCollectionPersil','path':'Collection/EditCollectionPersil','serviceId':'main',
 'serviceMapping':'audited supplemental main-session collection-item action',
 'encoding':'multipart','recoveredTransport':'PUT with FormData fields id then caption; ordinary stored-account main client',
 'auth':'session','authenticated':True,'effect':'write','mutates':True,'requiresConfirmation':True,
 'enabled':True,'supported':True,'inspectOnly':False,'readiness':'ready_unverified',
 'reason':'Kontrak edit caption dan respons bertipe dipulihkan dari APK; penerimaan server belum diverifikasi.',
 'fields':[
  {'path':'id','label':'ID koleksi','type':'string','strictString':True,'location':'body','required':'unknown','clientRequired':True,'allowEmpty':True,'source':'input','recoveredType':"String; caller row.id ?? ''",'description':'ID baris koleksi persis, bukan contentId atau ID bidang.'},
  {'path':'caption','label':'Caption','type':'string','strictString':True,'location':'body','required':'unknown','clientRequired':True,'allowEmpty':True,'source':'input','recoveredType':'String','description':'Caption mengganti title. UI native memangkas dan mengabaikan caption kosong; service tidak memangkas atau mengulangi gate kosong sehingga adapter mempertahankan String mentah.'},
 ],
 'evidence':{'callAddress':'0xda839c','source':item_edit_source,'nativeProofSha256':item_edit_sha,'contractSource':'supplemental audited collection-item PUT'},
 'serverRequiredness':'unknown','serverAcceptance':'untested',
})
assert len(ops)==176 and len({o['id'] for o in ops})==176
target=ROOT/'webapp/private/operations.mjs'
runtime=(ROOT/'webapp/private/operations-runtime.mjs').read_text(encoding='utf-8')
target.write_text('// Generated from the fixed request corpus and supplemental SPS/collection evidence; do not include credentials.\n'+
 'const serviceData = '+json.dumps(services,ensure_ascii=False,indent=2)+';\n'+
 'const operationData = '+json.dumps(ops,ensure_ascii=False,indent=2)+';\n'+runtime,encoding='utf-8')
print(f'Generated {len(ops)} operations; {sum(o["enabled"] for o in ops)} enabled for unverified testing.')
