# Geotag Berkas: guard, capture, media, dan draf — 23 Oktober 2026

**Prioritas 2/3 sekarang mempunyai dataflow positif sampai byte writer dan draf. Capture membuat dua screenshot dari peta dan overlay aplikasi; kompresi meminta JPEG. Ekstensi `.png` tidak membuktikan isi PNG. Guard native juga mempunyai pemeriksaan mock-location/integrity yang belum mempunyai padanan browser terverifikasi.**

Ini melanjutkan [laporan gap](GEOTAG-LEGITIMATE-WORKFLOW-GAP-20261023.md) dan [preview/result](GEOTAG-PREVIEW-RESULT-FOLLOWUP-20261023.md). Untuk respons gunakan [koreksi aditif](GEOTAG-PREVIEW-RESULT-CORRECTION-20261023.md), bukan tabel semantik lama. Target Sentuh Tanahku **6.1.5 / 1037**, ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`, pool SHA-256 `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

REA digunakan untuk mengikuti caller dan field positif dari artifact yang sama. [Ledger GC1–GC5](recovered/geotag-capture-media-20261023/flow.json), [proof beralamat](recovered/geotag-capture-media-20261023/sources.json), dan dua manifest tambahan [follow-up](recovered/geotag-capture-media-20261023/followup-sources.json) / [UAb](recovered/geotag-capture-media-20261023/uab-sources.json) menyimpan batas setiap window. Tidak ada eksekusi APK, provider, browser, kamera, GPS, layanan, Docker, unggahan, atau perubahan app/runtime/tes/katalog/bukti lama.

## GC1 — State dan guard yang tepat

| Owner dan offset terkompresi | Arti yang diikat dataflow |
| --- | --- |
| `_ZAb+13` / `+1b` / `+1f` | Controller CAb / byte snapshot peta nullable / screenshot controller Uxb |
| `_ZAb+23` | **Capture busy**; setter `74b434` true, `8b4c98` / `8b5550` false |
| `_ZAb+27` | Menyembunyikan footer metadata untuk gambar dasar draf |
| `_ZAb+2b` | **Connection checking**; `8b55d0` true, `77d998` false |
| `CAb+17` / `+1b` | Posisi perangkat oYa / pin LatLng yang dipilih |
| `CAb+23` | GoogleMap controller, berbeda dari field busy milik `_ZAb` |
| `CAb+33` / `+3b` / `+57` | Distance-valid RxBool / region nullable / location-loading RxBool |

Tombol dan callback `d9758c` memerlukan **distanceValid && !captureBusy && !connectionChecking && !locationLoading**, setelah global precheck mengizinkan. Call `d975ec → d27ea8` menunggu precheck; true langsung keluar. `d97614..d97648` mengikat empat boolean berikutnya. Untuk koordinat finite yang valid, [proof jarak](recovered/geotag-coordinate-dataflow.json) serta `751610..751644` mengikat ambang **≤10 m antara posisi perangkat dan pin**, bukan posisi perangkat dari geometri dokumen. Tidak ada threshold umur fix atau horizontal accuracy yang dibuktikan pada gate ini.

**Precheck positif baru:** `d27ea8 → cce3cc → cce468` membaca posisi terakhir, atau meminta posisi saat null, lalu membaca `oYa+57` (serializer mengikatnya ke `is_mocked`). True menjadi alasan literal `mock` di `cce450`. Jalur komposit `cce620 → cce70c` juga mempunyai alasan hook/root/debugger/emulator/tampered/dev. Bila alasan bukan `-` dan konfigurasi `TRb.Thj` aktif, `d27ea8` membuka guard route `752c00` dan mengembalikan true. Konfigurasi dan provider tidak dieksekusi. Tidak ada dasar untuk mematikan kontrol ini atau menganggap fixture browser memenuhi integrity native.

## GC2 — Izin dan pengaturan posisi

