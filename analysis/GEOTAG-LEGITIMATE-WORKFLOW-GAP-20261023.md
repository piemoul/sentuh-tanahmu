# Geotag Berkas: gap alur kunjungan sah dan rencana E2E — 23 Oktober 2026

**Gate lokasi dan enam field request sudah mempunyai bukti positif. Bukti yang tersedia belum cukup untuk mengaktifkan pengiriman geotag Berkas dengan klaim setara APK 6.1.5.** Langkah berikutnya adalah audit positif terhadap preview UAb, trigger kirim, isi screenshot, dan callback hasil; bukan pencarian ulang jalur geotag jarak jauh.

Laporan ini dibuat untuk checkpoint sumber. Hanya file laporan ini yang ditambahkan. Tidak ada perubahan aplikasi, katalog, tes, runtime, provider, Docker, layanan, browser, sesi akun, lokasi, kamera, unggahan, atau dokumen. Tidak ada native APK execution atau penerimaan server yang diuji. Tidak ada proof lama yang ditulis ulang. REA skill diterapkan melalui pembacaan ledger dan disassembly yang sudah ditahan; tidak ada sesi binary atau instalasi provider baru.

## Sumber dan batas bukti

- [REA skill](../tools/Reverse-Engineer-Anything/skills/reverse-engineer-anything/SKILL.md): pisahkan observasi statis, inferensi, dan unknown; ikuti entry hingga hasil.
- [Graphify checkpoint](../environment/publish/sentuh-tanahmu/.graphify/GRAPH_REPORT.md): graph 22 Oktober, 146 input/1.776 node/4.656 edge, berbasis commit `f2ea136`. Ini peta checkpoint publikasi, bukan bukti bahwa sumber aktif belum berubah atau cakupan APK sudah lengkap.
- [Recheck kontrak](GEOTAG-REMOTE-CONTRACT-RECHECK-20261021.md), [validasi](GEOTAG-VALIDATION-AUDIT.md), [ledger validasi](recovered/geotag-validation-audit.json), [dataflow koordinat](recovered/geotag-coordinate-dataflow.json).
- [Berkas/map flow](recovered/berkas-map-followup/flow.json), [pemulihan draf](recovered/berkas-draft-callbacks-followup/flow.json), [lokasi dokumen](DOCUMENT-GEO-FLOW.md).
- Disassembly ditahan: [capture](recovered/request-callsites/range-00d97668.asm.txt), [UAb builder](recovered/request-callsites/range-008b4cc0.asm.txt), [submit callback](recovered/request-callsites/range-00d955ac.asm.txt), [service/writer/response](recovered/http-callsite-audit/00d96b98.asm.txt), [VAb/UAb metadata](recovered/blutter-unique/asm/1050570_eZn.dart), [capture guard](recovered/blutter-unique/asm/1050572_gZn.dart).

