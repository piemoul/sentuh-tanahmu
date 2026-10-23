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
scan_source='analysis/recovered/scan-flow.json'
scan_sha='bfa3cdc5257b0ca57b3d9ee881a2cac4c9ecd243cf81c1493e9885fe4c823ab4'
assert hashlib.sha256((ROOT/scan_source).read_bytes()).hexdigest()==scan_sha
scan_map_proofs={
 '0xd3d134':('analysis/recovered/scan-pbt-map-followup/flow.json','d62a880cf8940e871e98be6954327ab0bbf494540362b7e8c3aa2eb33f002e93'),
 '0xd311e8':('analysis/recovered/scan-kkpr-map-followup/flow.json','8aec89dbd6c36b0aba47caf0c880aec5f1fbf83b58963e1eed3579f316301d24'),
}
for map_source,map_sha in scan_map_proofs.values():assert hashlib.sha256((ROOT/map_source).read_bytes()).hexdigest()==map_sha
daring_form_source='analysis/recovered/verification-daring-form-followup/flow.json'
daring_form_sha='ea736769eab7c366ca146222ef8860817c0fd17242f0eb768f383c8a7c29c7b8'
daring_response_source='analysis/recovered/daring-identity-response-followup/flow.json'
daring_response_sha='ff50866326808280c90b2962cda3845b2e50ffe5124cdae2ad6d6c46d96a3243'
for source,sha in [(daring_form_source,daring_form_sha),(daring_response_source,daring_response_sha)]:assert hashlib.sha256((ROOT/source).read_bytes()).hexdigest()==sha
daring_response=json.loads((ROOT/daring_response_source).read_bytes())
assert daring_response['prior_ledger_sha256']==daring_form_sha
assert daring_response['contract']['request_values']['order']==['Nik','Nama','Tempatlahir','TglLahir','NoHp']
parcel_source='analysis/recovered/parcel-search-followup/flow.json'
parcel_sha='c110b2f22ecb811f063156ccc47e5708f31286d1ad0e4bab8492a6309077d2d7'
assert hashlib.sha256((ROOT/parcel_source).read_bytes()).hexdigest()==parcel_sha
parcel_calls={'0xd752bc','0xd74e4c','0xd74b90'}
guestbook_source='analysis/recovered/guestbook-service-followup/flow.json'
guestbook_sha='9bceab7de8b363e521cea846abaa65ae03a925fa5a5f389ee249c014676f10dc'
assert hashlib.sha256((ROOT/guestbook_source).read_bytes()).hexdigest()==guestbook_sha
guestbook=json.loads((ROOT/guestbook_source).read_text(encoding='utf-8'))
assert guestbook['contract']['url']['initial_url']=='https://sentuh.atrbpn.go.id/bukutamu'
assert guestbook['contract']['get']['query_order']==['uid','unid']
guestbook_submit_source='analysis/recovered/guestbook-submit-followup-20261022/flow.json'
guestbook_submit_sha='ea94f17f3d7e6a768f6c44bf40b99045b5f45c7407a8530e7198b81aa3dc4b04'
assert hashlib.sha256((ROOT/guestbook_submit_source).read_bytes()).hexdigest()==guestbook_submit_sha
guestbook_submit=json.loads((ROOT/guestbook_submit_source).read_bytes())
assert guestbook_submit['runtime_observed'] is False and guestbook_submit['production_requests']==0 and guestbook_submit['guestbook_submissions']==0
assert guestbook_submit['contract']['write']['fields']==['kantorId','unitKerjaId','userId','nik','alamat','namaLengkap','tempatLahir','tanggalLahir','noTelp','email','instansi','keperluan']
review_source='analysis/recovered/lost-review-protocol/source-index.json'
review_sha='24e250f583021c034a2bee9036b33cbed47a7744c89d326ccf7b7aa8cd9756dd'
review_bytes=(ROOT/review_source).read_bytes()
assert hashlib.sha256(review_bytes).hexdigest()==review_sha
review_proof=json.loads(review_bytes)
assert review_proof['production_requests']==0 and review_proof['review_writes_enabled'] is False
for source in review_proof['sources']:
 assert hashlib.sha256((ROOT/source['path']).read_bytes()).hexdigest()==source['sha256']
review_post_source='analysis/recovered/lost-review-post-protocol/source-index.json'
review_post_sha='8c141a63e3fe77ee8b6be559914be7de58cea4fa9aaaa0c003aa31b8514b39ce'
review_post_bytes=(ROOT/review_post_source).read_bytes()
assert hashlib.sha256(review_post_bytes).hexdigest()==review_post_sha
review_post_proof=json.loads(review_post_bytes)
assert review_post_proof['production_requests']==0 and review_post_proof['review_writes_enabled_by_audit'] is False
assert review_post_proof['verification']['passed'] is True and len(review_post_proof['sources'])==133
for source in review_post_proof['sources']:
 assert hashlib.sha256((ROOT/source['path']).read_bytes()).hexdigest()==source['sha256']
mitra_source='analysis/recovered/mitra-read-contract-followup/source-index.json'
mitra_sha='e6d6c1b29c6f6efa4e8cbd9ba84657ae54205e3f77a71d524b6016abdf854d5b'
mitra_bytes=(ROOT/mitra_source).read_bytes()
assert hashlib.sha256(mitra_bytes).hexdigest()==mitra_sha
mitra_proof=json.loads(mitra_bytes)
assert mitra_proof['production_requests']==0 and mitra_proof['runtime_files_changed'] is False and mitra_proof['verification']['passed'] is True
for source in mitra_proof['sources']:
 assert hashlib.sha256((ROOT/source['path']).read_bytes()).hexdigest()==source['sha256']
mitra_calls={'0xd3aa20','0xd3af08','0xd3b428','0xd3b910','0xd3be30'}
rating_ppat_source='analysis/recovered/ratingppat-read-followup/source-index.json'
rating_ppat_sha='fb14dcd006486b43e476901746b9befacba29ae8970b926ec1656bb12bd431f1'
rating_ppat_bytes=(ROOT/rating_ppat_source).read_bytes()
assert hashlib.sha256(rating_ppat_bytes).hexdigest()==rating_ppat_sha
rating_ppat_proof=json.loads(rating_ppat_bytes)
assert rating_ppat_proof['production_requests']==0 and rating_ppat_proof['submissions']==0 and rating_ppat_proof['rating_writes_enabled_by_audit'] is False
assert rating_ppat_proof['verification']['passed'] is True and rating_ppat_proof['request']['path']=='RatingPPAT/GetRatingQuestions' and rating_ppat_proof['request']['fields']==[]
for source in rating_ppat_proof['sources']:
 assert hashlib.sha256((ROOT/source['path']).read_bytes()).hexdigest()==source['sha256']
