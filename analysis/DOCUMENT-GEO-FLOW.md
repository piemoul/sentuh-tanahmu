# Lokasi dokumen Aktivitas: kontrak baca dan encoding q

Alur lokasi dokumen dapat dibangun sebagai pembacaan **GET `/apis/getGeoJsonInfo` pada main client**, dengan **contentId dokumen utuh** sebagai masukan q. q bukan persilid. Native mengubahnya dua kali: encode komponen UTF-8 terlebih dahulu, kemudian encode nilai query map. Respons modelnya dibaca langsung dari body dengan key `geometri` dan `tipeHak`, tanpa envelope `data`.

Ini bukti statis APK `id.go.bpn.sentuh` 6.1.5, ARM64 ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Tidak ada request produksi, penggunaan kredensial, modifikasi frontend/backend, pengiriman posisi, atau pengujian target runtime. [Ledger](recovered/document-geo-flow.json) dan [sumber terbatas](recovered/document-geo-flow) menyimpan kontrak serta batasnya.

## 1. Masukan dan request

[Audit dokumen Aktivitas](ACTIVITY-DOCUMENT-FLOW.md) membuktikan `showRoute` → ikon lokasi → generic mFb, dengan contentId utuh di `mFb+0xb`. Metadata.type tidak menentukan route untuk entry ini. Init `0x770190` meneruskan q melalui named argument `cth` ke controller+7; cabang nonnull memanggil `0xd39b74`, yang kemudian memanggil request helper `0xd39e50`.

Helper membaca service+7 lalu FRb+7 (`0xd39e90`, `0xd39e98`), yakni main client yang sudah digunakan pembacaan dokumen. Query map memiliki satu key `q` (`0xd39eb8`), hasil encoder `0x76e07c` (`0xd39ec4`). Path `/apis/getGeoJsonInfo` berada di `0xd39f0c`, panggilan GET di `0xd39f1c`. Tidak ada nama, NIK, latitude, longitude, accuracy, atau lokasi perangkat tambahan pada request ini. Bukti tersebut tidak mencakup efek interceptor/platform lain.

## 2. Encoding q yang tepat

Helper `0x76e07c` memanggil encoder `0x42ded4` dengan mask **2**, codec pool `0xc50`, dan spaceToPlus **false**. Tabel ASCII pool `0xb28` telah diekspor secara allowlist: tepat **128 code unit**, tanpa pool lain atau credential. Mask2 mempertahankan:

```text
A-Z a-z 0-9 - _ . ! ~ * ' ( )
```

Semua byte lain menjadi `%HH` uppercase; spasi menjadi `%20`. Codec `bg` memiliki CID **7128 / 0x1bd8**, dari metadata kelas tersimpan. Cabang CID tersebut menuju `0xb2a318`, worker `0xb2a500`: ASCII satu byte, UTF-8 dua/tiga byte, surrogate pair empat byte di `0xb2a908`. Surrogate UTF-16 terisolasi diganti **U+FFFD / EF BF BD** di `0xb2a458`. Karena itu `encodeURIComponent` setara untuk string yang well-formed; string dengan lone surrogate perlu dinormalisasi secara eksplisit jika ingin perilaku native yang sama.

Selanjutnya pembangun URI membaca query map `+0x4b` (`0x6bc63c`) dan memanggil `0x6bc738`. Wrapper mengaktifkan `cuh=true`; `PCc` default true pada `0x6bc798`. Nilai String diproses lagi melalui context+0x27 (`0x6bd1b4`, call `0x6bd1cc`). Closure pool `0xcbe8` dibuktikan relatif **`0x6bd4d4`** menggunakan alamat snapshot dan base dari log export yang sama. Closure memanggil `0x42eb74` → `0x42ded4`, kali ini **mask1 / spaceToPlus=true**. Mask1 mempertahankan hanya alnum dan `-._~`. `%` hasil tahap pertama menjadi `%25`.

