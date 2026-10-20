# Koleksi: tambah bidang ke grup dan pelepasan dari grup — APK 6.1.5

Audit statis ini mengikuti callback kartu `0x8fea54`, `0x8fe068`, dan `0x8fdb68` sampai pemilih grup, request, parser respons, controller, dan refresh. Callback pertama membuka pemilih **Tambah ke Grup**; callback kedua membuka edit; callback ketiga membuka konfirmasi hapus yang artinya bergantung pada konteks kartu. Tidak ada APK, request jaringan, akun, kredensial, mutasi produksi, atau perubahan aplikasi yang dijalankan oleh audit ini.

## Aksi pada kartu

Common card **FEb/_GEb** menampilkan ikon tambah ke grup jika **list grup mentah pada widget `+0x1b` tidak kosong dan konteks grup `+0x23` false** (`0x8fd344–0x8fd384`). Tidak ada pemeriksaan `row.type`, `row.groupId`, atau apakah baris sudah masuk grup. Root Bidang sudah memfilter PERSIL sebelum membangun kartu; pembatas tipe itu bukan bagian dari common card. Pada halaman grup, konteks true menghilangkan ikon tambah untuk semua tipe, termasuk BERKAS atau tipe lain yang lolos filter groupId halaman tersebut.

Ikon tidak memiliki label teks/tooltip eksplisit pada wrapper yang diperiksa. Callback `0x8fea54 → 0x8feaa4` membuka bottom sheet melalui `0x74719c`; tidak ada request untuk memuat grup saat sheet dibuka. List yang dipakai adalah snapshot grup cache yang telah diteruskan ke kartu. List mentah yang berisi hanya ID invalid masih memenuhi syarat menampilkan ikon, tetapi pemilihnya akan kosong setelah filter.

## Pemilih dan pengiriman

| Bagian | Perilaku yang terbukti |
| --- | --- |
| Judul | **Tambah ke Grup** |
| Judul baris | `row.title ?? '-'`, maksimal dua baris; subtitle, tanggal, dan ID tidak ditampilkan sebagai teks |
| Label pilihan grup | `collectionGroupName ?? '-'`; String kosong tetap kosong |
| Tombol | **Tambahkan ke Grup**; saat sibuk **Menambahkan...** |
| Pilihan yang tersedia | Hanya grup dengan `collectionGroupId != null && collectionGroupId.length != 0` |
| Urutan | Traversal sumber; tanpa sort, deduplikasi, trim, atau pengecualian grup yang sudah dipakai baris |
| Seleksi awal | Null setiap kali sheet baru dibuka; tidak diambil dari `row.groupId` |
| Tap pilihan | ID yang berbeda dipilih; tap pilihan yang sedang terpilih mengosongkan seleksi menjadi null |
| Kondisi tombol | Tidak aktif saat sibuk atau seleksi null; aktif jika ada seleksi dan tidak sibuk |

Predicate `0x8ffbd4` menerima ID String yang hanya berisi spasi karena tidak menjalankan trim. Duplikat ID tidak dibuang; semua pilihan dengan ID yang sama mempunyai hasil perbandingan selected yang sama. Pilihan dengan ID null atau String kosong tidak muncul. ID pada pilihan yang tampil ditegaskan nonnull oleh `0x8ff454–0x8ff460`.

Pada **seluruh builder pemilih yang dibatasi** tidak ada tombol Batal eksplisit, input teks, pesan kosong khusus, opsi Buat Grup/Grup Baru, atau opsi Tanpa Grup/Lepas Grup. Perilaku gestur/back bawaan bottom sheet belum dibuktikan oleh audit ini. Penghapusan dari grup memakai aksi terpisah pada kartu dalam konteks grup.

Callback submit `0xda8548` memasang busy=true sebelum await. Callback pilihan grup tetap terikat ketika busy; tidak ada pemeriksaan busy dalam `0x8ffaf4/0x8ffb64`. ID yang dikirim sudah ditangkap sebelum await service. Tidak ada langkah konfirmasi kedua atau toast sukses dalam chain yang dibatasi.

## Request dan respons assignment

Controller `0xda871c → service 0xda88b8`, call **`0xda897c`**:

```text
POST Collection/AddPersilCollectionToGroup
multipart/form-data
collectionGroupId = selectedGroupId
collectionId      = row.id ?? ''
```

Nama field memakai huruf kecil tepat seperti di atas, dengan urutan map `collectionGroupId`, kemudian `collectionId`. `collectionId` berasal dari model baris slot `+7`; **bukan `contentId`, persilId, groupId, atau indeks**. Tidak ada validasi UUID, trim, atau penolakan collectionId kosong pada caller/controller/service yang diperiksa. Tidak ada query, opsi caller, atau header caller tambahan. Client `service+7 → FRb+7` memakai autentikasi akun biasa LRb yang sudah dibuktikan pada [audit Buat Grup](COLLECTION-GROUP-CREATE.md).

Body merupakan FormData **iP CID 3744**, dibuktikan dari allocator `0xd15344` (header `0xea021c >> 12`) dan metadata kelas. Pembuatan map tidak melakukan JSON encode. UI mengharuskan group ID nonnull dan nonempty; service sendiri memasukkan nilai argumen apa adanya. Mapper FormData generik mengubah null menjadi String kosong dan nilai nonnull melalui `toString`; batas UI dan penerimaan service langsung perlu dibedakan.

Respons memakai parser **`yEb CID 606`, `0x74ae18`**, sama dengan create:

| Field | Slot | Tipe |
| --- | --- | --- |
| `error` | `+7` | `bool?` |
| `message` | `+0xb` | `String?` |
| `data` | `+0xf` | `String?` |

