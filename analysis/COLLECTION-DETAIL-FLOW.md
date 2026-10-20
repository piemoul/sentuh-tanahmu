# Alur daftar → detail Koleksi (APK 6.1.5)

**Baris Koleksi bertipe `PERSIL` membuka peta batas bidang memakai `contentId` sebagai `persilid`. `collection/GetCollectionId` bukan endpoint detail baris Koleksi.** Audit ini membaca artefak statis yang sudah tersedia; tidak memakai browser, akun pengguna, atau koneksi produksi.

| `type` baris | Transformasi `contentId` | Lanjutan native utama |
| --- | --- | --- |
| `PERSIL` | Utuh, tanpa split atau decode | `GET legacy/GetParcelBoundaryById?persilid=<contentId>` |
| `BERKAS` | `contentId.split(':')[0]` | `POST /berkas/CariBerkas`, form `berkasId=<hasil split>`; `nomor`, `tahun`, `kantorId` null pada caller ini |
| Nilai lainnya / `contentId` null | — | Router yang diperiksa kembali tanpa membuka halaman |

`id` baris adalah ID koleksi, berbeda dengan ID konten. Jangan memakai `id`, `title`, atau `subTitle` sebagai pengganti `contentId`. Daftar diambil melalui `GET collection/GetUserCollection`, call `0xd31a50`, tanpa body/query eksplisit, memakai client utama dan sesi pengguna.

## Bukti parser dan aksi baris

`GetUserCollection` memanggil parser `xEb` di `0x769aac`. Envelope yang dibaca adalah `error: bool?`, `message: String?`, dan `data: List<wEb>?`; pemetaan item memakai closure `0x769e1c` → parser `0x769e6c`.

| Nama JSON | Slot model `wEb` | Tipe parser |
| --- | --- | --- |
| `id` | `+7` | `String?` |
| `type` | `+0xb` | `String?` |
| `contentId` | `+0xf` | `String?` |
| `createdAt` | `+0x13` | `String?` |
| `email` | `+0x17` | `String?` |
| `title` | `+0x1b` | `String?` |
| `subTitle` | `+0x1f` | `String?` |
| `groupId` | `+0x23` | `String?` |

Serializer `0x700498` mengonfirmasi pasangan nama/slot itu. Builder kartu `0x8fbe74` memasang closure `0x8fcb50` di `0x8fbef8`. Callback membaca row `type`, `contentId`, dan `id` (`0x8fcb98`, `0x8fcba0`, `0x8fcbb0`) dan memanggil router `0xda76d0` pada `0x8fcbd4`.

## Cabang PERSIL: ID, request, dan respons

1. Router membandingkan `type` dengan literal `PERSIL` di `0xda7740–0xda7754`, lalu memeriksa `contentId` nonnull. Closure navigasi `0x8fcc50` menaruh `contentId` di `mFb+0xf` (`0x8fcc94`); ID koleksi disimpan terpisah di `mFb+0x1b` (`0x8fccac`).
2. Dispatch snapshot membuktikan `mFb` CID 6225 → createState `0x9fda0c`, dan `_nFb` CID 5406 → initializer `0x770190`. Tabel yang digunakan sama dengan audit sertipikat, dengan indeks absolut masing-masing **59956** dan **62145**. Framework menghubungkan widget ke `state+0xb` sebagaimana audit sebelumnya.
3. Initializer `0x770190` membaca `widget+0xf` pada `0x7701e0` dan meneruskannya ke constructor controller `0x770384`, named argument `eDf`. Constructor menaruhnya di `lFb+0xb` (`0x770970`). Karena `cth`/`lFb+7` null pada jalur ini, constructor memilih `0xd39470` di `0x7709b8`; jalur `/apis/getGeoJsonInfo` memakai field lain dan **bukan** jalur koleksi PERSIL ini.
4. `0xd39470` membaca `lFb+0xb` dan memanggil service `0xd39814` pada `0xd3955c`. Builder membentuk literal `legacy/GetParcelBoundaryById?persilid=` di `0xd39870`, diikuti ID utuh, lalu memanggil GET wrapper `0x7017a4` di **`0xd39898`**. Tidak ada body, query lain, atau header khusus caller.
5. HTTP 200 diparse oleh `syb` / `0x771cc4`. Native membaca **`features` pada root**, bukan envelope `data`. Setiap feature dipetakan oleh `0x7721a0` melalui `geometry.type`, `geometry.coordinates`, dan `properties`, lalu parser `pyb` / `0x77233c`. Collection parser dan browser harus mempertahankan struktur geometri.

