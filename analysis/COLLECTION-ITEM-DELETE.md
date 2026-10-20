# Koleksi: hapus item Berkas dan Bidang — APK 6.1.5

Audit statis ini mengikuti dua tombol hapus root sampai dialog, controller bersama, pemilihan endpoint, respons, perubahan cache, dan penutupan. Tidak ada aplikasi, akun, jaringan, kredensial, mutasi produksi, atau source runtime webapp yang dijalankan/diubah.

## Titik masuk dan konfirmasi

| Tampilan | Entry dan teks |
| --- | --- |
| Root Berkas, DEb/_EEb | Ikon kanan kartu `0x8fc358 → 0x8fc680`; dialog `0x8fc6fc`: **`Hapus ${row.title ?? 'item ini'}?`** |
| Root Bidang, FEb/_GEb konteks false | Ikon hapus common card `0x8fd670 → 0x8fdb68 → 0x8fdbb8`: **`Hapus ${row.title ?? 'item ini'} dari koleksi?`** |
| Isi grup, FEb konteks true | Entry common card yang sama berarti **`Hapus ${row.title ?? 'item ini'} dari grup?`**, memakai alur pelepasan yang terpisah |

Root Berkas memfilter tepat `BERKAS`; root Bidang memfilter tepat `PERSIL`. Kartu Berkas lengkap yang dibatasi hanya mempunyai aksi hapus, tanpa edit. Common card FEb juga memiliki edit dan assignment yang berbeda; tombol hapusnya tidak bergantung pada list grup atau `row.groupId`. Isi grup tidak memfilter tipe, sehingga common card di sana dapat menerima BERKAS/tipe lain, tetapi tetap memakai arti **lepas dari grup**.

Fallback judul hanya untuk null. String kosong/spasi dipertahankan; judul konfirmasi berasal dari kartu yang ditekan, bukan hasil lookup controller berikutnya. Kedua dialog mempunyai **Batal** dan **Hapus**, tanpa state busy lokal, cabang disable, copy loading, toast sukses, atau dialog sukses tambahan dalam builder/caller lengkap yang dibatasi. Callback tetap terikat saat request berjalan; perilaku pointer/gestur framework dan pencegahan tap berulang tidak diamati runtime.

Batal Berkas `0x728800` memanggil generic back `0x7257e8`; Batal FEb `0x74a6fc` memanggil context pop `0x7273d8`. Tidak ada request atau refresh. Konfirmasi Berkas `0xda7134` dan FEb konteks false `0xda79e4` sama-sama menunggu controller `0xda7230` dahulu, lalu menutup dialog jika context masih mounted pada completion normal—termasuk gagal/no-op. Berkas memakai generic back, FEb memakai context pop. Tidak ada setState/busy toggle pada kedua caller root itu. Menambah disable duplikat atau ownership guard di browser adalah adaptasi eksplisit.

## Lookup dan pemilihan endpoint

Caller meneruskan **`clickedRow.id ?? ''`**, bukan `contentId`, persilId, groupId, judul, atau indeks. Controller `0xda7230` menghasilkan `Future<void>`, mengambil nilai shared row subject `+0xb` melalui `0x62d618` **sekali sebelum await**, dan menyimpan referensi list tersebut.

`firstWhere` melalui dispatch selector `0xf129` untuk List CID 90/91/92 menuju `0x609f80`, dengan predicate `0x8fcae8` yaitu **`row.id == capturedId`**. Traversal mulai indeks 0, langsung mengambil hasil pertama. `orElse` `0x8fcad0` mengalokasikan `wEb` CID 608 melalui `0xd31c80`; allocator generik `0xe273d0` mengisi field null. Controller memeriksa `found.id == null` dan kembali tanpa request, perubahan list/error, atau refresh bila tidak ada kecocokan.

Konsekuensi yang perlu dipertahankan:

- `clickedRow.id == null` menjadi `''`, sehingga tidak cocok dengan baris ID null. Biasanya no-op; jika ada baris cache ID `''`, justru baris kosong pertama itu yang ditemukan.
- ID spasi tidak ditrim. Tidak ada validasi UUID atau gate ID kosong lain.
- Untuk ID duplikat, **tipe baris cache pertama yang cocok** menentukan endpoint, meskipun kartu duplikat yang ditekan mempunyai tipe berbeda. Teks konfirmasi tetap dari kartu yang ditekan.
- Controller memakai list penuh, bukan hanya tab/filter saat ini.

| Predicate tipe baris hasil lookup | Service / call | Request |
| --- | --- | --- |
| `row.type == 'PERSIL'` tepat | `0xda74ac` / `0xda7530` | `DELETE Collection/DeleteCollectionPersil/${capturedId}` |
| Semua nilai lain, termasuk BERKAS/null/tipe tak dikenal/kosong | `0xd92804` / `0xd92888` | `DELETE Collection/DeleteCollectionBerkas/${capturedId}` |

