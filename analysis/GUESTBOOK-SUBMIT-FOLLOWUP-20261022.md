# Buku Tamu: penutupan kontrak Simpan untuk implementasi browser

Audit statis tambahan ini memakai **APK resmi 6.1.5 yang sama**. Tidak ada eksekusi APK, request jaringan, QR yang dibaca/dibuat, kamera, submit Buku Tamu, atau nilai kredensial yang dibaca/diturunkan. Runtime aplikasi dan bukti lama tidak diubah.

[Ledger baru](recovered/guestbook-submit-followup-20261022/flow.json) mempunyai SHA-256 **`ea94f17f3d7e6a768f6c44bf40b99045b5f45c7407a8530e7198b81aa3dc4b04`**. [Verifier independen](rea/verify_guestbook_submit_followup_20261022.py) lulus untuk **8.792 instruksi ELF unik**: 1.054 instruksi dalam sepuluh window baru dan 7.738 instruksi dalam 27 window dependency. Ia juga memeriksa 24 binding pool baru, enam blok objek/descriptor publik, tujuh metadata kelas, tiga dispatch, 52 marker, serta 17 hash dependency. ELF tetap `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool tetap `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

Kontrak service, validasi agregat, input mentah dan hasil Simpan sudah cukup positif untuk implementasi browser yang dibatasi secara jujur. **Perilaku formatter ketika mengetik/IME serta seluruh disposal native belum terbukti.** Guard sesi, kepemilikan formulir, pencegahan submit ganda dan penanganan hasil kiriman ambigu harus disebut sebagai adaptasi browser; jangan menyatakan keseluruhan lifecycle native telah direplikasi.

## Input dan tanggal lahir

Kesembilan input memakai **ISb CID6133 → JSb CID5316**. Binding allocator `d73f3c`, factory `a065b0`, init `7ce044`, dan build `9cfa6c` cocok dengan ELF dan tabel dispatch. Konfigurasi caller langsung di form `8b9f14` adalah:

| Input | Objek keyboard Gra | maxLines |
| --- | --- | --- |
| Nama Lengkap | pool `21b58`, index 0 | 1 |
| NIK | pool `225d0`, index 2, signed=false, decimal=false | 1 |
| Nomor Telepon | pool `30c68`, index 3 | 1 |
| Tanggal Lahir | **objek yang sama persis dengan NIK** | 1 |
| Tempat Lahir | index 0 | 1 |
| Alamat Sesuai KTP | index 0 | 1 |
| Alamat Email | pool `32760`, index 5 | 1 |
| Instansi | index 0 | 1 |
| Keperluan | index 0 | **10** |

Index tersebut merupakan konfigurasi keyboard native; pemetaan browser ke `inputmode` numeric/tel/email adalah adaptasi tampilan. **Tanggal Lahir bukan widget kalender dalam form Buku Tamu ini.** Jangan membawa date picker atau format tanggal dari alur Daring lain. Tidak ada parsing tanggal, penambahan `/`, konversi `dd/MM/yyyy`/`yyyy-MM-dd`, atau trim pada builder, callback edit, validator agregat, maupun service Buku Tamu yang lengkap dalam batas audit ini.

`JSb.onChanged` (`9d09d8 → 9d0a24`) menyimpan String yang sama melalui local `setState`/closure `960de4`, lalu memanggil callback **widget saat itu** pada `+23` dengan String yang sama. Callback tanggal `8bb7bc..8bb85c` memeriksa tipe **String?**, mengambil kembali argumen asli, dan memanggil state-copy `754500` untuk model tanggal `mBb+13`. String prefill juga diteruskan mentah; tidak ada dasar untuk memformat ulang prefill atau seluruh nilai sebelum submit.

Shared formatter-builder `9d0748..9d0988` terlebih dahulu menerima daftar formatter eksplisit bila widget `+57` nonnull. Form Buku Tamu tidak memasangnya. Bila keyboard index 2 mempunyai signed=false dan decimal=false, builder menambahkan `Cra.Tvg`. Bukti initializer publik yang sudah dibekukan mengikatnya ke **pattern `[0-9]`, allow=true, replacement kosong**. Setelah itu builder selalu menambahkan **Dra(widget+63)**; semua input Buku Tamu menyimpan integer **99999** di `+63`. Namun dispatch metode formatter dan perilaku truncation/selection/IME belum diikat positif. Ini bukti **konfigurasi**, bukan bukti eksekusi digit stripping atau kesetaraan HTML `maxlength`. Jangan membuat aturan strip, batas 16 digit tepat, kapitalisasi, atau normalisasi tanggal berdasarkan tebakan.

