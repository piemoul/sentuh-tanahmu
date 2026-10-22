# Validasi integrasi simpan Koleksi dan Aktivitas

Pengujian final batch ini lulus: **603/603 tes Node, 1.190 pemeriksaan fungsi pada 23 suite, dan 21/21 pemeriksaan browser desktop**. Input pengujian dan receipt historis yang dipantau tidak berubah. [Rekap final](webapp/collection-save-integration-verification-summary.json) mengikat hasil tersebut ke Docker terpasang: delapan hash frontend dan 22 hash backend cocok. Lima aset publik melalui tunnel juga cocok. Lima pemeriksaan baca akun sendiri dicatat terpisah; layer Bhumi pada pemeriksaan live itu belum termuat.

Batch ini menghubungkan modul simpan PERSIL ke halaman peta browser, mempertahankan bookmark BERKAS yang sudah terhubung, dan mencatat pembacaan/penghapusan Aktivitas. Perilaku client bersumber dari bukti native statis yang dibekukan. Tes fungsi, backend, dan browser memakai data sintetis; hasilnya tidak membuktikan penerimaan mutasi atau efek penyimpanan pada server asli.

## PERSIL: sheet caption, grup, dan peta pemiliknya

[collection-save-persil.js](../webapp/collection-save-persil.js) kini dipakai host [app.js](../webapp/app.js) pada hasil Cari Bidang yang memiliki geometri yang didukung, peta bidang/PBT dari Aktivitas, detail PERSIL Koleksi, serta peta bidang terpilih dari sertipikat analog/elektronik. Host mempertahankan ID persil yang semula diminta, terpisah dari ID feature hasil respons dan ID baris koleksi. Ini bukan klaim seluruh entry native sudah diimplementasikan.

Gate memakai sesi terautentikasi dan profil dengan integer `statusVerifikasi` nonnull selain `-1`, termasuk `0` dan `-2`. Browser tidak meminta input NIK; adapter privat mengambil tepat `user.nomorIndukKependudukan` dari sign-in tersimpan. Profil `nomorIdentitas`, NIB, feature ID, atau field browser tidak menjadi penggantinya. Batas guard sesi/konfigurasi dan kepemilikan respons adalah adaptasi browser terhadap token-presence/model native.

Entry peta yang belum memiliki ID koleksi membuka sheet baru dengan caption kosong, pilihan satu grup yang dapat dilepas lagi, dan pembacaan grup milik sheet itu sendiri. Caption memakai trim native termasuk U+0085; caption kosong menjadi `Bidang Analog nomor ` ditambah NIB feature pertama, dengan fallback `1` hanya untuk NIB null. Primary save mengirim ID target asli dan judul yang ditangkap sebelum await; backend menambahkan `Subtitle=Lokasi Bidang` dan NIK tersimpan. Hanya envelope bertipe valid HTTP200 dengan `error === false` dianggap berhasil oleh caller PERSIL.

Input caption, pilihan grup, dan pembuka `Buat Grup` tetap dapat dipakai saat primary save sibuk; submit ganda ditahan. Pilihan grup dibaca setelah primary selesai. Assignment opsional hanya dijalankan jika returned collection ID nonempty dan pilihan grup nonnull. Kegagalan assignment biasa tidak membatalkan primary save; UI mempertahankan keberhasilan beserta peringatan native. Null/empty returned ID juga tidak membatalkan primary success. Normal sheet save tidak menulis returned ID ke peta induk dan tidak melakukan optimistic insert atau forced refresh koleksi.

Nested `Buat Grup Baru` memiliki input awal kosong, copy/trim/validasi sendiri, dan tombol Batal/Buat Grup yang dinonaktifkan saat request nested berjalan; input tetap editable. Typed HTTP200 diterima tanpa gate `body.error`. Sukses menutup nested sheet terlebih dahulu, lalu memuat ulang grup lokal tanpa await dan tanpa auto-selection atau reset pilihan lama. Ini berbeda dari controller pembuatan grup pada root Koleksi.