Client service dibangun dari dependency `FRb` (`0x770640–0x770660`), disimpan di `lFb+0x2b` (`0x77066c`), dan request mengambil `service+7 → FRb+7` (`0xd3984c–0xd39858`). Ini client utama dengan interceptor sesi `LRb` yang dibuktikan dalam [audit sertipikat](CERTIFICATE-DETAIL-FLOW.md) dan [audit transport](TRANSPORT-BOUNDARIES.md). Tidak diperlukan literal Authorization tambahan.

Pada awal audit, adapter `get-legacy-getparcelboundarybyid-d39898` masih inspect-only, sedangkan duplicate callsite `get-legacy-getparcelboundarybyid-dbaeb8` sudah enabled. Keduanya membentuk wire request endpoint/method/query yang sama; parser native duplicate adalah `qyb`, sedangkan jalur Koleksi adalah `syb`. Pemetaan UI bisa memakai adapter request yang sama setelah mencatat kedua sumber, tetapi jangan menafsirkan parser response keduanya sebagai kelas yang sama.

### Urutan koordinat dan batas klaim CRS

Konversi `0x7712d0` membaca **pasangan[1] → latitude** (`0x7712f4`, tagged integer 2 berarti indeks 1) dan **pasangan[0] → longitude** (`0x77131c`). Latitude dijepit ke −90…90 kemudian disimpan di objek map `+7` (`0x77137c`); longitude dibungkus ke −180…180 dan disimpan di `+0xf` (`0x7713fc`). Konstanta object pool yang diperiksa: `0xb998=-90`, `0x6ed8=90`, `0xb9a0=-180`, `0x6c68=180`, `0x6c78=360`.

Dengan demikian, input GeoJSON pada jalur native diperlakukan sebagai **`[longitude, latitude]`**, dan titik map memakai `LatLng(latitude, longitude)`. Parser mengolah nesting koordinat MultiPolygon; tipe `List<List<List<double>>>` muncul sebagai elemen hasil mapping di `0x772618`. Native mengambil properti utama `tipehak` / `TIPEHAK` / `TipeHak` (fallback `Belum Terdaftar`), `LUAS`, dan `NIB`.

Dalam parser yang diperiksa, `crs` tidak dibaca dan tidak ada reproyeksi sebelum konversi tersebut. Ini membuktikan asumsi sudut native, **bukan** datum geodesi atau EPSG server yang terverifikasi. Jangan mengubah data sumber, mengklaim akurasi pengukuran, atau menjadikan tampilan batas bidang sebagai bukti hadir di lokasi.

## Cabang BERKAS

Router membandingkan `BERKAS` di `0xda77c8`, membagi `contentId` dengan `:` di `0xda7804–0xda7810`, dan mengambil elemen 0 di `0xda7838`. ID diteruskan ke `0xd878dc` pada `0xda78b0`, kemudian ke `0xd87fe0` sebagai named argument `tbj` di `0xd87a28`. Builder memetakan `tbj` ke form field **`berkasId`** (`0xd881dc–0xd881e8`) dan melakukan `POST /berkas/CariBerkas` pada `0xd88218`. Ketiga parameter lainnya tetap null pada caller ini.

Controller juga memulai pembacaan tambahan `0xd87e00` dan `0xd87c14` sebelum membuka detail berkas. Audit ini membuktikan identifier/callsite utama, tetapi tidak mengklaim seluruh halaman Berkas dan semua aksi tambahannya telah diuji.

## Koreksi GetCollectionId

`GET collection/GetCollectionId` di **`0xd25250`** dipanggil dari detail berkas untuk memeriksa status koleksi/bookmark. Label `Detail koleksi saya` pada registry awal menyesatkan; label yang sesuai adalah **Status koleksi berkas**.

