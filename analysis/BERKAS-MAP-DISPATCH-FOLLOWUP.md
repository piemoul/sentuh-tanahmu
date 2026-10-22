# Berkas: klasifikasi dispatch tidak langsung pada detail

**Binding peta yang dilaporkan langsung pada detail Berkas masih belum ditemukan.** Audit ini menutup satu celah yang berbeda dari audit sebelumnya: sebelas panggilan tidak langsung (`BLR`) di parent `899b84–89a3b0` dan body `89a3b0–89d1dc`. Pada tipe receiver yang dibuktikan/diikat di bawah, callsite tersebut menjalankan konversi skalar, perbandingan teks, atau operasi daftar SPS. Tidak ada binding positif baru ke widget peta, request batas, pusat kamera, atau geometri Berkas terpilih.

Ini bukan bukti bahwa peta tersebut tidak ada. Pengamatan pengguna tetap valid. Klasifikasi ini tidak mengklaim seluruh turunan widget, dispatch tidak langsung aplikasi, state runtime, atau setiap varian build sudah habis dipetakan.

Skill REA digunakan dengan ELF/pool yang sudah dibekukan. Tidak ada setup/pull, dump luas baru, jaringan, login, APK, GPS, kredensial, browser, Docker, backend, atau mutasi aplikasi. Ringkasan perjalanan, child detail yang telah diklasifikasikan, serta inventaris empat pemanggil langsung allocator MAb tidak diulang.

## Bukti positif baru

| Callsite | Receiver yang diikat dari bukti lama | Selector relatif tabel | Hasil klasifikasi |
|---|---|---|---|
| `899c10`, `899c88` | ABb.`nomor` +f dan `tahun` +13, masing-masing int? | `ab4d` | Konversi skalar ke String untuk judul nomor/tahun. |
| `89a5ac`, `89a5e8`, `89a760` | ABb.`statusBerkas` +b, int? | `ab4d` | Konversi skalar ke String sebelum pemilihan label status atau fallback. Hasil call pertama pada `89a5ac` ditimpa sebelum dipakai. |
| `89a838` | ABb.`fileSop` +3f → EBb.`tipeProduk` +17, String? | `0` | Perbandingan dengan literal `Rutin`. |
| `89ae0c`, `89ae30` | Argumen body x3, dari MAb+1b | `0` | Perbandingan dengan `-` dan String kosong. Pada entry Koleksi/Aktivitas yang sudah dibuktikan, nilai ini berasal dari slot String tuple `getStatusCetak`, bukan data persil. |
| `89c068` | ABb.`fileSps` +43, sudah diperiksa nonnull | `f985` | Pemeriksaan daftar kosong untuk layout SPS. |
| `89c17c`, `89c1ec` | ABb.`fileSps` +43, sudah diperiksa nonnull | `df50` | Panjang daftar: tinggi dihitung `length * 55`, kemudian itemCount. |

Sebelas callsite adalah inventaris lengkap **BLR pada dua window parent/body tersebut saja**, bukan jumlah call yang teramati berjalan. Gate layar dan cabang berbeda dapat membuat sebagian call tidak dieksekusi untuk suatu entry.

Tabel dispatch yang dipin memakai indeks `4096 + CID + selector`. Dua belas pasangan konkret diikat: konversi CID60/61/171; equality CID94/95/171; serta empty/length untuk List CID90/91/92. Delapan record metadata berasal dari artefak Blutter yang dipin dan dibaca sebagai teks; skrip Frida tidak dijalankan.

Target skalar CID171 mengembalikan literal `null`. Target CID60 memiliki cache/penulisan byte String; cabang bilangan negatif meneruskan ke helper lain. Target CID61 melewati panggilan bootstrap native lalu mensyaratkan hasil String. Internals bootstrap, seluruh format bilangan, atau kesetaraan `String(number)` JavaScript **tidak ditutup** oleh audit ini.

Target equality String membandingkan identitas/panjang/konten dan memiliki cabang lintas representasi String; target null adalah perbandingan identitas. Target empty/length List yang diikat membaca panjang dan mengembalikan bool/int. Producer ABb memang mematerialisasi iterable SPS melalui `4b80e0`, tetapi helper materialisasi lengkap dan semua kemungkinan subtype List tidak diperluas. Cakupan pasangan builtin ini tidak menjadi klaim universal tentang implementasi List arbitrer.

## Konsekuensi untuk peta

Rute PERSIL yang sudah dibuktikan menuju pembacaan batas bidang tetap terpisah dari rute BERKAS yang memakai CariBerkas/SOP/status cetak. Klasifikasi sebelas dispatch ini tidak menambahkan transformasi ID atau koordinat pada rute BERKAS. Tidak dibuat hubungan `berkasId → persilId`, `q`, poligon, maupun pusat peta.

WMS Bhumi yang telah dipetakan tetap berupa layer PNG regional berdasarkan viewport XYZ. Itu belum membuktikan geometri atau pusat milik Berkas terpilih. Implementasi inline yang mengklaim mengikuti native harus menunggu binding positif dari varian route/state atau child lain yang belum tertutup. Panggilan indirect/inlined allocation di luar scope, builder framework transitif, konfigurasi runtime serta identitas build terpasang tetap gap.

## Pembekuan dan pemeriksaan

- [Ledger final](recovered/berkas-map-dispatch-followup/flow.json), SHA-256 `98bedcda2aa3a26eff2ea8e935bfde8243c618edb26c751b4475e7254034b05a`.
- [Hasil verifier](recovered/berkas-map-dispatch-followup/verification.json): **7 window baru / 381 instruksi**, **6 window warisan / 4.883 instruksi unik**, total **5.264 instruksi unik**, **11 callsite**, **12 entri dispatch**, **8 record metadata**, **108 marker**, dan **72 cek semantik independen** lulus. Tiga binding pool baru dan 15 hash dependensi cocok. Instruksi warisan diperiksa byte terhadap ELF; window tersebut tidak dianalisis ulang sebagai penemuan baru.
- [Verifier](rea/verify_berkas_map_dispatch_followup.py) memeriksa sumber, semua instruksi, annotation pool, inventory BLR, operand selector, tabel, tipe/dataflow, target helper, dan preservasi. `--verify-only` hanya membaca dan mengharuskan receipt yang sudah ada identik.
- ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- **1.168 input terlindungi cocok:** 80 runtime, 44 ledger native, 1.014 receipt historis, 27 dokumen, korpus170request, katalog dan manifest snapshot tes. Perbaikan label preview oleh root sudah terdapat pada hash view di snapshot awal audit ini; tidak ada pengecualian runtime dan seluruh80 tetap sama. Receipt review label root dipin sebagai konteks terpisah.

File `flow.initial-draft.json` dan `flow.parallel-change-draft.json` dipertahankan sebagai draf nonkanonik. Draf kedua sempat mengasumsikan perubahan view terjadi setelah snapshot; pemeriksaan row aktual membuktikan hash final sudah tersimpan sejak awal, dan verifier final menuntut `changed_protected_inputs: []`. `.explore.*` juga nonkanonik, termasuk eksplorasi helper materialisasi List yang tidak diperluas. Pin ledger lama bukan pernyataan bahwa verifier historis Berkas yang pernah mencatat drift telah lulus kembali; verifier lama tidak dijalankan.

Pemeriksaan ulang tanpa menulis:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_berkas_map_dispatch_followup.py --verify-only
```
