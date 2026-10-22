# Personal Swaplotting: kontrak review lokal dan descriptor murni

Audit baca sumber 21 Oktober 2026 ini mendukung review draf dan builder lokal tanpa HTTP. Acuan adalah ledger final APK6.1.5, bukan hash runtime historis yang menghalangi pengembangan baru. Audit ini tidak menjalankan request, autentikasi, GPS, kamera, emulator, OTP, upload, telemetry atau mutasi. Satu-satunya berkas yang dibuat adalah dokumen ini; kasus uji di bawah merupakan spesifikasi, belum hasil eksekusi.

## Batas pemisahan

Builder murni menerima snapshot formulir, pilihan referensi yang sudah diproyeksikan, teks koordinat dari strategi formatter yang dinyatakan, dan descriptor berkas lokal yang benar-benar dimiliki host. Ia mengembalikan ordered DTO serta descriptor scalar/file. Ia tidak menerima URL provider, token, callback request, objek FormData, status berhasil dari server, atau klaim kunjungan. Header/body multipart akhir dan penerimaan server tetap di luar kontrak.

Host bertanggung jawab atas sesi, keanggotaan opsi, pemilik Blob, disclaimer dan pembatalan pekerjaan basi. Fungsi murni tidak dapat membuktikan bahwa objek yang diberikan berasal dari sesi sah hanya dari bentuk datanya. Review harus diberi label **draf lokal, belum dikirim atau diverifikasi**, menampilkan sumber koordinat yang dilaporkan dan perubahan trim, serta mempertahankan Kirim nonaktif. Tidak ada perubahan pada geotag atau pemeriksaan kehadiran.

## Ordered DTO: persis16/20 key

Layanan registered `d9f1c4`, call `d9f850`, menulis `/apis/SwaplottingTerdaftar`; unregistered `da0424`, call `da0be8`, menulis `/apis/SwaplottingBelumTerdaftar`. Nama ini hanya metadata bukti; builder lokal tidak memanggilnya. Tabel memakai nama field browser saat audit. **T** berarti native `447974` trim; **R** berarti salin raw; **C** konstanta; **F** batas formatter yang dinyatakan.

| Urut registered | Key | Input browser / sumber native | Aturan |
|---|---|---|---|
| 1 | id | literal | C `id` |
| 2 | kluster | literal | C `K4` |
| 3 | namapemilik | fields.name / eCb+f | T |
| 4 | kontaktelp | fields.phone / eCb+13 | T |
| 5 | kontakemail | fields.email / eCb+17 | T |
| 6 | tipehakid | right.code / eCb+2b option+f | R |
| 7 | tipehak | right.label / eCb+2b option+b | R |
| 8 | kantorid | office.KantorId / eCb+1b option+f | R |
| 9 | namakantor | office.Nama / eCb+1b option+b | R |
| 10 | wilayahid | region.code / eCb+23 option+f | R |
| 11 | namawilayah | region.name / eCb+23 option+b | R |
| 12 | nomorhak | fields.number / eCb+2f | T |
| 13 | reviu | fields.review / eCb+37 | T |
| 14 | lat | point.lat / eCb+b LatLng+7 | F |
| 15 | lon | point.lng / eCb+b LatLng+f | F |
| 16 | file | photos / eCb+33 | ordered file list |

| Urut unregistered | Key | Input browser / sumber native | Aturan |
|---|---|---|---|
| 1 | id | literal | C `id` |
| 2 | kluster | literal | C `K4` |
| 3 | namapemilik | fields.name / hCb+b | T |
| 4 | kontaktelp | fields.phone / hCb+f | T |
| 5 | kontakemail | fields.email / hCb+13 | T |
| 6 | alamat | fields.address / hCb+2b | T |
| 7 | alashak | basis exact label / hCb+2f option+f | R |
| 8 | nomoralashak | fields.basisNumber / hCb+33 | R |
| 9 | keteranganalashak | fields.basisDescription / hCb+37 | T |
| 10 | buktipajak | tax exact label / hCb+3b option+f | R |
| 11 | nomorbuktipajak | fields.taxNumber / hCb+3f | R |
| 12 | keteranganbuktipajak | fields.taxDescription / hCb+43 | T |
| 13 | kantorid | office.KantorId / hCb+1f option+f | R |
| 14 | namakantor | office.Nama / hCb+1f option+b | R |
| 15 | wilayahid | region.code / hCb+27 option+f | R |
| 16 | namawilayah | region.name / hCb+27 option+b | R |
| 17 | reviu | fields.review / hCb+47 | T |
| 18 | lat | point.lat / hCb+7 LatLng+7 | F |
| 19 | lon | point.lng / hCb+7 LatLng+f | F |
| 20 | file | photos / hCb+4b | ordered file list |

