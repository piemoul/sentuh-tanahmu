# Sertipikat Hilang — 21 Oktober 2026

Menu **Sertipikat Hilang** kini mempunyai pemilih kantor, daftar pengumuman, pencarian lokal, detail terpilih dan pembacaan lokasi peta. Form teknis ID kantor pada alur utama diganti dengan pilihan dari layanan. Perubahan mengikuti [audit APK 6.1.5](LOST-CERTIFICATE-FLOW.md); ini rilis alur baca, belum pernyataan kesetaraan seluruh aplikasi.

## Alur yang diterapkan

- Kantor dibaca melalui `legacy/Kantah` dengan `nama=""` dan `tipeKantor=""`. Pilihan awal memakai kecocokan pertama terhadap `account_summary.data.kantorId`, atau kantor pertama dalam urutan respons. Browser menunggu daftar/pilihan kantor sebelum meminta pengumuman; urutan serial ini merupakan adaptasi atas initializer native yang memulai dua loader bersamaan.
- Feed menerima **HTTP200** dengan `data` berupa List bertipe: 12 String nullable dan `luas` integer nullable. `error`/`message` yang tidak dikonsumsi native tidak menggantikan model atau menjadi daftar cadangan. Katalog tetap **176 operasi / 84 enabled**; enabled bukan bukti penerimaan server.
- Pencarian lowercase tanpa trim memeriksa `nomorBerkas`, `pemohon`, lalu `wilayah`. Null mengikuti representasi pencarian `"null"`. Duplikat dan urutan sumber dipertahankan; pilihan hasil tetap menunjuk indeks sumber yang benar.
- Empat blok kartu mengikuti native. Detail menampilkan sepuluh fakta berurutan: Nomor, Tanggal mulai, Tanggal selesai, NIB, Nama Desa, Luas, Pemohon, Nomor Berkas, Tanggal berkas dan Tipe. Tidak ada PDF yang diada-adakan; widget native terkait adalah ulasan.
- **Lokasi Peta Bidang** memerlukan sesi akun dan tindakan eksplisit. `persilId` pengumuman membaca metadata `LokasiBidang/GetByPersilId`; **persilId hasil metadata**, tanpa substitusi ID lain, menjadi input pembacaan batas bidang bersama. Peta menggunakan raster OSM dan overlay Bhumi yang sudah tersedia. Metadata tidak dijadikan koordinat atau poligon buatan. Pergantian kantor/detail/sesi menolak hasil lama; kehilangan autentikasi juga melepaskan kunci permintaan peta agar retry dapat dilakukan.

Tanggal memakai formatter Dart/intl yang sudah dikirim bersama aplikasi, dengan keluaran Indonesia `dd MMMM yyyy`; tidak memakai tebakan `Date.parse` atau menggeser zona waktu. Null yang pada native mempunyai assertion ditampilkan sebagai `-` sebagai guard browser. [Sebelas kasus referensi Dart 3.12.2](webapp/lost-certificate-json-number-reference.json) mendukung klasifikasi integer/double yang diuji; ini bukan eksekusi APK. Integer luas di luar presisi aman JavaScript dikirim sebagai String desimal exact, bukan angka yang dibulatkan. Adaptasi tipe browser tersebut tetap dibedakan dari model int native.

## Pengujian dan delivery

| Bukti | Hasil |
|---|---|
| [Seluruh Node](webapp/swaplotting-node-tests-lost-certificate-final.json) | **1.741/1.741**, 96 file; exit0, tanpa perubahan input |
| [Regresi VM](webapp/lost-certificate-regressions-final-final.json) | **1.190 pemeriksaan**, 23 suite; tanpa suite gagal atau perubahan input |
| [Browser aplikasi utuh](webapp/lost-certificate-browser-summary.json) | **17/17 grup**, desktop1280×720 dan viewport langsung390×844 |
| [Image mandiri](webapp/lost-certificate-image.json) | **86/86 hash**, tanpa mount atau jaringan |
| [Deployment lokal](webapp/lost-certificate-deployment.json) | **55 frontend +31 backend** cocok; health sehat, readonly, port4173 pada loopback |
| [Aset HTTPS publik](webapp/lost-certificate-public.json) | **55/55 cocok**, nol gagal/perubahan input; TLS normal, tanpa autentikasi |
| [Browser HTTPS dengan server resmi](webapp/lost-certificate-public-browser.json) | Anonim: **487 kantor,7 pengumuman**, pencarian/detail benar, nol entri console |

