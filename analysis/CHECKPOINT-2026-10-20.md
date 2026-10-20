# Checkpoint pengembangan — 20 Oktober 2026

Checkpoint ini menyimpan progres rekonstruksi browser Sentuh Tanahku 6.1.5. Kesetaraan seluruh aplikasi dan penerimaan mutasi oleh server asli belum terbukti.

## Kode pada checkpoint

- Login dan pembacaan akun, Koleksi Berkas/Bidang, grup, Aktivitas, detail berkas/dokumen, layanan, antrean/Panggilan serta peta raster OpenStreetMap dengan overlay WMS Bhumi sudah memiliki implementasi parsial.
- Edit judul/caption dan penghapusan item/grup Koleksi memiliki audit statis serta pengujian sintetis terpisah.
- Toggle simpan/hapus BERKAS kini terhubung pada detail Cari Berkas, Aktivitas dan Koleksi. Berkasku tetap memakai cabang berbeda. Identitas NIK diambil adapter privat dari data sign-in tersimpan, tidak dari input browser atau identitas profil alternatif.
- Penghapusan Aktivitas mengikuti cache native: item yang cocok dihapus dari daftar lokal setelah request selesai, termasuk kegagalan biasa. Log lokal membedakan respons berhasil dengan penghapusan server yang belum terkonfirmasi. Menutup konfirmasi setelah request dikirim tidak membatalkan controller yang sedang berjalan.
- `webapp/collection-save-persil.js` menyediakan form caption, grup, nested create dan assignment, dengan 19 tes. **Modul ini belum diimpor atau terhubung ke UI aplikasi**; lihat [status integrasi](COLLECTION-SAVE-PERSIL-STAGED.md).
- Katalog tetap 176 bentuk request dan 75 adapter aktif. Unggah geotag tetap nonaktif; pembandingan koordinat tidak menjadi bukti kunjungan fisik.

## Validasi

Seluruh **549 tes Node lulus**, tanpa perubahan input selama run. **23 suite regresi / 1.190 pemeriksaan fungsi lulus**; angka ini terpisah dari jumlah tes Node. Transport mutasi pengujian memakai data sintetis, tanpa permintaan mutasi produksi. Bukti statis bukan observasi eksekusi APK.

Hash `webapp/app.js`: `ff995db7561750823c2d4361b649ea410484e11364e66248a7ec9b382a0d36f6`.

Audit baru: [BERKAS](COLLECTION-SAVE-BERKAS.md), [PERSIL](COLLECTION-SAVE-PERSIL.md), [Activity delete](ACTIVITY-DELETE.md). Hash dan lokasi proof pada dokumen tersebut merujuk workspace analisis lokal; raw APK, ELF, pool, sertifikat, kredensial dan data akun tidak termasuk publikasi source.

## Deployment dan pekerjaan berikutnya

Checkpoint source ini belum menjadi rilis Docker/backend baru. Pengujian browser untuk tiga alur baru dan penerimaan server asli masih memerlukan langkah terpisah. Sesi produksi yang baru dikonfirmasi tidak direstart untuk membuat commit.

Berikutnya: integrasikan modul PERSIL ke origin peta yang sudah dipetakan, jalankan pengujian browser sintetis, review perubahan backend, lalu lakukan deployment terkontrol. Pengujian simpan/hapus akun asli memerlukan pilihan data uji yang konkret; checkpoint ini tidak mengklaim sudah menjalankannya.

Repositori publik berisi source dan dokumentasi terpilih. Tes yang memverifikasi byte artefak atau receipt historis tetap memerlukan workspace analisis lokal. Graphify memetakan source aplikasi, tes, skrip operasional dan dokumentasi arsitektur yang dipilih; ia tidak mengindeks APK, kredensial atau data akun.