Ordered entries/array merupakan representasi yang mudah diuji. Pada lapisan descriptor ada15 atau19 scalar parts, lalu satu part bernama tepat `file` per foto; daftar kosong menghasilkan nol file part. Jangan menghasilkan `file[]`, `file[0]`, `file1`, key berkas dinamis, NIK, nama akun, `BerkasId`, `IsOffline`, GPS device, checksum atau field lain. Konstanta `id` bukan plotId atau ID berkas.

## Trim, null, validasi dan pilihan tepercaya

Native trim menghapus hanya tepi String dengan set **U+0009–000D, U+0020, U+0085, U+00A0, U+1680, U+2000–200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF**. Set berasal dari helper `43b3c8/43b5f4`, dipanggil `447974`; tidak mencakup U+180E atau U+200B. Jangan menghapus whitespace di tengah atau menormalisasi case/Unicode. Untuk JavaScript modern, regex edge-only `[\s\u0085]` dapat menyatakan set tersebut, tetapi uji set positif/negatif tetap diperlukan; `.trim()` saja kehilangan U+0085.

Ordinary scalar null menjadi String kosong pada mapper `707ee8`. Itu tidak membolehkan option object/LatLng/path list yang wajib nonnull hilang diam-diam: assertion terjadi lebih awal di layanan. Input scalar browser harus String atau null yang dinyatakan; jangan membiarkan `String(object)`/boolean/angka menyamarkan tipe salah. Scalar null option label dapat dipertahankan lalu menjadi `''` pada descriptor; objek opsi hilang harus ditolak. Validasi dan builder terpisah agar aturan serialisasi tidak disalahartikan sebagai aturan wajib.

Aggregate native memeriksa **raw** nonnull/nonempty sebelum trim: registered9 predikat; unregistered14. Tidak ada validasi email, telepon, digit-only, min/max atau trim dalam aggregate yang dibuktikan. Sebagai contoh `fields.review='\u0085 '` lolos raw-nonempty lalu serialized reviu menjadi `''`. Review harus menunjukkan nilai serialized sebenarnya, dengan pemberitahuan bila berbeda dari raw; jangan diam-diam mengganti semantik native menjadi required-after-trim atau mengklaim server menerima hasil tersebut. `nomoralashak` dan `nomorbuktipajak` tetap menyimpan semua whitespace dan leading zero.

Host memilih dari snapshot referensi miliknya, bukan DOM label/ID yang diketik pengguna:

- Office: hasil typed `legacy/Kantah`, `KantorId` sebagai value dan `Nama` sebagai label. `officeIndex` hanya indeks pemilihan lokal, bukan field wire. Pertahankan raw kode/nama, duplikasi dan null label. Controller saat audit menolak ID null/`''` saat memilih, menerima String spasi; ini kebijakan browser yang sudah ada.
- Region: hasil typed `legacy/Wilayah` milik office yang sedang dipilih; `WilayahId` menjadi `code`, `Nama` menjadi `name`. **Cyb.Kode bukan value pilihan.** Perubahan/reload office membatalkan region lama.
- Right: controller menyimpan String code. Lookup kembali pada `SWAPLOTTING_RIGHTS` yang tepercaya: `1/Hak Milik`, `2/Hak Guna Usaha`, `3/Hak Guna Bangunan`, `4/Hak Pakai`, `5/Hak Pengelolaan`, `8/Wakaf`. Jangan mengambil label dari DOM, membuat kode ordinal atau memakai nama saja sebagai ID.
- Basis/tax: native `812540` membuat CSb dengan String asli yang sama pada display+b dan value+f. Value adalah **label exact** dari `SWAPLOTTING_BASIS`/`SWAPLOTTING_TAX`, bukan indeks angka. `basisIndex`/`taxIndex` harus masih menunjuk label pilihan pada daftar konstanta yang tepat.
- Owner: hanya subset trusted `account/account_summary` terikat sesi, `userLevel` integer2/3 dan `isIkd === false`; `nama/nomorHp/email` nullableString → raw `name/phone/email`, null menjadi `''`. Bukan signin/username, managed-user storage, payload profile dari pengguna, NIK atau pilihan sembarang. Review/host harus menyegarkan gate profil; snapshot old-owner tidak boleh lolos setelah gate dicabut.

## Titik formulir dan formatter yang jujur

