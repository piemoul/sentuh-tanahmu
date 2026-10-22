# Profil dan pembacaan akun — validasi lanjutan

FAQ dan Manfaat kini menuju URL yang dibentuk APK6.1.5: base snapshot https://www.atrbpn.go.id/ ditambah suffix masing-masing. Privacy yang sudah ada cocok dengan bukti native dan tidak diubah. Halaman browser membuka tautan eksplisit terisolasi; ketiga halaman resmi juga berhasil merender konten yang sesuai pada browser. Status HTTP, seluruh isi, uptime dan lifecycle WebView belum diterima.

- **1.312/1.312 tes Node**, **1.190 pemeriksaan VM/23 suite**, **7 tes fokus**, **8 pemeriksaan browser desktop**, review independen tanpa temuan material pada implementasi tautan. Reviewer bukti delivery juga mengoreksi dua klaim pelaporan: kontinuitas backend kini dibuktikan StartedAt sebelum baseline, dan metadata emulator tidak disamakan dengan adb devices.
- **32 frontend +26 backend** cocok dengan container sehat, **58 file image mandiri** cocok tanpa jaringan, **32 aset publik HTTPS** cocok. Katalog tetap176/83.
- Hanya app.js berubah dari62 runtime baseline; satu modul publik ditambah.33ledger,390receipt historis dan korpus170request dilindungi. Backend tidak direstart; sesi login dipertahankan.

[Rekap mesin](webapp/profile-site-summary.json), [review](webapp/profile-site-independent-review.json), [browser](webapp/profile-site-browser.json), [base profil](PROFILE-BASE-FOLLOWUP.md).

## Penerimaan baca melalui sesi pengguna

Cari Bidang berhasil memuat **533 kantor** dan **73 desa/kelurahan** untuk Jakarta Barat. Uji ini berlangsung sebelum perubahan frontend profil; hash aktual dipertahankan pada receipt, sedangkan backend dan modul pencarian tidak berubah. Tidak ada nomor sertipikat/NIBEL yang dimasukkan, lookup yang dikirim, boundary yang dibaca, atau map acceptance baru.

Antrean berhasil memuat **490 kantor**, **3 lokasi** untuk Jakarta Barat, dan **7 loket** pada tanggal yang ditampilkan. UI selesai memuat kalender/ketersediaan tanpa error terlihat; jumlah baris kalender dan HTTP trace tidak direkam. Seluruh tombol Ambil Antrian tetap nonaktif, tanpa pemesanan atau identitas baru. Lihat [Cari Bidang](webapp/parcel-search-reference-live.json) dan [Antrean](webapp/queue-preread-reference-live.json).

## Audit dan batas berikutnya

Tiga ledger Swaplotting yang terpisah membuktikan menu/form, layanan, serta kamera peta/disclaimer. Dua read PlotBidang bukan bukti bahwa menu pribadi native memakai alur baca yang sama. Berkas multipart, identitas/OTP terpisah, validasi server dan lifecycle lengkap tidak dianggap selesai dari disassembly. Tidak ada submit, GPS, OTP atau telemetry dari audit.

Audit metadata tidak menemukan proses emulator/ADB, listener yang diperiksa atau interface PnP ADB. Perintah adb devices tidak dijalankan; jumlah target protokol dan status instalasi aplikasi tidak diketahui. Hambatan S5 sebelum login dari percobaan lama tetap belum teratasi; hasil statis tidak menggantikan pembanding APK pascalogin.

Kesetaraan1:1 seluruh menu belum tercapai. Buku Tamu runtime, Swaplotting native penuh, inline peta detail Berkas, account mutations, OTP/liveness, booking, filled-document branches dan viewport mobile masih memerlukan pekerjaan. Geotag yang mengganti kewajiban hadir tidak diaktifkan. Tidak ada commit/push baru pada batch ini.