Browser memakai API dan PNG lokal sintetis: 15 panggilan bisnis, termasuk satu503 feed dan satu401 lokasi yang sengaja dipaksakan untuk menguji retry/pembersihan sesi. Sebanyak39 permintaan raster lokal tidak menghubungi provider OSM/Bhumi. Fixture mempertahankan perbedaan ID awal/hasil metadata, 35 record, konten di-escape, sepuluh fakta, pin dan ketiadaan vektor bidang browser. Dua sumber fixture mempunyai transformasi eksplisit yang dicatat receipt. Ini bukan penerimaan BPN/provider, uji HP/GNSS, atau persamaan piksel APK. Fixture selesai normal dan port4212 ditutup.

Backend baru direcreate pada **2026-10-21T05:16:51.349948029Z** agar adapter dan decoder baru berasal dari image aktif. Tidak ada klaim sesi lama bertahan; pengujian akun setelah deployment memerlukan sesi baru. [Preview publik](https://sentuh.davay.space/#/lost) sudah diperiksa pada build ini: satu pilihan kantor memuat tujuh pengumuman nyata, filter substring menghasilkan satu kartu, pencarian tanpa hasil tampil benar, dan penghapusan kueri mengembalikan tujuh kartu. Detail mempunyai sepuluh fakta dan tiga fakta tanggal terformat; peta akun tetap disabled saat anonim, ulasan belum tersedia. Tidak ada overflow horizontal atau entri console yang diamati.

Smoke publik tersebut tidak membaca metadata/batas bidang akun atau mengirim write; jumlah request pada receipt berasal dari aksi dan implementasi, bukan packet capture. [Screenshot publik](webapp/lost-certificate-public-browser.jpg) memakai pencarian yang sengaja tidak cocok agar tidak menyimpan isi record pribadi, lalu kueri dibersihkan. Bukti ini menerima satu alur baca pengumuman pada server resmi, bukan seluruh kantor/record atau fitur akun.

## Bukti akun dan pekerjaan tersisa

[Uji akun sebelum deployment](webapp/live-account-reads-before-lost-release.json) memakai frontend sebelumnya: log sesi menunjukkan **14 berhasil /1 gagal**, dengan pembacaan sertipikat analog, status verifikasi, Aktivitas dan Koleksi. Ini bukan uji penerimaan fitur Sertipikat Hilang yang baru. [Log tambahan Berkas](webapp/live-account-berkas-log-observation.json) mencatat SOP gagal pada tahap TCP dengan **ECONNREFUSED**, sedangkan CariBerkas dan status cetak mendapat HTTP200; agregat log dapat mencakup aktivitas pengguna bersamaan. Peta sertipikat memuat13 dari14 tile pada observasi tersebut, sehingga penerimaan raster belum menyeluruh. Daftar kosong dan hitungan selector DOM tidak membuktikan seluruh kasus detail terisi.

Pembacaan/posting ulasan, final booking, seluruh peran/menu/error branch, pembanding APK pascalogin, dan end to end native masih belum selesai. Upload geotag serta write terlindungi tetap nonaktif. Koordinat berkas tidak dijadikan bukti kunjungan fisik; tidak ada GPS, OTP, upload, booking atau mutasi akun produksi pada rilis alur baca ini. **Tujuan keseluruhan belum tercapai.**