Native `8cc1e4→d9d948` menyimpan `cameraPosition.target`; kedua form mengambil target itu, fallback ke initial camera. Controller browser saat audit `openForm()` membekukan `point` dan `pointProvenance` dari pilihan pada saat membuka formulir; builder harus memakai **point formulir**, bukan draft input yang belum Apply, pusat peta setelah formulir dibuka, GPS perangkat, pusat wilayah kantor atau koordinat berkas hasil tebakan.

Point numeric harus finite, lat/lng tidak tertukar. Aturan rentang dan Mercator merupakan kebijakan browser yang sudah ada. Sumber `manual-coordinate`/`session-point` serta metadata deklarasi WGS84 tetap terpisah dari15/19 scalar; metadata tidak menjadi field wire tambahan. Session-point hanya label `EPSG:4326` dan sumber `survey`/`external_gnss` yang lolos pilihan/signature/generation host. Metadata waktu/akurasi yang tidak tersedia tetap tidak tersedia; tidak dibuat dari jam sekarang atau HDOP. Native fallback initial viewport `-0.792918,116.482347` adalah peta awal publik, bukan pengukuran. Review harus menyebut sumber tersebut apa adanya; tidak boleh menambahkan klaim pengukuran pada fallback atau geseran peta.

Native layanan meneruskan binary64 ke `a944a0→_Double::_toString`, tanpa fixed7. Shortcut positif zero yang terbukti adalah `"0.0"`; bit negatif zero dibedakan sebelum fallback native, tetapi teks final engine negatif zero belum menjadi oracle. Karena itu formatter review harus menjadi batas eksplisit, misalnya strategi browser bernama yang mengambil numeric point dan menghasilkan dua String. Formatter/adaptasi harus dicatat pada output review. Jangan menyebut `String(number)`, helper UI yang menghasilkan `'-0'`, fixed7 atau algoritme SDK publik tertentu sebagai golden-byte APK. Teks input asli/provenance dan hasil formatter dapat ditampilkan berdampingan; tidak perlu membulatkan stored point.

Jika pure builder menerima coordinate texts yang sudah diformat, input wajib menyertakan strategi dan numeric point yang sama, dan harus berasal dari adapter milik host; parameter itu bukan kotak teks wire baru yang bebas diisi pengguna. Fungsi murni tidak dapat memvalidasi kesetaraan seluruh formatter native yang memang belum dibuktikan. Review tetap lokal selama batas ini terbuka.

## Byte handle, urutan foto dan nama descriptor

Native capture adalah kamera eksplisit `takePicture`, preset medium, preview/foto ulang/pakai; output MIME/dimensi/quality Android belum tertutup. Form append hasil tambah di akhir. Batas5 berlaku ketika menambah; retake yang memilih path lama mengganti **semua** path yang sama in-place dan mempertahankan urutan. Hapus memakai konfirmasi lalu menghapus **semua** path yang sama. Jangan menyalin semantik review-comment gallery yang berbeda ke fitur ini.

Browser saat audit memiliki `photo-store.js` Map URL→Blob privat dengan `has/size/sync/dispose`, tanpa accessor Blob. `snapshot.photos` hanya path blob URL; URL dengan bentuk benar bukan bukti byte masih dimiliki. Langkah yang dibutuhkan root adalah accessor/proyeksi descriptor yang tetap terikat store owner aktif, bukan fetch URL/dataURI/provider. Host menyelesaikan setiap path pada snapshot ke Blob yang ada; hilang/revoked/stale harus gagal seluruh review. Tidak ada jaringan untuk mendapatkan foto. Simpan Blob sebagai handle di luar HTML/JSON logger, metadata file size integer aman positif dan MIME capture browser boleh ditampilkan sebagai metadata adaptasi. Jangan membocorkan bytes/objectURL di laporan publik otomatis.

Descriptor file lokal dapat memuat `{name:'file', filename, contentType, size, byteHandle}`. Ia tetap descriptor, bukan multipart body siap kirim. Native filename generator lalu penghapusan `-` menghasilkan **32 lowercase hex tanpa ekstensi**; UUID version/entropy/clock/sequence belum dibuktikan. Pemakaian generator browser yang disuntikkan atau ID yang dimintakan host adalah adaptasi; builder murni tidak perlu mengakses waktu/random/global crypto. Untuk review gunakan nama yang stabil pada snapshot yang sama agar repaint tidak merandom ulang. Pastikan output nama sesuai bentuk yang dinyatakan; jangan mengambil source `.jpg`, Blob.type, nama akun atau tanggal sebagai nama wire.

