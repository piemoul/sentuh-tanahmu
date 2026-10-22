# Swaplotting — validasi kemajuan webapp

Menu pribadi Swaplotting kini memiliki peta titik interaktif dan dua formulir lokal, untuk tanah bersertipikat dan belum bersertipikat. Referensi kantor/desa dan disclaimer menggunakan tiga operasi GET yang sudah tersedia. Data kontak berasal dari proyeksi profil akun sendiri yang terikat sesi. Ini kemajuan implementasi yang terukur; kesetaraan seluruh fungsi aplikasi resmi belum selesai.

## Bukti pengujian

Suite Node pada sumber saat ini lulus **1.493 dari 1.493 tes**. Regresi VM lulus **1.190 pemeriksaan dalam 23 suite**. Pengujian browser desktop mencatat **29 pemeriksaan berhasil**, dengan sumber aplikasi dan tangkapan asli terikat hash.

Pengujian terfokus juga lulus: 36 pemeriksaan frontend baru, 27 regresi peta bersama, dan 141 pemeriksaan backend yang mencakup 20 kasus baru. Review independen lulus 15 pemeriksaan integrasi frontend, 13 pemeriksaan sumber kontak, serta enam pemeriksaan writer deployment. Angka terfokus dan regresi beririsan dengan suite penuh; angka tersebut tidak dijumlahkan menjadi total baru.

Percobaan Node pertama, 1.492 dari 1.493, tetap disimpan. Kegagalannya berasal dari regex urutan sumber pada tes Buku Tamu setelah route Swaplotting menjadi khusus. Tes pengganti menjalankan flowPage yang sebenarnya, dan berkas tes asli dipertahankan. Satu fixture query generik juga berpindah ke route lost melalui tiga literal fixture; seluruh 103 assertion aslinya tetap ada.

Percobaan browser awal mencatat tujuh pemeriksaan berhasil dan satu kegagalan: pesan validasi untuk foto dan pilihan belum dilukis ulang bersama input teks. Bukti awal dan JPEG-nya dipertahankan. Host diperbaiki untuk memperbarui seluruh node error dan ARIA. Review tambahan kemudian menemukan atribut aria-invalid pada pilihan yang belum dibersihkan setelah nilai sah dipilih. Bukti 13 pemeriksaan berhasil dan satu kegagalan dipertahankan. Setelah perbaikan atribut itu, suite, review frontend dengan 15 pemeriksaan, dan browser dijalankan kembali pada sumber terbaru. Receipt browser sebelumnya dengan 27 pemeriksaan berhasil tetap menjadi riwayat dengan cakupannya sendiri.

## Perilaku yang tersedia

Peta memakai viewport awal native, termasuk zoom pecahan, lalu memilih titik dari pusat kamera peta yang digeser pengguna. Peta dasar OpenStreetMap digabungkan dengan jalur raster Bhumi yang aman. Pemilihan pusat peta bukan hasil GNSS, hasil pengukuran, bukti kunjungan, atau bukti kepemilikan. Tidak ada permintaan GPS otomatis atau poligon buatan.

Disclaimer dibaca sebagai empat String nullable langsung dari hasil server. Pesan utama yang tidak kosong menampilkan Setuju dan Tidak Setuju; pengguna harus benar-benar memilih untuk melanjutkan. Hasil sah dengan pesan utama null atau kosong melewati panel tanpa membuat catatan persetujuan palsu. Kegagalan baca menahan formulir dan menyediakan retry sebagai adaptasi browser. Persetujuan lokal ini tidak diklaim sebagai penerimaan hukum atau transaksi server.

Terpisah dari fixture browser, satu pembacaan Map/GetDisclaimer dilakukan melalui API yang sudah dideploy, memakai otorisasi aplikasi dan sesi lokal anonim baru. HTTP lokal dan upstream sama-sama 200, dengan empat String nullable yang bertipe benar serta pesan utama tidak kosong. Bukti hanya menyimpan panjang field dan hash model, tanpa menyalin isi hukum. Pembacaan ini tidak memakai login atau token akun, tidak menerima persyaratan, dan tidak mengirim identitas, OTP, koordinat atau mutasi. Referensi kantor/desa dan profil berisi data provider aktual tetap belum diuji.

Pilihan jenis hak, alas hak, bukti pajak, serta validasi sembilan dan empat belas kondisi mengikuti bukti native yang dibekukan. Kantor memakai filter nama dan tipeKantor kosong. Desa memakai WilayahId yang dikembalikan server, bukan Kode; nilai ID asli tidak dipangkas atau diganti. Input teks tetap mentah. Pembaruan referensi mempertahankan node input, caret, dan draf, sedangkan hasil lama dari route atau sesi berbeda diabaikan.

