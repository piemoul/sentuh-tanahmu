# Antrian: lifecycle identitas dan batas integrasi baca

**Sumber NIK otomatis adalah `account/account_summary.data.nomorIdentitas`, melalui model `ayb`, bukan field hasil login.** Daftar Antrian memakai seluruh NIK dari daftar identitas yang dikelola native. Pemilih identitas pada layar booking tidak membatasi query daftar tersebut.

Audit ini statis dan offline terhadap APK `id.go.bpn.sentuh` 6.1.5, ARM64 Dart 3.12.2, `libapp.so` SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Tidak membaca identitas akun nyata, menghitung token/OTP, mengirim request, menjalankan APK, atau mengubah aplikasi/backend. Tidak ada booking, penambahan identitas, maupun penghapusan yang dijalankan.

[Ledger beku](recovered/queue-identity-followup/flow.json), [hasil verifikasi](recovered/queue-identity-followup/verification.json), dan [verifier](rea/verify_queue_identity_followup.py) mengikat **27 berkas instruksi, 6.495 instruksi ELF, 9 sumber terdahulu yang digunakan kembali, 7 dependensi, 63 marker, 17 binding pool publik, dan 5 pemetaan field profil**. Ledger terdahulu [QUEUE-FLOW](QUEUE-FLOW.md), [QUEUE-TRANSPORT-FLOW](QUEUE-TRANSPORT-FLOW.md), dan [KKPR-DOCUMENT-FLOW](KKPR-DOCUMENT-FLOW.md) tidak diubah. Bukti baru memperjelas gap lifecycle mereka; angka ini bukan hasil uji server atau jumlah fitur selesai.

## Pemuatan sebelum query daftar

Controller `Yyb` menyediakan subject daftar identitas di `+0x37`, diawali `List<qzb>` kosong. Kunci penyimpanan lokalnya tetap `user_antrian`; tidak terdapat suffix akun pada kunci yang diaudit. Model `qzb` mewajibkan `id:int`, lima String (`nama`, `noHp`, `nik`, `tempatLahir`, `tglLahir`), dan `fromUserData:bool`. Parser tidak mengisi field storage yang hilang dengan nilai default.

Loader `0xd1ed00` membaca dan menunggu `user_antrian` di `0xd1ed60/0xd1ed6c`, lalu membaca keberadaan model login lokal `gyb?` melalui `0xcfed14`. Pembacaan login ini menentukan cabang; field NIK login tidak dipakai untuk membuat identitas otomatis.

| Kondisi | Perilaku native yang dibuktikan |
|---|---|
| Login lokal tidak ada, serialisasi identitas tersimpan ada | Parse daftar `qzb`, publish `+0x37` pada `0xd1ef2c`, lalu return. Cabang ini tidak melakukan merge profil. |
| Cabang lainnya | Resolve `wCb`, panggil metode dinamis pada subscription lama `+0x4f` bila ada dan tunggu, kemudian pasang listener profil `ayb?` serta callback error. |
| Callback profil selesai | Publish daftar sebelum menyelesaikan future loader pada `0xd1f520` atau `0xd1f630`. |
| Stream melaporkan error saat completer masih pending | Callback `0x72bdbc` memanggil penyelesaian error di `0x72be3c`. |

Controller daftar `0xd1e6c8` memanggil loader dan menunggunya pada `0xd1e704` sebelum membaca identitas, mengambil setiap `qzb.nik`, dan menggabungkannya dengan koma. **Daftar kosong atau hasil join berupa string kosong tidak menghasilkan GET daftar.** String tidak di-trim atau diganti dengan alias NIK login. Encoding query dijelaskan terpisah dalam [QUEUE-READ-FOLLOWUP](QUEUE-READ-FOLLOWUP.md).

Listener tetap tersimpan setelah initial load dan dapat memperbarui subject ketika profil berubah. Callback merge tidak memanggil GET daftar secara langsung. Serialisasi tersimpan yang dibaca callback berasal dari invocation loader; jalur penambahan/penghapusan memanggil loader lagi. Audit ini tidak membuktikan jadwal seed stream, hasil dua loader yang berjalan bersamaan, dispatch tepat metode cancel, atau jaminan completion ketika subject sudah ditutup. Completion yang dibuktikan adalah jalur callback yang tercatat, bukan jaminan seluruh exception native tertangani.

