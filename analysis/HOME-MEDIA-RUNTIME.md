# Beranda banner dan video — progres implementasi

Beranda terbaru aktif pada http://localhost:4173/#/dashboard dan https://sentuh.davay.space/#/dashboard. Banner memakai field `path` dan base yang dibuktikan pada audit APK 6.1.5; daftar YouTube mempertahankan urutan dan seluruh baris dari server. Kartu membuka dialog pemutar, dengan close/Escape, fokus kembali dan pelepasan iframe. Pembaruan Berita tidak memulai ulang video.

Tampilan mengikuti kebutuhan browser desktop/mobile. Ini belum membuktikan kesetaraan visual penuh atau semua fungsi Android. Katalog API tetap 176 operasi, 84 aktif; flag write dan batas geotag tidak diubah.

## Hasil

| Pemeriksaan | Hasil |
| --- | --- |
| Node saat ini | 1.688/1.688, 90 file |
| Regresi VM lama | 1.190, 23 suite |
| Review independen | 31 probe awal + 6 pemeriksaan delta integrasi; probe awal tidak diulang |
| Browser sintetis aplikasi utuh | 22 pemeriksaan; 24 request lokal untuk 4 read, tidak ada request tak terduga |
| Image / container localhost / domain | 79 / 79 / 49 file cocok |
| Browser domain publik | 3 baris banner, 25 video; empat thumbnail pertama berhasil; satu video diputar sampai 25 detik |

Fixture sudah berhenti normal; sesi proses 49438 keluar 0, tidak ada listener4209 dan tiga tab sementara ditutup. Byte aplikasi yang diterapkan persis sama dengan staging yang diuji. Container Docker dibuat ulang sekali untuk CSP; restart mengakhiri sesi login dalam memori.

## Kendala tersisa

Ketiga gambar banner pada URL `path` asli gagal dimuat. HEAD biasa terhadap satu URL yang teramati gagal validasi rantai sertifikat pada Windows (SEC_E_UNTRUSTED_ROOT) dan Node (SELF_SIGNED_CERT_IN_CHAIN), tanpa respons HTTP. Validasi TLS tetap aktif. Ini belum membuktikan bahwa penyebab browser identik; tidak ada host alternatif yang ditebak.

Pemeriksaan publik dilakukan tanpa login. Semua menu dan submisi geotag resmi belum dinyatakan selesai. Koordinat pengukuran yang disimpan sebagai draf tidak membuktikan kunjungan fisik atau penerimaan server. Daftar gap terdahulu tetap tersedia pada CURRENT-MENU-GAP-DELTA.md.

Dua ekspektasi CSP lama dan satu konteks fixture Berita gagal pada run pertama; receipt gagal disimpan. Perbaikan tes mempertahankan allowlist ketat dan seluruh57 assertion berita, tanpa mengubah kode produksi yang telah diuji browser.

Bukti terikat sumber dan daftar file berada pada [home-media-runtime-summary.json](webapp/home-media-runtime-summary.json). Screenshot nyata: [Beranda publik](webapp/home-media-public-ui.jpg), [pemutaran publik](webapp/home-media-public-player.jpg), dan [frame mobile390](webapp/home-media-browser-mobile-context.jpg).
