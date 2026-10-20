# Alur daftar → detail Sertipikatku (APK 6.1.5)

**Terbukti secara statis: sertipikat analog memakai `legacy/GetInfoSertifikat`, sedangkan sertipikat elektronik memakai `Brankas/DetailSertipikatNew`.** Jangan mengirim semua ID daftar ke endpoint Brankas. Audit ini tidak menghubungi server, membaca data akun, atau menjalankan APK.

| Kondisi baris daftar | Halaman / state APK | Permintaan detail utama | Autentikasi pada alur sesi normal |
| --- | --- | --- | --- |
| `StatusEl`/`statusEl` null atau integer 0 | `OIb` / `PIb` | `GET legacy/GetInfoSertifikat?sertifikatId=<SertifikatId>` | `tokenType + " " + accessToken` |
| `StatusEl`/`statusEl` integer selain 0 | `QIb` / `_RIb` | `GET Brankas/DetailSertipikatNew?id=<SertifikatId>` | `tokenType + " " + accessToken` |

Kedua request tidak memiliki body. ID berasal dari `SertifikatId`/`sertifikatId` baris yang dipilih; ejaan `sertifikatId` pada query analog berbeda dari ejaan nama endpoint `DetailSertipikatNew`. Gunakan hanya baris milik sesi pengguna. Model respons berbeda: analog `AIb`, elektronik `HIb`.

## Bukti rantai panggilan

1. Parser daftar yang sudah dipetakan menyimpan ID `GIb+0x17`, StatusEl `GIb+0x23`. Callback `0x955cd4` memeriksa StatusEl (`0x955d1c`, `0x955d24`, `0x955d9c`). Cabang analog menaruh ID pada `OIb+0xb` (`0x955d80`/`0x955df4`); cabang elektronik menaruhnya pada `QIb+0xb` (`0x955f68`). Sumber: `recovered/request-callsites/range-00955cd4.asm.txt`.
2. Tabel dispatch snapshot menutup celah metode virtual yang tidak diberi nama oleh Blutter. Register tabel ARM64 mengacu ke elemen 4096. Framework memanggil pembuatan state dengan `classId + 0xc1e3` di `0xa6ddac–0xa6ddb8`; callback awal state memakai `classId + 0xcda3` di `0xaa334c–0xaa3358`. Empat resolusi berikut diperiksa terhadap tabel asli:

   | Kelas / CID | Indeks tabel absolut | Target |
   | --- | --- | --- |
   | OIb / 6188 | 59919 | `0xa0124c` → alokasi PIb `0xde57a8` |
   | QIb / 6187 | 59918 | `0xa0135c` → alokasi _RIb `0xde57b4` |
   | PIb / 5370 | 62109 | `0x77f86c` |
   | _RIb / 5369 | 62108 | `0x782864` |

   Framework memasang widget ke `state+0xb` di `0xa6df30`. Ini bukti alamat dispatch, bukan dugaan dari kedekatan fungsi dalam berkas assembly.
3. Analog: `0x77f93c` mengambil `state.widget+0xb` → `0x77f948` memanggil `0xd430e8` → `0xd43124` memanggil `0xd43314`. Builder menaruh ID pada query **sertifikatId** (`0xd43370–0xd4337c`), memanggil wrapper GET `0x7017a4` pada `0xd4340c`. Model hasil `AIb` diteruskan ke state controller.
4. Elektronik: `0x782934` mengambil `state.widget+0xb` → `0x782940` memanggil `0xd43910` → `0xd4394c` memanggil `0xd43ac4`. Builder menaruh ID pada query **id** (`0xd43b1c–0xd43b28`), memanggil wrapper GET pada `0xd43b54`. Respons diparse oleh `0x782988` menjadi `HIb`.

## Client dan header final

Kedua constructor state mengambil dependency `FRb`, membuat service `XIb` dengan `XIb+7 = FRb`, lalu membuat controller `qIb`. Constructor `0x709368` menyimpan service pada `qIb+0x5f` (`0x709954`); controller disimpan pada `state+0x13`. Builder detail membaca `XIb+7` lalu `FRb+7`, yaitu client utama.

Registrasi `FRb` memakai closure `0x70be2c` di `0x70b838–0x70b860`. Closure membuat `FRb` dan memanggil constructor `0x6bb2a4`. Constructor menggunakan base `TRb.AYi` dan menyimpan client utama ke `FRb+7` (`0x6bb32c`), lalu memasang interceptor `LRb` (`0x6bb570`, `0x6bb580`). Selector base produksi telah dibuktikan dalam [audit transport](TRANSPORT-BOUNDARIES.md).

Builder analog memang memasang header `Authorization` sendiri di `0xd433a8–0xd433cc` (nilainya tidak dicantumkan). Itu **bukan header final** pada alur dengan sesi aktif:

- Kedua path tidak cocok dengan regex common milik LRb (`0x6b7d7c`).
- LRb membaca storage sesi pada `0xd0dc44`; parser `0x6b1eb0` menyimpan `tokenType` ke `fyb+7` dan `accessToken` ke `fyb+0x13`.
- Jalur sesi tersedia membentuk `tokenType + " " + accessToken` di `0xd0df78–0xd0dfb8`, lalu **menetapkan ulang** `headers["Authorization"]` di `0xd0dfd4–0xd0dfe0` sebelum meneruskan request di `0xd0dfec`. Tidak ada syarat "header belum ada" pada penetapan tersebut.

Karena itu adapter analog dapat menggunakan autentikasi sesi normal dan wajib memerlukan sesi. Tidak perlu menyimpan, membocorkan, atau meniru literal Authorization builder. Bukti ini tidak menyatakan jalur tanpa sesi diterima server.

## Reproduksi dan batas

- Artefak `libapp.so` SHA-256: `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.
- [Ledger JSON](recovered/certificate-detail-flow.json) memuat rantai, alamat, sumber, kondisi, dan batas hasil.
- [Tabel dispatch](recovered/certificate-detail-dispatch/dispatch-addresses.tsv) diekspor oleh `analysis/rea/export_dispatch.cmd` menggunakan loader Dart lokal yang telah tersedia. Mode `--dispatch-only` hanya menulis indeks dan alamat kode relatif, bukan nilai object pool, kredensial, atau memori akun. Hash tabel: `1b54c8b836ae0208273fe9f5393b15c0a3f60c069a34058ca9cfc5e6372f2ec4`.
- `analysis/rea/build_certificate_detail_flow.py` memeriksa hash artefak, empat resolusi dispatch, dan keberadaan semua sumber sebelum menulis JSON.
- Confidence **tinggi untuk alur detail utama statis**. Penerimaan server, visual native, seluruh aksi detail, retry/error, dan role lain tetap memerlukan pengujian terpisah. Initializer juga memulai bacaan tambahan (`0xd42d40` analog; `0xd43658` elektronik); laporan ini tidak menganggap kedua bacaan itu atau seluruh layar sudah terpenuhi.
- Tidak ada panggilan produksi, pengambilan ID pengguna, perubahan webapp, perubahan validasi lokasi, atau bypass integritas dalam audit ini.