| Masukan q sintetis | Nilai q setelah helper pertama | Teks query sebelum URI parser |
| --- | --- | --- |
| `a:b +%` | `a%3Ab%20%2B%25` | `q=a%253Ab%2520%252B%2525` |
| `!'()*~` | `!'()*~` | `q=%21%27%28%29%2A~` |
| `é/文😀` | `%C3%A9%2F%E6%96%87%F0%9F%98%80` | `q=%25C3%25A9%252F%25E6%2596%2587%25F0%259F%2598%2580` |
| lone surrogate `\uD800` | `%EF%BF%BD` | `q=%25EF%25BF%25BD` |

Hasil query ditambahkan ke path (`0x6bc6c0`) sebelum parser URI `0x439100` (`0x6bc6d4`). **Jangan melewatkan pre-encode native dan jangan decode escape yang sudah dihasilkan.** `URLSearchParams(innerQ)` masih berbeda pada beberapa karakter: ia mempertahankan `*` dan mengubah `~`, sedangkan native outer mask1 berlaku sebaliknya. Adapter khusus perlu mempertahankan tepat teks query yang terbukti. Audit ini membuktikan pembentukan teks tersebut, bukan rekaman paket atau seluruh proses interceptor setelahnya.

## 3. Respons dan kegagalan

HTTP harus **200** (`0xd39f38`). Body respons langsung diberikan ke model parser `0x772ab4` (`0xd39f40..0xd39f4c`). Tidak ada pembacaan `data`, `error`, `status`, atau `message` oleh model ini.

| Key case-sensitive | Aturan native |
| --- | --- |
| `geometri` | Missing/null, termasuk body null, menghasilkan model dengan list kosong; field lain tidak dibaca. |
| `geometri.type` | String nonnullable; tidak ada default. Nilainya disimpan, tanpa switch jenis geometri. |
| `geometri.coordinates` | Empat lapis list, hingga ordinate `num`, setiap angka dikonversi menjadi double. String angka/bool/null tidak dicoerce. |
| `tipeHak` | String; missing/null menjadi **`Belum Terdaftar`**. Tipe lain gagal. |

Dengan geometri hadir, model berisi satu `pyb`: `+7=type`, `+0xb=coordinates`, `+0xf=tipeHak`, kemudian dibungkus list pada `ryb+7`. Closure bertingkat `0x772da0 → 0x772e74 → 0x772f44 → 0x773014` membuktikan bentuk:

```text
coordinates[polygon][ring][vertex][ordinate]
```

Parser tidak mengubah Polygon tiga lapis menjadi empat lapis. Ia juga tidak memeriksa bahwa type bernilai `MultiPolygon`. GeometryCollection, Point, FeatureCollection, atau nested data envelope tidak boleh diterima berdasarkan dugaan.

HTTP bukan 200 menghasilkan tuple `(true,null)`. HTTP200 menghasilkan `(false,model)`, termasuk model kosong. Catch helper hanya menyerap exception tipe `sa` yang kompatibel (`0xd39ff4..0xd3a070`); exception lainnya diteruskan kembali (`0xd3a07c`). Jangan menyebut semua error parser native sebagai fallback empty yang aman.

Controller membaca tuple.model, bukan tuple.error. Model null/list kosong menyebabkan return tanpa render baru (`0xd39bd4..0xd39bf0`). Map controller+0x43 juga harus nonnull (`0xd39bf8..0xd39c0c`). Tidak ada teks error khusus di cabang return tersebut. Browser dapat menampilkan error/kosong yang jelas sebagai keputusan UX, tanpa meniru no-op atau crash native.

## 4. Geometri dan tampilan

Judul page adalah **Lokasi Bidang** (`0x907654`). Controller meratakan vertices semua polygon/ring, mengonversi pasangan melalui `0x7712d0`, lalu menghitung rata-rata aritmetika latitude dan longitude lewat `0x771418`. Vertex penutup yang berulang ikut dihitung. Ini **bukan centroid area**. Marker `geojson_marker` serta kamera memakai hasil tersebut. Flag mFb+0x13=true diteruskan sebagai controller+0xf melalui `mlj`; zoom cabang Aktivitas adalah **18**, alternatif false adalah17.

