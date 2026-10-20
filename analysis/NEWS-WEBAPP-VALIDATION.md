# Validasi Berita dan Pengumuman

Berita dan Pengumuman aktif di [localhost](http://localhost:4173/#/news) pada `app.js` SHA-256 `5c0441b4de30b7de77edca528bccdfccb8b28db7f68aeaf37b897136b929546b` dan stylesheet `e58541c4a99ec69e1c349479eacc85f476f0090f6ef57d20fef70420aa4c304c`. [Rekap rilis](webapp/news-verification-summary.json) mengikat bukti native, backend, fungsi frontend, browser sintetis, preview produksi dan deployment. Angka pemeriksaan bukan jumlah fitur selesai; kesetaraan seluruh aplikasi belum dinyatakan tercapai.

## Alur yang diimplementasikan

Beranda memuat dua feed publik setelah bootstrap sesi/katalog dan konfigurasi siap: **Siaran Pers Kementerian** melalui `GET Berita/GetBerita?limit=8` serta **Pengumuman** melalui `GET Pengumuman/GetPengumuman?limit=5`. Bootstrap tanpa akun tidak membaca profil, tetapi home anonim dapat menghubungi kedua API publik ini. Pemeriksaan `/health` dan diagnostik konfigurasi lokal sendiri tidak melakukan request produksi. Halaman Berita dan tab Pengumuman umum menggunakan state feed yang sama dengan beranda; tab Yuridis/Sertipikat Hilang tetap mempunyai alur terpisah dan tidak termasuk audit ini. Blok home tidak menambah entri `flowDefinitions` atau membuktikan menu mandiri native.

Parser menerima hanya HTTP 200 dengan `message` berupa array, termasuk array kosong; body String JSON didekode. `body.error` diabaikan sesuai helper native, dan `data` bukan alias daftar. Lima field model persis ialah `id`, `title`, `category`, `banner`, `url`, semuanya String nullable. Seluruh baris dan urutan respons dipertahankan tanpa pemotongan lokal pada angka limit, filter kategori, sorting atau pagination. Judul menjadi teks yang di-escape; ID/category tidak diangkat menjadi fakta artikel.

Kartu mempertahankan URL dari item yang dipilih tanpa request detail berdasarkan ID. URL absolut HTTPS tanpa userinfo dan karakter kontrol diterima sebagai tautan tab baru dengan `noopener noreferrer` dan `no-referrer`; URL tidak tersedia/ditolak menghasilkan kartu nonaktif. Ini mengganti WebView native dengan navigasi browser terisolasi. Adapter tidak mem-proxy artikel/banner atau meneruskan kredensial main API ke URL tersebut. Cookie milik situs tujuan tetap mengikuti aturan browser; tidak ada klaim bahwa semua cookie eksternal pasti tidak dikirim.

Banner menggunakan URL HTTPS yang valid dan fallback ikon ketika gambar gagal. CSP menambahkan hanya origin gambar **`https://www.atrbpn.go.id`**, di samping `self`, `data:` dan `blob:` yang sudah ada; bukan wildcard domain atau seluruh HTTPS. `connect-src` dan script tetap `self`; tidak ada iframe artikel atau script eksternal baru. URL HTTPS di origin lain dapat lolos validasi URL tetapi gambarnya tetap diblokir CSP. Audit URL atau respons feed sendiri tidak membuktikan gambar/navigasi berhasil; bukti preview terpisah di bawah mencatat 13 banner termuat dan satu artikel yang benar-benar dibuka.

## Adaptasi yang dinyatakan

Native memakai satu stream busy bersama, cache list tidak kosong, dan empat skeleton untuk waiting/error/null/empty. Webapp mempertahankan cache list tidak kosong, tetapi menyediakan busy terpisah per feed, pesan kosong/error, tombol muat ulang, dan retensi data saat refresh biasa gagal. Respons kosong atau gagal tidak menyebabkan loop fetch; masuk kembali ke tampilan atau retry manual dapat mencoba lagi. Penjagaan owner, request, route/tab dan epoch sesi menahan respons terlambat; kegagalan autentikasi yang masih berlaku mengikuti aturan sesi yang ada. Angka/dimensi responsif, validasi URL, fallback, state error dan pembukaan tab merupakan adaptasi web, bukan klaim perilaku identik APK.

## Bukti native dan backend

[Audit native](NEWS-FLOW.md), [ledger tetap](recovered/news-flow/flow.json) dan [hasil verifier](recovered/news-flow/verification.json) mencakup 25 hash sumber, 5.213 instruksi ELF unik, 224 marker, 268 referensi pool, 18 blok konstanta, 17 dispatch dan 17 dependensi. Bukti membedakan URL request WebView dari HTML lokal, serta tidak menganggap helper async onTap sebagai izin menambah efek otorisasi browser. Tidak ada eksekusi APK atau jaringan dalam audit tersebut.

[Verifikasi backend](webapp/news-backend-verification.json) mencatat 157 tes Node lulus, termasuk 12 tes baru, tanpa request produksi. Dua adapter yang sudah ada mendapat parser respons terbatas; jumlah registry tetap 171 dengan 67 aktif, bukan dua operasi baru. Fixed origin, optional-session/refresh, CSRF, redaksi, pembatasan redirect dan batas respons 20 MiB dipertahankan. Dua belas tes baru sudah termasuk dalam 157, bukan tambahan.

## Regresi fungsi dan browser sintetis

[Agregat 18 suite fungsi aktual](webapp/news-regressions.json) lulus **804 pemeriksaan, nol gagal**, dengan [57 pemeriksaan Berita/Pengumuman](webapp/news-flow-latest.json) sudah termasuk dalam 804. Fungsi sumber dijalankan dalam VM dengan respons/DOM sintetis; hash input dan laporan historis tetap stabil. Cakupan terfokus meliputi model/envelope, URL dan escaping, cache/autoload, busy/error/retry, retensi saat refresh gagal, route/tab, perubahan owner dan sesi. Ini bukan eksekusi APK atau browser.

[QA browser sintetis](webapp/news-browser-checks.json), 07:35:45–07:37:49 UTC, lulus **23 pemeriksaan, nol gagal**, tanpa warning/error console atau overflow dokumen. Fixture memeriksa kegagalan Berita 503 lalu retry, `error:true` dengan daftar Pengumuman valid, seluruh 10/7 kartu melebihi limit request 8/5, teks inert, URL tidak didukung yang nonaktif, dimensi kartu/banner, cache antarhalaman, tab Yuridis terpisah dan desktop/mobile. Pengukuran mobile 390,4 px pada viewport 390 px tidak disalahartikan sebagai overflow: assertion menggunakan `document.scrollWidth` terhadap viewport, dan koreksi tersebut dicatat terbuka dalam laporan.

[Transport fixture](webapp/news-fixture-transport.json) memuat tepat **tiga panggilan sintetis**: dua HTTP 200 dan satu HTTP 503 yang sengaja dipaksakan. Seluruh 16 hash sumber awal/akhir tetap sama; tidak ada request produksi, artikel atau banner. URL atribut dan isolasi link diuji, tetapi fixture ini tidak menguji navigasi artikel sebenarnya atau render gambar remote. Retensi refresh/race dibuktikan oleh VM terfokus, bukan dipromosikan menjadi cakupan browser.

## Preview produksi pada sumber final

[Preview anonim Docker](webapp/news-preview.json) pada **07:38:31–07:40:38 UTC** menampilkan delapan kartu Berita dan lima Pengumuman. Seluruh **13 banner** termuat; tidak ada alert, overflow atau entri warning/error console yang diamati. Satu kartu Pengumuman diklik dan membuka tab baru dengan URL yang cocok dengan hasil server, heading terlihat, serta referrer kosong. URL artikel yang sama juga dibuka langsung dalam tab terpisah. Ini dua cara memeriksa **satu URL**, bukan dua artikel atau seluruh perilaku WebView native. Tab artikel pengujian telah ditutup.

[Log preview terbatas](webapp/news-preview-transport.json) mengonfirmasi **dua respons API feed HTTP 200** pada jendela tersebut: satu Berita dan satu Pengumuman. Request banner, halaman artikel dan aset halaman terjadi melalui browser secara terpisah dan **tidak dihitung dalam dua request API**. Tidak ada mutasi yang diminta. [Screenshot preview localhost — data feed publik aktual](webapp/screenshots/news-localhost-preview.jpg) merupakan pengamatan UI ini, bukan fixture sintetis.

## Probe produksi terdahulu, sumber berbeda

[Probe anonim terdahulu](webapp/news-live-check.json) pada 19 Oktober 2026, 07:30:14–07:30:21 UTC memakai sumber `efb87a13341d2ef5a588aab3d9f34e66ab83a6c02ce55357e79f460f26ddcea3`: **dua panggilan HTTP 200**, delapan berita dan lima pengumuman. Seluruh URL/banner pada kedua respons memakai origin `https://www.atrbpn.go.id` dan lolos validasi URL yang diperiksa. Tidak ada request artikel atau banner dalam probe ini; keberhasilan link/gambar bukan kesimpulan dari jumlah tersebut. Sesi lokal terisolasi ditutup; tidak ada mutasi atau material kredensial yang disimpan. Bukti ini menerima dua daftar pada waktu tersebut, bukan seluruh konten, perilaku situs artikel, kondisi akun, atau penerimaan universal. Dua request probe sumber `efb87a13` ini tidak digabung sebagai batch preview sumber final `5c0441b4`.

## Deployment dan batas rilis

[Deployment 07:38:19 UTC](webapp/deployment-latest.json) mencatat container sehat `70b769218b45…d6af22a0`, tiga hash frontend dan tujuh hash backend cocok dengan sumber. Katalog tetap **171 bentuk request / 67 adapter aktif**. Blok home baru tidak menambah definisi alur: inventaris masih 29 menu audit, 19 halaman pembacaan dan 34 view, tanpa klaim parity dari angka tersebut. Port tetap loopback dengan alamat pengguna `http://localhost:4173`; public origin belum dikonfigurasi dan unggah geotag nonaktif.

Backend direstart untuk rilis ini dan mengakhiri sesi lama. Preview terbaru anonim; fitur pribadi memerlukan login kembali. Tab lama dapat masih menampilkan state login terdahulu sampai dimuat ulang. [Deployment kantor yang diarsipkan](webapp/office-deployment-2026-10-19.json), [rekap kantor](webapp/office-verification-summary.json) dan [pengamatan akun/dokumen sebelum rebuild](ACCOUNT-DOCUMENT-AVAILABILITY-2026-10-19.md) tetap historis pada sumber serta sesi masing-masing.

Native runtime Android, seluruh artikel/redirect/cookie/download WebView, semua kondisi jaringan/akun, navigasi keyboard lengkap dan kesamaan piksel belum dibuktikan. Busy terpisah, retry/empty/error, URL HTTPS dan tab terisolasi tetap adaptasi yang dinyatakan. Health masih `serverValidated: false` untuk keseluruhan backend. Fitur ini tidak mengubah posisi atau pengiriman dokumen; goal keseluruhan belum selesai.
