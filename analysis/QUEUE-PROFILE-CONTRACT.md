# Parser profil privat untuk pembacaan Antrian

`parseQueueProfileResponse(result)` pada [queue-profile.mjs](../webapp/private/queue-profile.mjs) menerima respons **yang sudah di-decode** oleh main `ApiClient`, berbentuk `{status, data: body}`. Caller harus mengambilnya dengan sesi autentikasi backend yang sama. Parser tidak membuktikan asal data dengan sendirinya; objek kiriman browser, cache frontend, dan model login bukan sumber yang boleh digunakan.

Sumber native digunakan kembali dari [audit lifecycle identitas](QUEUE-IDENTITY-FOLLOWUP.md) beserta [ledger beku](recovered/queue-identity-followup/flow.json): parser `ayb` CID 840 pada `0x755604–0x755f3c`, envelope `0x6bbe60`, dan controller `account_summary` `0xd292dc`. Tidak ada audit ELF penuh baru atau perubahan ledger lama.

Kontrak respons:

- Status berupa integer **200–299**. Caller `account_summary` tidak memiliki pembandingan HTTP200 tambahan; status mengikuti [predicate transport bersama](SEARCHFILE-FLOW.md). Body tetap wajib valid, sehingga HTTP204 tanpa body ditolak.
- `body` dan `body.data` adalah objek map biasa atau berprototipe null; string JSON tidak di-decode lagi. Array, null, dan objek kelas lain ditolak.
- `body.error` harus **false**, sesuai batas sukses main `ApiClient`. Native memeriksa `error:bool?` nonnull, tetapi kedua cabangnya dapat mengembalikan profil bertipe bila tersedia; menolak `error:true` di sini adalah batas backend yang lebih sempit, bukan klaim native selalu melempar error pada flag tersebut.
- `body.message` harus String atau null; field yang tidak ada menjadi null. Isi message tidak dikembalikan maupun disertakan dalam error parser.

Seluruh **18 field yang diparse fungsi `ayb` tersebut** divalidasi sebelum hasil diproyeksikan:

| Tipe nullable | Field |
|---|---|
| String — 14 field | `userId`, `username`, `email`, `roleName`, `roleUser`, `nama`, `nomorIdentitas`, `tempatLahir`, `tanggalLahir`, `nomorHp`, `namaKantor`, `alamatKantor`, `kantorId`, `linkedEmailIkd` |
| int — 2 field | `userLevel`, `statusVerifikasi` |
| bool — 2 field | `isIkd`, `readyToReview` |

Field yang tidak ada menjadi null, sama dengan lookup key yang tidak ditemukan pada map native. Null dipertahankan; tidak menjadi string kosong, Boolean false, atau level tertentu pada tahap ini. String tidak di-trim, NIK tidak diganti dengan `nomorIndukKependudukan`, dan tanggal tidak di-parse oleh parser profil. Unknown field diabaikan. Field schema dibaca hanya dari own data properties; accessor dan nilai eksplisit `undefined` ditolak karena bukan nilai JSON native. Getter unknown field tidak dijalankan.

Integer memakai `Number.isSafeInteger`: batas aman JavaScript adalah subset signed64 dan menolak nilai yang mungkin kehilangan presisi. Input ini sudah melalui JSON decoding `ApiClient`, sehingga parser tidak dapat membedakan ejaan wire seperti `2` dan `2.0`, yang sama-sama menjadi Number `2`. Validasi ini mencakup shape dan tipe nilai yang tersedia setelah decoding, **bukan klaim kesetaraan lexical JSON penuh** dengan Dart. Tidak dilakukan decode kedua atau tebakan tipe dari string.

Hasil baru hanya berisi:

```js
{userLevel, isIkd, nomorIdentitas}
```

`queueReadIdentityQuery` selanjutnya menentukan eligibility level2/3, melewati penyisipan profil pada `isIkd=true`, dan menolak `isIkd=null` pada cabang eligible. Parser profil tidak mengubah aturan itu, tidak mendaftarkan identitas tambahan, dan tidak mengaktifkan transport. Kegagalan parser menghasilkan error generik `QUEUE_PROFILE_UNRECOGNIZED`, status502, tanpa nilai profil atau diagnostic upstream.

[Tes profil](../webapp/tests/queue-profile.test.mjs) menambahkan **12 tes**: shape/proyeksi minimal, status2xx, decoded-only, flag error, message, semua field String/int/bool, null/missing/alias login, ownership/accessor, error tanpa data sensitif, dan komposisi dengan gate read. Bersama 7 tes identitas yang sudah ada, hasil **19 lulus, 0 gagal**, durasi runner123.1962ms. Semua input sintetis dan tidak ada jaringan.

```powershell
.\tools\runtime\node.exe --test webapp/tests/queue-profile.test.mjs webapp/tests/queue-identity.test.mjs
```

Perubahan terbatas pada parser, tesnya, dan catatan ini. UI, konfigurasi, registry, HTTP API, deployment, dan penerimaan server belum berubah atau diuji oleh pekerjaan ini.