Host menyembunyikan parent pane selama sheet dibuka dan mempertahankan node peta yang sama, state kamera, judul asal, serta fokus/selection input saat repaint async. Kembali mengembalikan parent pane. Guard epoch, route, detail sequence, reader/response, item/row snapshot, pilihan grup, dan dialog mencegah hasil lama memperbarui tampilan pengganti. Aksesibilitas dialog, penahanan submit ganda, dan penghentian hasil stale adalah adaptasi browser, bukan klaim seluruh gesture/lifecycle Flutter sama.

## PERSIL tersimpan: direct remove dari detail peta

ID koleksi nonnull dari detail PERSIL Koleksi, termasuk String kosong, memilih `Hapus Koleksi`. Aksi ini langsung memakai endpoint DELETE PERSIL dengan ID tersebut; tidak memakai pencarian first-match root row dan tidak membuka konfirmasi root item-delete. Typed HTTP200 diterima meski `body.error` true/null. Sukses hanya menghapus ID tersimpan pada owner peta dan menjalankan callback koleksi non-force.

Callback tersebut hanya dapat meminta reader rows default/non-force. Cache yang sudah loaded tidak melakukan GET; cache grup dan loaded flags tidak diinvalidate. Kegagalan biasa mempertahankan ID tersimpan dan membuka kesempatan retry. Perilaku ini terpisah dari penghapusan item root, pelepasan membership grup, dan penghapusan grup yang sudah didokumentasikan pada rilis sebelumnya.

## BERKAS: status, simpan, dan hapus bookmark

Shared detail BERKAS dari Cari Berkas, Aktivitas, dan Koleksi sudah memiliki kontrol langsung `Simpan ke Koleksi`/`Hapus dari Koleksi`. Cabang Berkasku dengan rating tidak mendapat bookmark ini. GET status memakai ID gabungan `berkasId:(tipeKantorId ?? '')` dan type tetap `BERKAS`; nilai `message` nonempty adalah saved ID. Save memakai ID gabungan, judul nomor/tahun dan nama kantor; nilai `data` nonempty menjadi saved ID. Null/empty data tetap dapat menghasilkan label saved dengan ID null, sehingga tap berikutnya kembali menjalankan save, sesuai native.

Typed HTTP200 BERKAS diterima walau `error:true`; caller BERKAS berbeda dari primary PERSIL yang membutuhkan `error:false`. Nonnull saved ID memilih direct DELETE tanpa konfirmasi tambahan. Callback Koleksi tetap non-force dan tidak mengubah cache shared secara optimistis. Sumber nama kantor dan aturan null/empty dipertahankan; data identitas tidak ditambahkan ke activity record lokal.

Regresi token-refresh juga dicakup: delayed401 dengan token lama, setelah token sesi sudah diperbarui, menghasilkan `SESSION_CHANGED` tanpa menghapus login/profil/cache privat yang masih aktif. Tidak ada automatic write retry. Klik pengguna berikutnya dapat memakai token baru. `AUTH_REQUIRED`, `LOGIN_REQUIRED`, dan `SESSION_EXPIRED` yang masih memiliki owner valid tetap membersihkan data privat. Ini diuji melalui ApiClient dan fungsi UI aktual dengan transport sintetis, bukan akun produksi.

## Aktivitas: pembacaan, detail bersama, dan penghapusan lokal

Adapter list memakai HTTP200 dengan pemilihan `body.data ?? body.message`, model camelCase delapan field, satu decode String yang diaudit, dan tanpa gate envelope.error. Kartu/filter mempertahankan urutan dan indeks asal untuk dispatch detail. Antrian Aktivitas memakai detail antrean bersama yang sudah tersedia; pernyataan lama bahwa detail antrean masih disabled tidak berlaku pada sumber ini.

Kontrol hapus mengonfirmasi judul sumber dan mengirim hanya `userActivityId` melalui operasi multipart yang tetap membutuhkan konfirmasi eksplisit pada API. Service mengembalikan boolean berdasarkan status200 dan tidak memerlukan parser body. Controller native menghapus seluruh ID yang cocok dari list lokal setelah hasil/failure biasa, termasuk false atau network failure; browser mengikuti aturan itu sambil mencatat bahwa penghapusan server belum terkonfirmasi. Hilangnya kartu bukan bukti server sudah menghapusnya. Cache/filter/pagination lokal disesuaikan tanpa GET otomatis. Actual session expiry dan stale-owner guard tetap memisahkan hasil akun/view lama; `SESSION_CHANGED` pada token-refresh sesi yang sama bukan logout.

