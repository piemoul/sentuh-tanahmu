# Ulasan Sertipikat Hilang — composer dan pemilih foto 6.1.5

Audit statis terbatas pada XAPK resmi yang sudah tersedia. ELF `libapp.so` SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; DEX Android SHA256 `08f4834b02647e860d50e8153a5cdb2bcb62a58bc27e81c1a89e65b2c4a0bc7d`. Tidak menjalankan APK, emulator, layanan produksi, login, GPS, atau pengiriman ulasan. Tidak mengubah runtime webapp, katalog, maupun bukti sebelumnya.

Hasil yang dapat diimplementasikan: bintang awal 0; tombol Kirim aktif ketika rating bukan 0 dan komentar sudah bukan null; foto opsional, dipilih satu per satu dari galeri dan dimasukkan paling depan; byte foto dipertahankan tanpa konversi JPEG. Batas jumlah/ukuran, validasi isi server, serta perilaku tutup modal saat request masih berjalan bukan kontrak server yang dibuktikan audit ini.

## Masuk dan keadaan awal

JTb menampilkan **Beri Ulasan** melalui `a4d144`. Aksi `a4d218 → a4d294 → a4d2e4` membuka modal; builder `a4d404` membuat GTb CID6123 dan memasang callback `deabc4` pada widget+b (`a4d4bc–a4d4dc`). Binding ini dipertahankan dalam `analysis/recovered/lost-review-ui/review-stream-and-actions.asm.txt`.

GTb `createState` selector49635, index59854, menunjuk `a069bc`. Ia mengalokasikan HTb CID5306 lalu memanggil constructor `a06a04`. Constructor menyimpan double0 di +13, false di +23, list dinamis kosong di +1f, dan objek pemilih foto di +27. Komentar +1b tetap null. HTb `initState` selector52643, index62045, menunjuk `7d1494`; ia memanggil initializer izin `d721f8`, kemudian menambahkan satu widget **tambah foto** hasil `7d1568` sebagai elemen terakhir list. Ini bukan foto yang diunggah.

Initializer izin `d72244` memeriksa izin yang ditunjuk pool21760 melalui `d19f54`. Hasil bukan true menampilkan pesan **Permission storage required** ketika context masih tersedia. Nama dan seluruh semantik izin Android modern tidak disimpulkan hanya dari pesan ini. Inisialisasi tidak menunggu hasil tersebut sebelum menambahkan tombol foto.

## Formulir, bintang, komentar, dan syarat Kirim

Build HTb `9dddc4` adalah selector state52114, index61516. Seluruh build dan sebagian besar callback sudah tersimpan dalam `analysis/recovered/lost-review-ui/range-009dddc4.asm.txt`; audit ini menambahkan ekor callback rating yang dahulu terpotong.

| Kontrol | Binding positif |
| --- | --- |
| Judul | `9ddfac`: **Berikan ulasan** |
| Rating | `9de004–9de044`: double state+13, wTb, 5 bintang, ukuran48, callback9dec78 |
| Pilihan bintang | wTb `a4c18c` memberikan double(index+1), sehingga tindakan UI menghasilkan bilangan bulat1–5; warna memakai rating>index |
| Perubahan rating | `9dec78 → 8b96e4`; `8b970c` menyimpan double pilihan ke state+13 |
| Komentar | placeholder **Kritik dan saran** di9de274; callback9debf4→8b9610; `8b9634` menyimpan String asli ke state+1b |
| Kirim | `9de49c–9de4d4`: callback9de670 hanya dipasang ketika rating !=0 **dan** komentar !=null; lainnya callback null |

Tidak ada trim, pemeriksaan String kosong, minimum panjang, atau syarat foto dalam gate Kirim. Karena komentar awal null, kolom yang belum berubah membuat tombol nonaktif. Setelah event perubahan terjadi, String kosong maupun spasi menjadi nilai nonnull dan lolos gate ini. Ini berbeda dari klaim bahwa server menerima komentar kosong; server belum diuji. Tidak ditemukan batas panjang komentar eksplisit pada kode formulir yang ditelusuri.

## Pilihan foto, urutan, penghapusan

Widget tambah berukuran48×48 pada `7d1568`, memasang tap `7d1710 → d720f0`. Pemilih dipanggil `7d1758` dengan enum Xhb.gallery, index1, dari pool3ca08. Parameter preferred-camera rear terdapat pada wrapper generik, tetapi **composer ini meminta gallery**, tidak menawarkan tombol kamera atau dialog pilihan sumber.

