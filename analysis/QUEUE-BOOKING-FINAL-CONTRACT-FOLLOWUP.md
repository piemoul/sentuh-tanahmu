# Antrian: token notifikasi, hasil booking, DOB dan retry POST

Audit REA offline ini menutup empat pertanyaan konkret dari [batas booking](QUEUE-BOOKING-IMPLEMENTATION-BOUNDARY.md), termasuk dispatch DOB yang sebelumnya belum diketahui. Tidak ada perubahan runtime/katalog, request provider/server, akun, OTP, booking, atau eksekusi APK. Dokumen dan receipt lama tetap utuh; temuan di bawah memperbarui batas pengetahuan, bukan mengaktifkan operasi.

[Ledger baru](recovered/queue-booking-final-contract-followup/flow.json), SHA256 `369d69ed221ef9765b21e8757f12400565ea6cfb8b71dfdb326ac7bd5ada9155`, diikat oleh [verifier mandiri](rea/verify_queue_booking_final_contract_followup.py). [Receipt PASS](recovered/queue-booking-final-contract-followup/verification.json) memeriksa **25 window / 1.969 instruksi ELF**, 102 marker, 65 pemeriksaan semantik, 72 anotasi pool, 14 record publik, satu entri dispatch dan 18 dependensi lama. Ini cakupan bukti statis, bukan jumlah fungsi yang diuji secara end to end.

## Token pemohon adalah Firebase Messaging

Resolver `d8bbfc..d8bcc4` terlebih dahulu menunggu `d34fc8`. Pada `d35000`, fungsi itu membaca key **`fcm_token`** melalui `6b452c → 6b4594`; payload platform memakai `key`, `options` dan method **`read`**. Token tersimpan yang null, sama dengan String kosong, atau berpanjang nol menuju fallback.

Fallback `6bc010 → 6b4758 → d03040` memanggil method platform **`Messaging#getToken`** pada `d03118`, kemudian mengambil key **`token`** pada `d03150`. Sumber package Firebase Messaging yang sudah diekstrak turut dipin. Jadi field JSON `pemohon.token` berasal dari registrasi notifikasi Firebase Messaging, bukan bearer autentikasi main API atau Directus.

Setelah fallback, **hanya null** yang berubah menjadi literal `"-"` (`d8bca4..d8bcb4`). Tidak ada bukti bahwa error provider menjadi null, bahwa token String kosong dari fallback berubah menjadi dash, atau bahwa web boleh memaksa hasil provider null. Nilai token tidak dibaca, dihitung, diekspor atau diuji. Provenance ini tidak membuktikan project Firebase web, kebutuhan notifikasi browser, maupun penerimaan token oleh server antrean saat ini.

## Sukses membuka detail Antrian yang sudah dikenal

Controller `d8b390` mempublikasikan objek hasil create, memulai refresh daftar tanpa await (`d8b448`), lalu mengembalikan ID hasil parser. Callback akhir menggunakan builder **`88c9b0`**, yang mengalokasikan **`tzb`, CID6290**, melalui `d88380` dan menyimpan ID itu pada widget **`+0xf`**.

Ini adalah layar detail yang sama pada [ledger Antrian lama](recovered/queue-flow.json): factory **`9f7f88`**, init **`72a44c`**, lalu `d1df1c` dengan ID utuh dari widget. Null ID menjadi String kosong sesuai init yang diwarisi. Karena itu, layar hasil bukan alasan untuk mengarang kode booking dari response create: hasil create mengarahkan pembacaan detail resmi. Urutan lengkap operasi navigasi Flutter dan penerimaan create/detail server tetap tidak diuji di sini.

## DOB: tiga parser ketat lalu DateTime.toString

Fungsi **`d8ba70`** mencoba pola secara berurutan: **`dd/MM/yyyy`**, **`dd-MM-yyyy`**, kemudian **`yyyy-MM-dd`**. Setiap percobaan memakai adapter **`88c980`**, yang mengirim Boolean true pada `88c994` ke parser **`72be88`**. Ini parser strict yang sama dengan [bukti tanggal sertipikat](recovered/certificate-date-flow.json), bukan DateTime.parse atau JavaScript Date.parse. Ketiga percobaan gagal menghasilkan error `Unrecognized date format: ...`.