Native factory memakai real File stream/length, contentType/customHeaders null. Dengan resolver awal kosong dan MIME table996 yang dibuktikan, nama32hex tersebut memilih **application/octet-stream**. MIME browser `image/jpeg/png/webp` adalah metadata capture, bukan pengganti diam-diam untuk contentType descriptor native awal. Tidak ada decode/reencode/compress/crop/EXIF/watermark/checksum dalam wrapper layanan/factory yang dipertahankan. Ini tidak membuktikan sumber Android atau browser tidak pernah diproses. Browser handle tetap byte asli hasil capture yang dimiliki store; review tidak perlu membaca atau mengubah seluruh buffer untuk menghitung ukuran.

Duplikasi path jangan didedup: sumber list order menentukan satu repeated `file` per occurrence. Tetapkan satu nama per occurrence bila generator descriptor dipakai, dan pertahankan pemetaan ke handle yang sama. Native service bisa menerima list kosong dan tidak menambah cap5 kedua; UI-review harus tetap memeriksa aggregate nonempty dan cap tambah yang sudah ada, tanpa menyebut cap layanan baru sebagai native.

## Gate lifecycle dan invalidasi review

Review hanya dibuka dari form registered/unregistered yang aktif, authenticated route owner/epoch/navigation masih current, disclaimer berstatus ready, serta `message` raw-nonempty telah disetujui eksplisit. Pesan server spasi/U+0085 tetap nonempty; jangan men-trimnya agar dialog hilang. Pesan kosong/null mengikuti gate native yang sudah diterapkan. Pesan2/3 dan URL harus tetap ditampilkan sesuai sumber dan kebijakan URL browser; persetujuan tidak boleh dipersist sebagai receipt server atau dibuat otomatis.

Host harus menutup/membatalkan review pada perubahan form/route/session/dispose, profile revoke/change, office/region/right/proof, field raw, photo list, snapshot point atau disclaimer. Token revision/semantic signature yang meliputi semua input review dapat dipakai. `photoGeneration` saja tidak cukup: `setField()` saat audit sengaja tidak mengubah token itu. Retry pembacaan offices/regions harus menonaktifkan review yang menyimpan pilihan lama, dan hasil respons office/region/disclaimer lama tidak boleh memulihkan review. Batas async map/camera/photo/removal tetap dimiliki host yang lama; jangan menampilkan hasil dari owner yang sudah ditutup.

Membuka dan menutup review tidak menghapus foto/draf yang masih aktif. Kembali ke peta/mengganti formulir/dispose menjalankan cleanup yang sudah ada: kosongkan model private, tutup dialog capture/removal/review, hentikan track kamera dan revoke URL yang tidak lagi dipakai. Descriptor tidak boleh mempertahankan strong reference Blob setelah disposal melalui cache review. Review tidak menjadi ekspor persisten, submit queue, auto retry atau formulir HTML yang menavigasi keluar.

## Uji yang perlu ditambahkan

Kasus berikut memeriksa perbedaan native yang bermakna dan ownership browser; hindari sekadar mencocokkan implementasi dengan konstanta yang sama diimpor dari modul under test.