Validator agregat `8badd8` tetap seperti ledger UI lama: semua sembilan nilai nullable String harus nonnull dan **tidak kosong mentah**; NIK kemudian diperiksa panjang `<16`; email nonnull harus mengandung `@`. Nilai spasi tidak di-trim. NIK kosong akhirnya mendapat pesan panjang, dan email kosong akhirnya mendapat `Email Tidak Valid`, karena pemeriksaan berikutnya menimpa pesan awal. Tidak ada validasi format tanggal, digit-only, panjang NIK tepat 16, atau regex email lengkap dalam validator ini. Aturan keyboard/formatter berbeda dari aturan validasi agregat.

## Identitas lookup dan payload

`uid` dan `unid` berasal dari parser QR yang telah diaudit, bukan identitas kantor yang dipilih bebas di browser. GET standalone mengembalikan `kBb` dengan **userId, kantorId, unitKerjaId, namaUnitKerja**, masing-masing String nullable. Sebelum POST, model `kBb` sendiri harus nonnull (`d99b5c`); **masing-masing ID tidak memiliki pemeriksaan wajib nonempty di builder POST**. Missing/null ID tetap menjadi nilai kosong lewat mapper multipart. HTTP200 lookup dengan data null bukan konteks yang boleh diisi identitas buatan. `error:true` pada envelope lookup juga tidak sendirinya menggagalkan parse native; kontrak tuple/model lama tetap berlaku.

POST memakai URL awal **`https://sentuh.atrbpn.go.id/bukutamu`** melalui **standalone `uBb+b`** dan Authorization aplikasi `AtrBpn ` dari konfigurasi opaque. Ia tidak memakai bearer sesi utama/Directus dan tidak memasang interceptor refresh/retry akun. Nilai/initializer kredensial tidak diambil oleh audit ini; izin teknis implementasi harus mempertahankan pemisahan klien tersebut.

Urutan field native yang tetap adalah:

| Urutan | Field | Sumber |
| --- | --- | --- |
| 1 | kantorId | kBb hasil lookup `+b` |
| 2 | unitKerjaId | kBb hasil lookup `+f` |
| 3 | userId | kBb hasil lookup `+7` |
| 4 | nik | mBb `+b` |
| 5 | alamat | mBb `+1b` |
| 6 | namaLengkap | mBb `+7` |
| 7 | tempatLahir | mBb `+17` |
| 8 | tanggalLahir | mBb `+13` |
| 9 | noTelp | mBb `+f` |
| 10 | email | mBb `+1f` |
| 11 | instansi | mBb `+23` |
| 12 | keperluan | mBb `+27` |

Field tetap hadir dalam urutan tersebut. Null menjadi String kosong; `String.toString()` mempertahankan nilai asli. Tidak ada JSON quoting, URL encoding nilai, trim, konversi tanggal, file, koordinat, atau checksum tambahan dalam builder ini. Kebutuhan sembilan input berasal dari validator form, bukan pemeriksaan tambahan pada masing-masing field service. Browser dapat memakai opaque context untuk mengikat hasil lookup server dengan form dan sesi; token opaque tersebut adalah kontrak lokal dan bukan field native tambahan.

## Multipart dan transformasi respons

Komposisi `d99af8 → 707bd4/707ee8 → body processing d0c910 → 6fc248` sekarang ditautkan dengan bukti multipart bersama yang sebelumnya ditutup untuk LOST. Dua belas scalar diterbitkan sesuai urutan sumber; file list kosong. Untuk boundary `B`, setiap part mempunyai bentuk:

```text
--B\r\n
content-disposition: form-data; name="K"\r\n
\r\n
V\r\n
```

Nilai `V` di-UTF8-encode **mentah**, termasuk LF/CR yang ada di nilai. Nama part memakai escaping CRLF/CR/LF menjadi `%0D%0A` dan `"` menjadi `%22`; nama tetap di atas tidak memerlukannya. Tidak ada per-part Content-Type untuk scalar. Penutup sukses adalah `--B--\r\n`. Shared body processor memasang `multipart/form-data; boundary=B` dan menghitung encoded content-length. Boundary/RNG tertentu, byte HTTP engine/TLS, dan corner case malformed UTF-16 tidak diamati. FormData bawaan browser yang menormalisasi line ending nilai tidak otomatis setara dengan encoder ini.

**Service mengabaikan body bisnis, tetapi transport tetap mentransformasikan respons lebih dahulu.** Factory standalone yang sama memasang normal transformer pada client `+13` (`6b8150..6b8160`) dengan threshold 51200. Dispatcher `d05500` menunggu `d056d8` sebelum menghasilkan Response untuk service; catch pada `d0567c` memanggil normalisasi exception `6b93a8` di **`d05688`**. Bukti transformer/codec bersama yang diikat hash menetapkan:

- MIME JSON: body byte kosong mempunyai shortcut null; nonempty whitespace atau JSON malformed gagal parse. UTF-8 JSON memakai decoder fatal; malformed UTF-8 tidak menjadi sukses.
- JSON valid dengan bentuk apa pun—object, array, String, number, boolean, null—dapat mencapai service; tidak ada keharusan envelope tertentu untuk POST ini. `{"error":true}` bukan cabang error bisnis setelah transform berhasil.
- MIME non-JSON: decode teks dengan replacement UTF-8, tanpa menebak JSON berdasarkan isi. Teks mirip JSON yang rusak bukan error JSON native pada jalur itu.

Setelah transform berhasil, `d99df0` hanya membandingkan HTTP200: **200 → error=false**, status lain yang dikembalikan normal → error=true. Service catch juga mengembalikan true (`d99e08..d99e10`). Jadi HTTP200 application/json malformed **bukan keberhasilan native**, walaupun service tidak membaca `Response.data`. Status-only false juga bukan receipt terverifikasi, visitor-card issuance, atau bukti kunjungan fisik.

## Busy, kegagalan, keberhasilan dan kembali

Controller `d999c8` menyalakan busy sebelum validasi. Bila invalid, ia mematikan busy dan kembali false tanpa POST. Bila valid, ia mengambil model terbaru, menunggu service, lalu membalik error bool menjadi hasil controller: service true → busy=false/return false; service false → busy=false/return true. Catch mematikan busy lalu melempar lagi. Tidak ada guard duplicate-submit eksplisit dalam controller lengkap ini. Hilangnya tombol Simpan pada rebuild busy tidak membuktikan seluruh timing tap/framework; single-flight browser harus dinyatakan sebagai adaptasi.

Outer callback `d9992c` hanya menavigasi bila hasil controller **exact true**. Known error=true mempertahankan form/draft; tidak ada toast error, reset input, refresh daftar, penutupan form atau pop parent pada completion failure dalam caller/controller ini. Native success membuka **tBb CID5942** melalui helper `753708`, dengan copy **Terimakasih / Buku Tamu Sudah Terisi / Kembali**. Tidak ditemukan reset draft eksplisit atau pembacaan ulang daftar/Activity pada completion lokal itu. UI browser harus membedakan known received error dari hasil transport yang ambigu setelah handoff; larangan replay otomatis dan notice hasil ambigu adalah adaptasi browser untuk pelaporan yang jujur.

`Kembali` mengikat `728800 → 7257e8`. Window baru helper lengkap mengikat pemilihan navigator sekarang dan panggilan pop `4e5ffc` secara kondisional dengan result null/default options. Ia tidak menyebut menu Home atau destinasi tetap lain. Riwayat stack, observer dan disposal setelah pop belum ditutup; jangan mengklaim nama tujuan yang tidak ada dalam bukti.

Tidak ada pemeriksaan mounted/session epoch/current form pada continuation await dalam caller/controller lengkap yang diaudit. Override disposal `_rBb`/`jBb`, penutupan subject, pembatalan async dan dispose text controller **belum diikat positif**. Ini tidak membuktikan cleanup native tidak ada. Browser perlu guard pemilik form/sesi, clear draft saat keluar, tidak melukis hasil ke form baru, dan tidak mengulang kiriman tak pasti—dengan provenance sebagai adaptasi, bukan kutipan kontrak native.

## Batas kunjungan dan reproduksi

Instruksi resmi menyebut pendaftaran **kedatangan**, lalu verifikasi petugas sebelum kartu pengunjung. Tidak ada GPS/radius dalam payload yang dibatasi ini, tetapi itu bukan izin menciptakan QR, identitas lookup, atau catatan kedatangan jarak jauh yang tidak terjadi. Pertahankan QR kantor yang sah, konteks kunjungan nyata, dan aksi Simpan eksplisit. Audit tidak membuktikan penerimaan server sekarang, autentisitas QR, kepemilikan attendee pada chooser, scanner/camera lifecycle, seluruh formatter/IME, disposal native, atau parity UI/pixel end to end.

```powershell
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/build_guestbook_submit_followup_20261022.py
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_guestbook_submit_followup_20261022.py
```

Builder/verifier menolak penimpaan artefak beku yang berbeda. Hasil verifikasi hanya mencakup window, marker dan dependency yang dinyatakan; tidak menggantikan observasi server atau sertifikasi seluruh fungsi aplikasi.