## Profil yang benar dan aturan merge

Rantai asal profil sudah terikat: request `account/account_summary` → envelope `data` → parser `ayb` CID 840 di `0x755604`. Controller meneruskan hasil lewat `0xd292c8 → 0x755510`; publisher membaca `wCb+0x13` pada `0x75552c`. Loader Antrian membaca subject `wCb+0x13` yang sama pada `0xd1efec` dan memasang callback `0xd1f080` dengan tipe `ayb?`. Model sign-in `gyb` berbeda.

| Field `account_summary.data` | Offset `ayb` | Field `qzb` | Aturan |
|---|---:|---|---|
| `nama` | `+0x1b` | `nama` | String nullable, null menjadi `''` |
| `nomorHp` | `+0x33` | `noHp` | String nullable, null menjadi `''` |
| `nomorIdentitas` | `+0x23` | `nik` | String nullable, null menjadi `''`; tanpa alias/fallback |
| `tempatLahir` | `+0x2b` | `tempatLahir` | String nullable, null menjadi `''` |
| `tanggalLahir` | `+0x2f` | `tglLahir` | Parse `d MMMM yyyy`/`id_ID`, format `yyyy-MM-dd`; null/kosong/exception menjadi `''` |

`userLevel` bertipe `int?` pada `+0x1f`. Hanya nilai **2 atau 3** masuk cabang merge. Profil null atau level lain memakai daftar tersimpan tanpa dedup cabang merge; kondisi itu bukan larangan universal membaca Antrian.

Pada cabang merge, native membentuk identitas profil `id=0`, `fromUserData=false`. Identitas ini dimasukkan di indeks nol hanya jika `isIkd:bool?` pada `+0x43` adalah **false**. Nilai true melewati penyisipan; null mencapai null assertion. Teks `"false"` atau `"true"` tidak setara Boolean pada parser model ini. Nama flag `fromUserData` tidak boleh dipakai untuk menyimpulkan otorisasi: profil otomatis maupun kandidat editor yang diaudit justru memakai false.

Daftar kemudian dijadikan map dengan key `qzb.nik`; entri duplikat yang muncul kemudian mengganti nilainya. Callsite `0xd1f374 → 0x43548c` diberi identitas **`Map._fromLiteral`** oleh metadata Blutter `1050512_WXn.dart`, dilanjut loop assignment `0xd1f460 → 0xca1768` dan materialisasi values di `0xd1f4b0/0xd1f4c4`. Ini bukan call langsung `Map.fromIterable`. Ledger beku belum mengklaim audit terpisah atas urutan iterator map/implementasi SDK; pemetaan key dan penggantian nilai sudah dibuktikan. Keluwesan parser tanggal penuh juga tetap di luar cakupan.