Peta bidang/dokumen memakai basemap OSM raster plus fixed Bhumi WMS dan pin/metadata kamera yang sudah ada. Ini adaptasi provider browser terhadap Google hybrid native, sehingga klaim lama bahwa basemap belum tersedia juga tidak berlaku. Alur dokumen non-PBT tetap mempertahankan PDF valid ketika metadata gagal; perbedaan penolakan generik metadata `error:true` tetap merupakan batas yang diketahui. Batch ini tidak mengubah pipeline main Scan.

## Bukti, finalisasi, dan batas

Kontrak native utama tetap dibekukan:

| Alur | Ledger | SHA256 |
|---|---|---|
| Simpan PERSIL | [flow.json](recovered/collection-save-persil/flow.json) | `dcc8abd41209eb741106dda7e88b834b4ba731b8e89838622859ff425767f199` |
| Simpan BERKAS | [flow.json](recovered/collection-save-berkas/flow.json) | `c04d52a1cf004e9959fe9d9c006ed52c4b02bc8dda22ac181edf301a597d6573` |
| Hapus Aktivitas | [flow.json](recovered/activity-delete/flow.json) | `6b9fe33d129a6919110c1c5bfa4f4ccc1260320946a30d92733395bc846a6c80` |

Uji terfokus mencakup modul PERSIL, integrasi host/handler/DOM aktual, UI bookmark BERKAS, UI hapus Aktivitas, dan scope/decoder/backend simpan-Aktivitas. [Receipt Node final](webapp/collection-save-integration-backend-tests.json) mencatat 603 pass, nol fail dan nol changed inputs. [Receipt regresi fungsi final](webapp/collection-save-integration-regressions.json) mencatat 1.190 pass pada 23 suite, nol failed suites, nol changed inputs dan nol perubahan receipt historis yang dipantau. Semua penerimaan mutasi pada fixture adalah sintetis; baseline corpus/ledger/receipt tetap mempunyai scope dan hash aslinya.

| Bukti rilis baru | Hasil dan batas |
|---|---|
| Tes Node | 603/603 pass; nol changed inputs |
| Regresi fungsi aktual | 1.190 pass / 23 suite; nol failed suites, changed inputs atau historical changes |
| Browser sintetis | 21/21 pass; desktop 1280×720; nol console warning/error |
| Transport fixture kumulatif | 27 panggilan, termasuk 9 request write sintetis; nol unexpected dan nol pending |
| Freeze browser | Hash app, CSS, modul dan fixture awal/akhir identik; tabel di bawah |
| Viewport dan provider fixture | Desktop 1280×720; raster memakai PNG lokal, bukan provider asli |
| Produksi pada tes sintetis | Nol request produksi/provider; tidak ada mutasi akun asli |
| Hash frontend/backend terpasang dan status deployment | Delapan frontend dan 22 backend cocok; sehat, bind loopback, 176 operasi/75 enabled; geotag upload disabled |
| Aset publik dan image tanpa mount | Lima hash aset publik cocok; modul PERSIL ada dan cocok di image standalone tanpa bind mount/network |
| Uji baca akun sendiri | Lima pemeriksaan UI lulus; viewport sempit 484×531 tanpa overflow; tidak ada mutasi; Bhumi live belum termuat |
| Mutasi live, efek membership/cascade server, dan oracle runtime APK | Belum dibuktikan |

[Receipt browser final](webapp/collection-save-integration-browser.json) menguji UI aplikasi dan API privat lokal dengan transport upstream sintetis. Cakupannya meliputi penolakan primary PERSIL `error:true`, nested group yang menerima `error:true`, caption/pilihan grup yang tetap editable, caption yang ditangkap sebelum await, pilihan grup setelah await, pemulihan peta induk, hapus Aktivitas pada respons503 dan duplicate ID, refresh yang memulihkan data fixture, perbedaan message/data pada bookmark BERKAS, serta direct saved-map delete tanpa GET tambahan. [Screenshot desktop](webapp/collection-save-integration-desktop.png) melengkapi receipt, bukan pengganti pemeriksaan fungsi.

