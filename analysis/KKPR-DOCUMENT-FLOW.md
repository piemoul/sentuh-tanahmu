# Dokumen KKPR: parameter nama, transport, hasil, dan viewer

Kontrak dokumen KKPR sudah dapat diimplementasikan dari bukti APK: **POST `apis/GetDocument`**, form **`q = selected.kkprId + ':KKPRKU'`**, **`name = account/account_summary.data.nama`** dari akun yang sama. Native menyimpan nama profil ke slot statis sebelum callback dokumen membacanya. Username login, nomor identitas, dan nama pemilik KKPR bukan pengganti yang dibuktikan.

Ini audit statis APK Sentuh Tanahku 6.1.5 ARM64, SHA-256 ELF `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Tidak ada akses kredensial, request produksi, perubahan app/server/tests, atau perubahan Blutter. Hasil melengkapi batas parameter `name` pada [KKPR-FLOW.md](KKPR-FLOW.md); laporan awal tetap merupakan catatan audit sebelumnya.

Ledger: [recovered/kkpr-document-flow.json](recovered/kkpr-document-flow.json). Potongan sumber: [recovered/kkpr-document-flow](recovered/kkpr-document-flow). Generator dan verifier: [build_kkpr_document_flow.py](rea/build_kkpr_document_flow.py), [verify_kkpr_document_flow.py](rea/verify_kkpr_document_flow.py).

## Kontrak yang terbukti

| Komponen | Native |
| --- | --- |
| Origin awal | `https://sentuh.atrbpn.go.id`, melalui opsi main client `TRb.AYi`; mutable configuration tetap mungkin. |
| Metode/path | POST `apis/GetDocument`, call `0xd41ee8`. |
| Body | `Map<String,String>` dengan tepat `q`, `name`, form-urlencoded. Tidak ada URL bebas. |
| q KKPR | `kkprId` dari objek KKPR terpilih + literal `:KKPRKU`; `0xda6c1c..0xda6c50`. |
| name | `nama` String? dari model akun `ayb`, melalui slot statis `0x1780`. Aturan null dijelaskan di bawah. |
| Autentikasi | Client clone memasang LRb; autentikasi sesi dan refresh normal main client berlaku. |
| Respons | Opsi `ResponseType.bytes`, enum `nP` index 3, pool `0xbea0`, store `0xd41ec0`. |
| Sukses native | HTTP 200, body `List<int>`, panjang **lebih dari 200 byte**. |
| Penyimpanan native | Direktori temporer, `scan_<timestamp>.pdf`; helper mengembalikan path String. |
| Viewer | Path menjadi File lokal pada yGb; downloader mengembalikan file tersebut langsung. Tidak ada download ulang dari URL. |

`name` adalah metadata nama akun pada request dokumen. Tidak ada bukti bahwa nama tersebut mengubah otorisasi server atau memberi akses ke dokumen pengguna lain. Adaptor harus mempertahankan sesi pengguna, origin tetap, TLS terverifikasi, dan pembatasan input yang sudah ada.

## Asal nama sampai callback

1. Controller akun `0xd291b0` meminta `POST account/account_summary` pada `0xd2939c`. Envelope helper `0x6bbe60` membaca **`data`** (`0x6bbe98`) dan memanggil callback parser `0x755570`.
2. Callback memanggil parser `ayb` CID 840 di `0x755604`. Key **`nama`** dimuat pada `0x7558c4`, diperiksa **String?** pada `0x755900`, lalu disimpan ke model **`+0x1b`** pada `0x755918`.
3. Controller menerbitkan model melalui `0x755510` (call `0xd292c8`) ke subject `+0x13` (`0x75552c`, `0x755554`).
4. Homepage yCb mengikat stream bertipe **`ayb?`** (`0x8d9be4`) ke builder `0x8da190` (`0x8d9c04`). Builder mengambil `snapshot.data` pada `0x8da1d8`; jika tidak ada data, ia tidak melakukan assignment nama.
5. Untuk data akun nonnull, `snapshot.data.nama` dibaca pada `0x8da200`; null menjadi **string kosong** (`0x8da210`). Nilai disimpan ke slot statis **0x1780**, displacement tabel **0x2f00**, pada **`0x8da218`**. String kosong dipertahankan.
6. Callback KKPR `0xda6b70` membaca slot itu pada `0xda6bf0`. Hanya jika slot sendiri masih null, callback memakai **`'-'`** (`0xda6bfc`). Nama null dari profil yang sudah diproses menjadi `''`, sehingga tidak berubah menjadi `'-'` di tahap ini.

Ada penyimpanan lain sebagai key lokal `full-name` di jalur akun (`0xd29468`), tetapi callback KKPR yang dibuktikan membaca slot statis tersebut secara langsung. Model login `gyb` dan public session user webapp bukan model ringkasan akun ini; `nama` tidak boleh ditebak dari username.

