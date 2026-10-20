# Validasi Kantor Pertanahan dan Kalender Kantor

Implementasi pada `webapp/app.js` SHA-256 `717f612e568ed5720727681d423a79ea791cb34a71cbeca2505a757b78bc045d` mempunyai halaman khusus daftar kantor terdekat dan kalender kantor, aktif di [localhost](http://localhost:4173/#/office). Stylesheet memakai SHA-256 `118bfb7ada0bae9e43a3f02eaf5c4418f8135ab7e9a41f7ae171d682bdd5546a`. Bukti berikut memisahkan audit APK, pengujian sintetis, dua pembacaan produksi terbatas, dan deployment. [Rekap verifikasi rilis](webapp/office-verification-summary.json) mengikat laporan serta hash tersebut; hasilnya tidak menyatakan seluruh aplikasi telah setara 1:1.

## Fungsi yang diimplementasikan

Kantor Pertanahan memakai posisi perangkat yang diminta melalui tindakan pengguna di browser. Adapter mengirim JSON `latitude`, `longitude`, `radius: 0.1`, `isKalender: 1`, dan `limit: null`. Daftar mengikuti model NDb: nama `namaKantor`, alamat, jarak asli, serta tiga fasilitas. Pencarian nama lokal tidak memangkas spasi, mempertahankan urutan sumber, dan tidak membuat permintaan tambahan. Filter fasilitas memakai AND dan nilai integer tepat `1`. Kartu menampilkan ketiga indikator; memilih kartu menyimpan objek kantor asli dan membuka informasi tanpa mutasi.

Kalender memakai daftar serta pilihan kantor bersama. Pilihan awal adalah kantor pertama bila belum ada pilihan. Referensi terenkripsi dari daftar dipertahankan sampai backend privat menerapkan transformasi native, lalu mengirim `kantorId` hasil dekripsi dan `tahun` String sebagai form. Kalender dibatasi bulan berjalan sampai Desember tahun berjalan; semua tipe peristiwa dapat menandai hari, sedangkan daftar keterangan bulanan hanya memakai `tipeLiburId === "2"`. Pembaruan untuk kantor/tahun yang sama mempertahankan data sebelumnya saat menunggu atau mengalami kegagalan sementara. Perubahan kantor/tahun membersihkan data lama. Kepemilikan request, pilihan, halaman dan sesi mencegah respons terlambat mengganti tampilan baru.

## Bukti native

| Bukti | Cakupan | Verifikasi |
|---|---|---|
| [UI native](OFFICE-UI-FLOW.md), [ledger](recovered/office-ui/office-ui-flow.json) | Callback dua menu, lifecycle, pencarian/filter/daftar kantor, pilihan kantor dan kalender | 21 hash sumber; 10.543 instruksi ELF; 188 marker; 19 dispatch |
| [Grid kalender](recovered/office-ui/office-ui-grid-followup.json) | Pengelompokan seluruh tipe, warna hari, callback grid | 3 hash sumber; 443 instruksi ELF; 8 marker; 1 dispatch |
| [Layanan/model](OFFICE-SERVICES-FLOW.md), [ledger](recovered/office-services/flow.json) | Request, envelope typed, lokasi, model NDb/FDb, dekripsi referensi | 35 hash sumber; 3.926 kemunculan instruksi, 3.882 unik; 212 marker; 4 dispatch |

Ketiga ledger memakai APK 6.1.5 yang sama, dengan hash ELF `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Angka instruksi antarledger tidak dijumlahkan sebagai instruksi unik karena sebagian bukti layanan/UI berbagi helper. Tidak ada eksekusi APK, emulator atau panggilan produksi dalam audit statis ini. [Hasil verifikasi native terbaru](webapp/office-native-verification.json) mengikat ketiga ledger dan hash verifier. Verifier: [UI](rea/verify_office_ui.py), [grid](rea/verify_office_ui_grid.py), dan [layanan](rea/verify_office_services.py).

## Pengujian otomatis

| Laporan | Hasil | Batas bukti |
|---|---|---|
| [Seluruh Node tests](webapp/office-automated-tests.txt) | 145 lulus, 0 gagal; 610,9351 ms | Transport sintetis, fungsi backend, dan API loopback |
| [17 suite fungsi aktual](webapp/office-regressions.json) | 747 lulus, 0 gagal | Fungsi sumber diekstrak ke VM; API/DOM/lokasi sintetis |
| [Suite kantor/kalender](webapp/office-calendar-flow-latest.json) | 67 lulus, 0 gagal; 49 panggilan fixture | Sudah termasuk 747; bukan panggilan produksi |
| [Backend kantor](webapp/office-read-backend-verification.json) | 11 lulus, 0 gagal | Sudah termasuk 145; wire, scope, refresh, retry, Origin/CSRF, redaksi, dan isolasi sesi |
| [Browser fixture](webapp/office-browser-checks.json) | 36 lulus, 0 gagal; 0 warning/error console | Posisi dan respons sintetis; 5 panggilan fixture, 0 produksi |
| [Review independen](webapp/office-independent-review.json) | 2 temuan diperbaiki, 0 aktif | Review statis kartu fasilitas dan retensi kalender; bukan uji visual |

Pengujian private decoder terdapat dalam `webapp/tests/office-configuration.test.mjs`, termasuk vektor sintetis, UTF-8, padding, batas input dan binding konfigurasi. Laporan backend 11-test memakai helper sintetis untuk memeriksa pemanggilan yang tepat serta kepemilikan referensi, sehingga tidak mengklaim menguji cipher native itu sendiri.

[Runner agregat](rea/verify_office_regressions.mjs) memverifikasi satu hash sumber, stylesheet, dan registry selama eksekusi serta menjaga laporan historis. Enam belas suite lama tetap lulus 680 pemeriksaan. Satu fixture generik sebelumnya masih memilih route kalender yang sekarang mempunyai halaman khusus; kegagalan awal disimpan di [laporan sebelum penyesuaian fixture](webapp/office-regressions-before-fixture-fix.json). Fixture dipindah ke route generik `parcel`/`guestbook` dengan semua assertion retensi query, label, penghilangan field kosong, isolasi antarflow dan logout tetap dipertahankan. Tiga suite lama sekarang menulis laporan tersimpan hanya dengan `--write-report`.

## Browser sintetis

[QA browser pada 19 Oktober 2026, 06:56:32 UTC](webapp/office-browser-checks.json) mencatat 36 pemeriksaan lulus tanpa overflow atau warning/error console. Cakupannya meliputi izin lokasi ditolak dan retry, kegagalan daftar/kalender lalu retry, seluruh 26 baris kantor fixture, pencarian nama/spasi/case, tiga filter AND, indikator fasilitas, pemilihan objek asli, kalender per bulan, serta desktop dan mobile. Nilai koordinat dan seluruh data layanan disediakan fixture; tidak ada pembacaan GPS perangkat nyata. Retensi kalender saat refresh gagal dibuktikan oleh [67 pemeriksaan fungsi aktual](webapp/office-calendar-flow-latest.json), bukan oleh pemeriksaan browser ini.

[Transport fixture](webapp/office-fixture-transport.json) mencatat tepat **5 panggilan sintetis**: 2 pencarian kantor dan 3 kalender, terdiri dari 3 HTTP 200 serta 2 HTTP 503 yang sengaja dipaksakan. Tidak ada request produksi. Fixture telah dihentikan dan tab pengujiannya ditutup. Observasi option disabled memakai properti DOM `HTMLOptionElement.disabled`, karena hasil `isEnabled` dari driver untuk option tidak mewakili keadaan tersebut.

[Screenshot desktop kantor — seluruh posisi dan data pada gambar bersifat sintetis](webapp/screenshots/office-browser-desktop.jpg). Screenshot kalender/versi mobile ditautkan oleh laporan browser yang sama; gambar tersebut bukan bukti kunjungan, GPS nyata, data akun, atau tampilan respons produksi.

## Pembacaan server produksi terbatas

[Pengujian live](webapp/office-live-check.json) pada 06:58:28–06:58:31 UTC memakai sesi lokal anonim yang terisolasi. Dua POST berhasil HTTP 200: `kantornearby/getkantornearby` mengembalikan **485 kantor**, kemudian `KantorNearby/GetCalendar` untuk satu kantor terpilih dan tahun 2026 mengembalikan **124 baris kalender**. Seluruh 124 tanggal dapat dibaca oleh parser browser, dan 20 baris mempunyai tipe String `"2"`. Ini menguji satu pusat pencarian dan satu kalender kantor, bukan setiap kantor, tahun, kombinasi input, atau kondisi akun.

Pusat pencarian contoh berasal dari konstanta kamera awal native, **bukan GPS perangkat pengguna**. Nilai itu tidak diklaim sebagai lokasi perangkat atau bukti kunjungan. Tidak ada mutasi yang diminta; sesi lokal terisolasi ditutup setelah selesai. Laporan tidak menyimpan identifier record atau material kredensial. [Log transport terbatas](webapp/office-live-transport.json) mengonfirmasi tepat dua respons HTTP 200 pada jendela pengujian yang sama, hanya dengan path, hostname, status dan durasi. Dua request produksi ini terpisah dari lima panggilan fixture browser.

## Docker dan preview

[Deployment 06:59:02 UTC](webapp/deployment-latest.json) mencatat container baru `40cf4092f3ba…bb96bad` yang sehat setelah rebuild backend. Tiga hash frontend dan lima hash backend cocok dengan sumber; katalog berisi **171 bentuk request dan 67 adapter aktif**. Container tetap hanya-baca dan port 4173 hanya dipublikasikan pada loopback; alamat pengguna adalah `http://localhost:4173`. Upload geotag tetap nonaktif. Health masih menyatakan `serverValidated: false`, karena dua pembacaan terbatas tidak memvalidasi keseluruhan backend.

[Preview utama 07:00:19 UTC](webapp/office-preview.json) dibuka pada tab baru di `http://localhost:4173/#/office`: **belum login**, tombol lokasi siap, tidak ada overflow atau warning/error runtime, dan script geolocation fixture tidak ada. Agen tidak meminta lokasi perangkat pada preview utama. Rebuild backend mengakhiri sesi sebelumnya; pengamatan login historis tidak membuktikan sesi pada container baru. Tab yang telah terbuka dapat masih menampilkan keadaan login lama sampai dimuat ulang.

## Batas yang masih berlaku

Peta hybrid, marker/InfoWindow dan kontrol kamera Google Maps native belum tersedia di browser. Tindakan izin lokasi eksplisit berbeda dari lifecycle otomatis Android. Parser tanggal canonical, penolakan ID kosong, batas input Base64, pengurutan stabil untuk tanggal sama dan responsif browser adalah pilihan implementasi; kesetaraan penuh Dart Intl, timezone, Unicode dan pixel belum dibuktikan.

Kedua adapter mempunyai maksud pembacaan menurut kode klien; ini tidak membuktikan seluruh efek internal/telemetry server. Tidak ada pengiriman dokumen/geotag, klaim kunjungan fisik, mutasi akun, atau penyelesaian parity seluruh aplikasi. Laporan historis tetap terikat pada source dan sesi saat laporan dibuat.