`d27450` memanggil checkPermission; enum tepat `denied` memicu requestPermission, lalu membuat subscription stream. Pool **43580** memuat qYa dengan enum **best/index 4** dan integer **10**. Serializer `c64e00` mengikat enum ke key `accuracy`, sedangkan integer ke key **`distanceFilter`**. Jadi angka 10 ini bukan syarat accuracy 10 m. Perilaku lengkap denied-forever, service-off, error dan provider masih memerlukan dispatch/perangkat.

`d2752c` mengaktifkan `CAb+57`, meminta posisi bila cache `CAb+17` null, memperoleh region melalui `d2668c`, lalu menonaktifkan loading. `d97668` mengaktifkan connection-checking, menjalankan probe `d24818` sampai tiga kali dengan jeda, lalu menonaktifkannya. Jika region null, ia mencoba resolusi lagi; region yang tetap null memilih `d985e4`, jalur capture/draf offline yang tetap didahului guard di atas.

## GC3 — Isi gambar dan dua tujuan byte

`d978c8` menangkap pin melalui `8b4c84` ke context `+13` dan menyetel flag `CAb+1f`. Callback posisi masih dapat memperbarui `CAb+17`; tidak ada klaim semua stream dihentikan. `d979d0 → 8b4b80` meminta native `map#takeSnapshot`, menyimpan byte di `_ZAb+1b`. Renderer `8b6718` memakai Image.memory bila byte ini ada, menggantikan cabang GoogleMap live.

| Tahap beralamat | Isi dan tujuan |
| --- | --- |
| `d97ad4 → 8b2bec`, setelah `_ZAb+27=true` | Screenshot pertama, footer metadata disembunyikan; kompresi `d97f38` → context `+1f` → **UAb+37**, gambar dasar draf |
| `d97b54 → 8b2bec`, setelah `_ZAb+27=false` | Screenshot kedua, footer ditampilkan; kompresi `d97cd0` → context `+17` → **UAb+0f**, byte gambar untuk writer |
| `8b4cc0..8b4e94` | Mengikat kedua context tersebut ke field UAb; pin diformat tujuh desimal untuk Lat/Longi, dan lokasi diteruskan terpisah |

Tree capture memuat peta/overlay. Pernyataan penguasaan fisik di `8b6440` dirender sebagai **Text hanya ketika distanceValid=true dan captureBusy=true**. Pada tree ini ia bukan checkbox, signature, field multipart tambahan, atau input foto kamera/galeri. Ini tidak membuktikan seluruh APK tidak mempunyai fitur foto lain. Footer `8b55f4` memuat pengecekan sertipikat, nama pemeriksa, waktu, koordinat dan region. Nilai identitas/provenance tersebut tidak boleh dikarang oleh implementasi.

Screenshot Uxb `8b2bec → d96e60 → 8b2c9c → d96f68` mengambil RenderRepaintBoundary, menggunakan bounds render dengan pixelRatio **2**, dimensi **ceil(width×2), ceil(height×2)** dan native Scene.toImage. Tidak ada user crop rectangle yang terbukti di sini. `7cb23c` meneruskan encoding integer **4** ke native Image.toByteData. Nama **PNG** untuk integer itu adalah inferensi kuat berdasarkan korespondensi enum Flutter, bukan konstanta bernama yang dipulihkan atau byte gambar yang diamati.

## GC4 — Kompresi, ukuran, dan nama file

`d96d8c` mengirim **input asli yang sama** pada kualitas **80, 70, 60, 50, 40, 30** ke `d582f4`. Hasil nonkosong ≤**512.000 byte** langsung dikembalikan. Hasil kosong mengembalikan buffer saat ini; bila kualitas 30 masih terlalu besar, buffer terakhir tetap dikembalikan. Ini **threshold upaya kompresi, bukan jaminan batas ukuran**.

