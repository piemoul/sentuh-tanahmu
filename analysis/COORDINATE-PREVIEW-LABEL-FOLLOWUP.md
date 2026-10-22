# Perbaikan label pratinjau koordinat

Judul pilihan titik sesi kini netral sebelum maupun sesudah Apply. Petunjuk menjelaskan bahwa sumber koordinat aktif ditampilkan pada bagian tersendiri. Koordinat, sumber, formulir, peta dan kemampuan pengiriman tidak diubah.

Hanya satu dari 80 berkas runtime berubah, melalui tiga penggantian teks/komentar pada view. Satu ekspektasi literal pada tes yang sudah ada disesuaikan. Review independen 8/8 dan 11 pemeriksaan browser terarah lolos, termasuk Apply berhasil, pan dan Apply yang ditolak. Uji mobile memakai iframe CSS 390 piksel dengan data sintetis, bukan perangkat Android.

Tes sumber terbaru: 1.636 tes Node dan 1.190 pemeriksaan regresi dalam 23 suite lolos. Image baru dan container aktif cocok 75/75 berkas; 45 berkas frontend publik cocok hash. Image baru diverifikasi terpisah dari image lama yang tetap berjalan dengan mount frontend readonly. Backend tidak direstart atau dibuat ulang.

Halaman publik baru masih menunjukkan gate login. Penerimaan akun/provider, kamera/GNSS asli, pengiriman dan geotag Berkas belum terverifikasi oleh batch ini. Tujuan keseluruhan belum selesai.

[Bukti sumber](webapp/coordinate-preview-label-summary.json) · [Uji browser](webapp/coordinate-preview-label-browser.json) · [Review independen](webapp/coordinate-preview-label-review.json)