Target seluruh ledger native di atas adalah `id.go.bpn.sentuh` **6.1.5 / 1037**, ELF ARM64 SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`, pool SHA-256 `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`. Identitas/hash itu diwarisi dari ledger/recheck; laporan ini tidak menghitung ulang seluruh verifikasi ELF. Temuan tambahan di bawah berasal dari pembacaan positif disassembly ditahan, bukan eksekusi native atau proof ELF baru.

## Yang sudah dapat menjadi requirement

| Bagian | Fakta positif dan implikasi |
| --- | --- |
| Entry Berkas | Parent MAb membaca nullable context flag `+0x2b`, default 0; bagian Penandaan Lokasi muncul ketika 1. Ini berbeda dari `ABb.allowGeotag+0x4b`. Daftar memakai `POST geotag/GetGeotagList`, `BerkasId` asli. Jangan memakai `allowGeotag` sendirian sebagai pengganti konteks entry yang belum dipetakan. |
| Ambil/ambil ulang | Marking-section callbacks bercabang ke NGb atau YAb berdasarkan context `+0x37`; YAb menerima context `+0x23`. Tampilan daftar, route capture, dan route melihat dokumen adalah aksi berbeda. |
| Posisi perangkat | Callback platform menyimpan model posisi di `CAb+0x17`; callback pin menyimpan pilihan di `CAb+0x1b`. Nilai tersebut harus tetap dua state berbeda. |
| Gate 10 m | Dua pasangan lat/lon masuk helper Haversine, radius 6.378.137 m; hasil ≤10 m mengaktifkan boolean yang dipakai UI dan capture callback. Bukan batas akurasi GPS, jarak ke polygon, atau toleransi koordinat dokumen. |
| Pernyataan fisik | Literal UI menyebut pin maksimal 10 m dari posisi pengguna dan kesesuaian penguasaan fisik dengan kondisi aktual di lapangan. Penerimaan pernyataan tidak boleh dibuat otomatis. |
| Koordinat kirim | Capture membaca titik pilihan; satu UAb caller memakai `toStringAsFixed(7)` ke `+0x17/+0x1b`. Caller pemulihan draf mempertahankan teks tersimpan. Tujuh desimal adalah format, bukan bukti ketelitian. |
| Draf | Lookup lokal terikat user dan berkas; draf memuat koordinat/image path dan dapat dibuka kembali ke UAb. `IsOffline` bukan izin membuat geotag tanpa kunjungan. |
| Dokumen hasil | `Lihat Penandaan Lokasi` memakai item `geotagId` → `geotag/GetSuratPernyataanGeotag` → PDF. Ini pembacaan dokumen yang sudah ada; belum membuktikan dokumen baru otomatis terbit setelah submit. |

Enam entri eksplisit writer `0xd96914` adalah:

| Field | Dataflow yang sudah dibuktikan | Yang belum boleh diasumsikan |
| --- | --- | --- |
| `BerkasId` | Identifier berkas yang diteruskan ke builder. | ID bebas, persil ID, atau contentId dokumen yang dapat saling menggantikan. |
| `Lat` | Teks latitude titik pilihan UAb `+0x17`. | Titik GNSS/dokumen sebagai posisi platform atau bukti hadir. |
| `Longi` | Teks longitude titik pilihan UAb `+0x1b`. | Semua caller selalu membulatkan tujuh desimal. |
| `file` | Byte file multipart; filename dibangun `geotag_<waktu>.png`. Capture mempunyai jalur screenshot. | Foto kamera/galeri biasa, isi komposit, resolusi, PNG byte parity, atau bukti tanda tangan telah setara. |
| `Lokasi` | Nilai yang diteruskan dari UAb/capture; capture membentuk teks Desa/Kecamatan/kabupaten/Provinsi atau `-`. | Bebas diisi keterangan pengguna, alamat dari dokumen, atau respons geocode arbitrer. |
| `IsOffline` | Flag yang diteruskan melalui request builder dan caller draf. | Pengecualian gate kunjungan, auto-retry yang aman, atau mode remote. |

Accuracy, timestamp, `is_mocked`, sumber GNSS, geometry, checksum, dan signature bukan entri eksplisit dalam builder enam field ini. Itu bukan bukti ketiadaan kontrol lain, konten tertanam pada file, interceptor, SDK, atau kewajiban server.

## Klarifikasi positif dari disassembly ditahan

1. **`file` berhubungan dengan screenshot, belum terbukti sebagai foto biasa.** Capture `0xd978c8` memanggil `0x8b2bec` pada `0xd97ad4` dan `0xd97b54`, kemudian helper byte `0xd96d8c`. Literal positifnya adalah `[Geotag] raw screenshot`, `compressed screenshot`, dan `draft snapshot` pada `0xd97b9c/0xd97d30/0xd97f98`. Teks lokasi dibentuk pada `0xd97e8c..0xd97f08`. Isi layar yang discreenshot, hubungan byte preview/draf/wire, policy kamera, serta bentuk pernyataan/tanda tangan masih harus ditutup dengan menelusuri widget dan helpernya. Nama literal screenshot saja tidak membuktikan komposisi gambar.
2. **Success bukan sekadar HTTP 200.** Sesudah POST `0xd96b98`, builder membaca body `error` pada `0xd96bc4`, `message` pada `0xd96c34`, dan `data` pada `0xd96cac`. Pada window ini `error` default false dan harus bool; `message` default `Gagal upload geotag` dan harus String; `data` default string kosong dan harus String. `0xd96d34` membalik error menjadi boolean success. Catch mengembalikan false, pesan `Terjadi kesalahan saat upload geotag`, dan data kosong. Status HTTP, transform body, dan exception yang sampai ke catch masih bergantung pada main client/shared pipeline.
3. **Wrapper dan hasil UI masih perlu disambung.** Wrapper `0xd96828` meneruskan tuple bool/message dan tidak meneruskan data String ke caller yang ditinjau. Submit callback `0xd955ac` memasang callback state sebelum image preparation, menerima tuple pada `0xd957c8`, lalu memiliki cabang hasil melalui `0x8b2f9c`, `0x8b2fcc`, `0xd950e8`, `0x75c000`, dan failure/draft helper `0xd95a34`. Tanpa body callback tersebut, jangan menamai seluruh flag sebagai busy/success atau mengklaim daftar/dokumen otomatis direfresh. Ini target audit berikutnya yang positif dan spesifik.

## Window yang perlu ditutup sebelum enable writer

| Prioritas | Audit positif berikutnya | Jawaban yang wajib diperoleh |
| --- | --- | --- |
| 1 | `_VAb` preview `0x8b1e58`, pembentuk tombol/callback terkait `0x8b245c`, `0x8b2a04`, `0x8b31b4`, serta `0xd955ac`. | Semua input/checkbox/validasi; siapa dapat menekan Kirim; apakah ada signature/canvas; bound BerkasId/koordinat/file/Lokasi; busy dan pencegahan submit ganda. |
| 2 | Capture guard `0xd9758c` → `0xd27ea8`, state yang dibaca `+0x23/+0x2b`, lalu `0xd97668` → `0xd978c8`. | Identitas seluruh gate selain 10 m, permission/service handling, kapan nilai posisi/pin dibekukan, perubahan posisi ketika capture sedang berjalan. |
| 3 | `0x8b2bec`, helper `0xd96d8c`, caller screenshot dan widget `0x8b5098/0x8b4ed4`, serta snapshot draf. | Apa tepatnya yang masuk PNG, gambar peta/foto/pernyataan, format/compression dan sumber tiap byte; bukan sekadar ekstensi filename. |
| 4 | `0xd15344` → `0x707bd4` → multipart/main-client finalizer untuk writer ini. | Encoding scalar/boolean, urutan parts, MIME, filename time unit, redirect/timeout/auth-refresh dan kemungkinan retry POST; reuse shared proof hanya bila caller cocok. |
| 5 | Success/failure callbacks `0x8b2f9c`, `0x8b2fcc`, `0xd950e8`, `0x75c000`, `0xd95a34`. | Busy clear, pesan/close behavior, hapus/simpan draf, refresh daftar dan route dokumen; apakah ada efek aktivitas tambahan dan kapan dipicu. |
| 6 | Caller marking-section `0x8a6cf8` dan context/route NGb/YAb. | Gate akun/role/berkas dan entry yang sah dari Berkasku/Koleksi/Aktivitas; tidak mengarang hak akses dari label tombol. |

Tidak perlu mengulang scan literal absence untuk mode remote, mock-location, Play Integrity, atau field tambahan yang sama. Ledger negatif yang sudah dibatasi tetap berlaku sesuai scope lamanya. Audit di atas mengikuti body/caller/callback yang sudah mempunyai alamat positif.

## Delta implementasi webapp yang dibaca

Keadaan sumber aktif saat audit, bukan verifikasi deployment:

- [operations.mjs](../webapp/private/operations.mjs): `post-geotag-uploadgeotag-d96b98` tetap disabled/inspect-only/`native_required`; enam field masih `clientRequired:false` dengan required native unknown. Form generik katalog ini belum mewakili validator native.
- [app.js](../webapp/app.js): predicate `ready` menolak endpoint UploadGeotag. `berkasDetailView` yang dibaca belum merender alur capture/review/submit geotag. Detail/aktivitas Berkas bukan bukti perjalanan geotag lengkap.
- [http-api.mjs](../webapp/private/http-api.mjs): capability `geotagSubmission:'official-app-required'`; ada pemeriksaan magic PNG untuk jalur file. [api-client.mjs](../webapp/private/api-client.mjs) memiliki penamaan file geotag. Kode dormant tersebut tidak membuktikan writer end-to-end atau format isi PNG telah ditutup.
- Tes operasi/backend yang sudah ada mengharapkan penolakan geotag sebelum upstream, termasuk multipart terkonfirmasi dan `IsOffline:true`. Tes itu hanya dibaca dalam audit ini, tidak dijalankan.
- [Lokasi dokumen](DOCUMENT-GEO-FLOW.md) adalah GET `getGeoJsonInfo` dengan q contentId utuh dan geometri empat lapis. Ia tidak memberi lokasi perangkat, signature, proof kunjungan, atau izin submit. Gambar/polygon referensi harus berlabel sumbernya dan tidak mengisi posisi perangkat.

Pekerjaan frontend lokal dapat menyiapkan tampilan referensi dan state perangkat/pin secara terpisah. Aktivasi writer memerlukan hasil audit transisi di atas dan implementasi khusus dengan state milik sesi; sekadar mengubah enabled=true atau menghapus pengecualian `ready` tidak cukup.

## E2E terfokus setelah kontrak ditutup dan implementasi tersedia

**Fixture browser sintetis** harus memuat label bukti sintetis dan upstream/session lokal yang terisolasi; semua host provider asli harus diblokir. Mock geolocation hanya di fixture, dengan titik dan media sintetis. Fixture tidak boleh ditafsirkan sebagai kunjungan nyata atau diteruskan ke server asli.

1. Entry berkas yang sesuai, gate role/context, izin ditolak, permission hilang, layanan lokasi tidak tersedia, timeout dan fix belum ada. Capture tetap tidak dapat berjalan bila state wajib belum valid.
2. Posisi perangkat dan pin berbeda: jarak 0, di bawah 10 m, tepat 10 m pada helper deterministik, serta di atas 10 m. Memindahkan pin/posisi memperbarui gate; koordinat referensi dokumen tidak menjadi fix perangkat. Gunakan nilai yang jauh dari batas untuk assert tombol browser agar pembulatan floating point tidak menghasilkan false confidence.
3. Seluruh validasi native yang baru ditutup, pernyataan belum/disetujui, capture dibatalkan, screenshot gagal/byte kosong, perubahan posisi saat capture, preview ditolak/diulang, serta perbedaan online/draf.
4. Review terikat berkas dan sesi, mutation browser atas koordinat/ID/media ditolak, logout/401/route switch menutup state usang, double click menghasilkan maksimal satu pengiriman. Perilaku request outcome-unknown tidak otomatis retry tanpa kontrak yang telah dibuktikan.
5. Multipart final berisi tepat enam field dengan byte/formats yang dibuktikan; tidak menambah proof GPS, mock flag, timestamp fix, attestation atau signature rekaan. Uji business `error:true/false`, missing/null/wrong types, network failure dan respons terlambat. Success message, busy clear, draft effect, refresh, dan dokumen mengikuti hasil audit callback.
6. Pada viewport ponsel dan desktop, periksa peta, pernyataan, preview PNG, tombol/busy/error, focus/back/cancel, tanpa overflow atau akses tombol melalui state usang. Simpan screenshot dan network receipt yang telah disanitasi.

**Pembuktian ponsel di lokasi** adalah tahap terpisah: perangkat fisik yang diterima, akun/berkas berwenang, GPS asli dengan pengguna hadir pada tanah tersebut, pernyataan sesuai fakta, media nyata yang diwajibkan flow, dan otorisasi eksplisit untuk mutation berkas itu. Bandingkan official APK dan browser pada tahap yang sama; catat izin/fix/pin/capture/review, respons bisnis, refresh daftar, dan pembacaan dokumen hasil. Geolokasi browser bukan attestation Android, dan browser tidak dapat membuktikan native `is_mocked`/integrity hanya dari Web Geolocation API.

Jika upstream menolak karena kontrak/attestation/device requirement yang belum diketahui, catat penolakan aktual dan lanjutkan pembuktian melalui jalur resmi; jangan membuat proof, memalsukan kehadiran, mengubah kontrol kedekatan, atau mengklaim penerimaan. Tidak ada E2E sintetis, E2E ponsel, atau submit produksi yang dilakukan oleh audit ini. **Geotag end-to-end dan parity APK tetap belum selesai.**
