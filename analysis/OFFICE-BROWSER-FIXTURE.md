# Fixture browser Kantor Pertanahan dan Kalender Kantor

Fixture terpisah ini berada di `webapp/tests/office-browser-fixture.mjs`. Persiapan dan pemeriksaan sintaks sudah selesai; server belum dijalankan saat dokumen ini ditulis. Tidak ada request produksi dari fixture.

Saat diluncurkan, fixture menyalin ulang file publik terbaru ke `analysis/webapp/office-browser-fixture`: index, app.js, styles, import JavaScript publik, dan aset. Modul private, konfigurasi, artefak APK, serta kredensial tidak disalin. app.js tetap sama byte demi byte; `office-fixture-source.json` merekam hash sumber/salinan. Hanya index salinan yang diberi judul/banner **UJI LOKAL** dan script eksternal `data/office-geolocation-fixture.js` sebelum app.js.

Script uji mengembalikan izin lokasi ditolak pada panggilan pertama dan koordinat sintetis `-6.1, 106.8` pada panggilan berikutnya. Banner menampilkan jumlah permintaan lokasi dan statusnya. Script ini hanya berada dalam salinan publik fixture; app.js sumber tidak dimodifikasi untuk pengujian.

Peluncuran yang disiapkan:

```
tools/runtime/node.exe webapp/tests/office-browser-fixture.mjs
```

Alamat default adalah `http://127.0.0.1:4175/#/office`, terpisah dari adapter akun pada localhost. Tidak diperlukan login. Semua upstream diganti transport dalam proses; rute selain dua layanan kantor/kalender ditolak. Key/IV uji bersifat sintetis dan bukan material APK produksi.

Urutan uji yang disiapkan:

1. Buka Kantor Pertanahan. Klik pembacaan lokasi: izin ditolak dan tidak boleh ada request nearby.
2. Ulangi: posisi sintetis tersedia, request nearby pertama menghasilkan HTTP 503. Ulangi pemuatan: respons berisi 26 kantor, termasuk semua kombinasi tiga fasilitas dan satu ID kosong.
3. Periksa pencarian nama, sentinel `CARIHANYAALAMAT` yang hanya ada pada alamat, filter fasilitas dengan logika AND, daftar panjang, panel pilihan, serta tampilan mobile.
4. Buka Kalender Kantor. Request kalender pertama menghasilkan HTTP 503, retry menghasilkan delapan baris: tipe1/2/3, tipe lain, field nullable, tanggal null/tidak valid, teks XSS inert, dan agenda bulan berikutnya. Tanggal bulan sekarang dibuat mulai hari ini; akhir bulan dapat memiliki beberapa agenda pada hari yang sama.
5. Ganti kantor dan bulan. Transport memeriksa bahwa kantorId telah didekripsi dan tahun berupa String tahun sekarang. ID kosong harus ditangani sebelum transport.

`analysis/webapp/office-fixture-transport.json` dibuat ketika server fixture disiapkan/dijalankan dan diperbarui setelah setiap request. Isinya hanya hash sumber, method/path/status, hitungan, serta assertion boolean bernama. Body, key/IV, hasil dekripsi, token, atau kredensial tidak dicatat. Laporan ini tidak sama dengan laporan browser: hasil interaksi dan screenshot perlu dicatat oleh penguji browser terpisah.

Persiapan awal menyalin 58 file publik dan memverifikasi app.js identik. Peluncuran selalu mengulangi penyalinan dan menghasilkan hash baru bila sumber telah berubah. Pemeriksaan sintaks modul fixture dan script geolocation lulus; klaim tersebut bukan hasil pengujian browser. Untuk Desember, agenda bulan berikutnya berada pada tahun berikutnya sementara UI native membatasi navigasi sampai Desember tahun ini.