Sumber kontak hanya cached account_summary tepercaya dari sesi saat ini: userLevel harus integer 2 atau 3 dan isIkd harus exact false. nama, nomorHp, dan email dipetakan ke tiga kontak; null menjadi String kosong. Ini proyeksi pengguna sendiri, bukan model lCb lengkap dengan delapan field. NIK, tanggal lahir, parser tanggal, daftar pengguna terkelola dan impor user_plotting belum diimplementasikan pada alur ini.

Kirim dan pengambilan foto tetap nonaktif. Periksa isian hanya memeriksa draf dalam memori. Tidak ada foto pengganti, OTP, unggah identitas, multipart, pendaftaran pengguna terkelola, kunjungan palsu, atau halaman sukses server yang dibuat.

## Deployment dan preservasi

Image mandiri tanpa jaringan cocok untuk **70 berkas**. Container sehat cocok dengan **40 berkas frontend dan 30 backend**, dan seluruh **40 aset HTTPS** cocok dengan sumber. Katalog tetap **176 operasi: 84 aktif dan 92 nonaktif**. Tidak ada operasi baru yang diaktifkan; satu perubahan descriptor mengizinkan tipeKantor kosong pada GET Kantah yang sudah ada. Sebanyak 175 record operasi lain tetap identik. POST Swaplotting, POST kedatangan Buku Tamu, dan unggah geotag tetap nonaktif.

Baseline 69 berkas runtime mengalami lima perubahan dan mendapat enam berkas runtime baru. Sebanyak 38 artefak native, 442 receipt historis, 11 dokumen, serta korpus awal 170 kontrak tetap identik per byte. Bukti owner baru dibekukan secara terpisah. Backend dibuat ulang untuk decoder baca baru, sehingga sesi akun dalam memori dari container sebelumnya berakhir. Pemeriksaan publik memastikan route dan gate login anonim, bukan sesi akun produksi yang masih aktif.

Browser memakai respons profil, disclaimer, referensi, dan tile Bhumi sintetis. Seluruh 14 panggilan kontrak yang tercatat adalah fixture lokal; tidak ada request BPN produksi, identitas, OTP, plot, geotag, kamera, atau GPS. Browser dapat memuat gambar publik OSM, sehingga tidak ada klaim nol trafik provider gambar. Fixture telah dihentikan dan port loopback telah diperiksa tertutup. Viewport responsif yang diperiksa adalah iframe CSS berukuran 390 × 844 pada browser desktop; ini bukan pengujian Android, mobile user agent, sentuhan, kamera atau GNSS.

Percobaan writer pemeriksa awal sempat membuka probe TCP satu detik ke 129.0.0.1:4202 karena penggantian angka yang terlalu luas. Probe itu timeout tanpa payload aplikasi, kredensial atau request BPN. Writer awal dan receipt koreksi tetap disimpan. Setelah hostname dikembalikan ke 127.0.0.1, pemeriksaan memastikan port fixture tertutup. Karena itu tidak ada klaim bahwa seluruh alat menghasilkan nol trafik jaringan.

Build tersedia di [localhost](http://localhost:4173/#/swaplotting) dan [domain pengujian](https://sentuh.davay.space/#/swaplotting). [Rekap mesin](webapp/swaplotting-runtime-summary.json), [browser](webapp/swaplotting-browser-validation-final.json), [baca disclaimer aktual](webapp/swaplotting-disclaimer-live.json), [review frontend](webapp/swaplotting-frontend-aria-final.json), [review profil](webapp/swaplotting-owner-projection-review-validation.json), dan [cakupan](webapp/function-coverage-swaplotting.json) menyimpan batas serta hash sumbernya.

## Batas yang masih terbuka

Kesetaraan seluruh menu, role dan cabang data/error belum tercapai. Managed-user dan otorisasinya, model lCb lengkap, parser tanggal, formatter angka bersama, capture foto dan keasliannya, serialisasi koordinat unggahan, multipart serta penerimaan server belum diuji menyeluruh. Tidak ada sertifikasi viewport mobile, pembanding APK/emulator pascalogin, kontrak checksum server, bukti kepemilikan atau bukti kehadiran dari pengujian ini. Tidak ada commit atau push GitHub yang dilakukan oleh finalizer ini.
