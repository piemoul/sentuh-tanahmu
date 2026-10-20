# Audit menu dan model tampilan APK 6.1.5

Artefak mesin: [official-menu-map.json](official-menu-map.json). Generator: [build_official_menu_map.py](rea/build_official_menu_map.py). Audit ini memakai skill REA dan hasil ekstraksi/disassembly yang sudah ada. Tidak ada panggilan layanan produksi atau pembacaan akun pengguna.

## Hasil yang terbukti

- Pembentuk daftar tab `0x8bf058` dan daftar halaman `0x8bf93c` menyusun **Beranda, Koleksi, Scan, Aktivitas, Profil**. Kedua daftar memakai predikat yang sama untuk menyisipkan Koleksi dan Aktivitas. Scan adalah aksi khusus dengan placeholder pada daftar halaman. Sumber: `range-008befe8.asm.txt`, `range-008bf7a0.asm.txt`, `range-00d9aa90.asm.txt` di `recovered/request-callsites/`.
- Predikat `0x8bf78c` memerlukan profil, `roleUser == "PERORANGAN"`, `statusVerifikasi != null && statusVerifikasi != -1`, dan `isIkd` bukan true/teks `"true"`/`"1"`. Nama field dibuktikan parser profil `0x755604`, bukan disamakan dengan layout model sign-in. Ini aturan tampilan lokal, bukan bukti izin server. Nilai harus berasal dari `account/account_summary`.
- Varian beranda `GZn._PBb` membentuk **Laci: Sertipikatku, Aktaku, Berkasku** dalam urutan itu (`0x8c0eb4–0x8c0fec`). Callback varian tersebut menampilkan pesan harus login. Ada implementasi beranda lain (`GYn._cAb`, `bao.yCb`); pemilihan seluruh variannya menurut akun belum dibuktikan saat berjalan.
- Daftar **Layanan** dibentuk sebagai tujuh objek ikon–label–callback: Cari Bidang, Cari Berkas, Antrian Daring, Swaplotting, Info Layanan, Mitra Kerja, Buku Tamu (`0x8c2f24–0x8c31e8`). Field objek menu: ikon `+0xb`, label `+0xf`, callback `+0x1b`. Urutan disimpan secara eksplisit, bukan diambil dari kedekatan string.
- Daftar **Informasi**: Kantor Pertanahan, Kalender Kantor Pertanahan, Bantuan, Website, JDIH, PPID (`0x8c26e0–0x8c28c8`). Empat target web terakhir juga tersedia sebagai konstanta URL/konfigurasi WebView di pool.
- Profil memuat Akun dan Keamanan, Pengaturan, bagian Tentang dengan Keuntungan Pakai Sentuh Tanahku, Hubungi Kami, Pusat Bantuan (FAQ), Kebijakan Privasi, Beri Kami Nilai, serta aksi Keluar. Konfirmasi keluar memakai "Mau keluar dari Sentuh Tanahku?", "Tetap disini", "Iya, keluar". Hubungi Kami/FAQ memakai IconData Material, sehingga tidak boleh diberi klaim memakai `ic_tentang.png`.

## Data yang dapat dipakai antarmuka

1. **Berkasku:** `Berkas/GetBerkas` mengambil `data` iterable lalu memanggil closure `0x708100` → parser `0x708160`. Kunci yang terbukti antara lain `berkasId`, `nama`, `namaProsedur`, `nomor`, `status`, `statusPengurusan` (String?), `allowGeotag` (int?), `readyToRating` (bool?). Ada 17 field dalam JSON audit. Hubungan klik baris ke request detail belum dituntaskan; jangan otomatis mengirim ID dengan dugaan casing.
2. **Sertipikatku:** `Legacy/SertifikatTanahNew` → closure `0x785cfc` → parser `0x785d5c`. Mendukung pasangan `SertifikatId`/`sertifikatId`, `Nomor`/`nomor`, `Nama`/`nama`, `JenisHak`/`jenisHak`, `StatusEl`/`statusEl` dan field lain dengan casing asli. Kartu `YIb` membawa item. Callback `0x955cd4` memilih halaman `OIb` bila StatusEl null/0, dan `QIb` bila bukan nol; keduanya membawa SertifikatId `+0x17`. Jangan menyamakan semua kartu dengan endpoint `Brankas/DetailSertipikatNew` sebelum kelanjutan tiap cabang dipastikan.
3. **Info Layanan:** parser daftar `0x75f180` membaca `layananId`, `nama`, `deskripsi`, `grup`. Baris `0x8e7038` menangkap item, tap `0x8e74ac` → route `0x8e7524` menyimpan item dalam `WCb+0xb`; init `0x75ea3c` membaca item `+7` dan meneruskan ke `0xd2f1e8` → `0xd2f33c` → query **id**. Hubungan `item.layananId → GET InfoLayanan/GetInfoLayananDetail?id=...` telah ditelusuri langsung.
4. **Detail Info Layanan:** parser `0x75eaa8` memakai ejaan asli **`persayaratan`**, `penyelesaian`, `keterangan` (daftar string), `tarif` (String?), `tipeSimulasi` (int?). Judul bagian UI: Persyaratan, Waktu Penyelesaian, Keterangan Tambahan, Tarif. `tipeSimulasi` pada parser daftar dibaca/divalidasi tetapi tidak disimpan dalam objek aDb empat field; parser detail menyimpannya.

## Cakupan dan batas

- 29 item navigasi yang dipetakan, 5 model respons (termasuk subset profil untuk navigasi), 7 item layanan utama. **170 bentuk request bukan 170 menu** dan tidak membuktikan seluruh layar sudah direkonstruksi.
- Endpoint pada setiap node diberi tingkat hubungan: asosiasi fitur tetap berbeda dari aliran widget→request yang dibuktikan. Rute browser usulan bukan nama rute Android asli.
- Emulator asli berhenti pada peringatan integritas S5. Tidak ada visual pembanding resmi yang berhasil melewati login; kesetaraan piksel, seluruh role, kamera, map, tanda tangan, serta alur submit belum dapat dinyatakan 1:1.
- Perbandingan koordinat di browser tetap pemeriksaan lokal. Peta menu ini tidak menyediakan perubahan posisi perangkat atau penghilangan verifikasi kunjungan.
- Generator dijalankan tanpa jaringan. JSON dapat dibaca; semua file bukti yang dirujuk dan aset yang dinyatakan tersedia telah diperiksa ada. Tidak dilakukan tes produksi.
