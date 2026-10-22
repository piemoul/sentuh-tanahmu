# Validasi pipeline Scan browser

Scan kini memakai satu alur kode mentah → klasifikasi → bidang atau PDF/metadata, dengan kamera QR lokal dan input manual. Ini menggantikan empat tab formulir Scan generik pada sumber sebelumnya. **777/777 tes Node, 1.190 pemeriksaan fungsi pada 23 suite VM, 23/23 pemeriksaan browser pipeline dan 3/3 pemeriksaan browser QR aktual lulus.** Build Docker lokal dan aset publik cocok dengan sumber yang diuji. [Rekap bukti batch ini](webapp/scan-pipeline-verification-summary.json) memisahkan bukti sintetis, deployment/static access dan preview akun tanpa submisi Scan.

Implementasi mengikuti audit client APK 6.1.5 yang dibekukan, dengan adaptasi browser yang dijelaskan di bawah. Penerimaan server asli dan efek `apis/scanDocument` tetap belum diketahui. Operasi klasifikasi dipertahankan sebagai kapabilitas write yang membutuhkan konfirmasi eksplisit, bukan diubah menjadi read hanya karena hasilnya dipakai untuk routing. Tidak ada aktivasi berkas, geotag atau penggantian bukti kunjungan yang ditambahkan.

## Sumber native dan batas bukti

| Bukti | Ledger beku | SHA256 |
|---|---|---|
| Entry center Scan, raw barcode, nama dan klasifikasi/routing | [scan-flow.json](recovered/scan-flow.json) | `bfa3cdc5257b0ca57b3d9ee881a2cac4c9ecd243cf81c1493e9885fe4c823ab4` |
| Metadata, original viewer q, lokasi generic dan batas rute khusus | [scan-location-followup/flow.json](recovered/scan-location-followup/flow.json) | `f99ec732ea7c09684a34522c9b79667f08695c236f0fb8c5cf04e97eb07ff5c9` |

[SCAN-FLOW.md](SCAN-FLOW.md) membuktikan alur entry/caller pada ELF yang dipin, bukan efek implementasi server. [SCAN-LOCATION-FOLLOWUP.md](SCAN-LOCATION-FOLLOWUP.md) merupakan supplement terpisah: metadata tidak melakukan JSON String decode tambahan; original viewer q yang null gagal sebelum lokasi; dan rute PBT native memiliki fall-through ke rute generic tanpa await. Bukti lama tidak direbaselining atau ditulis ulang untuk menyamakan interpretasi tersebut.

Supplement membuktikan initial request khusus PBT/KKPR dan sebagian model, tetapi belum seluruh nested model, stack/gesture native, atau penerimaan layanan. Browser pada batch ini tetap menahan kedua lokasi khusus itu. Model detail KKPR hasil scan tidak diganti dengan model list KKPR yang berbeda.

## Alur yang terhubung

[scan-controller.js](../webapp/scan-controller.js) menjalankan urutan berikut melalui host [app.js](../webapp/app.js). Input nama, endpoint bebas, atau profile browser tidak menjadi bagian formulir Scan.

| Tahap | Operation ID | Input dan perilaku |
|---|---|---|
| Profil prasyarat | `post-account-account-summary-d2939c` | Backend membaca ringkasan akun sesi yang sama, memvalidasi model ayb, kemudian menangkap `nama ?? email ?? '-'`. Null-only fallback mempertahankan String kosong/spasi. |
| Klasifikasi | `post-apis-scandocument-d42440` | Write/confirm; browser mengirim hanya `{q}`. Wire POST form tepat `q,name`, memakai nama hasil tangkapan backend. |
| Bidang | `get-legacy-getparcelboundarybyid-dbaeb8` | Pesan tepat `GetParcelBoundaryById` memakai `classification.data` sebagai persilid utuh. Ini berbeda dari q dokumen asli. |
| Dokumen | `post-apis-getdocument-d41ee8` | Pesan selain bidang/aktivasi memakai raw request q asli dan nama tangkapan yang sama. Hanya PDF yang lolos validasi adapter dapat dibuka. |
| Metadata | `post-apis-getdocumenttype-d417d4` | Dipanggil setelah PDF valid, dengan request q yang sama. `showRoute` dan `type` diteruskan ke state viewer Scan. |
| Lokasi dokumen generic | `get-apis-getgeojsoninfo-d39f1c` | Aksi pengguna dari viewer memakai original viewer q, opaque context dan encoding dua tahap yang sudah diaudit. |