`d720f0` menunggu satu hasil pilihan, mengambil path melalui result+7→File+7, lalu memanggil `4758f4(list, 0, path)` pada `d72180–d72188`. Helper4758f4 menambah panjang, menggeser elemen, dan menulis elemen pada indeks yang diberikan: setiap pilihan baru ada di indeks0; widget tambah tetap paling akhir. Contoh pilihan A lalu B menghasilkan `[B,A,tambah]`. Tidak ada deduplikasi, ganti foto di tempat, drag, atau kontrol reorder di builder ini.

Builder `9de7b4` membedakan elemen widget tambah melalui runtimeType Vua; itu sebabnya pemanggilan `dee0bc` di9de844 **bukan** layanan pemilih foto. Elemen path String dibuat sebagai File dan dirender Image.file48×48 (`9dea04–9dea74`). Tap callback9deb54 memanggil506aac pada indeks foto lalu setState; helper506aac menggeser elemen berikut ke kiri dan memotong panjang. Urutan foto lain dipertahankan. Tidak ada konfirmasi hapus atau penghapusan byte file cache dalam callback ini.

Gate tombol, init, picker callback, list builder, penghapusan, dan submit tidak memeriksa jumlah maupun ukuran byte foto. Tidak boleh meminjam aturan **Maksimal 5 foto** milik alur Swaplotting untuk composer ini. Batas browser/transport dapat ditambahkan secara terbuka sebagai adaptasi operasional; audit ini tidak menyatakannya batas native/server.

## Adapter Android dan byte berkas

Dispatch picker Hhb selector0x609 memetakan CID4276/Ghb ke `e0d508` dan CID4275/Thb ke `e0da2c`; cabang Android yang diaudit adalah Ghb. `e0d508 → e0d5d0 → e0d6b8` mengirim pesan Pigeon **dev.flutter.pigeon.image_picker_android.ImagePickerApi.pickImages**. Source gallery dipetakan melalui b65ecc. Options mempunyai maxWidth=null, maxHeight=null, quality100; kedua Boolean pemilihan pada e0d634–e0d63c false. Ini memilih satu gambar per tap, tanpa resize yang diminta composer.

`android-picker-methods.json` mempertahankan sembilan metode DEX terpilih; `android-picker-helpers.json` mempertahankan lima helper. Offset DEX adalah offset byte file, bukan alamat ELF. Parser hanya mendekode batas instruksi, register, literal, field, panggilan, dan branch mentah; bukan keluaran decompiler tingkat tinggi.

