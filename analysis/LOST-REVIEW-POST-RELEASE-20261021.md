# Beri Ulasan — release browser

Formulir pada detail Sertipikat Hilang kini mendukung rating1–5, komentar asli (termasuk String kosong setelah diedit), foto galeri satu per pilihan, foto terbaru pertama, hapus foto, dan pengiriman multipart ke endpoint sesi resmi. Penulisan baru aktif setelah autentikasi dan klik Kirim pengguna; agent tidak mengirim ulasan produksi. HTTP200 dengan transform respons yang valid menghasilkan false-success seperti native, menutup modal dan memuat ulang halaman pertama ulasan.

Byte foto tidak dikompresi atau dikonversi. MIME berasal dari996 pasangan ekstensi native. Empat scalar tetap berurutan, termasuk LF komentar yang tidak dinormalisasi oleh FormData biasa. Browser membatasi total permintaan25MiB dan respons20MiB; batas ini bukan klaim aturan server. Nama berkas berkarakter kontrol/backslash ditolak sebagai pembatasan browser. Cancel yang aman, pengunci duplikasi lintas navigasi, pembersihan preview, dan pemulihan formulir dengan pesan hasil belum terkonfirmasi adalah adaptasi browser.

Validasi akhir: **1794/1794 Node**, **1190 pemeriksaan pada23 harness VM lama yang tidak diubah**, dan **17 kelompok browser**. Delapan POST hanya menuju fixture lokal sintetis. Kasus200/201/503/401 terlambat, retry eksplisit, urutan/hash foto, komentar kosong, pending Escape, kembali ke berkas yang sama, dan viewport390px tercakup. Uji galeri cancel native belum terbukti karena API FileChooser tidak menerima pilihan kosong. Percobaan regresi/harness yang gagal tetap disimpan; perbaikan CSS terakhir diuji ulang pada100 sumber runtime dan dibatasi satu aturan display:none serta normalisasi akhir baris.

Image dan container mencocokkan95 berkas; Cloudflare mencocokkan62 berkas publik menggunakan TLS normal. Katalog176 operasi:86 aktif (72 baca,14 tulis); satu-satunya operasi baru adalah review/post. Backend dibuat ulang sekali. Preview asli berada di [halaman akun](https://sentuh.davay.space/#/account) dengan sesi anonim; login pengguna diperlukan untuk uji baca akun. Tidak ada kredensial dibaca atau ulasan asli dikirim.

Bukti native adalah audit statis6.1.5, bukan eksekusi APK. Kesetaraan seluruh aplikasi, transaksi yang masih dilindungi, dan penerimaan produksi belum selesai. Goal keseluruhan tetap aktif.

- [Protokol native](LOST-REVIEW-POST-PROTOCOL.md)
- [Compose dan galeri native](LOST-REVIEW-COMPOSE-UI.md)
- [Ringkasan bukti](webapp/lost-review-post-release-summary.json)
- [Tampilan mobile sintetis](webapp/lost-review-compose-mobile-release.png)