Sesudah berhasil, caller tidak memformat ulang dengan pola tanggal. Caller menjalankan selector **`+0xab4d`** terhadap hasil DateTime. Rantai konstruktor dan allocator `cd09f8` mengikat hasil ke **CID8068**. Tabel dispatch AOT yang sudah disimpan memberi:

`4096 + 0xab4d + 8068 = 56017 → 0xa6e488`.

Window **`a6e488..a6e888`** sekarang dipertahankan utuh. Ia menyusun komponen menjadi **`year-month-day HH:mm:ss.mmm[uuu]`**, dengan **spasi**, millisecond tiga digit, suffix microsecond tiga digit hanya bila nonzero, dan `Z` hanya untuk UTC. Helper padding `6be4ac..6be640` dan `6be740..6be8d0`, serta pemetaan komponen tanggal yang sudah dibuktikan preflight, ikut diikat. Untuk tanggal lokal yang berhasil diparse pada tahun biasa dan midnight, derivasi bentuknya adalah **`YYYY-MM-DD 00:00:00.000`**. Ini derivasi instruksi, bukan contoh respons produksi.

Dispatch output DOB **sudah tertutup**, sehingga jangan lagi menyebut target toString itu unknown. Tetap jangan menyamakan bentuk wire dengan tanggal saja atau ISO memakai `T`. Seluruh grammar input intl, extreme years, validasi zona lokal/DST dan hasil midnight yang tidak ada/ambigu belum dibuktikan secara menyeluruh. Window ini tidak membuat oracle baru atau mengklaim parser browser yang ada sudah setara.

## Native dapat mengulang POST create

Wrapper **`6b9270..6b93a8`** menetapkan method literal **POST**, lalu meneruskan data dan options ke composer **`d00690`**. Ini menghubungkan dua callsite booking lama dengan jalur HTTP umum; bukan bukti baru final byte body, redirect POST atau server acceptance.

Handler retry **`e1888c..e18b1c`** membaca `RequestOptions.data` pada `e189ec`. Hanya **FormData CID0xea0** yang memakai cabang clone. Map JSON memakai **`e18a18`**, mempertahankan objek request yang sama, lalu **`e18a70 → d007f4`**. Predicate `6bb848..6bb948` yang diikat tidak mengecualikan method POST. Batas attempt, delay dan predicate error tetap berasal dari [audit interceptor](QUEUE-INTERCEPTOR-FOLLOWUP.md).

Dengan demikian, tidak benar menganggap retry native terbatas pada GET. Namun retry native **bukan bukti idempotency server**. Tidak ada booking nyata, timeout atau duplikasi yang diamati. Kebijakan create satu kali tanpa retry pada web harus disebut adaptasi eksplisit; timeout harus tetap berstatus hasil belum diketahui sampai ada rekonsiliasi, bukan sukses atau gagal sintetis.

## Yang kini bisa dikerjakan

Empat temuan ini cukup untuk meneruskan implementasi lokal dengan kontrak lebih konkret: token sebagai dependency notifikasi terpisah, output DOB yang benar, hasil create yang menuju detail resmi, dan penanganan POST timeout/retry yang jujur. Fixture harus sintetis serta terpisah dari provider asli. Tidak perlu membuat layar hasil baru atau bearer pengganti.

**DOB.toString bukan lagi blocker tunggal. Queue lengkap belum tertutup.** Masih diperlukan transformasi Map ke wire dan redirect POST; converter response create yang divalidasi lalu dibuang; snapshot identitas booking milik sesi backend; cache availability/review dan gate context; provisioning notifikasi web; lifecycle identitas tambahan/OTP di luar subset profil sendiri; rekonsiliasi timeout/idempotency server; serta socket asli. Sumber berikutnya yang sempit adalah serializer create **`88c77c`**, wrapper/composer **`6b9270 → d00690 → 6fe4d8 → d007f4`**, dan parser create **`88bb58`** beserta converter yang benar-benar dipanggil. Backend saat ini belum menjadi implementasi booking lengkap hanya karena preview pemilihan lokal sudah ada.

Reproduksi verifier offline:

```powershell
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_queue_booking_final_contract_followup.py
```

Verifier membaca ulang ELF/pool dan membandingkan setiap instruksi, anotasi publik, header allocator, formula dispatch, marker dan dependency hash. Ia tidak mengimpor builder atau menguji aplikasi. Receipt hanya dibuat jika belum ada; pengulangan harus byte-identik. Seluruh hasil tetap dibatasi pada APK 6.1.5, ELF SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683` dan pool SHA256 `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
