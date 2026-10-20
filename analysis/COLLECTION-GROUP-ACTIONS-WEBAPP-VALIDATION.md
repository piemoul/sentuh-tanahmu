# Validasi aksi grup pada webapp

Sumber eab604a0562e0e5891135f4079502de1fb9ea703c69a98e89e46ef0bbc13f87f menerapkan tiga alur terpisah dari [audit assignment/removal](COLLECTION-GROUP-MOVE.md) dan [audit hapus grup](COLLECTION-GROUP-DELETE.md). Assignment memakai snapshot pilihan, filter ID nonnull/nonempty, toggle ID tanpa trim, serta row.id untuk collectionId. Group-context menyembunyikan assignment. Respons HTTP200 nullable bool/String/String diterima tanpa bergantung pada body.error.

Setelah assignment dan pelepasan membership berhasil, dua daftar dimuat ulang bersamaan tanpa insert optimistis. Pelepasan mempertahankan objek/judul grup terpilih saat stream baris berubah. Hapus Grup menutup dialog sebelum request dan hanya memfilter grup dengan ID sama setelah sukses; cache baris, membership dan loaded flags tetap. Label konfirmasi mengikuti APK; efek server tidak diasumsikan dari copy dialog.

Dua DELETE tambahan dicatat terpisah dari corpus170 request asli. Path tetap pada origin utama, memakai satu String segmen ter-encode dan tidak menerima body/query/files. Origin, CSRF, sesi dan confirm boolean tetap diperiksa. Validasi path khusus, guard hasil terlambat, pencegahan duplikasi dan kontrol modal merupakan adaptasi browser. Tidak ada URL proxy arbitrer atau retry mutasi otomatis.

[Rekap bukti](webapp/collection-group-actions-verification-summary.json) mengikat 401 tes Node, 1116 pemeriksaan dalam22 suite (81 terfokus sudah termasuk), dan 42 uji browser sintetis. Fixture mencatat 59 panggilan upstream sintetis tanpa server produksi/provider. Tidak ada akun asli diubah. Deployment mencocokkan 7 hash frontend/21 backend dan empat aset publik; backend direbuild, preview akun anonim.

Penerimaan produksi dan efek unlink/cascade belum diuji. Edit/penghapusan koleksi root, alur lain, peta langsung BERKAS dan keseluruhan aplikasi belum selesai. Unggah geotag serta substitusi bukti kunjungan tidak diaktifkan. Bukti rilis sebelumnya tetap historis pada sumber/sesinya masing-masing.

Corpus masukan saat pencatatan memiliki 170 record dan SHA256 c731e68ec6bbf3525f7d6d74f8965c2e3cbf107e91eb38f2b4d605603379cf7f. Tidak ada hash sebelum perubahan yang disimpan; klaim tidak diedit merujuk pada tindakan rilis, bukan perbandingan hash sebelum/sesudah yang independen. Dua skema DELETE ditambahkan terpisah melalui generator.

Pengambilan ulang gambar desktop memakai fixture terpisah pada port4184: tiga pembacaan sintetis, nol mutasi dan nol akses produksi/provider. Observasi gambar ini tidak termasuk hitungan 42 uji/59 panggilan suite utama.
