# Ulasan Sertipikat Hilang — progres 21 Oktober 2026

Webapp kini mempunyai jalur **baca ulasan** pada detail Sertipikat Hilang dan sudah diterapkan di localhost serta domain publik. Pengujian kode, browser sintetis, dan pengiriman berkas lulus. Ini progres fungsional, belum penyelesaian seluruh fungsi APK; ulasan dan foto akun produksi belum diuji.

## Perilaku dan dasar native

Kontrak mengacu pada APK 6.1.5: [protokol](LOST-REVIEW-PROTOCOL.md), [indeks sumber protokol](recovered/lost-review-protocol/source-index.json), [UI/lifecycle](LOST-REVIEW-UI.md), dan [indeks sumber UI](recovered/lost-review-ui/source-index.json). Bukti ini audit statis ELF, bukan eksekusi APK atau penerimaan server produksi.

Detail dengan sesi aktif otomatis membaca `POST review/all`, memakai `berkasId` dari pengumuman terpilih sebagai `contentId` persis, termasuk String kosong/spasi. Form berurutan berisi `reviewType=pengumumanSertipikatHilang`, `contentId`, `pageNumber=1`, `pageSize=10`. Tidak ada penggantian ID, pemangkasan String, formulir ID bebas, atau kontrol halaman berikut yang belum terbukti. Semua baris yang dikembalikan ditampilkan sesuai urutan sumber.

Respons menerima status bersama 200–299, MIME JSON yang sesuai, dan objek hasil transformasi langsung; String JSON tidak dibuka ulang. Decoder mempertahankan tujuh field envelope, lima field ulasan, dan tiga field foto beserta null. Salah tipe menolak seluruh respons; `data` null bukan daftar sukses kosong. Native tidak memakai `error/message/counts` untuk menentukan keberhasilan setelah model valid dan `data!`; karena itu `error:true` dengan daftar bertipe valid tetap dapat menampilkan ulasan. Envelope tetap dipertahankan untuk browser.

Integer mengikuti bukti lexeme JSON dan rentang signed 64-bit; nilai lebar dikirim sebagai String desimal untuk menghindari kehilangan presisi JavaScript. Referensi [11 kasus Dart SDK](webapp/lost-certificate-json-number-reference.json) mendukung batas terpilih, bukan bukti runtime APK. `createdAt` tetap String mentah. Encoder form kini memakai aturan yang diaudit (`*` menjadi `%2A`, `~` tetap), termasuk uji byte payload; normalisasi lone surrogate dan parser MIME Node merupakan adaptasi browser yang dinyatakan dalam audit.

UI mengikuti urutan **lima bintang, komentar, foto 48×48, footer literal `id_ID`**. Footer tersebut memang hasil jalur Future native; tidak diganti tanggal atau nama pengulas. Null memakai placeholder agar browser tetap dapat digunakan. Gate sesi lokal, pesan gagal/retry, dan pembersihan hasil saat gagal merupakan adaptasi UX. Foto hanya diizinkan dari `https://sentuh.atrbpn.go.id` sesuai batas CSP; URL lain mendapat placeholder, tanpa meneruskan bearer/PFX. Keberhasilan foto akun nyata belum dibuktikan. Tombol **Beri Ulasan** masih nonaktif karena alur tulis belum lengkap.

## Cakupan dan validasi

Katalog menjadi **176 operasi: 85 aktif (72 baca, 13 tulis), 91 nonaktif**. Satu-satunya operasi yang baru diaktifkan ialah baca `post-review-all-dace58`; sifat POST tidak menjadikannya operasi tulis. Daftar operasi tulis aktif tetap sama. Pengiriman ulasan/foto, ulasan pengguna terakhir, booking akhir, serta jalur terlindungi lain tidak diaktifkan oleh perubahan ini. [Baseline](webapp/lost-review-baseline.json) mempertahankan sumber dan proses deployment sebelumnya.

