# Batas implementasi Swaplotting native

Rencana ini memakai tiga ledger frozen UI, service dan map, tanpa disassembly tambahan atau perubahan runtime. Target menu pribadi adalah **pilih pengguna→map→Tanah Bersertipikat / Belum Bersertipikat**, bukan daftar/detail PlotBidang yang kini ditempatkan pada route Swaplotting. Nama menu yang sama tidak membuktikan keterkaitan dua keluarga repository.

## Batch yang dapat dibuat sekarang

1. Buat pure model/constants/validator, controller pembacaan terikat sesi, point-map view dan dua formulir tanah lokal. Owner/pengguna, capture, OTP dan Kirim tetap nonaktif. Tidak perlu mengaktifkan operasi katalog baru untuk tiga GET yang sudah tersedia.
2. Gunakan `get-map-getdisclaimer-d29ef0` dari main client. Decoder menerima HTTP200, satu JSON String decode bila diperlukan, kemudian Map dengan `message/message2/message3/url:String?`; tidak ada data/error envelope native. Tampilkan teks server, bukan persetujuan buatan. Kesalahan tetap jujur; jangan menganggap disclaimer gagal dibaca berarti persyaratan terpenuhi.
3. Gunakan `get-legacy-kantah-d10364` dengan **`{nama:'',tipeKantor:''}`**. Ini koreksi penting: jangan mewarisi filter Cari Bidang `3,2,1`. Kedua form loader native memanggil d10268 dengan nama null dan descriptor pp348 tanpa optional Uqj; service lama yang sudah frozen mengubah kedua null menjadi String kosong. KantorId adalah jyb+13, Nama adalah +17. Pertahankan order; prioritas kantor profil belum terbukti untuk menu ini.
4. Gunakan `get-legacy-wilayah-d752bc` dengan **KantorId asli pilihan** dan nama kosong. Bersihkan pilihan/list desa segera saat kantor berubah. Cyb.WilayahId adalah nilai pilihan; Cyb.Kode bukan penggantinya. Jenis Hak serta Alas Hak/Bukti Pajak adalah konstanta lokal, bukan endpoint tambahan.

Native loader mengonsumsi tuple.second dan mengabaikan error flag. Browser boleh menambah status error/retry, pemeriksaan ID yang tidak dapat dipakai dan stale-request suppression secara eksplisit sebagai adaptasi; jangan menyebutnya perilaku native persis. Tidak ada dekripsi kantor terdekat atau Directus kantor di alur ini.

## Map dan dua form

Map native memakai Google hybrid dan Bhumi raster. OSM+Bhumi yang sudah disetujui hanya adaptasi browser. Gunakan map point controller tersendiri, bukan GeoJSON palsu agar cocok dengan parcelMap. Camera target bCb+b diteruskan ke oCb+b→eCb+b untuk registered atau rCb+b→hCb+7 untuk unregistered; fallback adalah initialcamera.target. Viewport bawaan bukan titik ukur. Jangan mencampur camera target dengan posisi perangkat, mengimpor koordinat ukur sebagai bukti hadir atau menempelkan polygon PlotBidang.

Batch awal tidak meminta GPS/camera otomatis dan tidak menjalankan geolocation. Recenter perangkat nyata di browser perlu pekerjaan/adaptasi terpisah. Map target tetap titik peta, bukan bukti kunjungan, akurasi atau pengukuran.

| Form | Field tanah | Validasi lokal yang siap direplikasi |
|---|---|---|
| Tanah Bersertipikat | Kantor; Desa/Kelurahan; Jenis Hak; Nomor Hak; Foto Dokumen; Uraian Singkat |9checks: nama/telepon/email/nomor/uraian raw nonempty,3pilihan nonnull, foto list nonempty |
| Belum Bersertipikat | Letak Tanah; Kantor; Desa/Kelurahan; Alamat; Alas Hak+nomor+uraian; Bukti Pajak+nomor+uraian; Foto; Uraian Singkat |14checks dengan15slot error (satu unused): contact/address/number/description raw nonempty,4pilihan nonnull, foto list nonempty |

