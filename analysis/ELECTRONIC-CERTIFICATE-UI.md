# Detail sertipikat elektronik: model dan ikatan UI APK

Audit statis terbatas pada APK resmi 6.1.5 arm64, `libapp.so` SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Tidak ada request produksi, data akun, modifikasi APK, perubahan GPS, atau perubahan integritas selama audit. Bukti ini menetapkan kontrak tampilan, bukan penerimaan server ataupun kesamaan piksel yang telah diuji pada APK.

Rantai daftar → `QIb` / `_RIb` → `GET Brankas/DetailSertipikatNew?id=<selected SertifikatId>` sudah dibuktikan dalam [alur detail](CERTIFICATE-DETAIL-FLOW.md). Model elektronik ialah **HIb, CID 540**, berbeda dari AIb analog. Ejaan field respons elektronik adalah lower camel case; jangan mengganti `sertipikatId` dengan `sertifikatId`.

## Model HIb

Parser `0x782988` membaca key berikut; penetapan field terakhir berada pada `0x78351c–0x78359c`. Semua field di bawah menerima null melalui cabang eksplisit kecuali `statusDI301A`, yang divalidasi sebagai bool. Tidak ada fallback key kapital pada parser ini.

| Key JSON | Offset HIb | Bentuk wire / model |
|---|---|---|
| sertipikatId | +0x7 | String? |
| jenisHak | +0xb | String? |
| kodeHat | +0xf | String? |
| nibel | +0x13 | String? |
| letak | +0x17 | String? |
| berakhirHak | +0x1b | String? wire, dikonversi helper tanggal 0x6beed4 |
| tanggalPenerbitan | +0x1f | String? wire, dikonversi helper tanggal 0x6beed4 |
| listPemilik | +0x23 | List<String>? |
| kodeSatker | +0x27 | String? |
| luas | +0x2b | String? — bukan angka JSON pada parser ini |
| noSk | +0x2f | String? |
| tanggalSk | +0x33 | String? wire, dikonversi helper tanggal 0x6beed4 |
| catatan | +0x37 | List<IIb?>?, setiap input item diparse dari map |
| persilId | +0x3b | String? |
| isPrinted | +0x3f | int? — bukan bool |
| kodeBlanko | +0x43 | String? |
| statusDI301A | +0x47 | bool, tidak ada fallback null yang aman |

Parser juga membaca `persil`, memanggil helper `0x7835b4`, tetapi hasil itu tidak disimpan dalam 17 field HIb tersebut. Jangan menjadikan `persil.batasbidang` sumber peta layar berdasarkan keberadaan key saja.

`listPemilik` null menjadi list kosong ketika diteruskan ke renderer (`0x94c940–0x94c968`), bukan pada parser HIb. `catatan` null tetap diteruskan sebagai null dan ditangani renderer. Model catatan **IIb, CID 539**, parser `0x784458`, menyimpan empat String nullable: `kolom1 +7`, `kolom2 +0xb`, `kolom3 +0xf`, `kolom4 +0x13` (`0x7846f4–0x78470c`). Tidak ada `Status` atau `CatatanId` pada model ini.

## Urutan layar

Closure milik `_RIb` pada `0x94c83c` memanggil helper berikut dan menyimpan child dengan urutan yang sama pada `0x94ca6c–0x94ca8c`:

1. Ringkasan: `0x94fb40`, dipanggil `0x94c904`.
2. **Lokasi Bidang Tanah**: `0x94eccc`, dipanggil `0x94c920`.
3. **Pemilik**: `0x94e68c`, dipanggil `0x94c974`, input `listPemilik`.
4. **Catatan Pendaftaran**: `0x94dc1c`, dipanggil `0x94c998`, input `catatan`.
5. **Kode QR**, conditional: `0x94d014`, dipanggil `0x94ca1c`.

Tidak ada bagian Surat Ukur pada daftar child ini. Bagikan Akses dan Buka Sertipikat adalah aksi tersendiri; label atau callback tidak membuktikan kontrak lengkap aksi tersebut.

## Ringkasan

