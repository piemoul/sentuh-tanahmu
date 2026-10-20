# Panggilan Antrian: alur native yang dibuktikan

Tab **Panggilan** adalah daftar pesan dari `GET api/notifikasi` melalui klien Directus yang sama dengan daftar Antrian. Ia bukan WebView, dan baris pesan tidak mempunyai aksi buka detail, tandai dibaca, atau hapus dalam fungsi yang diaudit.

Audit ini offline terhadap ELF ARM64 APK 6.1.5, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Tidak ada request produksi, token yang diturunkan/diekspor, atau perubahan aplikasi/backend oleh audit. [Ledger beku](recovered/queue-calls-flow/flow.json) dan [verifier](rea/verify_queue_calls_flow.py) memverifikasi 19 sumber baru, 5 sumber yang digunakan kembali, **2.941 instruksi ELF**, 140 marker, 174 referensi pool, 26 konstanta publik, 8 dispatch, serta 12 dependensi. Angka ini adalah cakupan bukti statis, bukan uji runtime.

## Entry, identitas, dan request

Parent `rzb/_szb` membentuk halaman kedua `Nzb` CID6285 pada `72a360`, dengan controller `Yyb` yang sama seperti Antrian. Dispatch mengikat factory `9f8590`, state `_Ozb` CID5462, init `746544`, dan build `88d840`. Callback tab memperbarui selected index melalui `87f91c → 7d3744 → 7d37b4`.

Init memanggil controller `d22054`. Controller menunggu loader identitas `d1ed00`, membaca subject `Yyb+37`, memetakan `qzb.nik` melalui getter `436cf8`, lalu memanggil service `d22340`. [QUEUE-IDENTITY-FOLLOWUP](QUEUE-IDENTITY-FOLLOWUP.md) tetap menjadi bukti asal profil dan identitas tambahan. Webapp dengan subset akun sendiri harus menggunakan identitas dari backend `account_summary` dalam sesi yang sama; audit ini tidak membuka form NIK bebas.

Service mengubah list String menjadi **Set CID88** (`5ebc20 → 46afbc`), kemudian menggabungkan dengan koma (`5dcd9c`). Field query hanya `nik`. Tidak ada body, kategori, limit, halaman, tanggal, atau pilihan satu identitas. Tidak ada trim. List identitas kosong menghentikan request, tetapi service Panggilan tidak memeriksa panjang hasil join; list berisi satu String kosong dapat menghasilkan `nik=""`. Guard web terhadap identitas kosong adalah pembatasan eksplisit.

Pembacaan `xzb+7 → FRb+b` pada `d2240c/d22414` dan GET `7017a4` pada `d22468` mengikat klien Directus, dengan base awal `https://aplikasi.atrbpn.go.id/konsol/antrian/directus/`. Provenance bundled bearer, User-Agent, status **2xx**, MIME/JSON, dan retry menggunakan [QUEUE-TRANSPORT-FLOW](QUEUE-TRANSPORT-FLOW.md) dan [QUEUE-INTERCEPTOR-FOLLOWUP](QUEUE-INTERCEPTOR-FOLLOWUP.md). Main access token tidak dibaca/dikirim oleh callsite ini. Nilai bearer tidak disalin atau dihitung.

## Envelope dan model

Service membaca response body yang sudah ditransformasi oleh klien, kemudian **hanya `body.data`**. Field `error` dan `message` diabaikan, termasuk `error:true`. `data` harus List, dan setiap item harus Map<String,dynamic>. List kosong adalah sukses. Body/data null, tipe salah, atau exception model menghasilkan tuple `(false,[])`; tidak ada JSON decode kedua untuk body String dan tidak ada syarat khusus HTTP200 pada service.

Parser `pzb` CID723 di `746614` mewajibkan keenam field berikut; semuanya String non-null tanpa default.

| Field | Pemakaian native |
|---|---|
| `id` | Divalidasi, lalu dibuang |
| `tipe` | Divalidasi, lalu dibuang |
| `pesan` | Disimpan di `+7`, ditampilkan sebagai teks |
| `pengirim` | Disimpan di `+b`, judul `Panggilan {pengirim}` |
| `penerima` | Disimpan di `+f`, teks penerima |
| `tanggal_dikirim` | `DateTime.parse6beed4`, hasil disimpan di `+13` |

Controller hanya mem-publish daftar pada flag tuple literal true. Kegagalan membersihkan flag busy tetapi mempertahankan daftar sebelumnya. Karena exception service ditangkap, kegagalan HTTP/model tidak otomatis menjadi `snapshot.error` yang ditampilkan UI.

## Tampilan dan lifecycle

Daftar diurutkan tanggal menurun melalui comparator `74689c`, yakni tanggal argumen kedua dibanding tanggal argumen pertama. Urutan timestamp yang sama tidak dijamin. Baris menampilkan judul dan waktu pada header, diikuti penerima lalu pesan. Waktu menggunakan `HH:mm`, locale `id_ID`, setelah konversi ke waktu lokal `8867cc`. Semua adalah widget Text; tidak ada HTML, link, attachment, atau callback tap pada fungsi baris lengkap `88ddac..88e3b8`. `id` yang dibuang tidak dapat digunakan untuk menyimpulkan endpoint detail.

UI memiliki cabang spinner untuk waiting/busy, error stream `Terjadi kesalahan: {error}`, serta pesan kosong:

> Belum ada panggilan, nih!
>
> Halaman ini buat nunjukin panggilan Antrian Daring. Kamu bakal dapet info kalau antrianmu udah dekat.

Daftar nonkosong memakai seluruh jumlah item tanpa slicing. RefreshIndicator memanggil dan menunggu `d22054` melalui `d8c2c4`: reload penuh, bukan append atau pagination. Native wrapper refresh dibuat hanya pada cabang nonkosong.

Init juga memasang listener scroll `7468e8 → 746920`; pada posisi >= batas maksimum ia memanggil reload yang sama. Namun constructor ListView di `88dc9c` tidak menerima argumen `controller`; default controller terbukti null di `872234/87232c`. Karena itu, audit tidak menyatakan listener tersebut benar-benar terhubung pada daftar. Tidak ada Timer/periodic call dalam init/controller/refresh/scroll/UI yang dipertahankan. Tidak ada websocket dalam rantai tab ini; websocket yang ditemukan pada init booking adalah scope terpisah.

Tombol steering-wheel pada toolbar parent ketika index1 membuka manajemen identitas `vzb`, bukan detail pesan. Alur identitas/OTP tetap terpisah dalam bukti identity; tidak ada aksi enrollment yang dilakukan audit.

## Batas

Belum ada observasi runtime, validitas bearer saat ini, atau penerimaan server. Detail penuh grammar DateTime, overflow/zona/locale, urutan iterator dan hashing Set, dispose, overlap request, pergantian akun, serta push global tidak dibuktikan ulang. UI browser yang mengikat tanggal tanpa zona ke zona browser, menjaga race/logout, menyediakan refresh saat kosong/error, atau menolak input identitas kosong perlu dicatat sebagai penyesuaian. Lookup GET mengidentifikasi intent baca, bukan jaminan server tanpa telemetry.

Reproduksi lokal: `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_queue_calls_flow.py`. Builder/finalizer menolak perubahan terhadap sumber beku. Berkas bernama `*-draft.asm.txt` adalah sisa eksplorasi yang tidak termasuk ledger, tidak dipakai sebagai bukti tambahan, dan tidak menggantikan sumber kanonis terdahulu.