Kedua service memakai wrapper DELETE `0x8a9a20`, tanpa body, query, file, opsi caller, atau header caller tambahan. Client adalah main `service+7 → FRb+7` dengan sesi akun biasa; rantai autentikasi/default status dipertahankan dari [audit Buat Grup](COLLECTION-GROUP-CREATE.md). Tidak ada field checksum/device tambahan dalam caller ini. Path dibentuk dengan interpolasi String native, tanpa trim/escaping/validasi lokal. Kesetaraan karakter path khusus setelah final transport terhadap percent escaping browser belum dibuktikan.

## Respons dan efek lokal

Kedua service hanya menerima **HTTP 200** dengan body nonnull yang sudah berupa `Map<String,dynamic>` dan lolos parser `0x74ae18`, `yEb` CID 606. Tidak ada decode JSON String kedua.

| Field | Slot | Tipe |
| --- | --- | --- |
| `error` | `+7` | `bool?` |
| `message` | `+0xb` | `String?` |
| `data` | `+0xf` | `String?` |

Missing/null diterima, String kosong dipertahankan, dan tipe nonnull yang salah menggagalkan parse. `data` bukan objek/list. HTTP 200 yang valid menghasilkan tuple `(false, envelope)`, **termasuk `envelope.error == true`**. Status normal lain menghasilkan `(true,null)`. Pengecualian WO CID 3758 yang mempunyai respons Map valid dapat menghasilkan `(true,envelope)`; body hilang/salah, parser gagal, dan pengecualian lain menghasilkan `(true,null)`. Penerimaan 2xx transport umum tidak memperluas batas helper ini.

Controller root **tidak mengaktifkan loading, tidak mengosongkan error yang sudah ada, dan tidak mengubah busy index**. Ketika pending, list lama tetap ada. Ini berbeda dari controller aksi grup.

Pada tuple sukses, controller menyaring **snapshot list awal sebelum await**, dengan predicate `0x8fca60` yaitu `row.id != capturedId`, materialisasi `toList` `0x575c28`, lalu menerbitkan ke row subject semula melalui `0x43eef4`. Semua duplikat exact ID dibuang, tanpa predicate tipe. Urutan, objek, dan field survivor dipertahankan. Jika list lain diterbitkan selama await, hasil dari snapshot lama dapat menimpanya; tidak ada ownership guard native di routine ini. Ia tidak memakai `envelope.error/message/data` dan tidak menghapus error lama pada sukses.

Tuple gagal menerbitkan **`envelope?.message ?? 'Gagal menghapus koleksi'`** ke error `+0x17`, dengan String kosong tetap kosong. Catch controller menerbitkan prefix **`Terjadi kesalahan: `** ditambah exception, lalu kembali normal. Tidak ada pengosongan list/loading atau rollback. Dialog sendiri tidak berlangganan stream error untuk menampilkan banner khusus; sanitasi exception di browser perlu disebut sebagai adaptasi.

Tidak ada GET, full orchestrator, loader baris/grup, perubahan group list/groupId, penulisan flag loaded `+0x23/+0x27`, invalidasi cache, atau refresh terjadwal pada alur hapus root ini. Jumlah bidang grup yang diturunkan dari list baris dapat berubah sesudah publikasi lokal. Efek cascade/unlink, otorisasi, dan penerimaan server tidak dibuktikan.

## Perbedaan pelepasan dari grup

FEb konteks true langsung memakai `DELETE Collection/DeletePersilCollectionFromGroup/${row.id ?? ''}` tanpa firstWhere/pemilihan tipe root. Setelah sukses, caller memulai full forced refresh baris dan grup tanpa await, kemudian menutup dialog. Kedua hasil normal menutup dialog setelah await. Alur ini **tidak** memakai filter snapshot root. [Ledger pelepasan](COLLECTION-GROUP-MOVE.md) tetap utuh.

## Bukti dan reproduksi

- [Ledger kanonik](recovered/collection-item-delete/flow.json), SHA-256 **`a88478e6e4865f778b6821062623139f8fcbf516bba4467197f14a6cb734a97d`**.
- [Verifikasi](recovered/collection-item-delete/verification.json): **11 hash baru / 1.119 instruksi ELF, 16 sumber warisan / 2.980 instruksi ELF, 115 marker, 47 binding pool baru + 115 warisan, 12 dependensi, 6 dispatch, 6 metadata kelas, dan 1 header allocator — lulus**.
- [Builder](rea/build_collection_item_delete.py) dan [verifier independen](rea/verify_collection_item_delete.py). Jalankan `tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_collection_item_delete.py`.
- ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool SHA-256 `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

Sumber warisan diikat ke ledger sebelumnya dengan hash; verifier mendecode ulang setiap instruksi baru maupun warisan dari ELF dan menghitung ulang anotasi pool/dispatch. File eksplorasi hanya alat pembacaan terbatas. Bukti ini tidak menyatakan parity pixel/runtime Android, mutasi server yang berhasil, semua menu, atau submisi geotag/kunjungan.
