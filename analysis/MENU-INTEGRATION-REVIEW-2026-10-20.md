# Review integrasi menu — 20 Oktober 2026

Empat perbedaan antarmuka dapat diperbaiki tanpa menebak perilaku native atau menambah API. Review memakai sumber rilis Antrian `cd20ebab938aacb5962409df8894323fa16cd4ac52aef424945fc7fb7fd800a4`, 176 kontrak dan 80 adapter aktif. [Laporan mesin](webapp/menu-integration-review-20261020.json) menyimpan baris sumber, hash referensi, empat probe fungsi aktual dengan state sintetis, dan batas tes. Tidak ada request produksi, pembacaan kredensial, atau perubahan runtime/tes/receipt lama.

| Temuan | Perilaku sekarang | Perbaikan terbatas |
|---|---|---|
| P2 — penjelasan sesi di Pengaturan | Teks mengatakan data sesi lokal dibersihkan saat reload. Koordinat/riwayat tab memang hilang, tetapi cookie dan sesi login server dapat bertahan; `load()` memulihkannya. | Pisahkan penjelasan memori tab dari login. Arahkan pengguna ke Keluar untuk mengakhiri sesi; reload bukan logout. |
| P3 — penjelasan verifikasi di Akun dan Keamanan | Mengatakan alur verifikasi native belum tersedia, padahal formulir validasi awal Daring sudah dapat ditawarkan dari status layanan. | Sebut tahap awal yang tersedia dan batas OTP/liveness. Jangan menjanjikan verifikasi akun lengkap. |
| P2 — tujuan pada tinjauan katalog | Semua tinjauan menunjukkan host Sentuh utama, termasuk enam operasi `queue-read` yang sebenarnya menuju Directus `aplikasi.atrbpn.go.id`. | Tampilkan tujuan dari metadata layanan tetap yang dipercaya. Nilai pengguna tidak boleh menentukan label tujuan atau routing. |
| P3 — shortcut Profil | Koleksi/Aktivitas selalu tampil untuk akun login, sementara sidebar/bottom navigation menyembunyikannya menurut gate profil yang sudah diaudit. | Gunakan keputusan `visibleNativeMenus()` yang sama untuk shortcut tersebut. Ini konsistensi menu, bukan aturan izin server baru. |

Tes sekarang sudah mencakup pemulihan profil setelah reload, logout/expiry, tahap Daring, serta origin dan bearer transport. Tes tersebut belum menilai teks Pengaturan/Keamanan, tujuan yang dirender pada tinjauan katalog, atau shortcut Profil pada cabang profil yang tidak memenuhi gate. Tambahkan pemeriksaan render pada fungsi aktual untuk cabang tersebut, kemudian jalankan regresi sesi dan transport yang ada.

Transport Directus tetap memakai audience dan kredensial terpisah. Label tujuan yang keliru tidak membuktikan kebocoran token. Flag geotag nonaktif dan status kesetaraan/server yang belum terverifikasi tetap sesuai implementasi. Fungsi `connectionPage()` lama tidak menjadi layar akun yang dapat dicapai pada renderer sekarang, sehingga teksnya tidak diperlakukan sebagai cacat yang terlihat pengguna.
