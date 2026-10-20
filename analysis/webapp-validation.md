# Status terbaru

Pembaruan terbaru: **Kantor Pertanahan dan Kalender Kantor mempunyai halaman khusus** pada sumber `717f612e…bc045d` di [localhost](http://localhost:4173/#/office). [Validasi kantor/kalender](OFFICE-WEBAPP-VALIDATION.md) dan [rekap rilis](webapp/office-verification-summary.json) mencatat 145 tes Node, 747 pemeriksaan fungsi dalam 17 rangkaian, 36 pemeriksaan browser sintetis, serta tiga verifier native yang lulus. Sebanyak 67 pemeriksaan fungsi kantor/kalender termasuk dalam 747; 11 tes backend dan delapan tes konfigurasi termasuk dalam 145. Browser memakai lima panggilan fixture, tanpa GPS perangkat nyata atau request produksi. Secara terpisah, dua POST anonim ke server asli berhasil HTTP 200: daftar 485 kantor dan 124 baris kalender untuk satu kantor/tahun; seluruh tanggal terbaca dan 20 baris bertipe "2". Pusat pencarian contoh berasal dari konstanta kamera native, bukan posisi perangkat atau bukti kunjungan; sesi pengujian terisolasi telah ditutup.

[Deployment terbaru](webapp/deployment-latest.json) pada 19 Oktober 2026, 06:59:02 UTC mencatat container sehat, tiga hash frontend dan lima hash backend yang cocok, serta 171 bentuk request dan 67 adapter aktif. Alamat pengguna adalah `http://localhost:4173`, dengan port tetap terbatas ke loopback. [Tab preview baru](webapp/office-preview.json) pada 07:00:19 UTC belum login, tombol lokasi siap, tanpa overflow atau error runtime; agen tidak meminta GPS perangkat. Rebuild backend mengakhiri sesi lama, sedangkan tab yang sudah terbuka dapat masih menampilkan keadaan login lama sampai dimuat ulang. Peta hybrid/marker/kamera native, kesetaraan parser tanggal dan visual lengkap tetap terbuka; unggah geotag nonaktif. **Seluruh aplikasi belum setara 1:1 dan goal keseluruhan belum selesai.** Bukti Info Layanan, Status Verifikasi, Cari Berkas, Mitra dan bootstrap/profil di bawah tetap historis pada sumber serta sesi masing-masing.

Rincian hasil, sumber bukti dan batas implementasi: [validasi kantor/kalender](OFFICE-WEBAPP-VALIDATION.md), [status kesetaraan](WEBAPP-PARITY-STATUS.md), dan [inventaris terbaru](webapp/coverage-latest.json). Angka tes bukan jumlah fitur selesai; bukti sintetis terpisah dari pengamatan produksi.

Bagian di bawah adalah arsip historis. Seluruh byte mulai judul “Validasi webapp dan Docker” dipertahankan; alamat, jumlah, kondisi login dan keterbatasan yang tertulis di dalamnya berlaku pada pengujian lama.

# Validasi webapp dan Docker — 18 Oktober 2026

Webapp sudah berjalan di Docker Desktop pada **http://127.0.0.1:4173**. Preview Codex dibuka pada halaman akun untuk login pengguna. Container tetap berjalan agar pengguna dapat melanjutkan pengujian. Cloudflare Tunnel belum dibuat atau dijalankan.

## Hasil otomatis

Perintah yang dijalankan dari workspace:

```powershell
.\tools\runtime\node.exe --test webapp/tests/*.test.mjs
```

**40 tes lulus, 0 gagal, 0 dilewati.** Semua pengujian koneksi backend menggunakan transport fixture dalam proses; tidak ada request ke API produksi. Cakupan mencakup login dan rotasi sesi, refresh token, logout termasuk respons login terlambat, Origin/CSRF, cookie bootstrap, host HTTPS eksplisit, redaksi kredensial, registry operasi, serialisasi query/form/multipart, file PNG, serta validasi dan impor koordinat. Pengujian ini membuktikan perilaku adapter lokal, bukan penerimaan oleh server asli.

Review independen tambahan memeriksa empat regresi frontend melalui fungsi aktual: array respons campuran/null, respons execute terlambat setelah logout, respons state terlambat, serta kegagalan login setelah navigasi. Temuan telah diperbaiki. Katalog final memuat **170 bentuk request: 39 adapter operasi, 1 alur login khusus, 130 kontrak yang belum diaktifkan**.

## Pengujian melalui browser

Fixture berjalan terpisah pada port 4174 menggunakan `webapp/tests/browser-fixture.mjs`. Transport upstream diganti sepenuhnya dengan respons dalam proses. Akun, identitas, koordinat dan berkas uji bukan pengajuan sebenarnya. Fixture dan tabnya dihentikan setelah pemeriksaan.

| Pemeriksaan | Hasil |
| --- | --- |
| Halaman awal, login dengan kredensial fixture | Berhasil; sesi aktif ditampilkan |
| Pemeriksaan lokal dari halaman Pengujian | Tiga pemeriksaan lulus; tidak ada request resmi |
| Cari `account_summary`, buka formulir, review, eksekusi | Respons HTTP 200 fixture ditampilkan |
| Respons mengandung teks HTML dan token | HTML tampil sebagai teks; token disembunyikan; tidak ada error konsol |
| Input titik manual dan akurasi | Nilai tersimpan hanya dalam sesi; waktu yang kosong tetap tidak diketahui |
| Impor CSV dengan dua ID sumber yang sama | Dua titik tetap dapat dipilih secara independen |
| Metadata `browser` dari impor | Dilabeli Lokasi browser, bukan hasil ukur/GNSS |
| Pilih titik kedua dan isi geotag | `Lat=0.9876543`, `Longi=2.1234568`, sesuai titik kedua dan urutan sumbu |
| Lampirkan PNG dan review multipart | Lima nilai scalar serta bagian `file` terlihat; metadata GNSS tambahan tidak masuk payload |
| Konfirmasi pengiriman geotag | Hanya fixture menerima; respons envelope ditampilkan sebagai status/message |
| Logout | Form login kembali; hasil, riwayat, dan titik sesi dibersihkan |
| Tampilan ponsel, viewport override 390 × 844 | Menu navigasi dan layout berfungsi; lebar konten sama dengan viewport efektif (375 px), tanpa overflow horizontal |
| Konsol browser pada alur yang diperiksa | Tidak ada error aplikasi |

Override viewport dikembalikan setelah pengujian. Screenshot ponsel tersedia di `webapp/screenshots/mobile-fixture.png` relatif terhadap folder analisis ini.

## Verifikasi deployment sebenarnya

Docker Desktop Linux engine tersedia. Container **`sentuh-tanahku-webapp-1`** berstatus **healthy**, menggunakan image **`sentuh-tanahku-web:local`**, dipublikasikan hanya pada **127.0.0.1:4173**. Proses berjalan sebagai user `node`, filesystem baca-saja, capability Linux dihapus, dan hanya dua file artefak yang di-mount baca-saja. Source frontend dan backend di image dicocokkan dengan hash workspace setelah build terakhir.

`/health` mengembalikan `status:ok`, `upstreamConfigured:true`, `serverValidated:false`. Katalog/diagnostik publik tidak menciptakan cookie baru. Source privat, metadata ekstraksi, `.env`, dan Dockerfile tidak dapat diakses lewat HTTP. Hasil machine-readable tersedia di `environment/docker-deployment-verification.json` pada workspace utama.

Browser kemudian membuka deployment Docker pada port 4173. Pemeriksaan lokal melalui UI kembali lulus, menunjukkan 170 kontrak dan 39 adapter. Tidak ada login atau transaksi ke server ATR/BPN oleh agent. Preview akhir berada di **http://127.0.0.1:4173/#/account**, dengan form kosong dan status siap login. Screenshot: `webapp/screenshots/docker-login.png` relatif terhadap folder analisis ini.

`START-WEBAPP.cmd` sekarang menjalankan launcher Docker; launcher diuji dengan `-NoBrowser` dan berhasil memakai ulang container healthy. Rebuild dilakukan eksplisit menggunakan `-Rebuild`. Panduan deployment dan origin HTTPS untuk domain mendatang tersedia di `DOCKER.md`.

## Yang belum terbukti

Login pengguna sebenarnya, respons data akun, penerimaan koordinat/dokumen, persyaratan checksum/attestation, dan kesetaraan seluruh fungsi aplikasi masih membutuhkan pengujian lanjutan. Operasi yang belum dipahami tidak disamarkan sebagai berhasil. GNSS saat ini mendukung input/file; pembacaan perangkat USB/Bluetooth langsung belum dibuat. Tidak ada tunnel, DNS, atau domain publik yang diubah.
# Pembaruan diagnosis koneksi — 18 Oktober 2026

Setelah laporan pengguna tentang login timeout, probe tanpa kredensial menemukan kegagalan TLS `SELF_SIGNED_CERT_IN_CHAIN`. CA dan identitas klien TLS bawaan APK kini dimuat dari artefak hash-pinned di memori backend, dibatasi pada host produksi, dengan verifikasi TLS dan hostname tetap aktif. Format PKCS12 lama memerlukan opsi runtime legacy provider; koneksi aktual tetap TLS 1.3.

66 tes lokal lulus setelah perubahan, container Docker dibangun ulang dan healthy, dan HEAD tanpa kredensial melalui transport terpasang mendapat HTTP 405 dalam 276 ms. Login akun sebenarnya belum diulang oleh agent. Bukti lengkap dan batas kesimpulan: [APK-TRANSPORT-LOGIN.md](connection-diagnostics/APK-TRANSPORT-LOGIN.md) dan [docker-head-after-fix.json](connection-diagnostics/docker-head-after-fix.json).