Konversi pasangan memakai `input[1]` sebagai latitude dan `input[0]` sebagai longitude (`0x7712f4`, `0x77131c`). Ordinate tambahan tidak dipakai. Native mengapit latitude ke [-90,90] dan melipat longitude ke [-180,180). Tidak ditemukan validasi finiteness, panjang minimum ring, penutupan ring, atau geometri legal dalam batas helper ini.

Render `0x770a08` membuat setiap `coordinates[i]` sebagai polygon. **Ring pertama** menjadi outer points (`0x770b44`); **skip(1)** menjadi hole rings (`0x770c0c`). Nama polygon `polygon_<modelIndex>_<polygonIndex>`. `type` tidak mengubah keputusan ini. Styling diambil dari **tipeHak model pertama** melalui `0x770e18`; exact numeric color values belum diekspor dan tidak diperlukan untuk menghubungkan pembacaan awal.

Tidak ditemukan ringkasan NIB, luas, alamat, atau identitas dokumen pada build terbatas. Jangan mengarang field tersebut dari respons yang belum diamati. Nama page dan legenda adalah literal UI. Legenda menampilkan Hak Milik, Hak Guna Usaha, Hak Guna Bangunan, Hak Pakai, Hak Pengelolaan, Hak Wakaf, Tanah Adat, dan Belum terdaftar. Perhatikan literal default parser `Belum Terdaftar` berbeda kapitalisasi dari label/switch `Belum terdaftar`; jangan mengklaim styling fallback persis sebelum nilai warna ditelaah.

## 5. Batas aksi tambahan

- Pembacaan awal yang dibuktikan adalah GET dengan q. Tidak ada submisi koordinat di helper ini.
- Recenter `0x908a98 → 0x908b08` menggunakan center tersimpan dan memperbarui kamera lokal, tanpa request pada helper tersebut.
- Legenda `0x908f00 → 0x908f74 → 0x908fd0 → 0x909040` membangun dialog statis **Legenda Persil**.
- Rute `0x908bc0` membangun string koordinat dan meneruskan callback `0x908ddc → 0xdaa400`; efek peluncuran rute/logging belum dituntaskan. Jangan aktifkan berdasarkan audit baca ini.
- Callback lokasi/zoom `0x908a28 → 0xdaa110`, pemilihan layer, inisialisasi izin platform, tap/neighbor lookup, subscription posisi, dan seluruh kemungkinan mutasi di luar flow ini belum diklasifikasi lengkap. Audit ini **tidak** menyatakan semua kontrol peta read-only.

Membuka geometri dokumen tidak membuktikan hadir di lokasi, tidak mengganti validasi geotag, dan tidak memberi dasar untuk submisi lokasi atau penandatanganan dokumen.

## Verifikasi

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/build_document_geo_flow.py
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_document_geo_flow.py
```

Hasil: **24 hash sumber, 3 dependensi, 5.038 instruksi tepat dari ELF, 128 mask ASCII hasil export snapshot, 5 vector encoding, dan 1 entry dispatch** terverifikasi. `main.cpp` shared telah dikembalikan byte-exact ke SHA-256 `b317ef86094e22b3bc12bea20e48400ba20d1924246cc2f504d47f799f4ac1e2`. Ekspor menggunakan patch allowlist sementara; backup, source exporter, hash restore, dan output tabel disimpan dalam folder bukti. Build exporter hanya digunakan membaca snapshot, bukan menjalankan APK atau menghubungi server.

Masih belum terbukti: respons produksi aktual, keberhasilan akun nyata, wire capture, semua interceptor, basemap/provider, semua toolbar dan tap details, seluruh style warna, serta penerimaan server terkini. Kontrak ini cukup untuk merancang adapter baca khusus dan renderer yang memelihara struktur polygon/holes, dengan error browser eksplisit dan tanpa menambahkan aksi mutasi.