Hanya **HTTP 200** dengan body nonnull yang sudah berupa `Map<String,dynamic>` diterima. Tidak ada decode JSON String kedua. Missing/null menjadi null, String kosong dipertahankan, dan tipe nonnull yang salah menggagalkan parser. `data` bukan objek atau list grup. Respons 200 yang lolos parse menghasilkan tuple `(false, envelope)` **meskipun `envelope.error=true`**. Status lain yang kembali normal menghasilkan `(true,null)`; pengecualian WO dengan body Map yang lolos parse dapat menghasilkan `(true,envelope)`. Pengecualian lain, response hilang, atau parse/cast gagal menjadi `(true,null)`.

Controller mengaktifkan shared loading `+0x13`, mengosongkan error `+0x17`, lalu menunggu service. Hanya **flag error tuple** yang memilih jalur gagal. Jalur gagal memakai `envelope?.message ?? 'Gagal menambah koleksi ke grup'`; String pesan kosong tetap kosong, loading dimatikan, return false. Catch memakai prefix **Terjadi kesalahan: **. Jalur sukses mematikan loading dan return true tanpa membaca `envelope.error`, `message`, atau `data`. **Controller assignment tidak menjalankan refresh, invalidasi cache, publikasi list, atau perubahan groupId optimistis.**

## Penutupan dan refresh

Setelah controller return true, caller menutup sheet jika context masih mounted, kemudian memanggil **`d31cb8(DZi:true)`**, juga bila context sheet sudah tidak mounted. Future refresh tersebut **tidak di-await oleh caller**. Orkestrator memulai loader baris `0xd32224` dan grup `0xd31e18` dengan force true secara berurutan tanpa menunggu yang pertama, lalu menunggu keduanya melalui `Future.wait`. Dengan demikian, dua pembacaan berjalan bersamaan; ini berbeda dari create yang hanya memaksa refresh grup.

Kegagalan pembacaan ditangani loader masing-masing seperti [ledger baca grup](COLLECTION-GROUPS-FOLLOWUP.md); list dapat menjadi kosong dan tidak ada rollback lokal assignment yang sudah sukses. Caller tidak melakukan insert/merge optimistis. Jika controller return false dan context masih mounted, sheet tetap terbuka, seleksi terkini dipertahankan, dan busy dikembalikan false. Builder sheet tidak berlangganan stream error controller atau menampilkan banner error khusus.

Halaman grup terpilih **zEb CID 5936** adalah widget stateless yang memegang snapshot objek grup pada `+b` dan controller bersama pada `+f`. Judul dan ID filter tetap dari objek widget itu; stream baris dapat berubah setelah full refresh. Build yang sudah dibuktikan tidak mencari ulang objek grup atau mereset route. Assignment sendiri tidak tersedia pada konteks halaman grup; retensi ini relevan untuk pelepasan baris dari grup.

## Pelepasan dari grup adalah aksi terpisah

Callback `0x8fdb68 → 0x8fdbb8` memakai flag konteks `widget+0x23`:

| Konteks | Teks konfirmasi | Arti |
| --- | --- | --- |
| true, halaman grup | `Hapus ${row.title ?? 'item ini'} dari grup?` | Melepas baris dari grup |
| false, root | `Hapus ${row.title ?? 'item ini'} dari koleksi?` | Menghapus koleksi; service lengkap cabang ini tidak diperluas pada audit ini |

Dialog `0x8fdd38` mempunyai **Batal** dan **Hapus**. Batal `0x74a6fc → 0x7273d8` hanya menutup dialog. Tidak ada state busy lokal, penggantian copy, atau penonaktifan tombol lokal pada seluruh builder dialog yang dibatasi. Pencegahan tap berulang oleh perilaku modal/framework belum dibuktikan.

Untuk konteks grup, Hapus `0xda79e4` memanggil controller `0xda7b48 → service 0xda7cdc`:

```text
DELETE Collection/DeletePersilCollectionFromGroup/${row.id ?? ''}
```

Call `0xda7d60` melalui wrapper DELETE `0x8a9a20`; tanpa body/query caller. Respons memakai kontrak 200/yEb/tuple yang sama; fallback gagal **Gagal menghapus koleksi dari grup**. Controller tidak mengubah list optimistis atau melakukan refresh. Jika return true, caller memanggil full forced orchestrator tanpa await. Dialog ditutup bila mounted pada kedua hasil, sukses maupun gagal. Cabang konteks false memanggil `0xda7230(row.id ?? '')`; detail service penghapusan koleksi dan refresh cabang tersebut tetap di luar scope.

## Bukti dan reproduksi

- [Ledger kanonik](recovered/collection-group-move/flow.json), SHA-256 **`43b59a45774524a298232e8dcb667284211bf8481886c54de48ea77ab825425f`**.
- [Verifikasi independen](recovered/collection-group-move/verification.json): **16 hash sumber, 3.096 instruksi ELF, 145 marker, 121 binding pool, 11 dependensi, 4 dispatch, 4 metadata kelas, dan 1 header allocator — lulus**.
- [Builder](rea/build_collection_group_move.py) dan [verifier](rea/verify_collection_group_move.py); jalankan `tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_collection_group_move.py`.
- ELF `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

File `.explore.asm.txt` adalah catatan eksplorasi. `flow.pre-verification-draft.json` menyimpan draft sebelum pemeriksaan metadata membetulkan CID FormData; **bukan ledger kanonik**. File kanonik adalah `flow.json` dan 16 `.proof.asm.txt` yang diikatnya. Ledger baca dan create yang lebih lama tidak diubah. Audit ini tidak membuktikan penerimaan server, runtime Android, pixel parity, semua menu, edit koleksi, atau geotag/kunjungan.
