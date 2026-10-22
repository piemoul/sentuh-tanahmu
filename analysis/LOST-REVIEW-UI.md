# Ulasan Sertipikat Hilang: UI dan lifecycle native 6.1.5

JTb menampilkan **bintang, komentar, foto, lalu footer literal `id_ID`**. Ia tidak menampilkan nama pengulas atau `createdAt`. Daftar default hanya memakai hasil halaman pertama layanan; tidak ada kontrol pagination atau ekspansi pada renderer yang diperiksa.

Ini audit statis terbatas atas ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`, memakai REA, Blutter tersimpan dan decoding instruksi ARM64. Tidak ada request produksi, akun, eksekusi APK, perubahan GPS atau mutasi runtime. Kontrak layanan/model dimiliki [audit protokol](LOST-REVIEW-PROTOCOL.md); sumber UI dan batas yang digunakan dipatok pada [source-index.json](recovered/lost-review-ui/source-index.json).

## Pemuatan dan daftar

Detail Sertipikat Hilang membuat JTb menggunakan `berkasId` sebagai contentId serta enum `pengumumanSertipikatHilang`. Constructor `91b318` menyiapkan subject dengan list kosong dan langsung memanggil `dacbec` di `91b444`; bukan sesudah menekan ekspansi. Flag default `+13=false` memilih pembacaan `review/all`, halaman `"1"`, ukuran `"10"`. ContentId null mencapai null assertion native. Tidak ada guard authenticated/profile eksplisit pada constructor maupun renderer JTb ini; penerimaan sesi tetap persoalan transport/server.

Dispatch konten custom pada selector `48657` mengikat CID5893/JTb ke `a4cce8`, CID5895/zTb ke `a4c230`, dan CID5896/wTb ke `a4be54`. `a4cce8` berlangganan JTb+1b dan memasang snapshot builder `a4cd60`.

- Snapshot tanpa data menampilkan child pemuatan (`a4cdb8–a4cde8`). Subject constructor sendiri sudah diberi list kosong; ini bukan bukti indikator jaringan khusus sampai request selesai.
- List kosong menuju `a4d63c`: aset **`assets/images/belum_ada_ulasan.png`**, kemudian **Beri Ulasan**.
- Pada flag default false, itemCount adalah panjang list persis, dan callback `a4d7cc` mengambil item berdasarkan indeks, lalu membuat zTb. Urutan sumber dipertahankan; tidak ada sort/dedup di renderer ini.
- Tinggi area gulir dihitung **`min(length * 60, 192)`** (`a4ced0–a4cf1c`). Tidak ditemukan callback halaman berikut, parameter pagination baru, reply, edit, hapus, atau ekspansi pada fungsi lengkap ini. Klaim tersebut terbatas pada JTb default ini, bukan seluruh sistem ulasan.
- **Beri Ulasan** juga dipasang sesudah list nonkosong (`a4d070→a4d144`).

`dacbec` hanya memperbarui subject ketika tuple error tidak true. Kegagalan awal karena itu dapat meninggalkan list kosong; kegagalan pembacaan ulang dapat mempertahankan list lama. Pesan error/retry eksplisit di web adalah adaptasi UX, bukan teks error native yang dipulihkan dari builder ini. Metadata jumlah halaman pada envelope tidak diteruskan ke daftar oleh service yang diaudit.

## Isi setiap ulasan

zTb menyimpan objek zyb asli pada +b. `a4c230–a4c668` membangun empat child dalam urutan berikut:

| Child | Binding positif |
|---|---|
| Lima bintang | zyb.`rating` +b dibaca `a4c2b8`, null-asserted, menjadi double. wTb menerima ukuran20, jumlah5. `a4c060` memilih warna penuh bila `rating > index` untuk indeks0…4. |
| Komentar | zyb.`comment` +f di `a4c364`, null-asserted `a4c374`, diteruskan ke Text di `a4c420`; bukan HTML. |
| Foto | zyb.`reviewPhotos` +17 di `a4c454`, null-asserted. List nonkosong membuat strip tinggi58; item mengikuti urutan sumber. |
| Footer | FutureBuilder dengan nilai literal **`id_ID`**, sebagaimana rantai berikut; bukan tanggal. |

Tidak ada pembacaan field zyb.`createdAt` +13 di seluruh build row tersebut. Model juga tidak mempunyai author, nama atau avatar. Null rating/comment/photos/mediaUrl merupakan assertion native walaupun modelnya nullable; placeholder browser untuk null adalah adaptasi ketahanan.

Bintang memiliki wrapper tap, tetapi callback yang diberikan row pada wTb+23 berasal dari pool40438 dan menunjuk kode **`ca30e8: mov x0,x22; ret`**. Nama pool `Shader::Shader._` merupakan label kode yang dibagi/deduplicated, bukan operasi shader yang dijalankan. Wrapper `a4c18c` menghitung nilai index+1 lalu memanggil fungsi no-op itu. Dengan demikian tap bintang ulasan tersimpan tidak memiliki efek update/submisi pada jalur ini. Jangan menghapus fakta wrapper tap atau menyebutnya callback perubahan rating yang mengirim data.

## Footer async yang tidak biasa

Rantai berikut menutup nilai footer tanpa menebak dari nama helper:

1. `a4c4e4–a4c4f0` memuat literal `id_ID` dan menulis default locale global.
2. `a4c4f8` mengalokasikan **`_Future<String>`** melalui `cb4918`; header allocator mengikat CID7387 dan metadata kelas menamainya `_Future`. State pending diisi `a4c500`, current zone diisi `a4c528`.
3. `a4c538` memanggil `434bc4` dengan future dan literal `id_ID`. String tersebut bukan Future sehingga jalur value menuju `434cb4`.
4. `434cb4` menyimpan future dan nilai ke context, lalu menjadwalkan closure `434dac`. Closure mencapai `434dfc→434e90`; `434ee0–434eec` menyetel value-state8 dan menyimpan **nilai yang sama** pada Future+17.
5. FutureBuilder callback `a4c668` membaca snapshot.data (+f). Jika belum ada, ia menampilkan child kosong; setelah data ada ia menampilkan Text berisi nilai itu, disertai Text kedua yang literal kosong (`a4c7ec`).

Hasil footer normal yang dibuktikan secara statis adalah **`id_ID`**. Tidak ada DateTime.now, pemanggilan formatter `d910bc`, atau pembacaan `createdAt` pada rantai ini. Ini tampak seperti kejanggalan native; audit tidak menggantinya dengan tanggal yang dianggap lebih masuk akal. Render APK langsung tetap belum diamati.

## Foto dan batas navigasi

Callback `a4c8b4` membaca row.reviewPhotos, mengambil indeks yang diminta, membaca **Ayb.`mediaUrl` +b** pada `a4c98c`, lalu null-asserts dan meneruskannya **tanpa transformasi** ke constructor Image.network `9778ac`. Width dan height masing-masing48 (`a4c9a8–a4c9d4`). Child image dibungkus dekorasi/padding; fungsi lengkap ini tidak memasang callback tap, galeri, browser luar atau viewer foto.

Tidak ada bukti untuk memakai mediaId sebagai URL atau meneruskan bearer/PFX ke URL foto. Pembatasan origin/CSP dan placeholder foto yang ditolak di web adalah adaptasi browser yang harus disebutkan tersendiri; audit ini tidak menguji keberhasilan gambar dari server.

## Compose dan refresh

**Beri Ulasan** mengarah `a4d218→6bd5d0` (wrapper aktivitas), kemudian callback `a4d294→a4d2e4` membuka modal. Builder `a4d404` membuat GTb (CID6123) dengan callback `deabc4`; GTb menuju state HTb. Build HTb `9dddc4` menunjukkan **Berikan ulasan**, lima bintang yang dapat dipilih, input **Kritik dan saran**, strip media, dan **Kirim**. Pengiriman `9de670` mengambil rating sebagai int, teks dan daftar media untuk callback. Ini adalah compose ulasan baru; tidak ada reviewId/reply-parent yang diikat pada entry JTb ini.

Callback `deabc4` pada Blutter tersimpan membedakan hasil boolean: hasil selain true menjadwalkan `a4d5f8→dacbec` untuk membaca ulang halaman pertama dan menutup modal; true menampilkan **`Error while post review!`**. Makna boolean transport dan payload lengkap tetap milik audit protokol. Audit UI ini tidak menutup semua validasi form, inisialisasi/picker media, izin platform, seluruh lifecycle submit atau penerimaan server. Tidak ada write yang diaktifkan/dijalankan olehnya. Tombol compose yang belum aktif pada browser harus dinyatakan belum tersedia, bukan dianggap sudah setara native.

## Koreksi dan batas bukti

Dua ekstraksi awal berlabel `review-widget-build` dan `review-row-build` memakai selector state52114 dan menghasilkan kelas lain. File serta export awal dipertahankan, tetapi **tidak dipakai sebagai bukti ulasan**. Dispatch konten48657 dan allocator zTb yang benar menutup binding di atas. Ekstraksi base sK `shared-reactive-widget-build` juga tidak diperlukan dan dikecualikan. Ini dicatat dalam source index, bukan menimpa hasil eksplorasi lama.

Sumber yang dipakai berupa rentang terbatas dengan hash; beberapa mempunyai tail berdekatan yang secara eksplisit tidak menjadi dasar klaim. Tidak ada whole-pool export baru atau verifier berulang. UI browser, CSP, kegagalan akun, foto aktual, layout pixel dan perilaku APK runtime memerlukan pengujian tersendiri. Tidak ada implikasi terhadap lokasi fisik, geotag atau validasi kehadiran.
