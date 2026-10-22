# Kamera lokal dan tinjauan antrean di webapp

Alur foto dokumen sekarang tersedia sebagai draf lokal: buka kamera, ambil, preview, foto ulang, pakai dan hapus. Tambah dibatasi lima; pengambilan ulang tetap tersedia. Draf tidak diunggah dan dilepas ketika formulir atau sesi ditutup. Sumber daya kamera serta callback terlambat mengikuti konteks formulir.

Antrian menambahkan jumlah berkas1–5 dan tinjauan loket yang benar-benar dikembalikan pada pilihan saat ini. Perubahan tanggal, kantor/lokasi, pemohon, jumlah atau refresh mencabut tinjauan. Kuota ditandai belum diverifikasi; tindakan final Ambil Antrian tetap nonaktif.

Validasi:1568 tes Node;1190 pemeriksaan VM/23 suite;28 tes kamera;15 probe host;76 tes antrean dan8 probe independen. Browser menjalankan29 pemeriksaan foto serta22 antrean, termasuk iframe390×844. Fixture memakai video canvas dan data sintetis; tidak ada kamera nyata, dokumen pribadi, GPS, OTP, unggahan atau booking.

Docker image baru cocok74/74 berkas tanpa mount/jaringan. Container berjalan cocok74/74 dan domain publik44/44 frontend. Backend tidak direstart atau direcreate:44 berkas frontend berasal dari bind mount readonly,30 backend tetap dari image sebelumnya dan cocok hash. Image baru dan image container berjalan sengaja dilaporkan terpisah.

Uji publik memverifikasi route/login gate anonim; sesi akun masih belum terbaca aktif. Hasil ini belum membuktikan seluruh fungsi1:1, penerimaan server saat submit, checksum, attestation, kunjungan atau Android hardware. Encoding foto dan objectURL merupakan adaptasi browser yang dinyatakan.

Dua perbaikan UI dibuktikan: group foto tidak lagi dibungkus label tombol Tambah, dan fokus setelah pakai/hapus foto kembali ke kontrol yang masih ada. Percobaan awal yang gagal dipertahankan. Pemeriksaan stream menggunakan status track yang dirender fixture karena scope DOM CUA tidak mengekspos srcObject; satu wait teks timeout diselesaikan dengan pembacaan keadaan yang sama, tanpa restart.

Semua fixture telah terminal dan port4203–4206 tertutup. Fixture antrean desktop tidak mempunyai endpoint stop, sehingga dihentikan memakai PID tepat; stopped:false historis tidak diubah. Tidak ada commit/push baru.

Bukti: [ringkasan sumber dan batas](webapp/swaplotting-capture-runtime-summary.json), [cakupan fungsi](WEBAPP-FUNCTION-COVERAGE-CAPTURE-REVIEW.md), [foto browser](webapp/swaplotting-photo-browser-final.json), [antrean browser](webapp/queue-review-browser-final.json), [deployment](webapp/swaplotting-capture-deployment.json).
