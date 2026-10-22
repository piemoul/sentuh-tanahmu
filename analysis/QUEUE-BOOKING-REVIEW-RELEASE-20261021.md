# Pemeriksaan kuota dan tinjauan antrean

Rilis ini menghubungkan tombol Tinjau Antrian ke pemeriksaan kuota Directus yang dipetakan dari APK 6.1.5. Ini belum membuat pemesanan antrean. Entry tetap melalui pilihan kantor, lokasi, tanggal, jumlah berkas dan loket hasil layanan; tidak ada isian NIK, URL atau token notifikasi bebas.

[Bukti wire](QUEUE-BOOKING-WIRE-FOLLOWUP-20261021.md) menutup Map → JSON → UTF-8 pada ELF yang dipin: 8 window/792 instruksi, ditambah satu helper converter tanggal/49 instruksi. Kuota memakai POST `api/booking/limit/` dengan urutan `nik`, `kantorid`, `tanggal_booking`, otorisasi aplikasi Directus dan trailing slash asli. `kantorid` berasal dari ID kantor antrean, bukan ID kantor kalender. Respons memvalidasi Boolean `is_available` serta integer64 `jumlah_antrian` yang kemudian dibuang. Ini bukti statis, bukan rekaman penerimaan server.

Backend menyimpan snapshot ketersediaan dan identitas pemohon sendiri dari account_summary. Browser hanya mengirim opaque context, indeks baris sumber, jumlah berkas 1–5 dan zona waktu IANA. Profil dibaca kembali sebelum kuota; perubahan profil, sesi atau pilihan menggugurkan request/hasil lama. Urutan prasyarat mengikuti kuota → substring lowercase `full` → jam tutup → tinjauan. Waktu sekarang berasal dari server dengan zona browser; waktu DST ambigu/tidak ada ditolak secara eksplisit. Presisi milidetik dan zona IANA adalah adaptasi browser; grammar DateTime native seluruhnya belum diklaim.

Pilihan dikunci selama pemeriksaan dan tinjauan. Batal membuka kembali kontrol tanpa membuat antrean. Identitas berubah pada satu render langsung membuka tombol pemulihan; respons halaman lama tidak memulihkan child atau menghapus akun yang lebih baru. Teks sumber di-escape. HTTP non2xx dengan pesan JSON String, termasuk kosong, mempertahankan pesan dan status upstream tanpa menganggapnya sebagai 401 akun utama. Body error tidak terpetakan/null masih memakai error transport web; teks exception Dio lengkap belum ditiru.

Pembuatan antrean tetap dinonaktifkan: penyedia token notifikasi web resmi belum tersedia. Browser tidak memaksa token null/`-`, tidak memakai ulang key Android dan tidak menyediakan endpoint create. Tombol Ambil Antrian menampilkan alasan ketidaktersediaan. POST tanpa retry/redirect merupakan batas eksplisit web; perilaku redirect native dan idempotency belum tertutup. Realtime, identitas tambahan/OTP, create lengkap dan acceptance transaksi tetap belum selesai.

## Validasi

- [Regresi Node terbaru](webapp/queue-booking-node-retry.json): **2208/2208**, 131 file tes, seluruh source input tetap. Ada 70 tes baru: frontend30, backend30 dan integrasi aplikasi10. [Run pertama](webapp/queue-booking-node-final.json) tetap gagal2205/2207: satu assertion katalog lama masih menganggap quota disabled, dan fungsi tujuan katalog belum menerima profil baru. Tujuan katalog diperbaiki dengan guard ID/path/auth yang tepat dan tes pembatasan tambahan.
- [Migrasi tes katalog](webapp/queue-booking-catalog-test-migration-retry.json):19 file lama,175 helper/tes tetap,50 konteks penggantian persis, assertion1906→1926 dan tidak ada definisi tes dihapus. Preimage dan receipt pertama dipertahankan. Ini pembaruan jumlah/delta katalog serta fixture berstruktur, bukan penghapusan assertion fitur.
- [Browser build final](webapp/queue-booking-browser-summary-retry.json):**12/12** kelompok pemeriksaan,9 POST kuota sintetis dan0 create/provider/server asli. Meliputi tinjauan, batal, kuota penuh, pesan kosong, gangguan layanan, `full`, jam tutup, HTTP401 Directus, stale route, markup literal dan desktop1280×720/mobile390×844 tanpa overflow. Kedua fixture dihentikan dengan listener tertutup/exit0. [Run browser sebelumnya](webapp/queue-booking-browser-summary.json) dipertahankan; perbaikan tujuan katalog kemudian diuji ulang pada byte aplikasi final.

Runtime authored menjadi129 file:6 file lama berubah dan7 modul baru. Katalog tetap176 record,90 aktif (74 baca/16 tulis). Satu-satunya record berubah adalah quota; record create tetap disabled dan175 record lain identik terhadap baseline Rating.

## Delivery dan uji akun

[Image](webapp/queue-booking-image-final.json) lulus124 file dalam container offline/read-only sebelum deployment; proses pelayanan lama belum berubah saat verifikasi image. Image yang sudah diverifikasi kemudian diterapkan dengan mengganti container sekali. [Deployment](webapp/queue-booking-deployment-final.json) lulus124 file container,83 file publik localhost dan83 HTTPS; health kedua origin sesuai. User nonroot,13 bind mount read-only, root filesystem read-only, cap-drop ALL, no-new-privileges dan bind host loopback tetap. Cloudflare tidak dikonfigurasi ulang.

URL: http://localhost:4173/#/account dan https://sentuh.davay.space/#/account. Penggantian backend menghapus sesi di memori. Sebelum deployment pun, preview akun yang disegarkan menampilkan Belum masuk; jawaban login sebelumnya tidak menjadi bukti sesi aktif atau penerimaan Perjalanan Berkas. Uji baca Perjalanan Berkas dengan akun asli tetap pending, tanpa pengiriman dokumen/rating/booking atau request kuota asli pada rilis ini. Langkah akun berikutnya adalah memvalidasi login lalu langsung satu uji baca Berkas sebelum pekerjaan adapter lain/restart berikutnya.

Kesetaraan semua menu/APK belum selesai. Rilis ini tidak mengubah koordinat hasil ukur menjadi bukti kunjungan dan tidak mengaktifkan geotag tanpa kunjungan. Tidak ada commit atau push baru dalam increment ini.

![Tinjauan dengan data sintetis pada build final](webapp/queue-booking-browser-desktop-retry.jpg)