| Tampilan | Ikatan / kondisi | Bukti |
|---|---|---|
| Headline | `nibel`; null → `-`; nonnull dipecah `substring(0,2) + '.' + substring(2,4) + '.' + substring(4,13) + '.' + substring(13,14)` | 0x94ff7c–0x950100 |
| Lencana | literal `E` | 0x950260 |
| Jenis hak | `jenisHak`; null → `-` | 0x950340–0x95035c |
| Kode Sertipikat | `kodeHat`; disembunyikan bila **baris daftar `Dibagikan === true`** | 0x950480–0x9504c8 |
| Tanggal Penerbitan | `tanggalPenerbitan`, helper date-to-string 0x6be088 lalu formatter bersama 0xd910bc | 0x9504fc–0x950590 |
| Berlaku Sampai | `berakhirHak`; representasi date-to-string tepat `9999-12-31T00:00:00.000` → `-`, lainnya formatter bersama | 0x9505c0–0x95068c |
| Status Cetak | lihat kondisi di bawah | 0x9506bc–0x950754 |
| Kode Blanko | `kodeBlanko`; baris hanya saat kondisi sudah dicetak di bawah | 0x950784–0x9507f4 |
| Kode Satker | `kodeSatker`; opsional | 0x950828–0x95084c |
| No. SK | `noSk`; opsional | 0x95087c–0x9508a0 |
| Tanggal SK | `tanggalSk` melalui formatter, **hanya dievaluasi jika `noSk` nonnull**; opsional | 0x9508d0–0x950970 |

Kondisi Status Cetak:

```text
printed = (kodeBlanko != null && kodeBlanko != "") || isPrinted == 1
if printed: "Sudah dicetak"
else if statusDI301A == true: "Tidak Dicetak"
else: "Belum dicetak"
```

Kondisi `printed` yang sama mengendalikan keberadaan baris Kode Blanko. Jadi `isPrinted == 1` tetap menampilkan baris meskipun kodeBlanko kosong/null. Null value pada helper baris menjadi `-`; string kosong tidak otomatis berubah menjadi `-`.

Helper baris `0x950a88` menerima flag opsional `LOj`, default false. Hanya Kode Satker, No. SK, Tanggal SK yang mengirim true. Untuk flag true, baris disembunyikan jika nilai hasil tampilan null, string kosong, `-`, atau **mengandung substring `0001` di mana pun**. Ini bukan hanya pemeriksaan awalan tahun. Pengecekan pada `0x950af8–0x950b90`; dispatch string CID94/95 dengan selector `-0x1000` menghasilkan `0xca6c90` / `0xca6b7c`. Implementasi mencari indeks dan membandingkan hasil terhadap nol; bukan startsWith.

Flag `Dibagikan` berasal dari GIb+0x2b, parser key pada `0x786494`, store `0x786524`, dibawa ke QIb+0x13 melalui `0x955e78` / `0x955f78`. Saat true, ringkasan juga menampilkan prefix `Dibagikan kepada saya sampai ` dengan `DibagikanSampai` yang telah diproses helper `0x955b24` (`0x955e84–0x955e98`, store QIb+0x17 `0x955f80`, display `0x94fd04–0x94fd30`). Format tepat helper itu belum dipetakan audit ini; memakai nilai sumber pada browser merupakan perbedaan format yang harus dicatat.

Implementasi browser boleh menjaga `nibel` non-14-karakter dengan menampilkan sumber utuh, agar tidak memotong atau melempar error. Itu guard browser tambahan; native memakai substring tanpa validasi panjang pada helper yang diperiksa. Tanggal mentah juga merupakan keputusan browser, bukan klaim format native 1:1. Lihat [audit formatter bersama](CERTIFICATE-DATE-FLOW.md) untuk batas grammar tanggal.

## Lokasi dan peta

Bagian lokasi menampilkan konten hanya bila **top-level `persilId` nonnull** (`0x94ee54–0x94ee60`). Jika null, tampil `Tidak ada data!`. String kosong tetap melewati cabang native; browser sebaiknya tidak mengirim query ID kosong.

Konten tersebut terdiri atas:

- `letak`, null → `-`, pada `0x94eea0–0x94eeb8`.
- `Luas ` + hasil number formatter atas parsed double dari string `luas` + ` m2`, pada `0x94efa8–0x94f054`. `luas` nonnull dipaksa pada cabang ini. Konfigurasi penuh number formatter belum dibuktikan; raw string dengan satuan merupakan perbedaan format yang eksplisit.
- Peta menggunakan **`persilId` yang sama tanpa transformasi**: read `0x94f2f4` → helper `0x947e54` pada `0x94f310`, lalu widget reactive `0x94f814`. Helper ini sama dengan [peta analog](CERTIFICATE-MAP-FLOW.md), yang terbukti meminta `legacy/GetParcelBoundaryById?persilid=<ID>` melalui client sesi utama. Tidak ada kebutuhan mengganti GPS, geotag, checksum, header, atau origin.

