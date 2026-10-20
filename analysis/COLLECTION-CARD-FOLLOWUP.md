# Koleksi: daftar dan kartu Berkas, APK 6.1.5

**Koreksi interpretasi tab Bidang:** [audit grup terpisah](COLLECTION-GROUPS-FOLLOWUP.md) membuktikan allocation `0xda7034` pada selector `0x8fb714` berkaitan dengan CID 6233 (`HEb/_IEb`), sedangkan `FEb/_GEb` adalah kartu PERSIL individual. Penyebutan `FEb/_GEb` sebagai layar grup di bawah merupakan interpretasi terdahulu yang digantikan bukti baru; ledger lama tetap utuh. Kontrak kartu **Berkas** tidak bergantung pada interpretasi tersebut. Verifier grup memeriksa 4.231 instruksi dan enam header allocator/CID terhadap ELF.

Audit ini menutup kontrak tampilan **tab Berkas**. Parent native mempunyai tab **Berkas** dan **Bidang**, dengan indeks awal 0. Isi grup pada tab Bidang belum ditelusuri dalam audit ini; akses baca PERSIL yang sudah ada di web perlu dipertahankan sampai kontrak grup terbukti.

Tidak ada APK yang dijalankan, request produksi, data akun, kredensial, perubahan aplikasi, atau mutasi koleksi dalam audit ini. Ini mengikuti alur bukti REA menggunakan ELF dan pool Blutter yang sudah tersedia.

| Unsur | Bukti statis dan kontrak |
| --- | --- |
| Parent | `_CEb` build `0x8fb384`, judul `Koleksi`; widget `Vyb` build `0xa3b638` menyusun label `Berkas`, `Bidang` pada `0xa3b6c0/0xa3b6cc`. Setter `0xa3bd9c` menerbitkan indeks ke `tEb+7`. Selector `0x8fb65c` memakai `DEb` untuk 0/default dan `FEb` untuk 1. |
| Daftar | `GET collection/GetUserCollection`, call `0xd31a50`, client utama `service+7 → FRb+7`, tanpa body atau query eksplisit caller. |
| Filter Berkas | Closure `0x8fccd8` membaca `wEb+0xb` dan membandingkan tepat dengan `BERKAS`. Builder `0x8fb938` materialisasi filter lalu memakai panjang penuh sebagai jumlah item. |
| Urutan dan indeks | `0x8fbd78` memilih baris dari list hasil filter menurut indeks. Tidak ada sort/reverse, pencarian teks, page slicing, atau request pagination pada chain aplikasi yang diperiksa. Urutan mengikuti traversal filter. Indeks tap native adalah indeks list terfilter. Menyimpan indeks respons asli untuk dispatcher browser merupakan adaptasi implementasi. |
| Daftar kosong | `Belum ada berkas di koleksimu, nih!` pada `0x8fba88`. |
| Judul | `row.title ?? 'Pencarian Berkas'`, `0x8fbf70–0x8fbf84`, ukuran 14. String kosong tetap kosong. |
| Subjudul | `row.subTitle ?? ''`, `0x8fc040–0x8fc050`, ukuran 12. |
| Tanggal | `row.createdAt`, `0x8fc10c/0x8fc118` → helper `0xda7094`, ukuran 10. |
| Ikon | Kartu yang diperiksa tidak mengalokasikan ikon depan. Ikon kanan dari pool `0x224b8`, MaterialIcons codepoint `0xe1b9`, ukuran 22, membuka konfirmasi hapus lewat `0x8fc680`. |
| Metadata internal | `id`, `contentId`, `email`, `groupId`, dan `type` tidak ditampilkan sebagai teks di builder kartu lengkap `0x8fbe74–0x8fc680`. |

## Parser dan pemuatan

Envelope `xEb` / `0x769aac` memerlukan root `Map<String,dynamic>`. Service langsung melakukan type assertion pada body (`0xd31a90`) lalu memanggil parser; **tidak ada decode JSON String kedua**.

- `error`: `bool?`; `message`: `String?`.
- `data`: null/missing atau list. Setiap item harus map dan diparse oleh `0x769e1c → 0x769e6c`.
- Delapan field baris semuanya `String?`: `id`, `type`, `contentId`, `createdAt`, `email`, `title`, `subTitle`, `groupId`. Tidak ada alias atau koersi numerik ke String.

Service `0xd319fc` menganggap **HTTP 200** sebagai jalur sukses, setelah parser berhasil. Tuple suksesnya `(false, model)` dibuat di `0xd31ac0–0xd31acc`. Controller `0xd3175c` memeriksa boolean **tuple transport**, bukan `model.error`. Akibatnya, HTTP 200 dengan `error:true` dan model valid tetap menerbitkan `model.data ?? []`. Backend generik web yang menolak `body.error:true` sebelum frontend tetap merupakan perbedaan transport yang harus disebutkan; audit ini tidak memperbaikinya.

Pada error tuple, controller memakai `model.message ?? 'Gagal memuat koleksi'`, mengosongkan daftar, dan mengakhiri loading. Catch controller membentuk teks `Terjadi kesalahan: ...`; web sebaiknya mempertahankan sanitasi error sebagai adaptasi. Renderer Berkas yang diperiksa tidak membaca stream error untuk membuat banner tersendiri.