[Receipt transport](webapp/collection-save-integration-browser-transport.json) mencatat keseluruhan 27 panggilan, termasuk traffic read provisional sebelum run final. Jumlah itu bukan tambahan 27 panggilan yang hanya berasal dari 21 assertion final. Sembilan write mencakup request yang sengaja gagal; jumlah write bukan jumlah mutasi yang berhasil. OSM template dialihkan ke PNG lokal dan URL Bhumi lokal juga mengembalikan PNG; koneksi/render tile dari provider asli tidak diuji. Bukti mobile atau provider historis tidak diwariskan sebagai hasil run ini.

| Sumber yang dibekukan untuk browser | SHA256 awal = akhir |
|---|---|
| `webapp/app.js` | `57356e2f7cb366104901a36720e882bda0e590c8f1e4fda1c25664bc5d8a988c` |
| `webapp/styles.css` | `03f0402135e477bd29cf202100c97843d04eb5e8f18a89edceefbd9728c07050` |
| `webapp/collection-save-persil.js` | `b5318271688487df7f7a629202372d855457aeca73806d008e2a9ef616d125db` |
| Fixture browser | `71da5f6b2610a449d5c4b3d941c2c3ffb9eac33dda9f73dc0e78dbbdfaf9d8f1` |

Receipt sebelum batch ini tetap historis dengan hash/scope aslinya, termasuk [rilis item actions](COLLECTION-ITEM-ACTIONS-WEBAPP-VALIDATION.md). Inventaris generator menambahkan hash modul PERSIL dan decoder Aktivitas, tetapi inventaris sendiri bukan hasil uji atau bukti penerimaan server.

[Uji baca live](webapp/collection-save-integration-live-browser.json) dilakukan setelah pengguna login pada container final. Profil aktif, daftar Berkas kosong, satu Bidang tersimpan, pin/zoom20/kontrol direct-remove, dan layout sempit diamati tanpa menjalankan simpan/hapus. [Diagnostik koneksi agregat](webapp/collection-save-integration-live-connections.json) mencatat lima HTTP200 untuk summary, daftar Koleksi, grup, geometri, dan permintaan token Bhumi. UI menyatakan layer belum termuat. HTTP200 pada permintaan token tidak membuktikan WMS berhasil. Logger Bhumi default adalah no-op saat `options.log` tidak diberikan; absennya event tile pada log tidak membuktikan tidak ada request atau keberhasilan WMS. Hasil ini tidak disamakan dengan 21 assertion fixture atau hasil provider historis. Identitas, koordinat, isi akun, token, dan gambar peta live tidak disimpan dalam receipt.

[Diagnosis baca tambahan](webapp/collection-save-integration-bhumi-diagnosis.json) kemudian memeriksa gambar yang benar-benar ada pada peta yang sama: tujuh dari sembilan tile Bhumi decoded, dua gagal, empat dari empat tile OSM dan gambar marker decoded. Navigasi langsung ke satu URL tile yang diamati mula-mula menampilkan PNG256×256; navigasi berikutnya untuk satu tile gagal menampilkan halaman Cloudflare502. Jadi kegagalannya sebagian/intermiten, bukan bukti semua WMS mati. Lokasi penyebab tepat antara edge, origin adapter, dan provider belum ditetapkan. Diagnosis tambahan ini terpisah dari lima pemeriksaan live awal dan tidak menambah mutasi akun.

[Manifest deployment](webapp/deployment-latest.json), [aset publik](webapp/collection-save-integration-public-assets.json), dan [pemeriksaan image](webapp/collection-save-integration-image.json) mengikat paket final. Sesi terbaru tetap aktif setelah pemeriksaan. Checkpoint GitHub `f2ea136a368f8614960b3b58169acf7e2c3cfd7d` tetap versi publik terdahulu; integrasi batch ini belum dipush dalam checkpoint tersebut.

Tidak ada perubahan validasi kehadiran, spoofing GPS, aktivasi berkas geotag, unggah koordinat, digital signature, atau main Scan yang ditambahkan batch ini. Full native/pixel/Unicode/date parity, seluruh origin peta, seluruh kondisi akun/server dan produksi mutasi tetap belum terbukti.