Closure peta `0x94f84c` / `0x94fae0` membuat mFb melalui allocator `0xd4292c` (CID6225); preview/fullscreen memakai ID yang ditangkap. Basemap dan seluruh kontrol native belum diuji; sketsa SVG browser tetap mempunyai batas yang sama seperti peta analog.

## Pemilik dan catatan

Pemilik adalah list **string**, bukan objek PemilikPertama analog. Native menampilkan literal `• ` ditambah setiap string dengan urutan asli (`0x94eb48`, prefix `0x94eba0`, item `0x94ebe8`). Untuk list kosong, helper tetap memiliki judul; tidak ditemukan label Tidak ada data dalam helper `0x94e68c–0x94eccc`.

Catatan elektronik berbeda dari analog. Loop `0x94dc94–0x94e18c` mempertahankan urutan input:

1. Mengambil **hanya kolom1 untuk text**, nullable → string kosong, mengubah `<br\\s*/?>` menjadi newline, memecah newline, menggunakan closure TextSpan bersama `0x945820` (`0x94dd18–0x94ddf4`).
2. Melewatkan record hanya jika keempat kolom null (`0x94de04–0x94de48`). String kosong bukan null.
3. Membuat RichText dari list span kolom1 tersebut (`0x94e0b4–0x94e0b8`). **Kolom2–4 hanya dipakai untuk cek all-null dalam renderer ini**, bukan tiga paragraf tambahan.

`catatan == null` atau list kosong membuat pesan `Tidak ada data!` (`0x94dc6c–0x94dc80`, `0x94e198–0x94e224`). List nonempty yang seluruh record all-null tidak melewati cabang pesan itu; hasil visual empty-state akhir harus dibedakan dari null/empty input bila menuntut kesamaan piksel.

Browser harus meng-escape teks; konversi br tidak mengizinkan HTML lain. Simpan keempat kolom di data asli/preview lengkap agar field yang tidak terlihat native tidak hilang. Jangan mengubah wire payload, menghapus kolom mentah, atau memakai renderer analog yang menampilkan empat paragraf sebagai klaim UI asli elektronik.

## QR dan aksi di luar implementasi baca ini

Initializer `_RIb` memanggil `0xd43658` setelah memulai detail (`0x782958–0x782964`). Itu **bukan review lookup**. Builder `0xd437d4` mengambil `XIb+7 → FRb+7`, membentuk `Dokumen/generateQRValue?q=` + selected list ID, lalu wrapper GET pada `0xd43858`. Body respons dibaca sebagai String (`0xd43884–0xd438c8`) dan disimpan sebagai nilai QR. Tidak ada body request. Tidak ada pembuktian runtime/penerimaan server dalam audit ini.

Bagian QR conditional mengacu pada isPrinted, statusDI301A, flag Dibagikan, dan flag turunan StatusHT pada widget (`0x94c9a8–0x94ca1c`). QR menjelaskan kegunaannya untuk APS dan scan sertipikat (`0x94d9f8`, `0x94da18`). Audit ini **tidak** mengaktifkan atau meniru QR, tidak mengubah status cetak, dan tidak menyimpulkan bahwa efek server `generateQRValue` hanya-baca dari metode GET saja.

Label `Bagikan Akses ke Sertipikat Ini`, callback bagikan, aktivitas `klik buka sertipikat`, dan alur dokumen ditemukan pada sumber kelas `_RIb`. Full kontrak share, pratinjau dokumen, telemetry, dan role gating belum ditutup audit ini; jangan menambahkan mutation atau request mereka dari bukti label semata.

## Reproduksi dan batas

Sumber baru dipisahkan di `analysis/recovered/electronic-certificate-ui/`. Jendela parser lama `request-callsites/range-00782988.asm.txt` dipulihkan ke batas asal `0x782988–0x782bb4`, sehingga audit sebelumnya tidak diperluas diam-diam. Ledger `recovered/electronic-certificate-ui.json` dan validator `rea/verify_electronic_certificate_ui.py` mengunci hash artefak, sumber, instruksi penting, dan dua resolusi dispatch string.

Confidence tinggi untuk field UI, urutan, kondisi status cetak, filter baris opsional, sumber ID peta, owner string, dan perbedaan catatan elektronik. Masih belum dibuktikan: penerimaan server elektronik, seluruh lifecycle/error/retry APK, full date/number formatting, pixel/layout native, share/open-document/QR side effects, dan semua fungsi aplikasi. Tidak ada akses akun ataupun produksi untuk audit ini.
