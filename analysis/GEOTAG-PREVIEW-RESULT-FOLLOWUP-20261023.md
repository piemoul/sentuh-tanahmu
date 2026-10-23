# Geotag Berkas: preview, konfirmasi, dan hasil kirim — 23 Oktober 2026

**Preview dan callback hasil kini mempunyai kontrak statis yang lebih konkret. Layar preview menampilkan pernyataan sebagai teks dan tombol konfirmasi dua tahap; tidak ditemukan checkbox atau input tanda tangan pada tree preview yang dibatasi ini.** Busy menghilangkan aksi dialog. Hasil bisnis menentukan cabang sukses/draf; cabang sukses melakukan navigasi kembali, bukan pembacaan ulang daftar geotag yang telah dibuktikan.

Ini follow-up positif atas prioritas 1 dan 5 di [laporan gap](GEOTAG-LEGITIMATE-WORKFLOW-GAP-20261023.md). Bukti baru ada di [flow.json](recovered/geotag-preview-result-20261023/flow.json) dengan finding **GP1–GP4**. Tidak ada perubahan aplikasi, katalog, tes, bukti lama, server/provider, layanan, Docker, browser, sesi akun, GPS, kamera, unggahan, atau dokumen. Tidak ada klaim kunjungan, penerimaan server, maupun parity APK penuh.

REA skill yang sudah dibaca digunakan untuk mengikuti alamat/caller/callback positif, tanpa mengulang pencarian negatif lama. Target tetap Sentuh Tanahku **6.1.5 / 1037**; ELF ARM64 SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`, pool SHA-256 `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`. Hash keduanya dihitung ulang oleh extractor dan verifier. Peta Graphify checkpoint sebelumnya tetap orientasi sumber, bukan oracle native.

## GP1 — Layar preview dan konfirmasi

Entry `0x8b1e58` adalah **pembuka dialog konfirmasi**, bukan seluruh layar preview. Layar utama berada di `0x8b0c80`; diagram alurnya:

```text
UAb → _VAb preview8b0c80
  → Kirim Penandaan Lokasi
  → dialog8b1e58 →8b1ec0 →8b1f00
  → Batal atau Kirim
  → Kirim memanggil submitd955ac
