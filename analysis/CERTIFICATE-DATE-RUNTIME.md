# Tanggal sertipikat analog

Tiga field pada detail analog sekarang menggunakan format `dd MMMM yyyy` dalam bahasa Indonesia: `ValidSejak`, `ValidSampai`, dan `SuratUkur.BerlakuSejak`. Contoh `2026-10-20T13:24:35.123Z` tampil sebagai **20 Oktober 2026**. Tanggal gagal diparse menjadi `-`. Tahun 9999 pada analog tetap ditampilkan; aturan sentinel elektronik tidak diterapkan ke analog.

Nilai respons asli tetap ada dalam pratinjau JSON dan tidak dimutasi. Renderer elektronik, tanggal masa berbagi, formatter teks umum, payload, API, backend, dan konfigurasi CSP tidak diubah.

## Dasar APK dan batas kesetaraan

Helper native `0xd910bc` memakai format keluaran `dd MMMM yyyy`. Initializer `0x89de1c` mencoba enam pola berurutan dengan locale default aplikasi `id_ID`:

1. `yyyy-MM-dd'T'HH:mm:ss.SSS'Z'`
2. `yyyy-MM-dd'T'HH:mm:ssZ`
3. `yyyy-MM-dd'T'HH:mm:ss`
4. `M/d/yyyy h:mm:ss a`
5. `MM/dd/yyyy HH:mm:ss`
6. `yyyy-MM-dd`

Bukti dan binding callsite: [alur tanggal](CERTIFICATE-DATE-FLOW.md), [batas parser](CERTIFICATE-DATE-PARSER-BOUNDS.md), dan [komposisi literal T](CERTIFICATE-DATE-LITERAL-CASE.md). Pembacaan ELF menunjukkan perbedaan antara literal `Z` dan field zona yang tidak mengonsumsi offset. Browser tidak memakai `Date.parse` untuk menebak konversi zona waktu.

Implementasi browser adalah kode Dart **3.12.2** yang dikompilasi dengan **intl 0.20.2** terpatok. Versi SDK sama dengan snapshot APK; nomor rilis intl yang tertanam dalam APK belum teridentifikasi. Bukti ini menyelaraskan aturan dan callsite yang terikat serta korpus teruji, bukan bukti seluruh perilaku runtime APK, Unicode, batas overflow, atau DST.

## Implementasi dan kompilasi

- `webapp/assets/certificate-date/vendor.js`: keluaran compiler tanpa perubahan, 289.894 byte.
- `webapp/assets/certificate-date/formatter.js`: menunggu inisialisasi locale sebelum aplikasi dirender.
- `webapp/assets/certificate-date/LICENSE.txt`: lisensi SDK, intl, dan ketiga dependensi terpatok clock, meta, path.
- `environment/certificate-date-oracle`: sumber Dart, lockfile, korpus dan SDK terisolasi. Folder ini tidak masuk konteks build Docker.

Dari direktori oracle, menggunakan SDK terpatok:

```powershell
$env:DART_SUPPRESS_ANALYTICS='true'
$env:PUB_CACHE=(Join-Path (Get-Location) 'pub-cache')
& './dart-sdk/bin/dart.exe' pub get
& './dart-sdk/bin/dart.exe' analyze lib bin web
& './dart-sdk/bin/dart.exe' compile js -O2 --csp --no-source-maps -o build/certificate-date.js web/main.dart
```

Bundle diuji dengan pembuatan kode string dan Wasm dinonaktifkan. CSP produksi tetap `script-src 'self'`; tidak ada penambahan `unsafe-eval`.

## Validasi

| Pemeriksaan | Hasil |
| --- | --- |
| Seluruh Node, 92 file | 1.704 lulus |
| Regresi VM, 23 suite | 1.190 lulus |
| Korpus Dart VM | 90 kasus, 77 ekspektasi, tidak ada selisih setelah koreksi berbukti |
| Bundle JS terhadap VM | 90 keluaran cocok dan 17 input tipe salah aman pada masing-masing zona Los Angeles dan Jakarta |
| Browser aplikasi utuh | 7 grup pemeriksaan; desktop, frame CSS390, dan viewport langsung390×844 |
| Delivery final | 82 file image, 82 container/localhost, 52 file publik |

Tes browser memakai respons baca sintetis. Tanggal valid/tidak valid/null, pecahan detik, tahun kabisat, offset yang tidak didukung, tahun 9999, dan respons JSON asli diperiksa. Viewport langsung mobile tidak overflow dan tidak mencatat error console sebelum kontrol fixture dijalankan.

Dua ekspektasi awal tentang ISO tanpa literal akhir dan pemisah jam opsional salah; bukti komposisi literal `T` menjelaskan kegagalannya. Korpus dan receipt awal tetap disimpan. Frame mobile mencatat satu error MutationObserver yang asalnya belum teridentifikasi dan tidak terulang pada viewport langsung. Satu klik kontrol fixture mobile mengenai navigasi Koleksi; satu pembacaan di luar allowlist ditolak fixture lokal. Ini tidak mengirim permintaan ke server resmi. Semua fixture berhenti normal, port4211 ditutup, tab sementara ditutup, dan override viewport direset.

Upaya publik pertama gagal DNS untuk52 aset. DNS sistem dan Cloudflare kemudian berhasil, dan receipt penerus mencatat52/52 cocok. Setelah uji browser, perubahan hanya melengkapi teks lisensi; app, wrapper, dan bundle teruji tetap identik. Tes dan delivery final mengikat lisensi lengkap.

## Status pengujian akun dan tujuan

Frontend aktif di http://localhost:4173 dan https://sentuh.davay.space. Pembaruan memakai mount frontend read-only tanpa restart/recreate backend; kesamaan proses tidak membuktikan sesi akun valid. Halaman akun domain yang baru dimuat masih menampilkan **Belum masuk**. Tidak ada kredensial dimasukkan atau percobaan login oleh agen.

Kesetaraan seluruh menu, pipeline tanggal elektronik/masa berbagi, binding peta inline Berkas, pengujian APK end-to-end, dan penerimaan submisi geotag resmi tetap belum selesai. Tidak ada perubahan pada proteksi kunjungan atau pengaktifan write geotag. Ringkasan dan hash bukti akhir: [certificate-date-runtime-summary.json](webapp/certificate-date-runtime-summary.json).
