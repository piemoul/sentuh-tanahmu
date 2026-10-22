# Koreksi catatan sertipikat analog

Detail analog kini memakai judul **Informasi Sertipikat**. Catatan Pendaftaran mempertahankan empat blok tanpa judul buatan, null menjadi teks kosong, urutan semua record/kolom tetap, dan konversi baris mengikuti bukti native termasuk perbedaan huruf besar/kecil. Keempat bagian kosong menampilkan **Tidak ada data!**. Renderer elektronik, tanggal, API, backend dan katalog tidak berubah.

Dasar: [audit UI APK](CERTIFICATE-DETAIL-UI.md), khususnya renderer0x94494c–0x945820. Ini memperbaiki cabang tampilan yang terbukti; tidak menyatakan seluruh aplikasi telah setara.

| Pemeriksaan | Hasil |
| --- | --- |
| Node | 1.699 lulus, 91 file; 11 tes baru termasuk di dalamnya |
| Regresi VM | 1.190 lulus, 23 suite |
| Review independen fungsi aktual | 8 lulus |
| Browser aplikasi utuh sintetis | 14 pemeriksaan lulus; desktop dan frame CSS390; 8 request untuk 3 jenis read |
| Image / localhost / domain | 79 / 79 / 49 file cocok |

Satu assertion pengukuran awal salah menganggap document.clientWidth harus390; scrollbar vertikal membuatnya375, sedangkan innerWidth tetap390. Kegagalan itu dipertahankan dalam receipt dan diselesaikan melalui pengukuran yang benar, tanpa mengubah aplikasi/fixture/CSS. Fixture sudah berhenti normal (proses26846 keluar0, port4210 tanpa listener, dua tab ditutup).

Frontend terbaru aktif di http://localhost:4173 dan https://sentuh.davay.space. Container yang sama ternyata sudah restart sebelum baseline pekerjaan ini; sebabnya tidak diamati. Guard deployment awal menolak perbedaan tersebut, lalu receipt penerus memakai checkpoint proses aktual. Pembaruan ini tidak melakukan restart atau recreate. Kesamaan proses tidak membuktikan sesi login masih valid.

Pemeriksaan gambar banner tambahan memakai CA publik APK tanpa identitas klien/kredensial, dengan TLS tetap diverifikasi, tetapi gagal sebelum respons HTTP (ERR_SSL_DECRYPTION_FAILED_OR_BAD_RECORD_MAC). Tidak ada relay gambar, host alternatif atau bypass TLS yang diterapkan.

Pengujian detail memakai data sintetis; penerimaan akun/sertipikat asli belum diuji ulang. Seluruh fungsi, binding peta inline Berkas dan submisi geotag resmi tetap belum selesai.

[Bukti dan audit tujuan](webapp/certificate-analog-notes-summary.json) · [Screenshot desktop](webapp/certificate-analog-notes-browser-desktop.jpg) · [Screenshot frame mobile](webapp/certificate-analog-notes-browser-mobile.jpg).