Shared owner `tEb` dibuat oleh `0x7001f4`: tab 0, list kosong, group list kosong, loading false, error null, busy index null, serta service utama. `_EEb` init `0x769a5c` memanggil loader `0xd3175c` dengan named argument `DZi` default false. Jika flag loaded `+0x23` sudah true dan `DZi` false, loader kembali tanpa request. Refresh `0x8fbcf4` memasok `DZi:true`. Jalur tuple sukses maupun tuple error menandai loaded=true; catch controller tidak menyetel flag itu. Tidak ada guard deduplikasi request berjalan di loader ini.

Saat request dimulai, loading=true dan error=null. List lama masih tersimpan sampai completion, tetapi renderer memilih placeholder loading. Saat completion, data diperbarui atau dikosongkan, lalu loading=false. Menambahkan cancellation, pemilik sesi, dan proteksi respons terlambat pada browser adalah adaptasi yang diperlukan, bukan perilaku native yang telah diamati runtime.

## Tanggal, tap, dan batas mutasi

Helper `0xda7094–0xda7134`:

1. Input null menghasilkan String kosong.
2. Input nonnull masuk ke `DateTime.parse` (`0x6beed4`).
3. Hasil diformat langsung oleh `DateFormat('d MMM yyyy, HH:mm', 'id_ID')` (`0xda70e4/0xda70ec`), tanpa panggilan `toLocal` di helper ini.
4. Jika parse/format melempar, helper mengembalikan String input asli (`0xda711c`).

Grammar lengkap Dart, normalisasi tanggal overflow, dan kesetaraan semua perilaku locale tidak dibuktikan ulang. Dukungan browser untuk ISO kanonik dengan fallback raw pada format lain merupakan batas adaptasi yang eksplisit. Jangan mengubah tanggal ber-offset ke zona browser secara otomatis sambil mengklaim itu setara dengan helper native.

Tap `0x8fcb50` meneruskan type, contentId, id koleksi, dan indeks terfilter ke router `0xda76d0`. Untuk BERKAS dengan contentId nonnull, router mengambil `contentId.split(':')[0]`, menyetel busy index, memanggil alur detail yang sudah dibuktikan, lalu mengosongkan busy index setelah completion normal. Kartu yang sedang busy menghapus row-tap dan menambah overlay loading; baris lain masih mempunyai callback. Tidak ada penggantian contentId oleh id/title/subTitle.

Dialog hapus memakai `Hapus ${row.title ?? 'item ini'}?`, tombol `Batal` dan `Hapus`. Callback konfirmasi `0xda7134` diklasifikasikan sebagai mutasi, **tidak diperluas, dijalankan, atau diaktifkan**. Menampilkan tombol hapus aktif tanpa implementasi mutasi yang sah bukan hasil audit ini.

Cabang PERSIL pada router tetap menggunakan contentId utuh seperti [audit daftar → detail](COLLECTION-DETAIL-FLOW.md). Tab Bidang memakai renderer terpisah `FEb/_GEb`; grup PERSIL, editor grup, urutan grup, dan aksi mutasinya tetap di luar cakupan. Tidak ada klaim parity 1:1 seluruh menu Koleksi.

## Bukti dan reproduksi

- [Ledger](recovered/collection-card-followup/flow.json), SHA-256 `ac653d86b2c23a5bd57202cfd5e7b92c0c79cc67403edfbf7913da204837f25a`.
- [Verifikasi independen](recovered/collection-card-followup/verification.json): **20 hash sumber, 3.136 instruksi ELF, 155 marker, 140 binding pool, 1 objek ikon publik, 10 dispatch, 9 dependensi, 8 metadata kelas — lulus**.
- Builder [build_collection_card_followup.py](rea/build_collection_card_followup.py) menulis hanya prefix baru dan menolak perubahan pada bukti yang sudah dibekukan.
- Jalankan `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_collection_card_followup.py` untuk memeriksa source hash, setiap instruksi terhadap byte ELF, anotasi pool, dispatch dan marker; verifier tidak mengakses jaringan.
- ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool SHA-256 `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

Sumber `.explore.*` hanya catatan eksplorasi. Sumber kanonik audit ini adalah `.proof.asm.txt` yang tercantum di ledger. Tidak ada canonical range atau ledger lama yang ditulis ulang.

## Rilis baca grup pada webapp

Sumber `3d382b6c` menerapkan tab Berkas/Bidang, kartu dan isi grup, serta pembacaan detail dari ID konten sumber. Dua adapter Koleksi sekarang menerima envelope HTTP200 bertipe valid meski `error:true`, setelah validasi model; gap transport pada rilis kartu sebelumnya sudah diperbaiki. [Rekap rilis](webapp/collection-groups-verification-summary.json) mengikat 377 tes Node, 985 pemeriksaan fungsi/20 suite dan 25 uji browser sintetis. Build Docker dan empat aset publik cocok; preview setelah rebuild masih anonim. Ini tidak membuktikan penerimaan akun produksi terbaru, mutasi, seluruh perilaku Android atau submisi geotag. Bukti/ledger audit lama tetap utuh.