Tidak ada trim, split, URI decode, prefix parsing atau pembukaan URL hasil QR untuk memilih cabang. Permintaan klasifikasi/dokumen/metadata memakai `barcode.code ?? ''` pada batas yang dibuktikan. Viewer tetap membedakan original q null dari String kosong: null menghentikan lokasi secara lokal; String kosong atau spasi dapat diteruskan melalui context tervalidasi. Keputusan ini tidak mengubah kewajiban input generik pada origin lain.

Pesan `AktivasiBerkasGeotag` menampilkan status belum tersedia dan tidak memanggil aktivasi berikutnya. Pada metadata dengan type `PetaBidangElektronik` atau `KKPR`, tombol lokasi tidak menebak adapter lain atau memaksakan peta generic. Alur lokasi khusus tetap dibatasi sampai model dan perilaku yang diperlukan selesai dibuktikan.

## Profil milik server, context, dan autentikasi

[http-api.mjs](../webapp/private/http-api.mjs) menangkap nama dari typed `account_summary` sesi aktif. Nama sign-in, username, NIK, judul dokumen, nama file dan input browser tidak menjadi fallback. Browser name override ditolak, termasuk pada pembacaan PDF yang memakai context Scan. Parser profil memvalidasi 18 field ayb yang diketahui, walaupun keluaran untuk nama hanya memerlukan nama/email. Envelope profil error:false merupakan batas adapter yang sudah ada; hasil profile yang tidak dikenali tidak memberikan context atau memulai klasifikasi.

Respons klasifikasi memiliki `result.scanContextId` opaque yang terikat pada session/user, raw q persis, nama tangkapan dan masa berlaku 120 detik. Maksimum lima attempt disimpan per sesi; context terlama atau kedaluwarsa tidak dapat dipakai. PDF, metadata dan lokasi generic mengirim context pada field top-level `/api/execute`, dengan `values:{q}`. NIK/nama atau credential tidak diteruskan melalui context browser. Context disimpan di state internal controller, bukan markup atau activity record.

Context dapat dipakai ulang melalui aksi pengguna selama masih valid. Perubahan profil setelah klasifikasi tidak mengganti nama yang telah ditangkap. Token refresh akun yang sama mempertahankan context; logout/login baru, user/session replacement, expiry atau q yang berbeda menolaknya. Refresh normal dapat terjadi sebelum profile/classifier atau pembacaan berikutnya, tetapi classifier write tidak diulang otomatis. Respons yang tertunda menyamarkan credential dari token generasi lama dan baru.

Origin/CSRF, sesi, konfirmasi Boolean, allowlist operation, scope method/path/encoding/field dan validasi lampiran tetap berlaku. Tidak ada proxy URL bebas, pengalihan otomatis credential ke origin lain, pengurangan TLS, checksum/attestation bypass atau aktivasi lokasi tambahan.

## Respons, kegagalan, dan pembatalan

[scan-response.mjs](../webapp/private/scan-response.mjs) dan scope [ApiClient](../webapp/private/api-client.mjs) menerima classifier hanya pada HTTP200 dengan map bertipe, atau satu String JSON setelah transformasi transport. `error` nullable bool tidak mengubah tuple routing; `message` null menjadi `Unknown Error`, dan `data` harus String. HTTP201 bukan keberhasilan classifier.

Setelah profil valid ditangkap, kegagalan classifier HTTP/parse/network biasa mengembalikan tuple native `{message:'error',data:'1009'}`, `nativeFallback:true`, status upstream sebenarnya atau null, serta context. Controller dapat melanjutkan ke PDF dengan q/nama semula. Bentuk respons HTTP API yang sukses menampung fallback itu tidak menyatakan upstream sukses. Profile/scope failure, actual auth expiry, `SESSION_CHANGED`, dan kegagalan ownership menghentikan alur tanpa context baru atau permintaan dokumen yang dikarang.

GetDocument mempertahankan guard browser HTTP200, panjang lebih dari 200 byte, awalan `%PDF` dan batas 20 MiB. Preview/download hanya memakai pasangan URL lokal milik sesi dan expiry yang sudah ada. Metadata membutuhkan HTTP200 dan model `error:bool?`, `data.showRoute:int`, `data.type:String?`; valid `error:true` tetap diterima. ShowRoute true hanya untuk integer1. Tipe/error model yang salah menghasilkan fallback `(true,false,'')` pada caller, sambil mempertahankan PDF yang sudah valid. Main Scan meneruskan metadata.type; Activity tetap memiliki routing type kosong yang berbeda.

Batal, navigasi, logout, request baru dan perubahan owner menghentikan publikasi hasil serta request downstream dari attempt lama. Pembatalan UI tidak membuktikan request classifier yang sudah terkirim dibatalkan atau efek servernya dibatalkan. Tidak ada retry write otomatis; pengguna dapat memulai attempt baru secara sengaja. Ini guard kepemilikan browser yang diuji, bukan klaim seluruh lifecycle dan gesture Flutter sama.