rating_ppat_post_source='analysis/recovered/ratingppat-write-final-followup/source-index.json'
rating_ppat_post_sha='67a9a026369f288352b435e6a09facc9ee87167dfa1ce154d2f5da55fb61bd52'
rating_ppat_post_bytes=(ROOT/rating_ppat_post_source).read_bytes()
assert hashlib.sha256(rating_ppat_post_bytes).hexdigest()==rating_ppat_post_sha
rating_ppat_post_proof=json.loads(rating_ppat_post_bytes)
assert rating_ppat_post_proof['verification']['passed'] is True and rating_ppat_post_proof['productionRequests']==0 and rating_ppat_post_proof['submissions']==0
assert rating_ppat_post_proof['contract']['path']=='RatingPPAT/PostRatingPPAT' and rating_ppat_post_proof['contract']['orderedFields']==['aktaId','PertanyaanRatingPPATId']
for source in rating_ppat_post_proof['sources']:
 assert hashlib.sha256((ROOT/source['path']).read_bytes()).hexdigest()==source['sha256']
berkas_question_source='analysis/recovered/berkas-question-followup-20261022/flow.json'
berkas_question_sha='ab802ec9225b175692ebe89c3fb2336a2e9f351ef6673fe6069c72725fbdaa18'
berkas_question_codec_source='analysis/recovered/berkas-question-codec-20261023/flow.json'
berkas_question_codec_sha='b3b27e8bebd12e1e0b56ce522fd9380c5bcc9e777921378f8b23817d08648afb'
for source,sha in [(berkas_question_source,berkas_question_sha),(berkas_question_codec_source,berkas_question_codec_sha)]:assert hashlib.sha256((ROOT/source).read_bytes()).hexdigest()==sha
berkas_rating_source='analysis/recovered/berkas-rating-followup/flow.json'
berkas_rating_sha='16c83a12a6b4cbf62b9a3881843c27c569102bd6a0617cddccd63dc9e8c0275f'
berkas_rating_catch_source='analysis/recovered/berkas-rating-followup/catch-followup.json'
berkas_rating_catch_sha='a20543d7460f39125257cf88a59f7073a8017aa0cdd07e74e2964bf575d0d24f'
berkas_rating_entry_source='analysis/recovered/berkas-rating-followup/entry-refinement.json'
berkas_rating_entry_sha='60891c26dbbbc4856ed66af2806926555124628ffc0642d57507273c44ff81b1'
for source,sha in [(berkas_rating_source,berkas_rating_sha),(berkas_rating_catch_source,berkas_rating_catch_sha),(berkas_rating_entry_source,berkas_rating_entry_sha)]:assert hashlib.sha256((ROOT/source).read_bytes()).hexdigest()==sha
berkas_rating_proof=json.loads((ROOT/berkas_rating_source).read_bytes())
berkas_rating_catch_proof=json.loads((ROOT/berkas_rating_catch_source).read_bytes())
berkas_rating_entry_proof=json.loads((ROOT/berkas_rating_entry_source).read_bytes())
assert berkas_rating_proof['production_requests']==0 and berkas_rating_proof['contract']['request']['ordered_fields']==['Berkasid','rating','userComment']
assert berkas_rating_catch_proof['contract']['controller_catch']['first'] is False and berkas_rating_entry_proof['production_requests']==0
assert berkas_rating_proof['shared_lost_source_pins']==len(review_post_proof['sources'])==133
for source in berkas_rating_proof['sources']+berkas_rating_proof['inherited_sources']+berkas_rating_proof['dependencies']+berkas_rating_entry_proof['sources']+[berkas_rating_catch_proof['source']]:
 assert hashlib.sha256((ROOT/source['path']).read_bytes()).hexdigest()==source['sha256']
yuridis_source='analysis/recovered/yuridis-read-flow/source-index.json'
yuridis_sha='3993a0e2b3988890bb6bad345797329c07d126d965579324dc75af6f3d5a3ebe'
yuridis_bytes=(ROOT/yuridis_source).read_bytes()
assert hashlib.sha256(yuridis_bytes).hexdigest()==yuridis_sha
yuridis_proof=json.loads(yuridis_bytes)
assert yuridis_proof['passed'] is True and yuridis_proof['runtimeObserved'] is False and yuridis_proof['productionRequests']==0
for source in yuridis_proof['sources']:
 assert hashlib.sha256((ROOT/source['path']).read_bytes()).hexdigest()==source['sha256']
queue_booking_wire_source='analysis/recovered/queue-booking-wire-followup/flow.json'
queue_booking_wire_sha='95e3bc41929c7e2f7a854a7ae28f8a0045383320cfe4920b7ed1cbf7f585b067'
queue_booking_preflight_source='analysis/recovered/queue-preflight-followup/flow.json'
queue_booking_preflight_sha='68d899495e9abb17278eccad0e1129dc82124216e4538d8a7f5ea5fad140a9b8'
for source,sha in [(queue_booking_wire_source,queue_booking_wire_sha),(queue_booking_preflight_source,queue_booking_preflight_sha)]:
 proof_bytes=(ROOT/source).read_bytes()
 assert hashlib.sha256(proof_bytes).hexdigest()==sha
 proof=json.loads(proof_bytes)
 for item in proof['sources']:assert hashlib.sha256((ROOT/item['file']).read_bytes()).hexdigest()==item['sha256']
