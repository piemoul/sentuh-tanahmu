# Directus Antrian: audit interceptor lanjutan

Audit lokal 2026-10-19 ini mengikat perilaku transport ke klien **FRb +0xb** yang dipakai `api/antrian/saya` dan detail `api/antrian/<id>`. Tidak ada permintaan produksi, perubahan aplikasi/backend, derivasi token, atau perubahan sumber kanonis lama. Bukti ini melengkapi [QUEUE-FLOW.md](QUEUE-FLOW.md), [QUEUE-TRANSPORT-FLOW.md](QUEUE-TRANSPORT-FLOW.md), dan ledger `queue-read-followup`; bukan hasil uji server aktif.

Ledger beku: `analysis/recovered/queue-interceptor-followup/flow.json`, SHA256 `8f5b2b0e31b6308264b6cf3e25371a13952feacccea4bcd9a146c5b401a993e9`. ELF yang diuji tetap `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.

## Kontrak yang dapat diimplementasikan

| Bagian | Bukti dan hasil |
| --- | --- |
| Klien | Queue mengambil FRb `+0xb`, dengan base awal `https://aplikasi.atrbpn.go.id/konsol/antrian/directus/`. Ini bukan klien `antre.atrbpn.go.id` atau main API. Constructor `6bb460 → 6b823c`, factory `6bb468 → 6b7fe0`, store `6bb478`. |
| GET list | Kontrak lama tetap: `api/antrian/saya`, satu query `nik` dari daftar identitas akun yang dikelola aplikasi, digabung koma. Daftar/gabungan kosong tidak mengirim request. Tidak menambahkan body, pagination, atau parameter pencarian. |
| GET detail | Kontrak lama tetap: `api/antrian/` ditambah ID penuh item yang dipilih dari respons list. Tidak memotong ID pada tanda titik dua; tanpa body/query. |
| Header | Base eksplisit `Authorization: Bearer <TRb.Xhj bundle>` dan `User-Agent: Dart/Flutter`. Nilai token tidak disalin di audit ini. Interceptor yang ditelusuri tidak memasukkan token akun main API atau melakukan refresh token. |
| Content-Type request | Body GET null. `kP` membaca request `+0x57` pada `bcc774`, langsung bercabang `bcc784 → bcc950`, lalu `next` di `bcc958`. Jadi tidak menyisipkan `Content-Type` untuk dua GET ini. Tidak ada `Accept` eksplisit dari builder. Ini bukan inventaris semua header otomatis Dart HTTP. |
| Sukses transport | **200 ≤ status < 300**, bukan hanya 200. Default closure pool `+bad8` diikat metadata `_PCf` ke `6b8f60`, lalu composer mewariskannya ke request `+0x23`; dispatcher memanggilnya pada `d05484`. |
| Envelope | Service memakai body yang sudah ditransformasi: `error` harus bool nullable, null/missing dianggap true; literal false dan `data` bertipe benar diperlukan. List mengharuskan List, detail Map sesuai ledger sebelumnya. Tidak ada decode JSON kedua jika body berupa String. |
| Error bisnis | `body.error: true` pada respons 2xx adalah penolakan service. Interceptor AP sudah selesai pada saat itu, sehingga kondisi ini sendiri tidak memicu retry transport. |
| Retry | Maksimum 3 retry setelah percobaan pertama, total 4. Jeda nominal 1, 3, 5 detik. GET mengulang **requestOptions dan klien queue yang sama**, bukan membuat sesi atau header auth baru. |

Otorisasi input tetap harus ditautkan ke identitas akun sendiri dan ID yang dikembalikan server. Audit interceptor tidak memberikan dasar untuk form NIK arbitrer atau detail ID bebas. Akses akun biasa untuk interoperabilitas milik sendiri adalah konteks pekerjaan; tidak ada persyaratan izin integrasi tambahan yang diciptakan oleh audit ini.

## Interceptor aktif dan urutan

Factory `6b8194` memulai list dengan `kP` CID3750. Constructor FRb menambahkan `AP` CID3749 di `6bb5e0` dan `vWa` CID3748 di `6bb628`. Callback dipilih lewat selector request `-0xfe2`, response `-0xfcb`, error `-0xfd0`; sepuluh entri dispatch dipin dalam ledger, termasuk timer retry. Loop dispatcher mengikuti urutan insertion.

`AP` mewarisi request/response dasar `dP`, yang meneruskan payload. `vWa` request `bcca40`, response `bca928`, dan error `bcb260` juga hanya memanggil handler berikutnya dengan payload yang sama. Body callback tersebut tidak menulis header, URI, data, checksum, device ID, atau akses token. Perilaku main interceptor `LRb` tidak dipinjam sebagai bukti Directus.

## Retry dengan batas tepat

`AP` membaca `request.extra +0x2b` untuk `ro_disable_retry` dan `ro_attempt`. Keduanya metadata lokal; tidak menjadi query/header. Nilai disable null/missing menjadi false dan non-null harus bool. Attempt null/missing menjadi 0 dan non-null harus int. Setelah batas dan predicate lolos, attempt dinaikkan, disimpan, dan delay dipilih.

Untuk error `badResponse`, status yang eligible adalah:

`408, 429, 500, 502, 503, 504, 440, 499, 460, 598, 599, 520, 521, 522, 523, 524, 525, 527`.