Pool **430a8** mengikat CIa enum index **0** ke nama **jpeg**. Dispatch class zIa CID4305 + selector `0x9c9` → register index6810 → `e0d274` mengirim method **compressWithList** dengan sembilan nilai:

```text
[buffer, 1920, 1080, quality, 0, true, 0, false, 1]
          minWidth/minHeight  rotate autoCorrection format keepExif inSampleSize
```

Artinya JPEG **diminta**, dengan minWidth1920/minHeight1080, rotate0, autoCorrection=true, keepExif=false dan inSampleSize1. Ini konfigurasi resize/codec, bukan dimensi atau isi output yang telah diamati. Tidak ada proof byte JPEG/PNG aktual dari perangkat.

[Audit multipart independen](recovered/geotag-multipart-finalizer-20261023/REPORT.md) mengikat filename **`geotag_<floor(clockInteger/1000)>.png`**, serta MIME awal **image/png dari ekstensi filename**. Interpretasi clock sebagai milliseconds since epoch didukung SDK Dart3.12.2 yang cocok; primitive bootstrap tetap anonim. Writer tidak melakukan magic-PNG check. Karena itu `.png` dan MIME deklaratif dapat membungkus hasil kompresi yang meminta JPEG. Browser PNG-only tidak boleh dipromosikan sebagai syarat native dari filename saja.

## GC5 — Draf offline dan hasil simpan

`d985e4` memperoleh pin, mewajibkan map snapshot nonnull, memasang snapshot/captureBusy/footer-hidden, mengambil **satu screenshot**, mengompres, memulihkan flag, lalu memanggil `d95ea8` dengan BerkasId dan koordinat tujuh desimal. Call lima argumen tanpa named `Ltj` memakai default false untuk flag database `is_offline_geotag`; nama jalur offline tidak memberi izin koordinat jarak jauh.

**Caller ini memeriksa return bool save:** `d98bec` false → dialog `8b4ed4` (gagal menyimpan), true → navigasi dan dialog `8b5098` (Koneksi Tidak Stabil/draf disimpan). Kedua alamat itu adalah **feedback**, bukan renderer gambar. Ini berbeda dari helper kegagalan preview `d95a34`, yang mengabaikan bool save lalu menampilkan klaim tersimpan. Transport retry juga berbeda: audit multipart membuktikan retry main client dapat mengulang byte yang sama tanpa recapture; tidak boleh dianggap sebagai bukti kunjungan baru.

## Verifikasi dan batas implementasi

[Verifier independen](recovered/geotag-capture-media-20261023/verify_proof.py) tidak mengimpor extractor/builder. [Receipt](recovered/geotag-capture-media-20261023/verification.json) **PASS: 35 window, 8.310 instruksi, 360 binding pool, 9 object pool, 59 pin instruksi semantik, 6 pin pool, 13 dependency hash, 3 manifest hash, satu dispatch, dan 32 kasus model gate**. Model bukan eksekusi APK. Ledger SHA-256 **`417b26ff7aab66c7f76bccb282acdda9d18b6df04c56ba65ed30e090f9e7caea`**.

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/recovered/geotag-capture-media-20261023/verify_proof.py
```

Kontrak ini cukup untuk menyiapkan alur guarded capture → preview → konfirmasi → byte writer/draf yang konkret. **Belum cukup untuk klaim browser 1:1 atau penerimaan resmi**: browser tidak memberi API langsung `is_mocked`/integrity Android, pixel/codec/Exif/map snapshot belum dieksekusi, dan role entry/region model/lifecycle refresh belum seluruhnya ditutup. E2E browser dengan geolocation sintetis hanya menguji gate dan state lokal; ia tidak membuktikan kehadiran. Validasi kunjungan nyata memerlukan perangkat dan izin pengguna di lokasi sebenarnya, tetap dengan ≤10 m serta kontrol native yang berlaku. Tidak ada pengujian semacam itu dalam audit ini.
