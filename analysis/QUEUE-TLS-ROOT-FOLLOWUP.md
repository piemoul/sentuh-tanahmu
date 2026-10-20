# Antrian: root TLS sebelum CA APK

**Context builder native memanggil pemuatan builtin roots sebelum menambahkan CA APK.** Karena itu, konteks yang hanya berisi CA APK belum mewakili seluruh urutan trust initialization yang dibuktikan. Audit ini tidak mengubah konfigurasi TLS atau melakukan koneksi.

Target tetap `libapp.so` APK 6.1.5/Dart 3.12.2, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. [Ledger beku](recovered/queue-tls-root-followup/flow.json), [hasil verifier](recovered/queue-tls-root-followup/verification.json), dan [metadata native](recovered/queue-tls-root-followup/metadata.tsv) mendukung rantai berikut:

| Tahap | Binding |
|---|---|
| Builder aplikasi | `0xd0b658 → 0x6c5cb8` |
| Objek baru | `0x6c5cd0 → 0xd09f10`, allocator `_qr` CID 8113, `dart:io` |
| Context native baru | `0x6c5cdc → 0xd09ecc`, `native_name = SecurityContext_Allocate` |
| Root bawaan | `0x6c5ce8 → 0xd09e88`, `native_name = SecurityContext_TrustBuiltinRoots` |
| CA APK kemudian ditambahkan | `0xd0b680 → 0xd0c748`, `native_name = SecurityContext_SetTrustedCertificatesBytes` |

Nama native diperoleh dari metadata `Function.native_name()` pada snapshot. Reader hanya mengekspor nama lima wrapper security-context beserta identitas kelas/immediate parent; tidak menjalankan fungsi TLS tersebut atau mengekspor isi sertifikat, private key, kata sandi, maupun bearer. Source/tool runtime bersama tidak diubah; executable pembaca terisolasi memakai object build lokal yang sudah ada.

Nama factory Dart publik di `0x6c5cb8` masih **unrecovered**, tetapi tubuhnya mengalokasikan objek baru, memanggil Allocate dan TrustBuiltinRoots secara berurutan tanpa cabang Boolean, lalu mengembalikan objek itu. Register `x1=null` pada `0xd0b654` tidak dibaca sebagai flag pada tubuh tersebut. Menyimpulkan `withTrustedRoots=false` dari register itu tidak sesuai bukti. Tidak ada klaim bahwa objek ini adalah singleton `SecurityContext.defaultContext`.

Empat cuplikan sumber SDK lokal versi **3.12.2** menguatkan semantik:

- [Allocator](recovered/queue-tls-root-followup/sdk-allocate.txt) membuat `SSL_CTX` dan memasang `SSL_VERIFY_PEER`; pemuatan root terpisah.
- [Wrapper native root](recovered/queue-tls-root-followup/sdk-native-trust-roots.txt) memanggil `TrustBuiltinRoots()`.
- [Pemilihan root Android](recovered/queue-tls-root-followup/sdk-android-root-selection.txt) menggunakan `/system/etc/security/cacerts` pada jalur default Android. Opsi `root_certs_file`, `root_certs_cache`, dan flag bypass diperiksa sebelumnya; nilainya dalam runtime perangkat belum diamati.
- [Import trust](recovered/queue-tls-root-followup/sdk-add-trust.txt) mengambil cert store yang sudah ada dan menambahkan sertifikat. Import ini bukan penggantian seluruh store.

Verifier memeriksa **3 berkas assembly/74 instruksi ELF, 4 cuplikan SDK beserta hash sumbernya, 5 dependensi, 5 identitas native, dan 11 marker**. Versi SDK diperiksa dari `tools/VERSION`; ledger SPS terdahulu tetap tidak diubah. Jalankan:

```powershell
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/verify_queue_tls_root_followup.py
```

Ini bukti konstruksi statis, bukan daftar CA yang benar-benar tersedia pada perangkat. Root Android dan root Node tidak dinyatakan identik. Tidak ada kesimpulan mengenai kelengkapan chain server, penyebab `ECONNRESET`/`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, atau apakah server mewajibkan client identity. Dua HEAD probe root oleh agent utama merupakan bukti terpisah; audit ini tidak mengulangi probe maupun mengakses API Antrian. Verifikasi sertifikat, callback penolakan sertifikat produksi yang telah diaudit, dan batas origin tetap berlaku.
