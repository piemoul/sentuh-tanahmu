# Koreksi aditif geotag: respons, retry, dan format media — 23 Oktober 2026

**Dua label boolean pada [laporan gap](GEOTAG-LEGITIMATE-WORKFLOW-GAP-20261023.md) dan [preview/result](GEOTAG-PREVIEW-RESULT-FOLLOWUP-20261023.md) salah: default `error` native adalah true, dan catch writer menghasilkan bool true.** Dokumen/bukti lama tetap utuh; tabel di bawah menggantikan interpretasi defaultfalse/catchfalse dan klaim bahwa exception selalu masuk draf. Validasi byte verifier lama tidak membuat label semantik yang ditulis analis menjadi oracle.

Sumber koreksi adalah [audit multipart independen GM4](recovered/geotag-multipart-finalizer-20261023/REPORT.md), [ledger](recovered/geotag-multipart-finalizer-20261023/flow.json), [writer/wrapper proof](recovered/geotag-multipart-finalizer-20261023/writer-wrapper.proof.asm.txt), [caller polarity proof](recovered/geotag-multipart-finalizer-20261023/caller-result-polarity.proof.asm.txt), dan [receipt](recovered/geotag-multipart-finalizer-20261023/verification.json). Ledger SHA-256 **`88ab3438f8866b5ceaa18919e7f09d2efcdea13be7b2dd156415c2dc09daf43b`**. Target dan ELF/pool tetap sama dengan laporan terdahulu; tidak ada pengujian server/perangkat atau perubahan runtime.

| Kondisi setelah shared pipeline | Writer | Wrapper dan message | Cabang caller |
| --- | --- | --- | --- |
| `error:false`, tipe message/data benar | true | true, message writer | Cleanup/navigasi/dialog sisi sukses |
| `error:true`, tipe message/data benar | false | false, **Geotag berhasil diunggah** | Gagal/draf |
| `error` missing/null, tipe message/data benar | false | false, **Geotag berhasil diunggah** | Gagal/draf |
| Exception ditangkap writer, termasuk cast salah | **true** | true, **Terjadi kesalahan saat upload geotag** | **Cleanup/navigasi/dialog sisi sukses** |

`d96be8` memilih `x22+0x20` = Dart true sebagai default; `d96d34` menegasikan dengan XOR0x10. Catch `d96d64` menyimpan true. Wrapper `d96828` mengganti false dengan tuple pool42fe0; tuple ini benar-benar memuat bool false dan teks sukses. Caller `d95800..d95824` menyimpan bool asli dan kebalikannya secara terpisah. `d958bc..d958c4` membandingkan **bool asli** dengan true: true menuju cleanup, false menuju helper draf. Teks sukses atau navigasi tidak membuktikan acceptance server.

Implikasi browser: pisahkan business success, business failure dan exception/outcome unknown. Jangan memakai catch native yang masuk sisi sukses sebagai receipt penerimaan. Parser default dan tipe harus mengikuti kontrak yang telah dibuktikan; adaptasi penanganan exception harus dinyatakan dengan jujur. Cleanup tidak ditunggu dan refresh daftar tetap belum terbukti, sebagaimana batas pada laporan preview.

Ada dua penajaman lain untuk pembacaan laporan lama:

- **Retry:** tidak ada repost di callback preview yang dibatasi, tetapi main-client AP benar-benar memasang tiga retry setelah percobaan awal, nominal 1/3/5 detik, termasuk POST yang memenuhi predicate. FormData di-clone dengan byte/boundary/scalar yang sama, tanpa recapture posisi. Jadi ketiadaan retry transport tidak boleh disimpulkan dari callback UI. Idempotensi server belum dibuktikan.
- **Media:** istilah “menulis PNG” pada pembahasan draf lama hanya aman sebagai **nama/path `.png`**. [Audit capture/media](GEOTAG-CAPTURE-MEDIA-FOLLOWUP-20261023.md) membuktikan kompresi meminta JPEG; writer menetapkan filename `.png` dan MIME awal image/png berdasarkan ekstensi. Isi byte native belum dieksekusi. Writer tidak membuktikan syarat magic-PNG.

Urutan enam key Map writer tetap benar sebagai **Map**: BerkasId, Lat, Longi, file, Lokasi, IsOffline. Urutan **parts wire** berbeda: **BerkasId, Lat, Longi, Lokasi, IsOffline, file**. Tidak ada field checkbox/signature tambahan yang dibuktikan. Guard ≤10 m, posisi perangkat yang sebenarnya, provenance dan kontrol integrity tetap berlaku; koreksi ini tidak memberi pengecualian.

Verifier multipart independen lulus 24 window baru / 3.705 instruksi, empat kasus respons dan dependency/caller pins. Koreksi ini hanya menambahkan interpretasi berbasis proof baru; tidak mengubah receipt/proof lama atau menyatakan E2E/penerimaan server sudah terjadi.