queue_booking_wire=json.loads((ROOT/queue_booking_wire_source).read_bytes())
assert queue_booking_wire['positive_contract']['full_create_enabled'] is False
assert queue_booking_wire['actions']['provider_requests']==0 and queue_booking_wire['actions']['booking_posts']==0
swaplotting_submit_source='analysis/recovered/swaplotting-submit-followup/flow.json'
swaplotting_submit_sha='e835a101543ad6d3c63ed31b2b9c947ec2deea6be32093e4d45c5266afe72d94'
swaplotting_service_source='analysis/recovered/swaplotting-service-followup/flow.json'
swaplotting_service_sha='f5be07485685102e41ee39e0718f4d241dee0224fd70b3b6e447a37e0bdd65f9'
swaplotting_multipart_source='analysis/recovered/swaplotting-multipart-followup/flow.json'
swaplotting_multipart_sha='31e4d9bbbdfdd7d77226d9cde0dfe5f6220311c5233f41382b0d03ae373c833e'
for source,sha in [(swaplotting_submit_source,swaplotting_submit_sha),(swaplotting_service_source,swaplotting_service_sha),(swaplotting_multipart_source,swaplotting_multipart_sha)]:
 proof_bytes=(ROOT/source).read_bytes();assert hashlib.sha256(proof_bytes).hexdigest()==sha
 for item in json.loads(proof_bytes)['sources']:assert hashlib.sha256((ROOT/item.get('path',item.get('file'))).read_bytes()).hexdigest()==item['sha256']