Rekomendasi browser: gunakan cache respons account summary milik sesi aktif; jika belum ada, jalankan read account summary yang sudah tersedia. Envelope yang dikenali sukses harus HTTP200, `error` tepat boolean false, dan `data` berupa objek. Native parser memeriksa `error` sebagai bool? (`0x6bbf40`), lalu controller menolak null (`0xd29414..0xd29418`); menerima missing/null/string sebagai sukses akan melonggarkan pemeriksaan ini. Setelah envelope profil valid, `nama` null/missing menjadi `''`, string kosong tetap kosong, tipe selain String/null ditolak. Envelope gagal/tidak dikenal harus memblokir unduhan. Memuat profil secara eksplisit sengaja menghindari keadaan slot global native yang belum terisi atau tertinggal dari state lama; ini bukan klaim kesamaan terhadap state global tersebut.

## Client yang dipakai

Callback memperoleh FRb dan menaruhnya ke service QRb `+7` (`0xda6cb4`). Helper `0xd41dd0` memanggil **`0x746b44`** (`0xd41e14`). Clone ini:

- Mengambil main client FRb `+7` (`0x746b5c`), membaca opsi client `+7` (`0x746b68`), lalu membuat client dengan opsi tersebut (`0x746b7c`).
- Menyalin adapter main client `+0xf` ke clone `+0xf` (`0x746b8c`, `0x746ba4`). Main client sebelumnya menerima base `TRb.AYi` (`0x6bb2d8..0x6bb32c`).
- Membuat dan memasang **LRb** (`0x746bcc..0x746be8`) serta **AP** (`0x746bec..0x746c10`).

LRb menyediakan `Authorization = tokenType + ' ' + accessToken` dan dapat melakukan refresh sesi normal. Load field token ada pada `0xd0df78`, `0xd0dfa8`; set Authorization pada `0xd0dfd4`; refresh call `0xd0de64`. Detail yang sudah dibuktikan sebelumnya dipertahankan dalam [TRANSPORT-BOUNDARIES.md](TRANSPORT-BOUNDARIES.md) dan ledger hash terkait.

Ini berbeda dari jalur SPS URL viewer: SPS memakai raw GET terpisah tanpa LRb/form/refresh pada downloader. Dokumen KKPR menggunakan **main-client clone**; jangan menerapkan profil header SPS ke POST ini. Identity/trust tetap berasal dari adapter main yang sama. Tidak diperlukan origin, trust anchor, credential, atau pengaturan attestation baru. Audit tidak membaca ulang material TLS. Lihat [SPS-TRANSPORT-FLOW.md](SPS-TRANSPORT-FLOW.md) dan [APK-TRANSPORT-LOGIN.md](connection-diagnostics/APK-TRANSPORT-LOGIN.md) untuk batas konteks transport yang sudah ada.

Helper memberi header `Content-Type: application/x-www-form-urlencoded` (`0xd41e78`, `0xd41e84`) dan mode bytes (`0xd41ebc..0xd41ec0`). Ia tidak menambahkan checksum, posisi GPS, app version, atau field attestation pada body `q,name` ini. Ini batas builder/interceptor yang diperiksa; tidak membuktikan seluruh kebijakan validasi server.

## Penanganan respons lengkap pada helper

Sukses melewati pemeriksaan status **200** (`0xd41f08`), body **List<int>** (`0xd41f28`), dan panjang **`> 200`** (`0xd41f64`, `b.le` menuju gagal pada `0xd41f68`). Tidak ada decode JSON, pemeriksaan MIME, pemeriksaan `%PDF`, atau batas ukuran maksimum di cabang sukses helper.

Helper direktori `0xcee480` meminta `getTemporaryDirectory` (`0xcee4f0`); jalur Android mengacu pada `PathProviderApi.getTemporaryPath` (`0xcee5dc`). Filename dibentuk dari `scan_` (`0xd41f94`), timestamp yang dihitung client, dan `.pdf` (`0xd4202c`). Byte ditulis pada `0xd42128`, operasi ditunggu pada `0xd42134`, kemudian path dikembalikan pada `0xd42138`.

HTTP yang tidak lolos atau ukuran `<=200` mengembalikan String **`1009`**. Body sukses dengan tipe salah memicu error tipe. Catch utama memeriksa exception **WO CID 3758** (`0xd42160`), lalu response dan response.data nonnull. Data exception harus `List<int>`, didecode menjadi teks (`0xd421b8`) lalu JSON (`0xd421c4`) bertipe `Map<String,dynamic>`. Field `message` dibaca pada `0xd421ec`, null/missing menjadi `Unknown Error`, kemudian harus String. Pesan dibandingkan dengan **kesamaan tepat**, bukan substring, melalui `0xbbd83c`:

| Pesan respons | Kode hasil helper |
| --- | --- |
| Dokumen bukan versi terakhir | `1001` |
| Dokumen tidak terbit | `1002` |
| Versi tidak valid | `1003` |
| Kode tidak valid | `1004` |
| Pesan lain, exception lain, response tidak tersedia, atau kegagalan decode/tipe | `1009` |

Kegagalan parsing dalam catch ditangani lagi dan menghasilkan `1009` (`0xd42308..0xd42314`). Tidak ada body error mentah yang menjadi hasil helper. Status penolakan aktual dari server tidak diobservasi.

