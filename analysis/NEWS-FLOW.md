# Berita dan Pengumuman: bukti native daftar → URL

Audit statis APK Sentuh Tanahku 6.1.5, ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Tidak ada perubahan aplikasi/backend, permintaan jaringan, pembacaan kredensial, atau uji runtime dalam audit ini.

Ledger kanonis: `analysis/recovered/news-flow/flow.json`. Verifier: `analysis/rea/verify_news_flow.py`. Bukti terdiri dari 25 rentang sumber, 5.213 instruksi ELF unik, 224 penanda, 268 referensi pool, 18 blok konstanta, 17 entri dispatch, dan 17 dependensi yang dipin hash. `sources.json` menentukan berkas sumber yang termasuk ledger; berkas lain yang tidak tercantum bukan bukti kanonis.

## Kontrak yang siap digunakan

| Alur | Request native | Hasil yang dibaca |
| --- | --- | --- |
| Berita / Siaran Pers Kementerian | `GET Berita/GetBerita?limit=8`, call `d2cb24` | `response.data.message` sebagai List |
| Pengumuman | `GET Pengumuman/GetPengumuman?limit=5`, call `d2cf54` | `response.data.message` sebagai List |

Keduanya menuntut status HTTP 200. Bila `response.data` adalah String, native melakukan JSON decode terlebih dahulu; selain itu body diindeks langsung. Tidak ada pemeriksaan `body.error` dan tidak ada pembacaan `body.data` pada kedua helper ini. `message: []` merupakan hasil parsing yang berhasil. Non-200 atau `message` bukan List menghasilkan flag gagal; controller mengganti daftar dengan list kosong. Kesalahan cast/decode juga mencapai flag gagal, kemudian controller mengabaikan isi sekunder tuple gagal. Jangan menerapkan parser envelope `data` generik untuk fitur ini.

Model `zCb` (Berita, parser `75b28c`) dan `ACb` (Pengumuman, parser `75b6e0`) memiliki kontrak identik:

| Key persis | Tipe | Offset | Penggunaan pada alur ini |
| --- | --- | --- | --- |
| `id` | `String?` | `+7` | Disimpan; bukan parameter request detail |
| `title` | `String?` | `+b` | Teks judul kartu |
| `category` | `String?` | `+f` | Disimpan; tidak dipakai sebagai filter/tab pada builder yang diaudit |
| `banner` | `String?` | `+13` | Sumber gambar kartu |
| `url` | `String?` | `+17` | URL viewer setelah kartu dipilih |

Nilai hilang/null tetap null pada model. Nilai non-null dengan tipe lain gagal cast. Tidak ada field tanggal, isi artikel, deskripsi, atau HTML yang dibaca oleh model ini.

## Rantai fungsi dan transport

Komposisi home membuat `ECb` pada `8c08d4`/`8d9f4c` dan `HCb` pada `8c0a14`/`8d9f64`. Judul blok Berita pada komposisi pertama adalah **Siaran Pers Kementerian**, bukan label API. Dispatch mengikat `ECb` → `_FCb` → init `75b0f8`/build `8e1a90`, serta `HCb` → `_ICb` → init `75b54c`/build `8e2834`. Ini membuktikan blok home; tidak membuktikan bahwa APK mempunyai halaman mandiri `/news` atau seluruh conditional login pada root home.

Kedua init mengambil singleton `wCb`, lalu controller `d2c904`/`d2cd34`. Konstruktor `708ac8` membuat stream list kosong pada `wCb+17`/`+1b`, satu stream busy bersama pada `+23` dengan nilai false, dan menyimpan `DCb` pada `+27`. Konstruktor service `709030` menyimpan `FRb` hasil lookup pada `DCb+7`. Kedua endpoint membaca field itu dan memanggil clone `746b44`.

Bukti clone sudah tersedia dalam ledger `kkpr-document-flow.json` dan `transport-boundaries.json`: opsi/adapter main client disalin, kemudian interceptor LRb/AP dipasang. Audit ini memin dependensi tersebut, tanpa mengekstrak origin atau material rahasia lagi. Tidak ada body, query map tambahan, options, checksum, versi, device ID, atau header khusus di dua callsite Berita/Pengumuman. Tidak ada gate sesi pada caller init/service yang diaudit. Klasifikasi statis yang dapat dipakai adalah **optional session melalui transport main yang sudah ada**; akses anonim pada server saat ini belum diuji.