swaplotting_submit=json.loads((ROOT/swaplotting_submit_source).read_bytes())
assert swaplotting_submit['actions']['provider_requests']==0 and swaplotting_submit['actions']['uploads']==0 and swaplotting_submit['actions']['activity_posts']==0
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
 '0xd752bc':('Wilayah untuk pencarian bidang','session','none'),
 '0xd74e4c':('Cari bidang sertipikat analog','session','none'),
 '0xd74b90':('Cari bidang sertipikat elektronik','session','none'),
 '0xd2939c':('Ringkasan akun saya','session','form'),
 '0xd44dc0':('Sertipikat tanah saya','session','none'),
 '0xd45354':('Sertipikat wakaf saya','session','none'),
 '0xd441a4':('Sertipikat hak tanggungan saya','session','none'),
 '0xd446dc':('Detail hak tanggungan','session','none'),
 '0xd43b54':('Detail sertipikat di brankas','session','none'),
 # Analog certificate flow and final session authorization: analysis/CERTIFICATE-DETAIL-FLOW.md.
 '0xd4340c':('Detail sertipikat analog saya','session','none'),
 '0xd1ccc4':('Daftar akta saya','session','none'),
 '0xd1d6bc':('Pertanyaan penilaian PPAT','session','none'),
 '0xd86e10':('Nilai layanan PPAT','session','json'),
 '0xd915c4':('Nilai layanan berkas','session','multipart'),
 '0xd15068':('Daftar berkas saya','session','multipart'),
 '0xd25618':('Geotag pada berkas','session','multipart'),
 '0xd88218':('Cari berkas milik saya','session','form'),
 '0xd87ca8':('Status cetak berkas','session','form'),
 '0xd87ea8':('Tahapan layanan berkas','session','form'),
 '0xd2826c':('Tanya jawab pada berkas','session','none'),
 '0xd994f4':('Kirim pesan Tanya Berkas','session','form'),
 '0xd31a50':('Koleksi saya','session','none'),
 '0xd31fbc':('Grup koleksi bidang saya','session','none'),
 '0xd25250':('Status koleksi berkas','session','none'),
 '0xd1dc68':('Aktivitas akun saya','session','none'),
 '0xda15dc':('Status verifikasi akun saya','session','none'),
 '0xda9a78':('Validasi data KTP','session','multipart'),
 '0xd92664':('Simpan berkas ke koleksi saya','session','multipart'),
 '0xdaae30':('Simpan bidang ke koleksi saya','session','multipart'),
 '0xda8f20':('Buat grup koleksi bidang','session','multipart'),
 '0xda897c':('Masukkan bidang ke grup koleksi','session','multipart'),
 '0xd74ab4':('Catat aktivitas akun saya','session','multipart'),
 '0xde6c94':('Hapus aktivitas akun saya','session','multipart'),
 '0xd0fb64':('Pengumuman yuridis per kantor','optionalSession','none'),
 '0xd10a9c':('Pengumuman sertipikat hilang','optionalSession','none'),
 '0xdace58':('Ulasan pengumuman sertipikat hilang','session','form'),
 '0xdad1dc':('Ulasan terakhir pengumuman yuridis terpilih','session','form'),
 '0xdeb030':('Kirim ulasan pengumuman terpilih','session','multipart'),
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
 '0xd42440':('Klasifikasi kode Scan','session','form'),
 # Exact q encoding and direct geometry model: analysis/DOCUMENT-GEO-FLOW.md.
 '0xd39f1c':('Lokasi bidang dari dokumen','session','none'),
 '0xd21a34':('Kantor pertanahan di sekitar lokasi','optionalSession','json'),
 '0xd2127c':('Kalender layanan kantor','optionalSession','form'),
 '0xdd980c':('Detail plot bidang','session','multipart'),
 '0xddbb60':('Daftar plot bidang saya','session','none'),
 '0xd26d20':('Unduh surat pernyataan geotag yang ada','session','multipart'),
}
write_calls={'0xd92664','0xdaae30','0xda8f20','0xda897c','0xd74ab4','0xde6c94','0xd96b98','0xd42440','0xda9a78','0xdeb030','0xd86e10','0xd915c4'}
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
  # Swaplotting's two native office loaders omit optional Uqj; null becomes ''.
  if call=='0xd10364' and key=='tipeKantor':field.update(allowEmpty=True)
  if call in parcel_calls:
   field.update(type='string',strictString=True,clientRequired=key not in {'nama','kodehat'},allowEmpty=key in {'nama','kodehat','nomorhak','wilayahid'},description='String asli dari form Cari Bidang; tidak dipangkas atau diubah menjadi angka. Kantor memakai KantorId main, wilayah memakai WilayahId dari respons Cyb.')
  if call=='0xd41ee8' and key=='name':field.update(clientRequired=False,default='',label='Nama dari profil akun',description='Field nama pada account/account_summary; bukan username atau nama file. Nilai kosong dipertahankan sesuai fallback client.')
  if call=='0xd42440':
   field.update(type='string',strictString=True,allowEmpty=True,clientRequired=True)
   if key=='name':field.update(source='server-profile',clientRequired=False,label='Nama dari profil sesi Scan',description='Backend mengambil nama ?? email ?? "-" dari account_summary sesi ini; browser tidak boleh mengirim nama.')
   else:field.update(description='Kode mentah tanpa trim/decode/split; String kosong dipertahankan sesuai barcode.code ?? empty.')
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
  if call=='0xdace58':
   field.update(type='string',strictString=True,recoveredType='String',clientRequired=key=='contentId',allowEmpty=key=='contentId',description='String persis dari berkasId record pengumuman; null ditolak tanpa trim atau substitusi.' if key=='contentId' else 'String konstan dari caller ulasan pengumuman sertipikat hilang; tidak menerima tipe numerik atau halaman lain.')
   if key!='contentId':field.update(source='constant',default={'reviewType':'pengumumanSertipikatHilang','pageNumber':'1','pageSize':'10'}[key])
  if call=='0xd0fb64':
   field.update(type='string',strictString=True,allowEmpty=True,clientRequired=True,recoveredType='String from selected jyb.KantorId or profile.kantorId',description='KantorId String asli dari pemilih/profil; tidak dipangkas atau dikoersi. String kosong nonnull dipertahankan sesuai native.')
  if call=='0xdad1dc':
   field.update(type='string',strictString=True,allowEmpty=key=='contentId',clientRequired=key=='contentId',recoveredType='String',description='String persis dari persilId record pengumuman yuridis terpilih; null ditolak tanpa trim/substitusi.' if key=='contentId' else 'Jenis tetap sertipikatSaya dari JTb yJj=true; bukan pengumumanSertipikatHilang.')
   if key=='reviewType':field.update(source='constant',default='sertipikatSaya')
  if call=='0xd86e10':
   if key=='aktaId':field.update(type='string',strictString=True,allowEmpty=True,clientRequired=True,recoveredType='String from selected Akta ID',description='ID Akta asli dari entry Rating PPAT terpilih; String kosong dan spasi dipertahankan tanpa trim/substitusi.')
   elif key=='PertanyaanRatingPPATId':field.update(type='array',arraySchema='rating-ppat-selected-answer-ids',minItems=0,clientRequired=True,recoveredType='List<String> from selection Map.values',items={'type':'string','strictString':True},description='ID jawaban dari pilihan kuesioner dalam urutan pemasukan Map; boleh kosong, duplikat atau String kosong. Tidak disortir, dipangkas atau diubah menjadi nilai/bobot.')
  if call in mitra_calls:
   field.update(type='string',strictString=True,allowEmpty=True,clientRequired=True,recoveredType='String from selected parent ID ?? emptyString',description='ID asli baris kantor/wilayah terpilih tanpa trim; null pada parent diubah menjadi String kosong oleh caller. Encoding query terisolasi merupakan adaptasi browser, bukan bukti kesamaan seluruh byte URL native.')
  if call=='0xdeb030':
   if key=='reviewPhoto{n}':field.update(type='file',location='file',source='file',dynamicNumbered=True,clientRequired=False,description='Foto pilihan pengguna berurutan reviewPhoto1..N, boleh tanpa foto/berkas kosong. Batas25MiB seluruh kiriman adalah kebijakan browser; tidak ada batas jumlah/ukuran native yang dibuktikan.')
   elif key=='rating':field.update(type='integer',strictNumber=True,minimum=1,maximum=5,clientRequired=True,description='Integer1..5 dari lima bintang formulir native; nilai awal0 belum dapat dikirim.')
   else:
    field.update(type='string',strictString=True,allowEmpty=True,clientRequired=True,recoveredType='String',description='String asli tanpa trim; contentId dari berkasId pengumuman dan komentar boleh kosong setelah diedit. Tidak menerapkan batas16000karakter sebagai fakta native.')
    if key=='reviewType':field.update(source='selected-context',default='pengumumanSertipikatHilang',allowedValues=['pengumumanSertipikatHilang','sertipikatSaya'],clientRequired=False,allowEmpty=False,description='Hanya dua konteks detail native yang diaudit: berkasId Sertipikat Hilang atau persilId Yuridis. Jenis lain ditolak; default lama tetap pengumumanSertipikatHilang.')
    elif key=='contentId':field.update(description='String asli dari berkasId Sertipikat Hilang atau persilId Yuridis terpilih, sesuai reviewType konteks; tidak dipangkas atau disubstitusi.')
  if call=='0xda9a78':
   field.update(type='string',strictString=True,allowEmpty=True,clientRequired=False,default='',source='input',recoveredType="OEb String?; null becomes empty String",label={'Nik':'NIK Sesuai KTP','Nama':'Nama Lengkap','Tempatlahir':'Tempat Lahir','TglLahir':'Tanggal Lahir','NoHp':'No. HP (terhubung dengan WhatsApp)'}[key],description="String asli dari formulir Daring, tanpa trim atau konversi angka. Null/missing menjadi ''. Bukan identitas yang diambil dari profil masuk.")
   field.pop('sessionKey',None)
  if call=='0xd96b98':
   field['type']='boolean' if key=='IsOffline' else 'file' if key=='file' else 'string'
   if key=='file':field.update(accept='image/png',maxBytes=12*1024*1024,description='Foto PNG dikirim sebagai bagian multipart file; batas adapter lokal 12 MiB.')
   if key=='IsOffline':field['default']=False
   if key in ('Lat','Longi'):field.update(format='decimal-coordinate',description='Nilai pengukuran Anda; teks desimal dipertahankan. Jalur APK tertentu memakai 7 angka desimal, tidak semua jalur.')
  fields.append(field)
 for arg in c.get('path_arguments',[]):
  fields.append({'path':arg.get('path','path_argument_1') if isinstance(arg,dict) else 'path_argument_1','label':'Segmen path','type':'unknown','location':'path','required':'unknown','clientRequired':False,'source':'input'})
 if any('[]' in f['path'] or f['type'] in ('array','object') and not(call=='0xda3490' and f['path']=='data' and f.get('arraySchema')=='information-simulation-type2' or call=='0xd86e10' and f['path']=='PertanyaanRatingPPATId' and f.get('arraySchema')=='rating-ppat-selected-answer-ids') for f in fields) and ready:raise RuntimeError('Opaque model erroneously enabled')
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
 if call=='0xd28bf4':
  op.update(label='Unit kerja Buku Tamu',serviceId='main',clientProfile='guestbook-read',upstreamAuthentication='application',auth='session',authenticated=True,effect='read',mutates=False,requiresConfirmation=False,enabled=True,supported=True,inspectOnly=False,readiness='ready_unverified',serviceMapping='audited standalone application-authorized guestbook read; account session is a local eligibility guard',reason='Membaca metadata unit dari QR kantor. Klien tersendiri memakai konfigurasi aplikasi yang sudah tersedia, tanpa bearer/refresh akun. Tidak mencatat kedatangan.',fields=[{'path':key,'label':key,'type':'string','strictString':True,'allowEmpty':True,'location':'query','required':'unknown','clientRequired':True,'source':'input','description':'Nilai mentah dari QR kantor; tidak dipangkas atau didekode ulang. Bukan bukti kehadiran atau keaslian QR.'} for key in ['uid','unid']],evidence={'callAddress':call,'source':guestbook_source,'nativeProofSha256':guestbook_sha,'uiSource':'analysis/recovered/guestbook-followup/flow.json'})
 if call=='0xd99dd8':
  guestbook_fields=[('contextId','Konteks unit Buku Tamu'),('name','Nama Lengkap'),('nik','NIK'),('phone','Nomor Telepon'),('birthDate','Tanggal Lahir'),('birthPlace','Tempat Lahir'),('address','Alamat Sesuai KTP'),('email','Alamat Email'),('institution','Instansi'),('purpose','Keperluan')]
  op.update(label='Simpan Buku Tamu',serviceId='main',clientProfile='guestbook-post',upstreamAuthentication='application',auth='session',authenticated=True,effect='write',mutates=True,requiresConfirmation=True,enabled=True,supported=True,inspectOnly=False,readiness='ready_unverified',serviceMapping='audited standalone application-authorized guestbook write; account session and opaque QR/lookup context are local ownership guards',reason='Mendaftarkan kedatangan melalui formulir unit dari QR kantor yang dibaca pada sesi ini. Tiga ID lookup hanya ditetapkan server; sembilan isian dipertahankan mentah tanpa trim atau konversi tanggal. Hasil native hanya error bool berdasarkan HTTP200 setelah transform respons, bukan verifikasi petugas atau kartu pengunjung. Tidak ada kirim ulang otomatis, pemalsuan QR/kehadiran, bearer akun atau retry Directus. Guard konteks, batas byte dan hasil ambigu adalah adaptasi browser; penerimaan produksi belum diuji.',fields=[{'path':key,'label':label,'type':'string','strictString':True,'location':'local','required':'unknown','clientRequired':True,'source':'input'} for key,label in guestbook_fields],nativeFields=[{'path':key,'location':'body','source':'server-QR-lookup' if index<3 else 'raw-user-form'} for index,key in enumerate(guestbook_submit['contract']['write']['fields'])],evidence={'callAddress':call,'source':guestbook_source,'nativeProofSha256':guestbook_sha,'submitSource':guestbook_submit_source,'submitProofSha256':guestbook_submit_sha})
 if call in {'0xd2cb24','0xd2cf54'}:
  op.update(serviceMapping='audited cloned main client with LRb/AP',reason='Kontrak daftar dan model nullable dipulihkan dari APK; penerimaan server belum diverifikasi.',evidence={'callAddress':call,'source':'analysis/recovered/news-flow/flow.json','requestSource':c['source'],'nativeProofSha256':'9628b9d094cb486c82a86f8a27d90426a3d15737d32fc2d7e3fd36e1615f6aa9'})
 if call in {'0xd1dc68','0xde6c94'}:
  op.update(serviceMapping='audited main-session activity list/delete',reason='Kontrak aktivitas native dipulihkan; penerimaan server belum diuji. Penghapusan cache lokal mengikuti controller native meski hasil layanan false.' if call=='0xde6c94' else 'Daftar aktivitas bertipe; createdAt dipertahankan sebagai String/null tanpa membuat timestamp browser.',evidence={'callAddress':call,'source':activity_source,'requestSource':c['source'],'nativeProofSha256':activity_sha})
 if call=='0xdace58':
  assert [field['path'] for field in fields]==['reviewType','contentId','pageNumber','pageSize']
  op.update(serviceMapping='audited main-session read-only lost-certificate reviews',effect='read',mutates=False,requiresConfirmation=False,reason='Pembacaan ulasan pengumuman: form String tetap, sesi akun, shared2xx dan model nullable yyb/zyb/Ayb. Penerimaan server belum diuji; tidak mengirim ulasan atau foto.',evidence={'callAddress':call,'source':review_source,'requestSource':c['source'],'nativeProofSha256':review_sha,'protocolDoc':'analysis/LOST-REVIEW-PROTOCOL.md'})
 if call in mitra_calls:
  op.update(serviceMapping='audited main optional-session Mitra read',reason='Daftar Mitra native HTTP200 dengan model nullableString dan body.data List; error/message tidak dibaca. ID mentah/null parent menjadi String kosong. Penerimaan server belum diuji; encoding query dan batas parser browser dinyatakan sebagai adaptasi.',evidence={'callAddress':call,'source':mitra_source,'requestSource':c['source'],'nativeProofSha256':mitra_sha,'protocolDoc':'analysis/MITRA-READ-CONTRACT-FOLLOWUP-20261021.md'})
 if call=='0xd1d6bc':
  assert fields==[] and method=='GET' and path=='RatingPPAT/GetRatingQuestions'
  op.update(serviceMapping='audited main-session Rating PPAT question read',reason='Pembacaan pertanyaan Rating PPAT tepat HTTP200 tanpa parameter entry, body.data List dan model Gyb/Hyb nullableString dengan nested List nullable. Error/message envelope tidak dibaca. Pengiriman penilaian tersedia melalui operasi POST terpisah dengan konfirmasi. Batas parser browser dinyatakan sebagai adaptasi; penerimaan server belum diuji.',evidence={'callAddress':call,'source':rating_ppat_source,'requestSource':c['source'],'nativeProofSha256':rating_ppat_sha,'protocolDoc':'analysis/RATING-PPAT-READ-FOLLOWUP.md'})
 if call=='0xd86e10':
  assert [field['path'] for field in fields]==['aktaId','PertanyaanRatingPPATId'] and method=='POST' and path=='RatingPPAT/PostRatingPPAT'
  op.update(serviceMapping='audited main-session selected Akta Rating PPAT submission',recoveredTransport='Ordered JSON String aktaId then PertanyaanRatingPPATId List<String>; application/json and accept text/plain; shared2xx response',reason='Pengiriman Rating PPAT terpilih dengan konfirmasi. Respons normal memakai !error dan pesan String langsung; null memakai fallback native, tanpa decode String tambahan atau syarat HTTP200 lokal. Error transport/auth tetap eksplisit pada backend browser; frontend memetakan error layanan biasa ke tuple catch native. Penerimaan dan penyimpanan server belum diuji.',evidence={'callAddress':call,'source':rating_ppat_post_source,'requestSource':c['source'],'nativeProofSha256':rating_ppat_post_sha,'protocolDoc':'analysis/RATING-PPAT-WRITE-FINAL-FOLLOWUP-20261021.md','uiSource':'analysis/recovered/ratingppat-ui-followup/source-index.json','navigationSource':'analysis/recovered/ratingppat-result-navigation-followup/source-index.json'},serverEffects='Posts one user-selected PPAT rating for the original selected Akta and answer-ID List; no production submission performed by validation')
 if call in {'0xd2826c','0xd994f4'}:
  op.update(serviceMapping='audited main-session selected-file conversation',evidence={'callAddress':call,'source':berkas_question_source,'nativeProofSha256':berkas_question_sha,'codecSource':berkas_question_codec_source,'codecProofSha256':berkas_question_codec_sha,'requestSource':c['source'],'protocolDoc':'analysis/BERKAS-QUESTION-FOLLOWUP-20261022.md','codecDoc':'analysis/BERKAS-QUESTION-CODEC-20261023.md'},reason='Tanya Berkas dari detail Koleksi atau Cari Berkas yang sesuai entry native. Riwayat tujuh String; pertanyaan hanya isTanya=String1. Pesan asli tidak dipangkas; POST dua field form, UTF8 dan space-to-plus native. Refresh hanya setelah HTTP200+typed error=false. Opaque context, ordinary ASCII ID domain dan unknown guard adalah adaptasi browser; penerimaan produksi belum diuji.')
  if call=='0xd994f4':op.update(effect='write',mutates=True,requiresConfirmation=True,clientProfile='berkas-question-post',fields=[{'path':'contextId','label':'Konteks percakapan detail berkas','type':'string','strictString':True,'location':'local','required':'unknown','clientRequired':True,'source':'input'},{'path':'content','label':'Pesan','type':'string','strictString':True,'location':'body','required':'unknown','clientRequired':True,'source':'input'}],nativeFields=[{'path':'berkasid','location':'body','source':'server-selected-original-file'},{'path':'content','location':'body','source':'original-editor-string'}],recoveredTransport='Ordered String form berkasid,content; UTF8 mask1, space-to-plus, raw LF preserved',serverEffects='Sends one user-written question to the selected file conversation. No production question submitted by validation.')
 if call=='0xd915c4':
  assert [field['path'] for field in fields]==['Berkasid','rating','userComment'] and method=='POST' and path=='berkas/postratingberkas'
  op.update(clientProfile='berkas-rating-post',serviceMapping='audited main-session original selected Berkasku rating submission',recoveredTransport='Ordered nativeFormData Berkasid,rating,userComment; rawUTF8 scalar bytes and sharedLOST finalizer; shared2xx response body strict nullablebool/String',reason='Penilaian hanya dari detail Berkasku dengan readyToRating=true pada baris asli dan konteks sesi opaque yang mengikat ID asli daftar, bukan ID tampilan, koleksi atau aktivitas. Komentar dipangkas seperti native; bintang integer1–5. Respons error=false bertipe menyatakan hasil layanan, tanpa receipt. Guard unknown/accepted dan TTL120s adalah adaptasi browser; tidak ada retry otomatis atau uji kirim produksi.',fields=[{'path':'contextId','label':'Konteks detail Berkasku','type':'string','strictString':True,'location':'local','required':'unknown','clientRequired':True,'source':'input'},{'path':'rating','label':'Bintang penilaian','type':'integer','strictNumber':True,'minimum':1,'maximum':5,'location':'body','required':'unknown','clientRequired':True,'source':'input'},{'path':'userComment','label':'Komentar penilaian','type':'string','strictString':True,'location':'body','required':'unknown','clientRequired':True,'source':'input'}],nativeFields=[{'path':key,'location':'body','source':'server-selected-original-Berkasku' if key=='Berkasid' else 'validated-user-input'} for key in ['Berkasid','rating','userComment']],evidence={'callAddress':call,'source':berkas_rating_source,'nativeProofSha256':berkas_rating_sha,'catchSource':berkas_rating_catch_source,'catchNativeProofSha256':berkas_rating_catch_sha,'entrySource':berkas_rating_entry_source,'entryNativeProofSha256':berkas_rating_entry_sha,'entryProtocolDoc':'analysis/BERKAS-RATING-ENTRY-REFINEMENT-20261021.md','requestSource':c['source'],'protocolDoc':'analysis/BERKAS-RATING-FOLLOWUP-20261021.md'},serverEffects='Posts one explicit rating for the original selected Berkasku ID; no production rating performed by validation')
 if call=='0xd0fb64':
  op.update(serviceMapping='audited main optional-session Yuridis feed',reason='Pembacaan pengumuman Yuridis tepat HTTP200, body.data List dan model GGb sebelas field nullable. Decode String satu kali mengikuti transform MIME; envelope error/message tidak dibaca. Penerimaan server belum diuji.',evidence={'callAddress':call,'source':yuridis_source,'requestSource':c['source'],'nativeProofSha256':yuridis_sha,'protocolDoc':'analysis/YURIDIS-READ-FLOW.md'})
 if call=='0xdad1dc':
  assert [field['path'] for field in fields]==['reviewType','contentId'] and path=='review/last_user_review'
  op.update(serviceMapping='audited main-session Yuridis last-user review read',recoveredTransport='Ordered form fields reviewType=sertipikatSaya and original GGb.persilId; shared main status2xx and MIME transform',reason='Pembacaan ulasan terakhir Yuridis: data null/missing menjadi list kosong sebelum validasi metadata; data nonnull dibungkus singleton sebelum model yyb/zyb/Ayb. Tidak ada pagination atau decode String tambahan. Penerimaan server belum diuji.',evidence={'callAddress':call,'source':yuridis_source,'requestSource':c['source'],'nativeProofSha256':yuridis_sha,'protocolDoc':'analysis/YURIDIS-READ-FLOW.md'})
 if call=='0xdeb030':
  assert [field['path'] for field in fields]==['contentId','reviewType','comment','rating','reviewPhoto{n}']
  op.update(serviceMapping='audited main-session lost-certificate review composer',recoveredTransport='Ordered raw UTF8 scalar multipart fields then original numbered file bytes; original Android POSIX basename with native996 extension MIME map',reason='Pengiriman ulasan pengumuman terpilih dengan konfirmasi. Respons false hanya setelah transform shared valid dan HTTP200; penerimaan server belum diuji. Batas25MiB kiriman/20MiB respons dan guard nama adalah kebijakan browser.',evidence={'callAddress':call,'source':review_post_source,'requestSource':c['source'],'nativeProofSha256':review_post_sha,'protocolDoc':'analysis/LOST-REVIEW-POST-PROTOCOL.md','uiSource':'analysis/recovered/lost-review-compose-ui/source-index.json','uiNativeProofSha256':'1f8a6dfb23f2913eeb68eab8042aa8f55fc57c48c0651015ed106c08b128cdfb'},serverEffects='Posts a new lost-certificate review and optional selected photos; no production submission performed by validation')
  op['serviceMapping']='audited main-session selected lost-certificate or Yuridis review composer'
  op['evidence'].update(yuridisSource=yuridis_source,yuridisNativeProofSha256=yuridis_sha,yuridisProtocolDoc='analysis/YURIDIS-READ-FLOW.md')
  op['serverEffects']='Posts one new review for the selected lost-certificate or Yuridis context and optional selected photos; no production submission performed by validation'
 if call=='0xd42440':
  op.update(serviceMapping='audited main-session Scan classification with server-owned profile',reason='Klasifikasi native dengan nama profil sesi backend. Efek server belum diketahui; konfirmasi eksplisit dipertahankan. Aktivasi/geotag tidak dijalankan.',evidence={'callAddress':call,'source':scan_source,'requestSource':c['source'],'nativeProofSha256':scan_sha},serverEffects='unknown')
 if call in scan_map_proofs:
  map_source,map_sha=scan_map_proofs[call]
  op.update(serviceMapping='audited main-session Scan special-map read',reason='Respons native bertipe tepat HTTP200; flag error dipertahankan dan model hanya ditampilkan bila false. Kode kosong hanya melalui konteks Scan sesi; penerimaan server belum diuji.',evidence={'callAddress':call,'source':map_source,'requestSource':c['source'],'nativeProofSha256':map_sha,'modelSource':'analysis/recovered/scan-location-followup/flow.json'})
 if call=='0xda9a78':
  assert [field['path'] for field in fields]==daring_response['contract']['request_values']['order']
  op.update(serviceMapping='audited main-session first Daring identity-validation action',recoveredTransport='FormData with five original String fields in native order; null model fields become empty Strings; no files',reason='Validasi awal identitas Daring dengan konfirmasi eksplisit. Respons tuple native dipulihkan; penerimaan server belum diuji. Tidak mengirim OTP, membuka kamera/liveness atau menyatakan akun telah terverifikasi.',evidence={'callAddress':call,'source':daring_form_source,'requestSource':c['source'],'nativeProofSha256':daring_form_sha,'responseSource':daring_response_source,'responseNativeProofSha256':daring_response_sha},serverEffects='identity validation; deeper provider effects unverified')
 if call in parcel_calls:
  op.update(serviceMapping='audited main-session Cari Bidang read',reason='Pembacaan wilayah dan ID bidang dari form native. Hasil langsung bertipe, tanpa telemetry/geotag atau geometri buatan; penerimaan server belum diuji.',evidence={'callAddress':call,'source':parcel_source,'requestSource':c['source'],'nativeProofSha256':parcel_sha})
 if call in save_proofs or call=='0xd25250':
  save_source,save_sha=save_proofs['0xd92664' if call=='0xd25250' else call]
  op.update(serviceMapping='audited main-session collection bookmark',reason='Kontrak bookmark native dan typed200 yEb; penerimaan server belum diuji. NIK simpan hanya dari stored sign-in user, bukan profil atau input browser.',evidence={'callAddress':call,'source':save_source,'requestSource':c['source'],'nativeProofSha256':save_sha})
 if call in {'0xd1e130','0xd1eb1c'}:
  op.update(label='Detail antrean' if call=='0xd1e130' else 'Antrean saya',serviceId='directus',serviceMapping='audited FRb +0xb Directus read client',clientProfile='queue-read',auth='session',authenticated=True,effect='read',mutates=False,requiresConfirmation=False,enabled=True,supported=True,inspectOnly=False,readiness='ready_unverified',reason='Pembacaan antrean akun sendiri; identitas dari summary backend dan ID detail dari daftar/aktivitas sesi. Booking dan enrollment belum tersedia.',fields=[] if call=='0xd1eb1c' else [{'path':'path_argument_1','label':'ID antrean terpilih','type':'string','strictString':True,'location':'path','required':'unknown','clientRequired':True,'source':'input','description':'ID utuh yang dikembalikan daftar atau aktivitas akun ini; bukan nomor antrean atau kode booking.'}],evidence={'callAddress':call,'source':'analysis/recovered/queue-flow.json','transportSource':'analysis/recovered/queue-interceptor-followup/flow.json','identitySource':'analysis/recovered/queue-identity-followup/flow.json'})
 if call=='0xd22468':
  op.update(label='Panggilan antrean saya',serviceId='directus',serviceMapping='audited FRb +0xb Directus notifications read',clientProfile='queue-read',auth='session',authenticated=True,effect='read',mutates=False,requiresConfirmation=False,enabled=True,supported=True,inspectOnly=False,readiness='ready_unverified',reason='Panggilan dibaca dari identitas profil backend sesi ini; tidak menerima NIK browser atau melakukan mark-read.',fields=[],evidence={'callAddress':call,'source':'analysis/recovered/queue-calls-flow/flow.json'})
 if call in {'0xd1fa00','0xd8a0dc','0xd89cb4'}:
  names={'0xd1fa00':'Kantor Pertanahan antrean','0xd8a0dc':'Lokasi Kerja antrean','0xd89cb4':'Ketersediaan loket antrean'}
  keys=[] if call=='0xd1fa00' else ['filter[kantor]'] if call=='0xd8a0dc' else ['lokasi','tanggal']
  op.update(label=names[call],serviceId='directus',serviceMapping='audited FRb +0xb Directus booking prerequisites',clientProfile='queue-read',auth='session',authenticated=True,effect='read',mutates=False,requiresConfirmation=False,enabled=True,supported=True,inspectOnly=False,readiness='ready_unverified',reason='Pratinjau baca kantor/lokasi/ketersediaan; referensi pilihan harus berasal dari respons sesi ini. Tidak melakukan booking, enrollment, OTP atau socket.',fields=[{'path':key,'label':{'filter[kantor]':'Kantor Pertanahan terpilih','lokasi':'Lokasi Kerja terpilih','tanggal':'Tanggal (yyyy-MM-dd)'}[key],'type':'string','strictString':True,'location':'query','required':'unknown','clientRequired':True,'source':'input'} for key in keys],evidence={'callAddress':call,'source':'analysis/recovered/queue-booking-reads/flow.json','selectionSource':'analysis/recovered/queue-booking-selection-followup/flow.json','dateSource':'analysis/recovered/queue-booking-date-followup/flow.json'})
 if call=='0xd8bf80':
  op.update(label='Periksa kuota dan tinjau antrean',serviceId='directus',serviceMapping='audited FRb +0xb Directus quota POST; main account session is a local ownership guard',clientProfile='queue-booking',upstreamAuthentication='application',auth='session',authenticated=True,encoding='json',effect='write',mutates=True,requiresConfirmation=True,enabled=True,supported=True,inspectOnly=False,readiness='ready_unverified',reason='Pemeriksaan kuota dari snapshot loket dan profil pemohon sendiri pada sesi backend, lalu tinjauan dengan gate native. Efek POST dan penerimaan server belum diuji; tidak membuat antrean. Token notifikasi resmi untuk pembuatan antrean web belum tersedia.',recoveredTransport='Ordered JSON nik, kantorid, tanggal_booking encoded UTF8 on fixed Directus client; no POST retry or redirect in browser adapter',serverEffects='Quota check; deeper provider effects unverified; no production quota POST performed by validation',nativeFields=[{'path':key,'type':'string','location':'body','source':'server-session'} for key in ['nik','kantorid','tanggal_booking']],fields=[
   {'path':'contextId','label':'Konteks ketersediaan sesi','type':'string','strictString':True,'location':'local','required':'unknown','clientRequired':True,'source':'input','description':'Opaque backend-issued context, never an office ID or NIK.'},
   {'path':'rowIndex','label':'Indeks sumber loket terpilih','type':'integer','strictInteger':True,'min':0,'location':'local','required':'unknown','clientRequired':True,'source':'input'},
   {'path':'documentCount','label':'Jumlah berkas','type':'integer','strictInteger':True,'min':1,'max':5,'location':'local','required':'unknown','clientRequired':True,'source':'input'},
   {'path':'timeZone','label':'Zona waktu browser','type':'string','strictString':True,'location':'local','required':'unknown','clientRequired':True,'source':'input','description':'Validated IANA browser zone; server owns the current instant; not sent upstream.'},
  ],evidence={'callAddress':call,'source':c['source'],'wireSource':queue_booking_wire_source,'wireNativeProofSha256':queue_booking_wire_sha,'preflightSource':queue_booking_preflight_source,'preflightNativeProofSha256':queue_booking_preflight_sha,'selectionSource':'analysis/recovered/queue-booking-selection-followup/flow.json','profileSource':'analysis/recovered/queue-identity-followup/flow.json'})
 if call in {'0xd9f850','0xda0be8'}:
  registered=call=='0xd9f850'
  scalar_keys=['id','kluster','namapemilik','kontaktelp','kontakemail','tipehakid','tipehak','kantorid','namakantor','wilayahid','namawilayah','nomorhak','reviu','lat','lon'] if registered else ['id','kluster','namapemilik','kontaktelp','kontakemail','alamat','alashak','nomoralashak','keteranganalashak','buktipajak','nomorbuktipajak','keteranganbuktipajak','kantorid','namakantor','wilayahid','namawilayah','reviu','lat','lon']
  op.update(label='Swaplotting Tanah Bersertipikat' if registered else 'Swaplotting Tanah Belum Bersertipikat',serviceId='main',serviceMapping='audited personal Swaplotting on FRb +7 main account client',clientProfile='swaplotting-post',auth='session',authenticated=True,encoding='multipart',effect='write',mutates=True,requiresConfirmation=True,enabled=True,supported=True,inspectOnly=False,readiness='ready_unverified',reason='Pengiriman formulir personal dari ringkasan dan byte foto milik sesi backend. Profil sendiri dan pilihan asli divalidasi ulang; tidak mengganti geotag bukti kunjungan. Penerimaan server belum diuji; tidak ada retry otomatis. Formatter koordinat, sumber nama32hex dan RNG boundary adalah adaptasi browser.',fields=[{'path':'reviewId','label':'Ringkasan formulir sesi','type':'string','strictString':True,'location':'local','required':'unknown','clientRequired':True,'source':'input','description':'Opaque review ID issued after local staging; no caller contact, labels, URLs, credentials or wire fields.'}],nativeFields=[{'path':key,'type':'string','location':'body','source':'server-owned-review'} for key in scalar_keys]+[{'path':'file','type':'file','location':'body','repeated':True,'contentType':'application/octet-stream','source':'server-owned-review'}],recoveredTransport='Ordered15/19 raw UTF8 scalar multipart parts then repeated file parts;32lowercasehex filenames; initial octet-stream MIME; exact shared finalizer; HTTP200 after MIME transform returns true',serverEffects='Personal plotting upload; after success feedback dismissal, one scoped activity mutation and forced activity read; no production upload/activity request performed by validation',evidence={'callAddress':call,'source':c['source'],'nativeProofSha256':swaplotting_submit_sha,'submitSource':swaplotting_submit_source,'serviceSource':swaplotting_service_source,'serviceNativeProofSha256':swaplotting_service_sha,'multipartSource':swaplotting_multipart_source,'multipartNativeProofSha256':swaplotting_multipart_sha,'sharedFinalizerSource':review_post_source,'sharedFinalizerNativeProofSha256':review_post_sha,'ownerSource':'analysis/recovered/swaplotting-owner-followup/flow.json'})
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