| Kasus | Assertion substantif |
|---|---|
| Registered valid | Harapkan16 ordered keys literal dari ledger dan15 scalar; konstanta tetap id/K4 meskipun snapshot mengandung plotId/BerkasId lain. |
| Unregistered valid | Harapkan20 ordered keys,19 scalar; tidak ada tipehakid/nomorhak atau field registered bocor. |
| Selective trim | Owner/kontak/nomorhak/reviu dan alamat/deskripsi terpilih dipangkas di tepi; proof numbers dan seluruh IDs/labels raw, leading zero utuh. |
| Unicode trim | Semua anggota set positif dipangkas dari kedua sisi; U+180E/U+200B tetap, whitespace tengah tetap. Raw whitespace-only lolos aggregate tetapi serialized empty diperlihatkan. |
| Scalar null/type | Nullable leaf→`''`, option object hilang/field wrong-type menolak; null label bukan alias ke ID/`'-'`/label tetangga. |
| Own profile | Level2/3 exact isIkd false lolos; true/null/`'false'`/profil signin/untrusted/revoked tidak membuat review. Null kontak menghasilkan required feedback raw. |
| Opsi referensi | Gunakan contoh KantorId/WilayahId ber-spasi dan Kode berbeda; hasil mempertahankan raw serta current office-region ownership, bukan indeks/label DOM. |
| Right/basis/tax | Right8→Wakaf; basis/tax value exact label, bukan ordinal; index/label mismatch atau pilihan dari family lain ditolak. |
| Point freeze | Form dibuka sesudah Apply dari point A; draft teks yang belum Apply dan target map B tidak mengganti lat/lon review. Manual/session provenance tidak masuk scalar wire. |
| Formatter adaptation | Lat/lon order, signedzero dan nilai pecahan/eksponen sesuai strategi browser yang dinyatakan; hindari golden APK palsu/fixed7; point tidak dimutasi. |
| No invented precision | Accuracy/time null tetap unavailable; initial viewport/map-camera tidak diberi label hasil pengukuran/kunjungan. |
| Owned byte handles | Bentuk blob URL valid tetapi absent dari store, remote/data URL, Blob hilang atau lifecycle basi menolak seluruh review; tidak ada fetch untuk foto. |
| Photo order/duplicates | Dua/lebih foto menghasilkan repeated exact `file` urut; duplicate path menghasilkan duplicate occurrence/handle, tanpa sort/dedup/renumber name. |
| Photo metadata | Size dari Blob asli; no byte conversion; filename32hex tanpa dot, MIME descriptor native awal octet-stream terpisah dari capture MIME. Nama stabil selama snapshot sama. |
| Capture lifecycle | Lima foto menghalangi add keenam namun retake tetap; ganti/hapus semua path sama menjaga yang lain; review lama invalid setelah perubahan. |
| Disclaimer | No-message gate, raw whitespace message needing explicit agree, loading/error/decline serta old delayed response tidak membuka review. Tidak auto-ack. |
| Stale ownership | Route/session/form/field/profile/reference/point/photos berubah saat async resolution/formatter tertunda: late completion tidak menampilkan old review atau callback auth-error dari owner lama. |
| DOM/UI | Escape seluruh owner/raw/deskripsi/label/pesan; data tidak menjadi HTML, URL navigasi atau field hidden credential. Review desktop/mobile dapat dibaca dan kembali ke field edit tanpa submit. |
| Local isolation | Buka/tutup/refresh review memanggil nol write/read provider, nol GPS/OTP/telemetry, tidak mengaktifkan Kirim atau menyimpan ke localStorage/log publik. Pure builder tidak memutasi input. |
| Disposal | Setelah close/revoke/dispose tidak ada dialog stale, track aktif atau reference Blob yang tertinggal pada review cache; draf aktif tetap ada bila hanya menutup review. |

Tes model/controller/photos/resources/coordinate yang sudah ada dibaca sebagai regression context. Tidak ada penambahan/pengubahan tes atau rerun verifikasi historis bersyarat runtime79/75 pada audit ini. Root dapat menambahkan focused builder/host tests lalu menjalankan suite aktual setelah source freeze.

## Sumber final dan hash yang diperiksa

Hash berikut dibaca langsung dari ledger final pada audit ini; semuanya menunjuk ELF `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683` dan pool `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04` yang sama. Ini reuse bukti native, bukan eksekusi ulang aplikasi atau jaminan server saat ini.

| Ledger analysis/recovered | SHA256 |
|---|---|
| swaplotting-followup/flow.json | 6463b44d3efaf596fe07bcaa508f5cf6843c569e255669ddc5b5783d820c40fd |
| swaplotting-service-followup/flow.json | f5be07485685102e41ee39e0718f4d241dee0224fd70b3b6e447a37e0bdd65f9 |
| swaplotting-multipart-followup/flow.json | 31e4d9bbbdfdd7d77226d9cde0dfe5f6220311c5233f41382b0d03ae373c833e |
| swaplotting-owner-followup/flow.json | 02ecc3c52cf9ee22c73dfe40b0e9a5cbd2327d5c5779285ed1d4ecd71c8ccf22 |
| swaplotting-map-followup/flow.json | 07d83a8a74c6a8ea59cc6b8dc81ffe52473e64e849cd112a4ef1a9db5873fc9a |
| swaplotting-coordinate-format-followup/flow.json | 5a16064f32b7a5ff5bdc287df724ff6faaf1d3c5ceff9f152f0b5296c1be6fc2 |
| swaplotting-capture-followup/flow.json | 468b6f6c3c20af3ecd764b9b9bdb4e6c87607ea982424df5dad20630d531b381 |
| parcel-search-input-followup/flow.json | 7ae1307678dbce9ea051cd1c4c7acc20f9615007cf0c307f179074c999b06b61 |

Native trim bodies reused: `collection-group-create/trim.proof.asm.txt` at447974, `trim-left.proof.asm.txt` at43b3c8, `trim-right.proof.asm.txt` at43b5f4. Current browser modules inspected: `webapp/assets/swaplotting/{model,controller,host,view,photo-store,coordinate-entry}.js`, relevant model/photos tests, plus session/route wrapper `webapp/app.js` around swaplottingCurrent/page. Current sources may legitimately evolve during root implementation; frozen native ledgers are the authoritative field/behavior source, not a historical runtime baseline.