## Daftar dan kartu

Controller berhenti sebelum request jika list cache sudah berisi item. Jika list kosong, init berikutnya dapat mengambil ulang. UI memakai panjang seluruh list hasil server, tanpa pemotongan lokal, sorting, pagination, atau filter kategori di jalur ini. `limit=8`/`limit=5` hanya berada pada URL request.

Snapshot waiting, shared busy true, snapshot error, data null, dan list kosong semuanya menuju builder placeholder yang sama (`8e1d5c`/`8e2b00`) dengan empat skeleton. Tidak ada pesan error/empty terpisah atau tombol retry dalam kedua builder ini. Daftar horizontal mempunyai tinggi 180; banner kartu diberikan ukuran 200×100 dan fit cover. Judul memakai plain Text, null menjadi string kosong, maksimum tiga baris dan ellipsis. Banner null juga menjadi string kosong. Placeholder gambar memakai helper bersama `8e2644`; kegagalan gambar memakai ikon konstan dari callback `8e25e4`.

Builder memilih item berdasarkan indeks, menangkap objek yang dipilih dalam closure, kemudian mengikat callback `8e24f0` (Berita) atau `8e30d4` (Pengumuman). Keduanya memakai factory detail bersama `8e2590`. Tidak ada pencarian ulang berdasarkan ID atau API detail Berita dalam callback tersebut.

## Detail adalah URL di WebView

Factory `8e2590` membaca `selected.url+17`, membuat `DRb`, mengisi judul toolbar dengan string kosong, URL pada `+f`, dan flag `+13=false`. Pada build `_ERb` (`9ca028`), URL null menjadi string kosong. Native tidak menonaktifkan kartu yang URL-nya null.

Rantai penting yang dibuktikan:

1. Widget URL → konversi URI `439100` → wrapper `NLa` melalui `842360` (`9ca06c..9ca0a4`). Implementasi parser URI lengkap tidak diaudit ulang.
2. Wrapper itu menjadi argumen posisi constructor request `rLa` `8650a0`, tersimpan di `rLa+63` pada `865a94`.
3. Serializer `8624dc` membaca `+63` dan menulis key **`url`** (`86281c..862840`).
4. Request diberikan sebagai argumen bernama `RKg` kepada widget `JIa` (`9ca3bc/9ca3c0`). Constructor `83f37c` menyimpan argumen itu pada parameter platform `+157` (`83f89c/83f8a4`).
5. Serializer platform membaca `+157`, menjalankan serializer request, dan menulis **`initialUrlRequest`** (`861ea8..861ee8`). Slot **`initialData`** `+15f` tidak diisi pada panggilan ini.

Dengan demikian, detail mengambil sumber dari URL yang dikembalikan server. Tidak ada HTML artikel dari list response yang dirender sebagai isi lokal. Caller viewer ini tidak memasok header khusus, method, atau body request. Jangan menyimpulkan bahwa token API otomatis diteruskan ke URL artikel.

Sebelum navigasi, kedua onTap juga memanggil helper async `d1cf2c` yang membaca state `isIkd` dan memanggil helper otorisasi yang sudah ada. Callback tap langsung melanjutkan navigasi tanpa await atau branch terhadap hasil helper. Efek downstream helper itu tidak diaudit penuh; jangan menyalin pemanggilan tersebut otomatis ke handler link browser hanya untuk meniru satu baris callback native.

## Batas implementasi berikutnya

Validasi skema/origin URL, pembukaan link secara terisolasi, fallback gambar, pesan empty/error dan retry yang jelas, serta batas ukuran data di browser harus dicatat sebagai adaptasi web. Tidak ada bukti dalam audit ini yang mengizinkan proxy URL arbitrer dengan kredensial main API.

Belum diuji: respons server terkini, akses anonim, kebijakan frame/CSP artikel, URL/banner aktual, seluruh opsi/cookie/navigation/download WebView, perilaku platform Android, dan kesamaan visual piksel. Audit ini tidak mengubah GPS, geotag, atau submisi dokumen.

Verifikasi lokal:

```powershell
tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_news_flow.py
```
