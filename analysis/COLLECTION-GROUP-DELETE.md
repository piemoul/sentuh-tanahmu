# Koleksi: audit statis Hapus Grup — APK 6.1.5

Alur **Hapus Grup** ditutup dari kontrol kartu grup sampai dialog, DELETE, respons bertipe, dan perubahan daftar lokal. Perbedaan penting dari create: **delete tidak memuat ulang grup atau bidang; hanya menghapus grup yang cocok dari list cache.** Tidak ada APK dijalankan, request produksi, kredensial, mutasi akun, perubahan aplikasi, geotag, atau visit-bypass. Ledger/range terdahulu tetap utuh.

## Entry dan konfirmasi

Builder kartu `0x901c70` menangkap controller, context, dan grup. Kontrol terpisah `0x902130..0x902164` memakai **yxa CID6010**, child tetap pool `0x41b08` (**Qta → Mxa**), dan callback **`0x902460`** sebagai named `had`. Constructor `0x5c8150..0x5c8474` memetakan `had → yxa+0x17`; build memilih keluarga recognizer **lX**, lalu `0xa2d5c8..0xa2d5d0` meneruskan callback ke `lX+0x5f`. Label semantik *tap utama* mengikuti struktur recognizer Flutter ini; timing gesture dan glyph tepat child tidak dipulihkan dalam audit sempit ini.

Kontrol langsung membuka konfirmasi, tanpa popup menu perantara. Callback kartu luar `0x902378` tetap membuka isi grup. Field `Dca+0x53` menerima BorderRadius yang dibuat `0x901d74`, bukan callback long-press. Jadi implementasi tidak perlu mengarang menu long-press untuk mencapai delete. Kontrol dibuat untuk setiap kartu tanpa guard ID grup.

`0x902460 → 0x9024b8` membuka dialog melalui `0x726368`, builder `0x90253c`, dan **qaa CID6059**. Copy persis:

- Judul: **Hapus Grup?**
- Isi: **Grup "${group.collectionGroupName}" akan dihapus. Bidang di dalamnya tidak ikut terhapus.**
- Tombol: **Batal** dan **Hapus**.

Nama memakai field nullable asli `+0xb` melalui interpolasi Dart, tanpa fallback **Grup**. Nama kosong menghasilkan kutip kosong; null diteruskan ke interpolasi (secara semantik Dart biasanya teks `null`, tidak diamati melalui runtime). Tidak ada input nama, state busy lokal, atau opsi dialog caller selain context/builder; perilaku default barrier/back belum diaudit penuh.

**Batal** mengikat `0x74a6fc → 0x7273d8` (Navigator.pop), tanpa memanggil controller/service. **Hapus** mengikat `0xda90d8`, yang **menutup dialog terlebih dahulu** pada `0xda912c`, lalu memanggil controller `0xda91a8` pada `0xda9184` dan menunggu hasil. Callback tidak memeriksa hasil sesudah await, tidak menampilkan toast, dan tidak membuka kembali dialog pada kegagalan.

ID berasal dari `collectionGroupId+7`. **Null diganti String kosong** pada `0xda9174`; empty String dan whitespace nonnull tetap utuh. Tidak ada trim, cek panjang, penolakan kosong, fallback ID lain, atau encode komponen ID dalam callback/controller/service.

## Request dan respons

Service **`0xda93cc`** memilih main client `service+7 → FRb+7`, membentuk path dengan interpolasi prefix persis **`Collection/DeletePersilCollectionGroup/`** dan ID, lalu memanggil wrapper **`0x8a9a20`** pada callsite **`0xda9450`**. Wrapper mengikat literal **DELETE** pada `0x8a9ab4`. Tidak ada body, query, options, atau header caller. ID kosong menghasilkan path yang berakhir `/`; shared URI composition/final-wire escaping tidak disertifikasi di sini.

Auth memakai dependency create yang dibekukan: LRb mengisi Authorization dari token sesi akun `tokenType + spasi + accessToken`, memakai machinery expiry/refresh lama, dan melewati assignment itu bila token tidak ada. Tidak ada client istimewa atau override auth caller. Untuk body null, branch shared LRb non-iP/non-String mengatur **application/x-www-form-urlencoded** pada `0xd0da68 → 0xd0da6c`; ini assignment Content-Type, bukan body form yang disuplai service. Nilai token dan byte final-wire tidak dibaca/diamati.

Helper hanya menerima **HTTP 200**, memerlukan `Map<String,dynamic>` nonnull tanpa JSON String decode kedua, lalu memakai parser **`0x74ae18`**, **yEb CID606**:

| Key JSON | Slot | Tipe |
| --- | --- | --- |
| `error` | `+7` | `bool?` |
| `message` | `+0xb` | `String?` |
| `data` | `+0xf` | `String?` |

Missing/null tetap null, String kosong tetap kosong, dan tipe nonnull salah menggagalkan seluruh parser. `data` bukan objek/list grup. HTTP 200 yang diparse mengembalikan **(false, envelope), termasuk `envelope.error=true` atau null**. Status lain yang kembali normal menghasilkan (true, null). Predicate shared default menerima 200–299, sehingga 201/204 biasa gagal di helper; non-2xx biasanya melempar WO lebih dahulu. WO CID3758 dengan response Map yang valid dapat dipertahankan sebagai (true, envelope); exception lain, response hilang, atau cast/parse gagal menghasilkan (true, null).

## Perubahan lokal, keanggotaan bidang, dan error

Controller `0xda91a8` menyetel loading `+0x13=true` dan error `+0x17=null`, lalu menunggu service. Hanya **tuple error `+0xb`** yang menentukan branch. Pada true, error menjadi `envelope?.message ?? 'Gagal menghapus grup koleksi'`; pesan kosong nonnull tetap kosong. Loading dibersihkan, hasil false, dan list grup lama dipertahankan. Catch menyimpan **Terjadi kesalahan: ** ditambah exception, membersihkan loading dan kembali false; finalizer luar juga membersihkan loading sebelum rethrow.

Pada tuple error=false, controller mengambil nilai **subject grup `+0xf`**, menjalankan `where` dengan predicate **`0x8fca60`**, membentuk list baru, dan memublikasikannya kembali. Predicate adalah **`candidate.collectionGroupId != suppliedId`** dengan equality nullable langsung. Semua ID yang cocok terhapus, termasuk duplikat; urutan dan objek grup tersisa dipertahankan. Jika ID terpilih null, suppliedId adalah `''`, sehingga grup ber-ID `''` yang cocok terhapus, sedangkan ID null tidak cocok. `envelope.error/message/data` tidak digunakan pada branch ini.

**Tidak ada GET, loader grup/baris, orkestrator penuh, write cache loaded `+0x23/+0x27`, atau refresh terjadwal pada seluruh controller ini.** Flag cache tetap sesuai nilai sebelumnya. Tidak ada publication ke subject baris, perubahan field wEb, pengosongan `row.groupId`, penghapusan baris bidang, atau call delete bidang. Cache bidang dan groupId-nya tetap utuh.

Kalimat dialog bahwa bidang tidak ikut terhapus adalah **intensi UI**, bukan observasi perilaku server. Apakah backend melepaskan keanggotaan, mempertahankan ID grup, atau memberi efek lain belum diketahui. Refresh eksplisit di kemudian hari dapat memperlihatkan state server yang berbeda.

Selama loading, selector root `_IEb` menampilkan placeholder yang sama dengan alur baca. Setelah loadingfalse, list tampil lagi. Dialog sudah tertutup sejak awal; bounded root builder tidak berlangganan error untuk banner, dan callback konfirmasi tidak mempunyai UI hasil/retry tersendiri. Guard deduplikasi request berjalan tidak terlihat dalam helper controller.

## Bukti dan reproduksi

- [Ledger immutable](recovered/collection-group-delete/flow.json), SHA-256 **`995bf8791fef83c733f2d13379a24dcc3443ac8be5090c952a7154199e8a1443`**.
- [Verifier PASS](recovered/collection-group-delete/verification.json): **17 hash proof, 1.269 instruksi ELF baru + 481 instruksi dependency auth/status, 90 marker, 61 binding pool, 2 objek publik, 15 dependency, 4 dispatch, dan 7 metadata kelas**.
- [Builder](rea/build_collection_group_delete.py) memakai recipe ekstraksi lokal create yang dipin hash; [verifier](rea/verify_collection_group_delete.py) secara independen mencocokkan instruksi dengan ELF serta memeriksa dependency dan ledger lama.
- Reproduksi: `tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_collection_group_delete.py`.
- ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- Ledger baca grup tetap `c5cc8bd27217e758ba1bb14c4dd6b2e46112e7b110e99bb88c6c89c89017a230`; ledger create tetap `8b4859d6587c4101712f42a089b3ea68b1cb3ed2d28cf908e33b1adc338b5fbc`. File `.explore.*` tidak kanonik, termasuk eksplorasi framework yang tidak dipakai sebagai proof.

Proof menutup alur delete grup root secara statis. Move, rename, delete bidang, server acceptance, izin akun, pixel parity, runtime native, dan seluruh mutasi Koleksi tidak diklaim atau diaktifkan oleh audit ini.