## Kamera QR lokal

[scan-camera.js](../webapp/scan-camera.js) menggunakan [bundle ZXing lokal](../webapp/assets/vendor/zxing/manifest.json), bukan CDN. Kamera meminta video environment-facing tanpa audio. Decode mengisi input dengan String hasil asli lalu menghentikan kamera; hasilnya tidak otomatis dikirim untuk klasifikasi. Modul kamera sendiri tidak mengirim frame maupun kode ke jaringan.

Setiap attempt memakai video decoder privat, sementara preview yang terlihat menyimpan stream miliknya sendiri. Pemisahan ini memperbaiki race yang ditemukan saat review: controls/callback decoder lama tidak lagi dapat mengosongkan preview stream baru setelah Stop/restart. Cleanup menghentikan track dan melepas hanya sumber video milik attempt tersebut. Permission/decoder completion yang terlambat, preview terlepas, cancel, detection, halaman tersembunyi, pagehide dan destroy dicakup. Fatal decoder error memulihkan state yang dapat dicoba ulang; `NotFoundException`, `ChecksumException` dan `FormatException` merupakan kegagalan frame normal dan tetap melakukan scan.

Manifest mengikat bundle `@zxing/browser` 0.2.1 beserta lisensi browser/library. Versi persis library yang tertanam pada bundle tidak diklaim, karena metadata peer/development range tidak membuktikannya. Hash/ukuran tiga output vendor cocok pada review. Browser QR memakai canvas/captureStream sintetis untuk menguji decoder vendor yang sebenarnya; itu bukan izin atau kamera hardware Android/desktop.

## Hasil pengujian final

Hitungan komponen merupakan bagian dari pengujian penuh, bukan angka tambahan yang dijumlahkan ke total release:

| Pemeriksaan | Hasil dan batas |
|---|---|
| Backend pipeline baru | 35 pass; scope, profile/context, real handler loopback, decoder, auth/race dan fallback |
| Controller Scan | 91 pass; urutan, payload, routing, cancellation dan ownership |
| Host Scan aktual | 21 pass; handler, DOM, viewer dan camera interface sintetis |
| Kamera | 15 pass; termasuk late controls/callback, disconnection, fatal/benign decoder error |
| Fixture pipeline | 12 pass; fixture behavior dan isolasi transport lokal |
| Full Node final | 777/777 pass; nol fail dan nol changed inputs |
| Regresi 23 suite VM final | 1.190 pass; nol failed suites, changed inputs atau perubahan receipt historis yang dipantau |
| Browser pipeline final | 23/23 pass; desktop 1280×720, nol console warning/error; delapan hash input awal/akhir cocok |
| Transport pipeline final | 59 panggilan sintetis, termasuk 16 request classifier write; nol pending/unexpected |
| Browser kamera final | 3/3 pass dengan reader vendor aktual dan canvas stream sintetis, pada hash kamera final `2441f7e3…e4460db` |
| Docker lokal | 14 frontend dan 22 backend hashes cocok; 176 shapes/76 adapter enabled; unggah geotag false |
| Image standalone | Enam modul/vendor/manifest/lisensi yang diperiksa cocok, tanpa bind mount dan tanpa jaringan |
| Aset publik | Delapan hash aset cocok melalui system curl dengan DNS dan verifikasi TLS normal |
| Preview akun tanpa submisi | 3/3 pass, viewport sempit 558×668 tanpa overflow; nol classifier, kode QR atau kamera dijalankan |

[Receipt Node final](webapp/scan-pipeline-backend-tests.json) dan [regresi VM final](webapp/scan-pipeline-regressions.json) merekam hasil lengkap. VM tetap memakai 23 suite lama dengan assertion perilaku yang sama; helper resetScanHost aktual ditambahkan sebagai binding. Tes backend memakai ApiClient/registry/handler HTTP aktual dengan injected upstream sintetis dan browser loopback lokal, bukan provider.

[Receipt browser pipeline](webapp/scan-pipeline-browser.json) beserta [transportnya](webapp/scan-pipeline-browser-transport.json) mengikat 23 assertion final pada fixture `ff303384…022b4b`. Dari 59 panggilan, 16 adalah request classifier write, termasuk permintaan yang sengaja gagal atau dibatalkan di UI; jumlah itu bukan jumlah mutasi server yang berhasil. Satu assertion dengan wording toast yang dikarang dikeluarkan dan dicatat dalam receipt; kriteria aktual diuji sebagai bagian 23 hasil final. Traffic assertion yang dikeluarkan itu tetap termasuk receipt transport run final. [Draft layout sebelumnya](webapp/scan-pipeline-browser-before-fixture-layout.json) dan [transport draft layout](webapp/scan-pipeline-browser-transport-before-fixture-layout.json) tetap terpisah dan tidak termasuk hitungan 59. [Screenshot desktop final](webapp/scan-pipeline-desktop.png) melengkapi bukti fungsi/transport.