## Handoff ke viewer dan perbedaan validasi

Callback KKPR menerima String? (`0xda6d04`) dan hanya memeriksa **nonnull** (`0xda6d40`) sebelum navigasi. Builder `0x8f911c` membuat File dari path hasil, mengisi yGb `+0xf` dengan File (`0x8f91a0`) dan `+0x17` dengan q (`0x8f91a8`). Flag opsi `+0x27` adalah false (`0x8f91c0`).

Init yGb memanggil downloader `0xd3e0e8`. Jika File widget `+0xf` nonnull, ia langsung mengembalikannya (`0xd3e128..0xd3e13c`), sehingga **pemeriksaan `%PDF` yang ada pada jalur URL SPS tidak dijalankan**. Post-load `0xd3d61c` juga melewati cabang opsional karena flag `+0x27=false` (`0xd3d694..0xd3d69c`). Kontrol viewer lengkap tetap tidak diaudit.

Ada kekurangan native yang perlu dihindari: callback KKPR tidak memfilter kode error `1001`–`1009` sebelum membuat File. Karena hasil error tetap String nonnull, kode itu bisa diteruskan sebagai pathname. Selain itu, body HTTP200 berisi JSON/HTML lebih dari 200 byte akan lolos pemeriksaan panjang native lalu disimpan sebagai `.pdf`. Webapp sebaiknya menghasilkan error terstruktur untuk kondisi tersebut.

## Kaitan dengan dokumen Aktivitas

Helper Scan Aktivitas non-PBT `0xd87754` memakai **helper unduh yang sama** (`0xd8780c`) dan **slot nama yang sama** (`0xd877e4`), dengan fallback slot null `''` (`0xd877f0`). q dipakai seperti diberikan oleh route Aktivitas; helper ini tidak menambahkan suffix KKPR.

Setelah unduhan, native memanggil `POST apis/GetDocumentType` dengan form q yang sama (`0xd8784c` → `0xd41720`, HTTP call `0xd417d4`). Hasil HTTP200 membaca `error` bool (null menjadi true), `data.showRoute` int, dan `data.type` String (null menjadi kosong); helper mengembalikan tuple `(error, showRoute === 1, type)`. Tidak ada body yang dibutuhkan untuk memperoleh file selain GetDocument; metadata type mengendalikan opsi viewer.

Builder `0x87ea4c` mengisi yGb File `+0xf`, q `+0x17`, dan flag `+0x1b` dari hasil boolean showRoute; flag `+0x27` kembali false. Ini memperluas bukti helper bersama hingga handoff lokal, bukan audit seluruh navigasi/aksi dokumen Aktivitas. Routing tetap mengacu pada [ACTIVITY-FLOW.md](ACTIVITY-FLOW.md).

## Aturan implementasi yang sengaja lebih ketat

Rekomendasi berikut adalah pengamanan webapp, bukan klaim pemeriksaan native:

1. Bentuk q dari record KKPR yang terpilih dan name dari profil sesi yang sama. Jangan menerima URL, token, atau nama alternatif bebas. Serialisasi form harus tetap mengirim `name=` jika kosong.
2. Pertahankan main session Authorization/refresh, origin tetap, TLS terverifikasi, timeout dan redirect boundary yang sudah ada.
3. Sebelum pemrosesan MIME/JSON sukses, minta HTTP200, panjang **lebih dari 200 byte**, awalan **`%PDF`**, dan maksimum **20 MiB**. PDF valid boleh dinormalisasi menjadi `application/pdf` meskipun MIME server keliru; MIME aktual belum diobservasi.
4. Tolak kosong, terlalu kecil, HTML/JSON yang menyamar, dan body terlalu besar. Parse error yang dibatasi hanya untuk memetakan pesan dikenal; jangan mengembalikan body/headers mentah atau mencatat byte dokumen, q, nama, dan credential ke log.
5. Gunakan penyimpanan unduhan milik sesi yang sudah ada; preview hanya untuk PDF tervalidasi dengan batas sesi yang sama. Tidak ada URL publik atau token browser baru.

`%PDF` adalah pemeriksaan format awal, bukan validasi tanda tangan digital, keaslian dokumen, checksum APK, atau bukti penerimaan server.

## Verifikasi

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/build_kkpr_document_flow.py
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_kkpr_document_flow.py
```

Hasil: **25 hash sumber**, **3 hash ledger dependensi**, **2.362 instruksi tepat dari ELF**, binding `nama` profil, **4 pemetaan error**, serta **3 entry dispatch** terverifikasi. **0 request produksi**. Satu ekspor metadata hanya berisi enum mode bytes yang diizinkan, tanpa nilai privat.

Belum terbukti: keberhasilan unduh akun nyata, MIME/redirect aktual, kebijakan server terkini, seluruh retry/native SDK/TLS protocol defaults dan perubahan konfigurasi setelah startup, serta keseluruhan kontrol PDF/signature/print/share. Kontrak read/download dan penanganan lengkap helper sudah dibedakan dari batas tersebut.
