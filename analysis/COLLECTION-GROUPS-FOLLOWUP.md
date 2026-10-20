# Koleksi: Bidang, grup, dan navigasi baca — APK 6.1.5

Audit statis ini menutup tampilan baca tab **Bidang**, kartu grup, dan halaman grup terpilih. Koreksi utama: tab Bidang memakai **HEb/_IEb**, sedangkan **FEb/_GEb adalah kartu baris bidang**. Ledger audit kartu sebelumnya tetap dibekukan; interpretasi nama kelas pada `contract.parent.selector` digantikan secara eksplisit oleh bukti baru ini.

Selector `0x8fb714` memanggil allocator `0xda7034`. Dua instruksi pertama membentuk header `0x185911c`; `header >> 12 = 0x1859 = 6233`, sesuai metadata **HEb CID 6233**. Dispatch indeks 59964 mengarah ke factory `0x9fce9c`, yang mengalokasikan `_IEb CID 5413`; dispatch build indeks 61623 mengarah ke `0x8ffcac`. Allocator kartu yang terpisah `0xda90c0` membentuk **FEb CID 6234**, factory `0x9fce14` → `_GEb CID 5414`, build `0x8fcd30`. Verifier memeriksa header allocator, metadata, instruksi call, dan tabel dispatch secara terpisah terhadap artefak sumber.

Tidak ada APK dijalankan, request produksi, data akun, kredensial, perubahan frontend, mutasi koleksi, atau operasi geotag dalam audit ini.

## Pemuatan dan model grup

`GET collection/GetPersilCollectionGroup`, call **`0xd31fbc`**, memakai client utama `service+7 → FRb+7`, tanpa body atau query caller. Respons HTTP 200 harus berupa `Map<String,dynamic>`, lalu masuk parser `vEb` `0x76a21c`; tidak ada decode JSON String kedua. Envelope: `error: bool?`, `message: String?`, `data: List<uEb>?`. Parser item yang benar adalah **`0x76a5dc`**, dipanggil melalui closure `0x76a58c → 0x76a5c4`; `0x76a424` adalah serializer envelope.

| Field JSON grup | Slot uEb | Tipe |
| --- | --- | --- |
| `collectionGroupId` | `+7` | `String?` |
| `collectionGroupName` | `+0xb` | `String?` |
| `createdAt` | `+0xf` | `String?` |

Tidak ada alias, pengganti ID, atau koersi numerik menjadi String. Nama kosong tetap kosong; fallback UI berlaku hanya untuk null.

Init `_IEb` `0x76a1cc` memanggil orkestrator `0xd31cb8`, named argument `DZi` default false. Orkestrator menyetel loading `+0x13=true`, error `+0x17=null`, memulai loader baris `0xd32224` dan loader grup `0xd31e18`, menunggu keduanya melalui `Future.wait`, lalu mengakhiri loading. Refresh `0x901560` memasok `DZi:true`. Flag cache baris `+0x23` dan grup `+0x27` diperiksa secara terpisah; bila sudah true dan tidak dipaksa, masing-masing loader kembali tanpa request. Tidak terlihat guard deduplikasi request berjalan pada chain ini.

Boolean tuple service adalah **flag error transport**. HTTP 200 yang berhasil diparse mengembalikan `(false, envelope)` sekalipun `envelope.error=true`. Loader memublikasikan `envelope?.data ?? []`; tuple error atau catch mengosongkan list. Kedua jalur tuple normal menandai flag loaded=true; catch tidak menyetelnya. Group loader tidak memakai `envelope.message` sebagai banner. Selector UI membaca loading, grup, lalu baris; build yang diperiksa tidak menampilkan banner tersendiri dari stream error. Perbedaan transport web generik terhadap `body.error=true` yang sudah tercatat pada audit kartu tetap merupakan adaptasi yang perlu dinyatakan.

## Susunan tab Bidang

Predicate root **`0x9029bc`** memfilter baris dengan `row.type == 'PERSIL'` persis. List grup mengikuti urutan respons; list bidang mengikuti traversal hasil filter. Tidak ditemukan sort/reverse, pencarian teks, page slicing, atau request pagination dalam chain baca yang diperiksa.

| Kondisi grup | Susunan |
| --- | --- |
| Ada grup | Header **Grup Bidang** dan kontrol **Buat Grup**, seluruh kartu grup, lalu header **Semua Bidang** dan seluruh baris PERSIL. Baris yang sudah masuk grup tetap muncul pada daftar ini. |
| Tidak ada grup | Header **Bidang Tersimpan** dan seluruh baris PERSIL. |

Pemetaan judul ini dikonfirmasi dengan dispatch primitive: selector `0xf985` → `isEmpty`, sedangkan `0xd67e` → `isNotEmpty`. Menganggap keduanya terbalik akan menukar judul dan kondisi kosong.

Kartu grup memakai `collectionGroupName ?? 'Grup'` (ukuran 14) dan `${jumlah} bidang` (ukuran 11). Jumlah berasal dari list **PERSIL yang sudah difilter**, lalu predicate `0x902950` membandingkan `row.groupId == group.collectionGroupId`. `collectionGroupId` dan `createdAt` tidak ditampilkan sebagai teks dalam builder kartu grup. Jika kedua list kosong, teksnya **Belum ada bidang di koleksimu, nih!**; bila ada grup tetapi list PERSIL kosong, teksnya **Belum ada bidang tersimpan.**