[Receipt browser QR final](webapp/scan-camera-browser.json) dan [screenshot](webapp/scan-camera-browser.png) memakai modul kamera setelah perbaikan restart/fatal error serta decoder vendor yang sebenarnya. Ketiga pemeriksaan diulang terhadap hash final, sehingga bukan penerimaan dari sumber kamera sebelum perbaikan. Stream berasal dari canvas/captureStream; tidak ada kamera hardware atau request klasifikasi dari fixture kamera. Fixture pipeline juga memakai PDF/map tiles sintetis lokal. Hasil ini tidak membuktikan provider hidup, model perangkat, atau browser mobile.

| Sumber browser utama | SHA256 awal = akhir |
|---|---|
| `webapp/app.js` | `e29853c282d251af37eb8b608c8d2b1be8f732289b5b259e5f9401a5486ef350` |
| `webapp/styles.css` | `a34d4f58c0c0cb7061ec61a1d192eadde6e515536d2542f33939a3f7c9b25ba1` |
| `webapp/scan-controller.js` | `eb2466a46d35537d1afa1a35a5962390c02300033af3889fbbb5654c5b601bba` |
| `webapp/scan-camera.js` | `2441f7e386ad759969a90350929c4faa2a40474aaa72d8c45a2c4d3d3e4460db` |
| Fixture pipeline | `ff303384b632ef474abcd53261c99b854dc12168641643b896b7eab0a6022b4b` |

Receipt browser juga mengikat tiga input backend lainnya, sehingga total delapan hash awal/akhir cocok. Semua request pipeline/camera pada fixture adalah sintetis; tidak ada request provider atau produksi dari pengujian tersebut.

## Deployment dan preview terbatas

[Manifest deployment](webapp/deployment-latest.json) mencatat container lokal sehat dengan 14 file frontend dan 22 backend yang cocok, katalog 176/76, dan geotag upload disabled. [Pemeriksaan image standalone](webapp/scan-pipeline-image.json) menguji dua modul baru serta empat file vendor/manifest/lisensi langsung di image, tanpa mount dan jaringan. Ini bukti packaging sumber, bukan penerimaan API BPN.

[Pemeriksaan aset publik](webapp/scan-pipeline-public-assets.json) memakai system curl dengan DNS normal dan validasi TLS biasa, tanpa forced IP atau bypass. Health menerima HTTP200 dan delapan aset publik memiliki hash sumber yang cocok. Probe Node fetch yang lebih awal gagal dengan `UND_ERR_CONNECT_TIMEOUT` sebelum menghasilkan verdict aset; kegagalan itu tetap diungkap dalam receipt. Keberhasilan curl berikutnya tidak membuktikan koneksi tanpa gangguan selama seluruh rentang pengujian.

Setelah pengguna login sendiri, [preview live](webapp/scan-pipeline-live-preview.json) dan [PNG preview](webapp/scan-pipeline-live-preview.png) memverifikasi tiga hal baca-saja: sesi akun aktif, satu UI Scan beserta tombol kamera/input kosong, dan layout 558×668 tanpa horizontal overflow. Tidak ada kode dokumen/QR yang disubmit, kamera dibuka atau classifier dipanggil. Preview ini tidak meningkatkan bukti mutasi sintetis menjadi penerimaan Scan server asli.

[Diagnosis Bhumi dari batch sebelumnya](webapp/collection-save-integration-bhumi-diagnosis.json), dengan kegagalan decode 7 dari 9 tile, tetap merupakan isu historis terbuka. Layer/tile itu tidak diuji ulang pada run Scan ini. PNG lokal pada fixture dan hasil static-asset access tidak menutup masalah provider tersebut.

`review_scan_document_before_fix.mjs` dan receipt manual Scan sebelumnya tetap historis pada sumber awalnya. Asumsi satu GetDocument langsung, caller-provided name, serta download-only pada probe itu bukan kontrak pipeline baru. Tidak ada receipt atau ledger lama yang ditulis ulang.

Penerimaan API Scan BPN saat ini, efek classifier, kamera hardware, browser mobile, special PBT/KKPR maps, route-stack native, semua kontrol PDF/digital signature, activation/geotag, pixel/Unicode parity dan kesetaraan seluruh aplikasi tetap belum terbukti. Inventaris cakupan membedakan Scan pipeline dari generic read views; flag write classifier tidak diubah agar cocok dengan penghitung read.
