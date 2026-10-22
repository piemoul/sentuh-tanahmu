# Buku Tamu: batas implementasi yang terbukti

Peninjauan offline ini memakai dua ledger beku: UI `guestbook-followup` (`d0fc1e5e1a7f770001b15aed6ec2f4b60b43558256654e4a76f1d0ba55939238`) dan service `guestbook-service-followup` (`9bceab7de8b363e521cea846abaa65ae03a925fa5a5f389ee249c014676f10dc`). Tidak ada request, QR aktual/buatan, kamera, nilai akun, token atau kredensial yang digunakan. Tidak diperlukan range native baru: caller dan transport yang relevan sudah terdapat dalam kedua proof tersebut.

## Akun biasa dan autentikasi layanan

**Belum ada bukti bahwa GET Buku Tamu memerlukan akun petugas/admin.** Caller native `d28694` membaca cached sign-in melalui `cfed14`; hasil nonnull langsung membuka scanner. Pada caller lengkap yang beku tidak terdapat predicate role/level petugas. Cabang tanpa cached sign-in menawarkan pemilihan pengguna, tetapi populasi dan hak bertindak untuk pengguna lain belum tertutup. Cabang own-account dapat diterapkan terlebih dahulu tanpa mengarang dukungan perwakilan.

Namun, GET ini bukan read dengan bearer akun. Constructor uBb776 membuat Dio standalone pada+b; service membaca+b meskipun FRb juga disimpan pada+7. GET dan POST membentuk `Authorization` dari prefix **AtrBpn** dan field konfigurasi aplikasi **TRb.oYi**. Field konfigurasi yang sama dipakai login `auth/signin`, sesuai `auth-config-provenance.json`. Kesamaan sumber ini memungkinkan pemakaian getter otorisasi aplikasi yang **sudah tersedia pada backend**, tanpa menurunkan atau meminta kredensial baru. Ini tidak menjadikan endpoint anonim dan tidak membuktikan cakupan izin/current acceptance server.

URL awal yang terbukti adalah **https://sentuh.atrbpn.go.id/bukutamu**, gabungan TRb.AYi dengan `bukutamu`. Host `persuratan.atrbpn.go.id` berasal dari isi QR; host tersebut bukan host endpoint metadata. Nilai base static dapat berubah setelah initializer; perubahan runtime tidak diamati.

Tidak ada alasan berbasis bukti saat ini untuk menghentikan seluruh UI/read dan meminta akun petugas. Jika getter aplikasi belum tersedia, QR sah tidak tersedia, atau server kemudian menolak request yang tepat, tampilkan kondisi itu apa adanya. Akses integrasi/pengelola diperlukan untuk menyelesaikan izin/scope yang tidak disediakan atau penolakan yang memerlukan pengelola; jangan mengasumsikan hal tersebut sebelum ada bukti. Membundel konfigurasi dalam APK sendiri juga bukan bukti izin pemakaian ulang universal.

## Pemindai QR pengunjung berbeda dari Scan dokumen

Pada awal peninjauan, runtime memiliki menu Buku Tamu tetapi menuju halaman unavailable; GET dan POST katalog masih `enabled:false`, `inspect_only`, dengan klasifikasi lama `auth:session`. Integrasi GET mulai dikerjakan secara paralel setelah temuan batas ini dikirim. JSON mencatat snapshot katalog saat capture; itu bukan penerimaan end-to-end. Klasifikasi sesi lokal tidak mengganti kontrak autentikasi upstream aplikasi. Mengaktifkan flag saja tanpa profil transport khusus akan memakai transport yang salah.

Scan dokumen sekarang memanggil classifier `apis/scanDocument`, kemudian cabang batas bidang/PDF dan metadata dokumen. Classifier itu adalah operasi bertanda write dengan nama dari profil akun. **QR Buku Tamu tidak memiliki bukti melewati classifier tersebut.** Modul kamera lokal `scan-camera.js` dapat dipakai ulang untuk membaca String tanpa mengirim frame/kode, tetapi controller Buku Tamu harus mempunyai jalur lokal tersendiri sebelum GET metadata eksplisit.

Parser native Buku Tamu memeriksa substring domain, memecah `?`, `&`, `=`, lalu mencari substring `id` dan `kd`. Parser ini bukan validasi host URI atau autentisitas QR. Komposisi positif dua ledger mengikat:

| Sumber | Tujuan |
|---|---|
| QR `kd` → nBb+7 | GET query `uid` |
| QR `id` → nBb+b | GET query `unid` |
| GET `data.userId` | identitas lookup untuk POST berikutnya |
| cached sign-in NIK/email | prefill dua isian pengunjung saja |

**uid bukan userId profil akun, dan unid bukan kantorId pilihan browser.** Jangan mengganti keduanya dengan username, ID akun, ID kantor dari daftar, atau nilai buatan. GET mengembalikan userId, kantorId, unitKerjaId dan namaUnitKerja; ketiga ID itu harus berasal dari hasil lookup milik konteks QR/sesi aktif, bukan input bebas.