## Membuka grup dan baris

Tap kartu grup `0x902378 → 0x9023f4` mengalokasikan **zEb CID 5936**, menaruh grup di `widget+b` dan controller bersama di `widget+f`. Widget ini stateless; dispatch build `0xa3af88`. Judulnya `collectionGroupName ?? 'Grup Koleksi'`. Halaman berlangganan stream baris controller yang sudah ada; **tidak membentuk request detail grup baru**.

Predicate halaman grup **`0xa3b5bc`** hanya membandingkan `row.groupId == selectedGroup.collectionGroupId`. **Halaman ini tidak memfilter `type == 'PERSIL'` lagi.** Karena itu, baris bertipe lain yang mempunyai groupId sama dapat tampil meskipun jumlah pada kartu root dihitung hanya dari PERSIL. Persamaan memakai nullable String secara langsung: null cocok dengan null, String kosong cocok dengan String kosong; tidak ada fallback, trim, normalisasi, atau koersi. Urutan mengikuti traversal sumber, dengan jumlah item penuh. Snapshot null menjadi list kosong. Teks kosongnya **Belum ada bidang di dalam grup ini.**

Kedua daftar memakai kartu FEb/_GEb yang sama, dengan `row.title ?? 'Pencarian Bidang'` ukuran 14, `row.subTitle ?? ''` ukuran 12, dan tanggal ukuran 10. Ikon depan publik berasal dari pool `0x4d9a8`, MaterialIcons `0xe36d`. Field `id`, `type`, `contentId`, `email`, dan `groupId` tidak ditampilkan sebagai teks kartu.

Indeks native berbeda antar jalur: daftar root memakai indeks **list PERSIL terfilter**. Halaman grup memakai `source.indexOf(row)` pada **list sumber belum difilter**, dengan first equality match atau −1. FEb menerima indeks itu di `+f`, flag busy di `+0x17`, list grup di `+0x1b`, controller di `+0x1f`, dan flag konteks grup `+0x23` (root=false, grup=true). Saat busy, tap baris dilepas dan overlay loading ditambahkan. Tap normal `0x8ffc20` meneruskan `type`, `contentId`, `id` koleksi, dan indeks ke router lama `0xda76d0`. Untuk PERSIL, router memakai `contentId` utuh menuju pembacaan batas bidang yang sudah dibuktikan di [audit daftar → detail](COLLECTION-DETAIL-FLOW.md). Field lain tidak menjadi pengganti ID konten.

Helper tanggal Bidang **`0xda794c` berbeda dari helper Berkas**: ia membuat `DateFormat('d MMM yyyy, HH:mm')` **tanpa argumen locale eksplisit**, kemudian `DateTime.parse`, tanpa `toLocal`. Null menjadi String kosong; catch mengembalikan String input asli. Locale default global tidak ditetapkan oleh audit ini. Jangan memindahkan klaim locale `id_ID` dari helper Berkas ke kartu Bidang. Kesetaraan penuh grammar Dart, locale, dan pixel tetap tidak diklaim.

Kontrol **Buat Grup**, callback hapus grup `0x902460`, dan kontrol kartu `0x8fea54`, `0x8fe068`, `0x8fdb68` hanya diklasifikasikan sebagai entry mutasi. Isi callback mutasi dan endpointnya tidak termasuk proof kanonik, tidak dijalankan, dan tidak diaktifkan oleh audit ini.

## Bukti dan reproduksi

- [Ledger immutable](recovered/collection-groups-followup/flow.json), SHA-256 `c5cc8bd27217e758ba1bb14c4dd6b2e46112e7b110e99bb88c6c89c89017a230`.
- [Verifikasi independen](recovered/collection-groups-followup/verification.json): **25 hash sumber, 4.231 instruksi ELF, 140 marker, 149 binding pool, 6 objek publik, 11 dispatch, 8 dependensi, 7 metadata kelas, dan 6 header allocator/CID — lulus**.
- Builder: [build_collection_groups_followup.py](rea/build_collection_groups_followup.py). Verifier: [verify_collection_groups_followup.py](rea/verify_collection_groups_followup.py).
- Jalankan `tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_collection_groups_followup.py`. Verifier membaca ELF/pool lokal dan menolak perubahan pada proof atau ledger yang dibekukan; tidak memakai jaringan.
- ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool SHA-256 `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.

File `.explore.*` adalah catatan eksplorasi; sumber kanonik adalah 25 file `.proof.asm.txt` yang dicantumkan ledger. Ledger/range lama tidak ditulis ulang. Audit ini mendukung implementasi baca grup, bukan klaim parity semua menu dan mutasi Koleksi.

## Rilis baca grup pada webapp

Sumber `3d382b6c` menerapkan tab Berkas/Bidang, kartu dan isi grup, serta pembacaan detail dari ID konten sumber. Dua adapter Koleksi sekarang menerima envelope HTTP200 bertipe valid meski `error:true`, setelah validasi model; gap transport pada rilis kartu sebelumnya sudah diperbaiki. [Rekap rilis](webapp/collection-groups-verification-summary.json) mengikat 377 tes Node, 985 pemeriksaan fungsi/20 suite dan 25 uji browser sintetis. Build Docker dan empat aset publik cocok; preview setelah rebuild masih anonim. Ini tidak membuktikan penerimaan akun produksi terbaru, mutasi, seluruh perilaku Android atau submisi geotag. Bukti/ledger audit lama tetap utuh.