Pada handler `Li7/m.f`, cabang gallery satu gambar memakai Android image picker atau fallback GET_CONTENT berjenis **image/*** (`0x366a02–0x366a12`). Cabang multi dan media umum yang berbagi metode tidak dijadikan bukti fitur composer. Hasil image ditangani `Li7/a.run` (`0x364b08–0x364b42`), URI dibaca melalui `Li7/e.e` dan file utility `Lc2/e.m`, lalu `Li7/e.g` memanggil resizer `La7/d0.t` dengan field maxWidth/maxHeight/quality milik options.

Resizer t pada `0x22e4ce–0x22e4de` menguji dua dimensi null dan quality>=100, lalu langsung menuju return-path `0x22e6d0`. Dengan parameter composer ini, byte hasil salinan galeri tidak di-rescale, tidak di-encode ulang, tidak diubah menjadi JPEG, dan tidak melewati cabang penyalinan EXIF. Gambar yang tidak dapat didekode bounds juga kembali sebagai path asli; keberhasilan thumbnail dan penerimaan server tetap bukan hasil audit runtime.

File utility `Lc2/e.m` menyalin stream URI ke berkas cache dengan buffer4096 sampai EOF (`0x292528–0x29256a`), tanpa batas byte terakumulasi. Ia membuat subdirektori cache UUID (`0x2923d2–0x2923fa`), **bukan selalu mengganti basename dengan UUID**. Nama tampilan diperoleh dari `_display_name`; helpero mengambil segmen terakhir pemisah `/`, mengganti `..` dan `/` dengan `_`. Helperh mengambil ekstensi melalui ContentResolver MIME untuk content URI atau ekstensi URL untuk URI berkas.

Jika ekstensi diketahui dan nama tersedia, ekstensi lama pada titik terakhir diganti ekstensi tersebut (`0x2924ca–0x292504`). Jika ekstensi tidak diketahui, nama tampilan dipertahankan. Jika nama tidak tersedia, fallback adalah `image_picker` ditambah ekstensi yang ditemukan; tanpa ekstensi memakai `.jpg` (`0x29248a–0x2924c6`). Ini fallback **nama**, bukan bukti konversi isi menjadi JPEG. Helpern memeriksa awalan canonical path terhadap direktori cache dan melempar bila tidak cocok. MIME map milik sistem Android bukan allowlist ekstensi tetap yang dapat disalin ke browser secara persis.

Layanan review/post memakai basename dari path akhir ini dan MIME berdasarkan ekstensi; audit wire/lP dan sumber writer dipertahankan dalam `analysis/LOST-REVIEW-PROTOCOL.md` dan supplement protokol tersendiri. Jangan mengklaim browser File.name sama dengan `_display_name`/MIME map Android untuk semua provider. Preservasi byte dan nama browser yang aman adalah adaptasi yang harus dinyatakan.

## Pending, cancel, hasil, dan kepemilikan

Submit9de670 menjalankan setState dengan74b434 yang menyimpan busy=true di state+23. Build9dde04–9dde40 kemudian mengganti seluruh formulir dengan child loading. Callback tidak melakukan pengecekan busy ulang yang atomik terhadap pemanggilan ganda; hilangnya formulir mencegah interaksi UI normal sesudah rebuild, bukan jaminan idempotensi server.

Submit menghitung list.length-1 lalu memanggil4f86d0 untuk memotong list ke panjang itu, sehingga elemen tambah terakhir dibuang. Jika belum ada foto, list menjadi kosong dan tetap dikirim ke callback. Rating double ditrunkasi menjadi int di9de72c; komentar dan list diteruskan tanpa transformasi. Panggilan callback pada9de76c bersifat sinkron dan tidak di-await oleh HTb.

Callback parent `deabc4` (retained `1051027_Oho.dart`) menunggu writerdead38. Nilai hasil true adalah jalur gagal: hanya pesan **Error while post review!** lalu return. Ia tidak memiliki referensi stateHTb, tidak memulihkan busy, tidak menutup modal, dan tidak memulai reread. Jalur selain true menjadwalkan a4d5f8→dacbec untuk memuat ulang ulasan, kemudian navigator pop. Tidak ada toast sukses atau review optimistic yang dibuktikan di callback ini.

Cancel galeri menghasilkan null: native Android menyelesaikan list kosong, Dart single-image wrapper mengembalikan null; d720f0 mengandung null assertion pada d72164→d721b8 sebelum insert. Dengan demikian cancel tidak menambah foto; kode composer yang dibatasi ini tidak memiliki pemulihan cancel yang disengaja dan dapat melempar. Tidak ada tombol **Batal** khusus dalam GTb build. Browser sebaiknya membatalkan pilihan dengan aman tanpa menyalin exception ini.

Modal dibuka melalui74719c, dengan tiga parameter bernama obfuscated Fud/Qud/RRg dan default Boolean lain; wrapper membuat route VY CID2608. Audit ini mempertahankan argumen dan assignment route, tetapi **belum mengikat selector route ke arti barrier-dismiss/back/drag**. Tidak ada cabang pending di caller yang mengubah parameter route setelah submit. Karena itu apakah barrier/back tetap menutup modal saat pending belum dibuktikan. Tidak ada klaim native membatalkan HTTP ketika modal ditutup, atau native mempunyai epoch session/detail seperti controller browser.

Browser perlu menyatakan adaptasi untuk cancel aman, single-flight submit, pemulihan error tanpa kehilangan draft, cleanup URL preview dan byte, batas transport, serta penjagaan owner/session saat pending/route ditutup. Ini tidak mengubah endpoint, tidak membuktikan server mengizinkan semua input, dan tidak memberi kemampuan geotag/GPS atau kunjungan jarak jauh.

## Bukti dan batas

Index `analysis/recovered/lost-review-compose-ui/source-index.json` memuat SHA256 sumber, dispatch positif, rentang yang dipakai, dan rentang eksplorasi yang dikecualikan. Source index, dokumen read-only lama, serta protokol lama tidak ditimpa. Dua kegagalan extractor saat menyiapkan DEX (dependensi lxml saat import modul audit penuh; satu nama metode codec yang keliru) tidak menghasilkan bukti DEX; extractor akhir memakai AST class Dex yang sama tanpa mengimpor audit lain. Tidak memasang dependensi atau menjalankan aplikasi.

Batas substantif tersisa: semantik lengkap barrier/back/drag dan cleanup native; inisialisasi runtime platform yang dipilih; perbedaan MIME map Android/provider; hasil server atas isi, jumlah, ukuran, atau retry; Android lifecycle saat process death; serta pengujian UI/perangkat dan produksi. Temuan negatif di atas dibatasi pada fungsi yang disebut, bukan bukti bahwa semua kode server atau library tidak mempunyai batas lain.