Response/status null pada kelompok itu juga eligible. Error cancel enum5 ditolak. Untuk jenis error lain, cause CID `331, 332, 1101, 4239, 4240, 7569` ditolak; cause lain atau null eligible, tetap tunduk batas dan disable. Metadata mengikat tiga CID pertama dan 7569 ke keluarga `FormatException`. Makna lengkap CID4239/4240 belum dibuktikan; keduanya tidak boleh dilabeli ulang sebagai kelas exception JS tertentu tanpa bukti lanjutan.

Alur `e1888c` memanggil predicate `e18b1c → 6bb848`, menyimpan attempt lewat `bcaed4`, memilih delay `bcae50`, kemudian untuk body null meneruskan objek request semula melalui `e18a70 → d007f4`. Respons sukses menyelesaikan handler asal lewat `bcb1b0 → 6bb140`. Error WO CID3758 yang tertangkap diteruskan; exception lain dilempar ulang.

Konstanta delay publik berisi 1.000.000, 3.000.000, dan 5.000.000 unit durasi. `Future.delayed 46d708 → 4337fc`, dispatch root-zone CID7291 menuju `b99490 → b54fec`; durasi dibagi 1.000 di `b5503c` sebelum penjadwalan timer. Ini membuktikan delay yang diminta, bukan waktu tunggu aktual pada perangkat. Jalur kloning multipart tidak termasuk scope GET ini.

## Dekode respons dan batas codec

Base default response type adalah `nP.json` dari pool `+baa8`; qP khusus GET hanya mengubah method. Composer meneruskan response type dan validator status dari base.

Transformer membaca nilai pertama header `content-type`, memanggil parser MIME, lalu mengenali `application/json`, `text/json`, atau subtype berakhiran `+json`. Header tidak ada atau error parsing MIME menghasilkan false. Dengan JSON response type dan JSON MIME, `d05864` memakai codec byte-ke-object static `wP._MLf`. Cabang lain membuffer byte kemudian memanggil decoder `b22ce8` dengan named argument `jac=true`. Byte JSON kosong pada cabang kecil menjadi null. Service queue tidak mencoba mengubah String hasil transformasi menjadi object lagi.

**Batas nyata:** initializer dan implementasi codec `wP._MLf` belum dibuktikan lengkap. Metadata `Ze<List<int>, Object?>`, enum JSON, dan MIME gate mendukung makna dekode JSON, tetapi audit ini belum membuktikan perilaku byte demi byte untuk UTF-8/JSON rusak, response stream, atau cabang isolate pada ambang 51.200 byte. Parser MIME `6c0f24` dan helper introspeksi generic pada penyesuaian empty String-to-null juga belum seluruhnya ditelusuri. Implementasi web perlu menamai batas parser/ukuran sebagai adaptasi, bukan mengklaim kesetaraan seluruh kasus.

## Redirect, TLS, dan locator konfigurasi

Instruksi membuktikan default request `+0x2f=true`, `+0x33=5`, `+0x37=true`, `+0x27=true`. Adapter menyalurkan dua yang pertama ke native request `+0x5b=true` dan `+0x5f=5`, melalui `6c3bec` dan `6c3b98`; pengaturan berikutnya menyentuh persistensi header connection. Susunan pertama cocok dengan `followRedirects/maxRedirects`, tetapi identitas properti dan loop keputusan redirect Dart HTTP belum terikat sepenuhnya. Jangan mengklaim status redirect, perubahan method, kebijakan downgrade, atau penerusan Authorization lintas host dari bukti ini. Menolak redirect pada backend dengan origin tetap merupakan kebijakan browser yang eksplisit.

Tidak ada TLS yang dilemahkan dan tidak ada handshake dilakukan. Bukti adapter/override sebelumnya tidak membuktikan server saat ini mengharuskan client certificate.

Locator bearer yang diminta tersedia tanpa nilainya: field `TRb.Xhj`, pool `+c630`, static offset `17f8`; initializer `6bb9f4 → 6bba80 → 6bbac8`. Mapper `6bbb74` membaca **pool `+c6e8` dan `+c6f0`, masing-masing `List<int>(32)`**; batas loop di `6bbb00`, XOR pasangan di `6bbbdc`, hasil dipakai helper String `42cfb0` pada `6bbb54`. Sumber lama `queue-transport-flow/range-006bb9f4.asm.txt` dipin hash dan tidak ditulis ulang. Tabel angka dan hasil bearer tidak dimuat ke report atau browser dan tidak dihitung oleh audit ini.

## Verifikasi dan batas hasil

Jalankan lokal:

```powershell
tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_queue_interceptor_followup.py
```

Hasil tersimpan di `analysis/recovered/queue-interceptor-followup/verification.json`:

- 36 sumber baru dan 7 sumber lama dipin; 4.855 kemunculan instruksi, **4.823 instruksi unik**.
- 168 marker, 214 referensi pool, 23 objek konstanta publik, 10 entri dispatch, 18 dependency hash terverifikasi.
- ELF dan byte tiap window cocok; 0 panggilan produksi; tidak ada perubahan aplikasi/backend atau nilai auth yang diturunkan.

Verifier mengecek byte/hash, marker, pool, metadata dan dispatch; penafsiran kontrak tetap dinyatakan bersama batasnya di atas. Bukti ini belum menguji token aktif, penerimaan server saat ini, lifecycle identitas terautentikasi, pixel parity atau fungsi akun end-to-end. Script builder/finalizer menolak perubahan pada artefak beku jika dijalankan ulang.