Registered Jenis Hak memakai **String** `1/2/3/4/5/8`: Hak Milik/Hak Guna Usaha/Hak Guna Bangunan/Hak Pakai/Hak Pengelolaan/**Wakaf**. Unregistered Alas Hak dan Bukti Pajak memakai label literal sebagai nilai; daftar lengkap dan field order ada di JSON. Jangan menyalin label/formatter atau filter dari Cari Bidang. onChange tidak trim/case/filter; empty String berbeda dari null yang dapat mempertahankan nilai lama pada copy helper. Validasi raw dapat berbeda dari trim pada serializer upload kelak; serializer tidak dibuat pada batch ini.

Max5 hanya gate menambah foto, bukan gate mengedit foto lama. Capture SDK/file/MIME/freshness belum tertutup. Tampilkan requirement tanpa membuka camera, membuat path atau mengunggah berkas. `Surat Pernyataan Penguasaan` adalah opsi Alas Hak, bukan checkbox atau bukti pemilikan. Validator yang ditelusuri tidak menilai GPS/radius/ownership; itu tidak membuktikan ketiadaan syarat pada server/disclaimer/shared flow.

## Pengguna sendiri dan user_plotting: blocker terarah

Entry d8c5a0 membaca cached signin: nonnull langsung ke map; null membuka chooser. Callback chooser tidak meneruskan objek ke map dalam window yang ditelusuri. Ini belum menutup sumber/otorisasi daftar pengguna.

Kedua form memanggil iCb.d2a508. Fungsi itu membaca **user_plotting** serta cached signin (disimpan di iCb+7). Hanya cabang **signin null dan storedString nonnull** yang JSON-decode List→lCb dan publish iCb+13. Cabang signin ada atau cache kosong mengambil wCb+13 stream ayb? melalui d2b320/758d94. iCb+27 adalah selected lCb. Mapping own-user/list/selection→nama/telepon/email eCb/hCb belum tertutup.

Karena itu **jangan isi owner dari username, account_summary, email sesi atau user pertama**; jangan migrasikan/menulis user_plotting ke localStorage dengan asumsi. Form tanah lokal dapat dibuat, tetapi owner tetap unresolved dan validasi belum lengkap; owner choice/add/edit dan Kirim nonaktif. Langkah audit berikutnya harus bounded ke wCb stream→callback→lCb→selection→contact setters, tanpa data akun atau request dan tanpa AddUser/OTP. Ini blocker kesetaraan pengguna, bukan alasan mengarang model.

AddUser native memanggil identity POSTd9e110 sebelum membuka OTP. Generic OTP dapat mengirim pesan saat dibuka; local compare bukan jaminan server. Bagian itu tetap di luar implementasi ini.

## Urutan file dan acceptance

- Pure `assets/swaplotting/model.js`: field/options, projection dan raw validator; tes9/14required checks, whitespace/null, literal String options dan tanpa transform tebakan.
- `controller.js`: hanya read disclaimer/offices/regions, pending/error, office-change clearing, generation/session/route disposal dan memori privat kosong saat keluar.
- `map.js`/`view.js` + host app/styles: map→duaform, titik snapshot, form input tetap fokus/IME, batas pengguna/capture/Kirim terlihat. Hapus asosiasi generic PlotBidang dari menu pribadi; technical tools tetap terpisah.
- Bila dibutuhkan, `private/swaplotting-read-models.mjs`: decoder disclaimer4String? scoped, tanpa membuat writer. Tes transport lokal/sintetis dan tidak ada POST/identity/OTP/telemetry/geotag call dari render/navigasi/validasi.
- Lakukan audit sumber pengguna terpisah sebelum membuka pemilihan owner. Uji browser desktop/mobile harus dilaporkan masing-masing; belum ada klaim keduanya lulus.

Kirim tetap disabled; tidak ada payload upload, hasil sukses sintetis atau percobaan server. `/apis/Swaplotting*`, `PlotBidang/Instansi*`, identity, OTP dan telemetry tidak termasuk allowlist controller. HTTP200 upload native hanya berarti helper success; bukan sertifikasi tanah/presence. Batas precision lat/lon a944a0, multipart/capture, current disclaimer, ownership, formatter/lifecycle, checksum dan pembanding APK pascalogin tetap terbuka.

Lihat [JSON batas implementasi](webapp/swaplotting-implementation-boundary.json) untuk hash3ledger, receipt, existing office proof, operasi persis, nilai request, keputusan dan acceptance plan. Semua tindakan baru:0network,0runtime/backend edits,0disassembly,0GPS/camera,0identity/OTP/submit. Dokumen ini rencana, bukan bukti kesetaraan menu atau kesiapan write.