- `type` adalah literal **`BERKAS`** (`0xd25220`), bukan input bebas.
- `id` adalah **`berkas.berkasId + ':' + (berkas.kantor?.tipeKantorId ?? '')`**. Builder caller `0xd24fc0` mengambil `ABb+7` dan `ABb+0x3b → kantor+0x1b` di `0xd2502c–0xd2506c`. Parser `ABb` (`0x74ca78`) dan parser kantor (`0x74e3c0`) membuktikan nama-nama field itu.
- Respons `yEb` / `0x74ae18` berisi `error: bool?`, `message: String?`, `data: String?`. Konsumen yang diperiksa membaca **`message`** (`0xd250d0`, slot `+0xb`), memeriksa tidak kosong, lalu memperbarui state. Arti pasti `data` tidak ditetapkan hanya dari parser.
- Request ini tidak boleh dijadikan shortcut detail PERSIL atau dipanggil dengan `id` koleksi saja. Field `type` pada registry awal masih input bebas; pengetatan menjadi nilai tetap mencerminkan bukti callsite.

## Reproduksi dan batas

- Artefak `libapp.so` SHA-256: `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.
- [Ledger JSON](recovered/collection-detail-flow.json) menyimpan alamat, sumber, hash potongan assembly, dispatch, dan batas hasil.
- Jalankan `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/build_collection_detail_flow.py` untuk memeriksa hash artefak, dispatch, dan marker sumber sebelum membangun ledger. Potongan baru dibuat dengan `analysis/rea/dump_arm64_range.py` menggunakan environment Blutter yang sudah ada; literal sensitif tidak diperlukan.
- Keyakinan tinggi untuk pemetaan statis PERSIL dan koreksi status koleksi berkas. Tidak ada pengamatan runtime APK, request produksi, ID akun, modifikasi webapp, atau bypass lokasi dalam audit ini.
- Enum PERSIL/BERKAS hanya dinyatakan untuk router yang diperiksa, bukan daftar global semua tipe aplikasi. Grup bidang, mutasi koleksi, semua error server, role lain, dan transaksi dokumen tetap di luar cakupan audit ini.

## Implementasi kartu Berkas di web

[Audit tab Bidang dan grup](COLLECTION-GROUPS-FOLLOWUP.md) kini membuktikan model grup, filtering, urutan, halaman grup yang memakai stream Koleksi tanpa request baru, serta perbedaan indeks dan locale tanggal. Audit ini juga memperbaiki interpretasi kelas tab pada ledger kartu terdahulu tanpa menulis ulang bukti lama. Implementasi baca grup berikutnya dicatat pada rekap rilis di bawah.

[Bukti kartu dan controller native](COLLECTION-CARD-FOLLOWUP.md) melengkapi audit routing ini. Kartu Berkas pada sumber `a4698897` memakai field yang diaudit, sedangkan bidang PERSIL mempertahankan jalur baca sebelumnya. [Rekap rilis web](webapp/collection-verification-summary.json) mengikat 944 pemeriksaan fungsi/20 suite, termasuk 38 terfokus, 12 pemeriksaan browser sintetis dan deployment tanpa restart backend. Preview publik saat penerimaan terakhir anonim; tidak ada penerimaan akun baru yang diklaim. Grup Bidang native, semua mutasi, grammar tanggal Dart lengkap serta perbedaan backend yang menolak envelope HTTP200 `error:true` tetap belum disetarakan.

## Rilis baca grup pada webapp

Sumber `3d382b6c` menerapkan tab Berkas/Bidang, kartu dan isi grup, serta pembacaan detail dari ID konten sumber. Dua adapter Koleksi sekarang menerima envelope HTTP200 bertipe valid meski `error:true`, setelah validasi model; gap transport pada rilis kartu sebelumnya sudah diperbaiki. [Rekap rilis](webapp/collection-groups-verification-summary.json) mengikat 377 tes Node, 985 pemeriksaan fungsi/20 suite dan 25 uji browser sintetis. Build Docker dan empat aset publik cocok; preview setelah rebuild masih anonim. Ini tidak membuktikan penerimaan akun produksi terbaru, mutasi, seluruh perilaku Android atau submisi geotag. Bukti/ledger audit lama tetap utuh.