| Bukti | Hasil |
|---|---|
| [Node final](webapp/lost-review-node-final.json) | 1.767/1.767 lulus, 98 berkas tes; tidak ada input berubah selama pengujian |
| [VM final](webapp/lost-review-vm-final.json) | 1.190 lulus, 23 suite; tidak ada input berubah selama pengujian |
| [Browser sintetis](webapp/lost-review-browser-summary.json) | 13/13 kelompok pemeriksaan lulus; desktop/mobile, null, retry, 503/401 disengaja, hasil terlambat, dan gate sesi; nol error console tercatat |
| [Image final](webapp/lost-review-image-final.json) | 91/91 hash berkas pengiriman cocok, tanpa jaringan/mount pada probe image |
| [Deployment final](webapp/lost-review-deployment-final.json) | 91/91 cocok; container sehat, readonly, port4173 hanya loopback; backend berasal dari image baru |
| [Publik final](webapp/lost-review-public-final.json) | 59/59 aset cocok melalui HTTPS dengan TLS normal |
| [Browser publik nyata](webapp/lost-review-public-browser.json) | Anonim: 487 kantor, tujuh pengumuman resmi, sepuluh fakta detail, gate ulasan sebelum peta; tanpa request ulasan atau error console |

Browser sintetis memakai 20 request API lokal, termasuk delapan pembacaan ulasan, dua foto lokal, dan 37 ubin raster lokal. Tidak ada request provider/produksi atau penulisan ulasan. Dua koreksi harness dipertahankan: lebar intrinsik PNG222 berbeda dari lebar tampil181, dan locator label kantor diganti ID DOM yang diamati. Hasil gagal awal tidak dihapus. Foto, ubin, dan respons fixture tidak membuktikan penerimaan server, foto produksi, atau kesamaan piksel Android. Ringkasan menyertakan tangkapan desktop/mobile dan bukti listener serta transport fixture sudah berhenti.

[Hasil Node awal](webapp/lost-review-node-initial.json) dan [log awal](webapp/lost-review-node-initial.txt) tetap disimpan: 1.763/1.766 lulus. Dua kegagalan berasal dari runner tanpa `--openssl-legacy-provider`; satu fixture perbandingan katalog Swaplotting hanya mengantisipasi perubahan kantor. Fixture diperbaiki secara sempit untuk mengizinkan tepat perubahan kantor dan baca ulasan sambil mempertahankan pemeriksaan semua operasi lain. Review independen juga menemukan perbedaan encoder form; kode diperbaiki dan satu uji byte ditambahkan. Tes tidak dinolkan atau dihapus untuk menghasilkan status lulus.

[Probe image pertama yang gagal](webapp/lost-review-image.json) juga tetap disimpan: image baseline `ff9275…` tidak lagi dapat diinspeksi setelah retag. [Verifier final tambahan](rea/verify_lost_review_delivery_final.mjs) tidak mengubah hasil itu; ia membaca katalog dari container baseline yang masih berjalan dengan guard ID, image, waktu mulai, readonly, serta hash katalog `88f908…` sebelum/sesudah import. Perbandingan seluruh176 operasi membuktikan tepat satu perubahan operasi baca ulasan. Probe image baru lalu cocok91/91.

Backend dibuat ulang **sekali**, container `fa09f1e62f14…`, image `5aa7e2c776f0…`, mulai **2026-10-21 05:51:12 UTC**. Deployment membuktikan 59 berkas frontend dan 32 backend; inventaris runtime berisi96 berkas. Keberlanjutan sesi tidak diklaim. Smoke publik memakai data resmi anonim; [tangkapan gate](webapp/lost-review-public-browser-gate.jpg) mengecualikan field pribadi pengumuman. Timeout tunggu awal, dukungan metode DOM, dan koreksi koordinat crop dicatat sebagai observasi harness pada receipt publik; crop awal bukan deliverable. Preview baru ditinggalkan di `#/account`, tab akun semula dipertahankan tanpa permintaan login tambahan.

## Batas penyelesaian

Bukti [14 pembacaan akun berhasil dan satu gagal](webapp/live-account-reads-before-lost-release.json), beserta [observasi SOP `ECONNREFUSED`](webapp/live-account-berkas-log-observation.json), berasal dari build sebelumnya. Bukti itu tidak memvalidasi baca ulasan pada build ini. Pemuatan ubin peta pada pengujian lama juga hanya parsial.

Composer/pengiriman ulasan, booking akhir, kesetaraan peta langsung pada detail **Berkas**, seluruh menu dan end-to-end APK/server belum selesai. Ulasan serta foto dengan akun produksi tetap belum divalidasi. Penyelesaian tujuan geotag tidak diklaim; perubahan ini tidak mengubah GPS, validasi kehadiran, atau melakukan submit dokumen. Tidak ada pembacaan/penulisan ulasan produksi atau mutasi akun pada rangkaian pengujian ini.