Corroboration setelah ledger dibekukan menggunakan **SDK versi target 3.12.2**, terpisah dari angka verifier: [patch VM `Map._fromLiteral`](https://raw.githubusercontent.com/dart-lang/sdk/3.12.2/sdk/lib/_internal/vm_shared/lib/map_patch.dart) membuat `LinkedHashMap` dan memasukkan pasangan berurutan. [Kontrak `LinkedHashMap` pada versi yang sama](https://raw.githubusercontent.com/dart-lang/sdk/3.12.2/sdk/lib/collection/linked_hash_map.dart) menyatakan urutan insertion dan bahwa penggantian value tidak memindahkan key. Digabung dengan identitas callsite AOT tersebut, ini mendukung derivasi read yang mempertahankan urutan kemunculan pertama setiap NIK, meskipun record bernilai NIK sama diganti oleh record terakhir. Bukti SDK ini bukan hasil eksekusi APK; ledger statis lama dipertahankan apa adanya. Ringkasan provenance tambahan ada pada [catatan corroboration](recovered/queue-identity-followup/map-order-corroboration.json).

## Pemilih, penyimpanan, dan enrollment identitas tambahan

Pemilih berada pada layar booking `Izb/_Jzb`, berjudul bagian **“Yang Akan Mengantri:”**. Init `0x72dbf4` memanggil loader identitas. Jika daftar kosong, tautan pada pesan belum ada pengguna membuka editor. Jika ada, picker menampilkan nama dan NIK; callback baris `0x885814` menyimpan objek terpilih ke state `+0x2f`. Builder memilih entri pertama saat id pilihan saat itu nol. Pilihan ini bukan sumber tunggal query daftar baca, yang tetap menggunakan semua identitas managed.

| Perubahan | Rantai native dan batas bukti |
|---|---|
| Tambah identitas | Handler form `0xd88bbc` membentuk `qzb`; `0xd88dbc` memeriksa duplikat NIK dan memanggil validasi `0xd88f5c` ke `POST api/verifikasi/`. Jalur berhasil membuka dialog **OTP Antrian Daring** dengan instruksi OTP WhatsApp. |
| Simpan kandidat | Callback OTP `0xd892d0` melewati gate hasil sebelum memanggil `0xd89460`. Fungsi ini membaca daftar tersimpan, menambahkan kandidat dari subject `+0x43`, men-serialize JSON, menunggu write `0xd896d0`, lalu memanggil loader lagi tanpa menunggu hasil reload. |
| Hapus identitas | Tombol hapus ditampilkan hanya jika `id != 0`; dialog meminta konfirmasi. Callback `0x885d7c` meneruskan id terpilih. Predicate `0x7d0344` mencocokkan `qzb.id`; penulisan ulang `user_antrian` ditunggu di `0xd89940/0xd8994c`, kemudian loader dipanggil tanpa await. |

Urutan layar dan gate tersebut adalah perilaku client. Audit tidak mengeksekusi atau mereproduksi pengiriman, pembuatan, maupun penerimaan OTP; tidak membuktikan apakah server menerapkan semua pemeriksaan yang sama. Penghapusan lokal juga tidak membuktikan pembatalan antrean di server. Tidak ada bukti bahwa semua identitas tersimpan adalah identitas pemilik akun yang sedang login, atau bahwa logout/pergantian akun selalu menghapusnya.

## Batas implementasi baca webapp

Untuk subset **profil pengguna sendiri**, backend perlu mengambil atau memakai cache `account/account_summary` yang diperoleh backend dalam sesi autentikasi yang sama, lalu menerapkan gate profil native dan mengambil `nomorIdentitas` dari hasil bertipe yang dikenali. Snapshot profil kiriman browser, cache frontend, dan `nomorIndukKependudukan` hasil login bukan pengganti sumber ini. Mengambil summary secara eksplisit sebelum derivasi adalah keputusan integrasi web; audit native membuktikan listener profil, bukan request summary baru di dalam loader Antrian.

Webapp tanpa penyimpanan identitas tambahan yang melewati enrollment native hanya dapat mendukung cabang profil tersebut. `isIkd=true`, level lain, dan identitas tambahan tidak boleh dipenuhi dengan form NIK bebas atau dengan menulis `user_antrian` langsung. Helper derivasi read dapat diuji secara sintetis tanpa mengaktifkan endpoint Antrian, booking, atau enrollment.

Integrasi transport tetap pekerjaan terpisah: provenance client/bundled bearer tidak membuktikan izin integrasi, kepemilikan server, atau keberhasilan live. Audit ini tidak menyatakan semua fungsi selesai dan tidak mengubah status deployment.

Reproduksi lokal:

```powershell
.\tools\runtime\blutter-python\Scripts\python.exe analysis/rea/verify_queue_identity_followup.py
```

Verifier membandingkan canonical `*.proof.asm.txt` dengan ELF dan hash ledger. Opsi `--build` hanya membuat artefak yang belum ada; artefak beku yang berbeda ditolak. Berkas eksplorasi dan `reference-index.json` di direktori yang sama adalah alat navigasi, bukan klaim cakupan seluruh writer atau seluruh lifecycle.