Browser boleh menerapkan guard URL yang lebih ketat sebagai adaptasi yang dinyatakan: HTTPS dan host persuratan yang tepat, tanpa userinfo atau query ambigu/duplikat, error yang jelas untuk delimiters rusak. Jangan mengklaim guard tersebut sama persis dengan parser substring native. Pertahankan nilai String yang diperoleh; native tidak melakukan URI-decode, trim atau coercion di parser/service yang beku. Jangan mengarang format UUID/digit untuk identifier opaque, menggandakan decoding, atau membuat QR untuk pengujian penerimaan produksi.

## Read yang dapat diimplementasikan

Gunakan profil privat yang hanya mengizinkan GET URL tetap tersebut, query String `uid,unid`, body kosong, dan getter applicationAuthorization yang sudah ada. Jangan mengirim bearer akun, melakukan account refresh, meminjam retry antrean, memasang main-client Content-Type GET, atau menerima URL/header arbitrer dari browser.

Constructor standalone native tidak memasang interceptor/main-client adapter dalam window yang beku. Backend utama sekarang memiliki Content-Type GET dan material TLS berlingkup main. Itu tidak boleh diwariskan diam-diam hanya karena host sama. Adaptasi read terpisah dapat menggunakan transport HTTPS dengan trust roots standar dan verifikasi sertifikat/hostname aktif; keputusan ini harus dinyatakan sebagai adaptasi, bukan bukti kesetaraan TLS/packet native. Redirect harus gagal tertutup, bukan memperluas tujuan otorisasi. Tidak ada alasan untuk mematikan verifikasi TLS.

HTTP200 harus memvalidasi envelope dan model yang sama: `data` null atau Map empat String nullable; `error` bool nullable; `message` String nullable. Envelope `error:true` tetap diparse dan tidak otomatis menjadi error service. HTTP selain200, timeout dan bentuk salah adalah kegagalan read. HTTP200 dengan data:null tetap null, bukan kantor/identitas palsu atau bukti kunjungan. Unknown fields diabaikan; angka tidak dijadikan String. Batas ukuran, cancellation, redaksi log dan pengamanan sesi adalah guard browser yang dinyatakan.

Session cookie/Origin/CSRF tetap melindungi endpoint browser walaupun header upstream memakai aplikasi. Konteks read harus habis saat logout, pergantian akun/QR, navigasi atau request yang lebih baru; respons terlambat tidak boleh memulihkan formulir dari konteks lama. Jangan mencatat QR, identifier, isian pribadi atau nilai Authorization dalam log. Bukti yang masih kurang untuk penerimaan produksi adalah QR kantor yang sah dan hasil read aktual, bukan bukti kebutuhan role petugas.

## UI dan validasi yang tetap berguna

UI nyata dapat menyediakan pembacaan QR lokal, review QR, GET metadata eksplisit, nama unit dari hasil GET dan sembilan isian native: Nama Lengkap, NIK, Nomor Telepon, Tanggal Lahir, Tempat Lahir, Alamat Sesuai KTP, Alamat Email, Instansi, Keperluan. Prefill own-account native memakai **cached sign-in NIK/email saja**; jangan diam-diam mengambil nama/tanggal/telepon dari account_summary seolah itu provenance native.

Validasi aggregate yang tertutup memakai null/raw-empty untuk semua isian, NIK length<16 dan email nonnull mengandung `@`. Error NIK pendek menimpa error kosong; error email tidak valid menimpa error kosong. Tidak ada bukti trim, digits-only, panjang tepat16, batas usia, parsing tanggal atau regex email penuh dalam validator itu. Semantik formatter/shared keyboard lengkap tetap belum tertutup. Pertahankan raw model Strings; adaptasi browser tambahan harus dinyatakan.

Instruksi native menyatakan formulir untuk **mendaftarkan kedatangan** dan isian akan diverifikasi petugas sebelum memperoleh kartu pengunjung. Tampilkan instruksi itu dengan interpolasi unit yang benar. Draft/form validation/read metadata boleh berfungsi tanpa POST. Tombol menyimpan kedatangan harus tetap jelas belum tersedia sampai adapter dan alur kunjungan yang sah benar-benar diterapkan; validasi lokal, QR terbaca atau HTTP200 GET tidak boleh memunculkan **Buku Tamu Sudah Terisi**.

Native POST merupakan tindakan terpisah dengan12 field. Service hanya melihat HTTP200 dan mengembalikan bool errorfalse; caller kemudian menampilkan sukses. Audit ini tidak mengimplementasikan atau menjalankan POST, tidak mengesahkan kunjungan jarak jauh, dan tidak membuktikan verifikasi petugas maupun kartu pengunjung. Tidak adanya koordinat pada builder bukan izin untuk mengarang kedatangan.

## Rekap

Ada jalur implementasi baca yang sah secara teknis dengan konfigurasi aplikasi yang sudah tersedia, own-account, dan QR kantor yang benar. Autentikasi, URL, pemetaan QR, model metadata, copy dan validasi tidak lagi merupakan gap statis utama. Shared chooser/formatter/scanner lifecycle native, perilaku TLS penuh, QR authenticity, server acceptance, pendaftaran kedatangan dan verifikasi petugas tetap belum selesai. JSON pendamping `analysis/webapp/guestbook-implementation-boundary.json` mengikat snapshot source yang ditinjau; hasil ini bukan deployment atau klaim fitur end-to-end selesai.