```

| Bagian | Kontrak positif |
| --- | --- |
| Pernyataan | `0x8b10e4` membuat Text pernyataan kesesuaian penandaan dengan lokasi penguasaan fisik. Tree ini tidak memasang callback checkbox/signature atau form edit Lat/Longi. Ini tidak menyatakan bahwa semua screen sebelum/sesudahnya tidak memiliki gate lain. |
| Bagian kirim | `UAb+0x27=false` menampilkan pernyataan dan tombol; true melewati bagian itu (`0x8b1068`). Nama semantik flag bukan simbol asli yang dipulihkan. Fresh dan resume caller yang sudah dibuktikan menyetel false. |
| Tombol utama | Label normal `Kirim Penandaan Lokasi`, label busy `Memuat...`. Callback adalah `0x8b1e58`. Boolean `Vqc` diteruskan ke helper `0x7faf94`; `0x7fb5d0..0x7fb5e0` mengganti callback dengan null bila false, lalu memasangnya ke widget pada `0x7fb90c`. |
| Enabled | `!busy && (!resumeMarker || metadataReady)`. Busy adalah `_VAb+0x13`; resumeMarker adalah `UAb+0x23`. Ini tidak menggantikan gate ≤10 m di tahap capture sebelumnya. |
| metadataReady | Helper `0x8b1498`: `_VAb+0x23=false`, string `_VAb+0x1b` tidak kosong, `_VAb+0x1f` nonnull, dan `UAb+0x2f` nonnull. Dataflow mengikat `+0x1b` ke teks Desa/Kecamatan/kota/Provinsi; identitas lengkap kedua model nonnull belum dinamai. |
| Konfirmasi | Dialog memuat pertanyaan kesesuaian, Batal, dan Kirim. Batal memakai callback bersama `0x728800`; Kirim memakai `0xd955ac`. Pernyataan bukan field multipart ketujuh. |
| Busy dialog | `_VAb+0x13=true` memilih widget busy pada `0x8b1f7c` dan list aksi kosong pada `0x8b20e0`. Tidak ada compare-and-set/reentry guard terpisah yang dibuktikan di awal body submit. Perlindungan dispatch ganda eksplisit adalah adaptasi browser yang masuk akal. |

`0x8b1508` membangun informasi pengecekan sertipikat, nama pemeriksa dari model, waktu, Lat/Long, dan lokasi penandaan pada cabang resume. Itu tampilan informasi; ia tidak memberi hak browser mengarang identitas, waktu, atau proof kehadiran.

## GP2 — Trigger submit, byte, dan hasil bisnis

`0xd955ac` menyetel busy=true melalui `0x8b31b4`, baik setter dialog maupun State.setState, sebelum menyiapkan byte (`0xd95630`, `0xd95668`). Callback busy tersebut menulis tepat `_VAb+0x13=true`; callback `0x8b2f9c` menulis false.

- Jika `UAb+0x23=true`, submit mencoba screenshot baru dari `_VAb+0x17` lewat `0x8b2bec`, kemudian helper byte `0xd96d8c`. Jika hasil null, ia memakai `UAb+0x0f` melalui helper byte yang sama. Cabang false langsung memakai `UAb+0x0f`. Isi/codec screenshot dan kesetaraan byte foto tetap memerlukan audit capture terpisah.
- Nilai UAb dan state diteruskan ke wrapper `0xd96828` → writer `0xd96914`. Entri eksplisit tetap **BerkasId, Lat, Longi, file, Lokasi, IsOffline**; tidak ada input signature terpisah pada builder ini.
- Parser respons membaca body `error` bool (default false), `message` String (default `Gagal upload geotag`), `data` String (default kosong), lalu menghasilkan `success=!error` (`0xd96d34`). Wrong types melalui cast/catch; catch builder mengembalikan false dan pesan kesalahan upload.
- Wrapper menghasilkan bool/message untuk caller ini; data String tidak diteruskan. Karena itu `data` tidak boleh digunakan oleh implementasi sebagai geotagId/receipt dokumen tanpa bukti lain.
- Pada jalur resolusi layanan atau catch yang ditinjau, shared back `0x7257e8` dipanggil sebelum cabang hasil (`0xd958b4`). Helper ini mempunyai kondisi navigator/overlay; jangan mengklaim jumlah route yang selalu tertutup pada setiap kondisi runtime.

Tidak ada perbandingan HTTP200 tersendiri di parser writer ini. Shared main-client transform, timeout, redirect, auth-refresh, dan kemungkinan retry transport tetap bukti terpisah. Boolean success adalah hasil parser bisnis ini, bukan sertifikasi hukum/kehadiran.

## GP3 — Sukses

Urutan positif setelah hasil success=true:

1. Jika `UAb+0x23=true`, panggil `0xd950e8` dengan BerkasId `UAb+0x13`. Submit **tidak menunggu Future cleanup tersebut** sebelum melanjutkan (`0xd95938` langsung menuju update state).
2. Helper cleanup memperoleh user scope, menjalankan transaksi `0xd953f8`, memilih `image_path`, dan menghapus baris `geotag_drafts` dengan `user_id=? AND berkas_id=?`, lalu mencoba cleanup file terkait. Sukses upload tidak membuktikan cleanup lokal selesai.
3. Busy=false melalui `0x8b2f9c`, kemudian `0x75c000` dengan predicate closure `0x75c688` → `0x75c6b8`.
4. `0x75c000` memperoleh navigator dan memanggil loop `0x725ac4`: evaluasi predicate, pop bila false, ulang hingga true/tidak ada entry. Body predicate memeriksa navigator dan identitas route yang ditemukan lewat helper. Penafsiran sebagai first-route predicate adalah inferensi struktural; exact framework symbol tidak dipulihkan dalam audit ini.
5. Dialog `0x8b2fcc` menampilkan **message dari hasil layanan**, dengan tombol **Tutup** callback bersama `0x728800`.

Tidak ada explicit `GetGeotagList`, pembacaan PDF baru, atau mutation aktivitas yang terbukti dalam cabang hasil ini. Efek lifecycle pada route tujuan belum ditelusuri; kata “refresh daftar” tetap belum menjadi kontrak native yang tertutup. Browser boleh melakukan pembacaan ulang terarah sebagai adaptasi, dengan hasil baca yang benar-benar diterima, bukan menganggap navigasi sebagai bukti refresh.

## GP4 — Gagal, draf, dan pemberitahuan

Semua hasil bool false yang ditinjau—termasuk business `error:true` dan exception—membersihkan busy lalu menuju `0xd95a34`. Ini bukan classifier bahwa penyebabnya pasti koneksi internet.

`0xd95a34` memilih byte `UAb+0x37` bila tersedia, selain itu `UAb+0x0f`; memanggil helper byte lalu `0xd95ea8` dengan BerkasId serta teks latitude/longitude. Helper save menulis PNG di folder `geotag_draft_images`; transaksi `0xd965cc` mengganti baris user/berkas yang sama dan menyimpan `user_id`, `berkas_id`, `image_path`, `latitude`, `longitude`, `created_at`, dan `is_offline_geotag`, disertai cleanup gambar lama. Call dari `0xd95a34` tidak menyediakan named `Ltj`; default false di helper menjadi flag database 0 pada jalur ini. Jangan menyamakan `UAb+0x23`, `UAb+0x27`, dan wire `UAb+0x2b` sebagai satu flag.

**Return bool save diabaikan:** sesudah Await `0xd95b10`, kode langsung memeriksa mounted lalu membuka dialog lewat `0x8b23d0`. Dialog `0x8b245c` berjudul **Koneksi Tidak Stabil** dan menyatakan draf otomatis disimpan. Teks optional batas hapus berasal dari `UAb+0x2f+0x1f` yang diformat; keberadaan teks tidak membuktikan enforcement TTL.

Tombol OK → `0x8b2a04` memanggil pop `0x7273d8`, lalu helper navigasi `0x75c000`. Tidak ada automatic repost dalam jalur submit/failure ini. Replay draf oleh pengguna adalah alur terpisah yang sudah mempunyai [bukti resume](recovered/berkas-draft-callbacks-followup/flow.json).

Untuk browser, laporkan keberhasilan simpan draf hanya sesudah penyimpanan lokal berhasil. Pisahkan kegagalan bisnis, penyimpanan lokal, dan outcome request yang belum diketahui; jangan membuat retry otomatis yang dapat mengirim ulang mutation.

## Verifikasi dan sisa pekerjaan

[Verifier independen](recovered/geotag-preview-result-20261023/verify_proof.py) tidak mengimpor extractor. Ia membaca ulang ELF/pool, membandingkan setiap byte-range/instruksi/operand/annotation terhadap sumber, memeriksa enam dependency pin, 52 marker instruksi semantik, 11 marker pool, serta tabel boolean statis gate dan hasil. **22 window / 5.463 instruksi / 253 binding pool lulus.** Tabel tersebut adalah model cabang statis, bukan eksekusi APK.

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/recovered/geotag-preview-result-20261023/verify_proof.py
```

Perintah default baca saja dan mencetak hasil. [Receipt final](recovered/geotag-preview-result-20261023/verification-readonly.json) menyimpan recheck dengan hash verifier final; `verification.json` tetap hasil awal sebelum perubahan agar default verifier dapat dipakai ulang tanpa menulis receipt.

Prioritas 1/5 kini cukup untuk membuat rancangan preview/result yang konkret dengan batas di atas. **Writer tetap memerlukan** penutupan gate capture lain, bitmap/media dan provenance tiap byte, multipart/finalizer/retry aktual, caller/role entry, lifecycle tujuan/refresh, identitas model `+0x1f/+0x2f`, serta full dialog/back/barrier behavior. Native/browser E2E dan penerimaan server belum dilakukan. Tidak ada dasar baru untuk melewati gate ≤10 m, memakai koordinat dokumen sebagai posisi perangkat, atau mengklaim kehadiran fisik dari fixture.
