# Info Layanan: service dan model native

Audit statis terbatas pada APK 6.1.5 yang diberikan, `libapp.so` SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Tidak ada panggilan produksi atau perubahan adapter. Alur widget dan form simulasi merupakan audit terpisah.

Constructor `0x9fb7c4` mengambil `FRb` (`0x9fb800/0x9fb80c`), mengikatnya ke service `+7` (`0x9fb820`), lalu service ke controller `+7` (`0x9fb82c`). Seluruh helper di bawah membaca service `+7 → FRb+7`, yaitu client utama. Batas LRb/auth/serializer tetap mengikuti [audit transport](TRANSPORT-BOUNDARIES.md); URL ini tidak cocok dengan regex `/common/`. Tidak ada header autentikasi atau checksum khusus caller. Route yang bisa dibuka tanpa login tidak sendiri membuktikan server menerima request anonim.

| Fungsi | Transport caller | Respons native |
|---|---|---|
| Daftar | helper `0xd2f714`, GET `InfoLayanan/GetInfoLayanan` di `0xd2f77c`; tanpa body/query | HTTP 200; String body di-JSON-decode; `body.error == true` ditolak; `body.data` harus List, setiap item Map. Sukses `(false,List<aDb>)`; non-200, bentuk salah, atau exception menghasilkan `(true,[])`. |
| Detail | helper `0xd2f33c`, GET di `0xd2f3c0`; string ID langsung digabung dengan `InfoLayanan/GetInfoLayananDetail?id=` | HTTP 200; String body di-JSON-decode; `body.error == true` ditolak; `body.data` harus Map. Sukses `(false,bDb)`; kegagalan menghasilkan `(true,null)`. |

Kedua helper membandingkan `error` terhadap boolean true secara dinamis; tidak ada cast `bool?` pada field itu. `"true"`, `1`, atau field hilang tidak boleh otomatis diubah menjadi true oleh rekonstruksi. Map/field lain tetap harus lolos parsing. Encoding URI setelah URL concatenation berada di composer transport dan tidak disertifikasi oleh audit ini.

Controller daftar `0xd2f588` mempublikasikan list kosong saat flag error; controller detail `0xd2f1e8` mempertahankan detail yang ada saat error dan menyelesaikan loading. Ini tidak membuktikan browser sebaiknya mempertahankan data dari pilihan lain: kepemilikan hasil async tetap perlu dijaga.

`aDb` parser `0x75f180` menyimpan nullable String `layananId`, `nama`, `deskripsi`, `grup` pada offset `+7,+0xb,+0xf,+0x13`. `tipeSimulasi` tetap dibaca dan diperiksa `int?`, tetapi tidak disimpan oleh objek empat-field itu. List mempertahankan urutan sumber.

`bDb` parser `0x75eaa8` menyimpan:

| Key JSON persis | Tipe | Offset |
|---|---|---|
| `layananId` | `String?` | `+7` |
| `nama` | `String?` | `+0xb` |
| `persayaratan` | `List<String>?` | `+0xf` |
| `penyelesaian` | `List<String>?` | `+0x13` |
| `keterangan` | `List<String>?` | `+0x17` |
| `tarif` | `String?` | `+0x1b` |
| `tipeSimulasi` | `int?` | `+0x1f` |

Ejaan `persayaratan` adalah kontrak asli. Missing/null tetap null. List nullable tidak otomatis menjadi list kosong dalam parser; elemen dipetakan dengan cast **String nonnull**, sehingga angka/null di dalam list gagal. Teks HTML atau format rich text tidak disimpulkan dari model.

Enam helper simulasi membentuk map, meng-JSON-encode melalui `0x6b27e0`, meminta caller `Content-Type: application/json`, lalu POST. Header akhir bisa diubah LRb; ini bukan bukti header wire final.

| Tipe | POST call | Field map |
|---|---|---|
| 1 | `0xda2f48` | `WilayahId`, `Luas`, `Penggunaan`, `Prosedur` |
| 2 | `0xda3490` | `WilayahId`, `data`; tiap item `data`: `Jumlah`, `Luas`, `Penggunaan` |
| 3 | `0xda3a30` | `WilayahId`, `Luas`, `Penggunaan`, `LayananId` |
| 4 | `0xda3f14` | `NilaiPerMeter`, `Luas` |
| 5 | `0xda4268` | `WilayahId`, `Luas`, `Penggunaan`, `Kewenangan` |
| 6 | `0xda474c` | `WilayahId`, `Luas`, `Penggunaan`, `Prosedur` |

Path masing-masing `InfoLayanan/SimulasiTipe1` sampai `SimulasiTipe6`. Semuanya memakai response helper `0x8e8278`: HTTP 200, String body di-JSON-decode, `error == true` menghasilkan kegagalan, `data` harus Map yang diparse `kDb` (`0x8e83d0`). Empat field hasil adalah nullable String: `pengukuran`, `pendaftaran`, `pemeriksaanTanah`, `totalBiaya`. Caught failure menghasilkan `(true,null)`.

Intent kalkulasi biaya dapat diinferensikan dari request/result tersebut, tetapi **client statis tidak membuktikan server tidak memiliki side effect**. Tidak ada simulasi yang diaktifkan atau dikirim dalam audit ini. Form, default, enum, validasi numerik, lookup wilayah, serta seluruh navigasi harus dibuktikan sebelum implementasi lengkap.

Ledger: [flow.json](recovered/information-services/flow.json). `analysis/rea/verify_information_services.py information-services` membandingkan 19 source hashes, 2.004 instruksi ELF, 120 marker, dan dua dependency yang diikat hash. Server acceptance, UI runtime, dan seluruh menu tetap di luar kesimpulan ini.
