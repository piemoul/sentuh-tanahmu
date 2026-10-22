# Berkas: state dan callback draf lokal

**Dua delegasi yang sebelumnya belum diklasifikasikan sekarang terikat ke pemulihan draf Penandaan Lokasi lokal.** Keduanya belum memberikan binding positif untuk peta yang dilaporkan langsung pada detail BERKAS.

Audit REA ini hanya membaca Sentuh Tanahku 6.1.5 ARM64 yang sudah dipin. Tidak ada browser, provider, jaringan produksi, akun, APK, GPS, Docker, perubahan runtime aplikasi, atau pengujian seluruh proyek. Sebelas BLR parent/body dari audit dispatch sebelumnya tidak dianalisis ulang.

## Jembatan yang ditutup

| Entry dan window | Observasi instruksi |
| --- | --- |
| State-init `749f58` dan callback `8a9974` → `d24408..d245b4` | Memerlukan widget MAb+37 nonnull. Meneruskan selected MAb+13 ke `d24b20`, lalu callback `74adb8` menyimpan draf hasil pembacaan di state+33. Setelah guard bool dan mounted, dapat membuka dialog `749f80`. |
| `d24b20..d24ca0` | Mengakses database lokal `geotag_drafts.db`, tabel `geotag_drafts`, kondisi `user_id = ? AND berkas_id = ?`, nilai akun cache dan ID Berkas terpilih. Literal urutan `created_at DESC` dan argumen tagged integer1 diberikan ke query wrapper. Ini sumber draf lokal; tidak ada respons geometri BPN pada lookup tersebut. |
| `749f80..74a558` | Dialog berjudul **Draf Penandaan Lokasi** menyatakan terdapat draf yang belum terkirim. Tombol **Nanti** menutup dialog. Tombol **Kirim** menuju callback `74a558`. |
| `74a558..74a5d4` dan callback `8a99cc` → `d245cc..d246fc` | Callback menutup dialog lalu meneruskan draf yang tertahan ke `d245cc`. Routine menunggu nullable `Uint8List` dari helper `d246fc` yang menerima `image_path`. Hasil null berhenti; hasil nonnull membuka navigasi dengan builder `74a5d4`. Callback ini tidak mengirim permintaan unggahan secara langsung. |
| `74a5d4..74a6fc` → allocator `d247c4` | Membuat **UAb CID6278**, dibuktikan dari header allocator dan metadata kelas. Meneruskan field draf yang sudah tersedia. Destination ini berbeda dari widget mFb parcel-map dan tidak memberikan hubungan baru ke PersilId. Ledger koordinat yang sudah ada sebelumnya juga mengenali cabang UAb ini. |

Parser HAb `74a988..74ad34` membaca `id`, `user_id`, `berkas_id`, `image_path`, `latitude`, `longitude`, `created_at`, dan `is_offline_geotag`. Koordinat draf bertipe String, bukan geometri dari endpoint tanah. Ini tidak membuktikan asal pengukuran, datum, hadir fisik, penerimaan server, atau hak mengganti pemeriksaan kunjungan.

Dugaan eksplorasi awal bahwa nullable bytes berarti tujuan PDF **tidak digunakan**: allocator dan metadata secara positif mengikat tujuan ke UAb.

## Bukti dan batas

- [Ledger](recovered/berkas-draft-callbacks-followup/flow.json), SHA-256 `06bf5010a5c620ce1b103251d33abd4735713d2d10836f849c15504ed238ec80`.
- [Verifier](rea/verify_berkas_draft_callbacks_followup.py) dan [receipt](recovered/berkas-draft-callbacks-followup/verification.json): **14 window, 1.203 instruksi, 68 binding pool, 39 pemeriksaan operand, 12 pemeriksaan semantik pool, 7 dependensi, 3 cross-reference entry, dan metadata UAb lulus**.
- ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- Verifier memeriksa seluruh instruksi terhadap byte ELF, binding pool, epilog/overflow dua routine, source hashes, dan entry lama. Ia tidak menjadi verifier seluruh runtime atau seluruh ledger historis.
- Internals bool helper `d24818/d24868`, primitive filesystem dan semua perilaku framework tidak ditutup. Bukti query wrapper lengkap tidak masuk 14 window; laporan ini tidak menggunakan inferensi parameter bernama sebagai bukti peta.
- Peta langsung detail BERKAS tetap membutuhkan binding positif dari route/state lain atau observasi native yang dapat dikorelasikan ke widget/request. Draf lokal ini bukan pengganti binding tersebut. Tidak dibuat ID, koordinat, poligon, atau sukses unggahan baru.

Pemeriksaan ulang tanpa menulis:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_berkas_draft_callbacks_followup.py --verify-only
```
