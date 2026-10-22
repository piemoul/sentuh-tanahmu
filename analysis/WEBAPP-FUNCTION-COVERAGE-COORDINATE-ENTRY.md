# Cakupan input koordinat personal Swaplotting

Cakupan ini hanya fitur koordinat personal; bukan pemetaan ulang seluruh menu native. Longitude/Latitude desimal memerlukan deklarasi WGS84 eksplisit. User dapat memilih titik sesi survey/external_gnss yang masih berlaku; metadata tetap keterangan pengguna.

| Fungsi | Hasil |
|---|---|
| Input manual dan pilihan titik sesi | Draf lokal dan pemusatan peta eksplisit |
| Angka tepat, -0, zoom, resize dan pan/reset | Teruji pada modul serta browser sintetis |
| Provenance kedua formulir dan lifecycle foto | Snapshot readonly; kamera/berkas hanya data sintetis pada pengujian ini |
| Kirim personal, OTP, quota/booking, geotag Berkas | Tetap nonaktif |
| GPS asli, bukti kunjungan, checksum dan penerimaan server | Belum dibuktikan |

Katalog tetap 176 operasi / 84 aktif / 92 nonaktif, tanpa record atau enablement baru. Ada 80 runtime saat ini; 44 ledger native, 1014 riwayat dan 27 dokumen baseline tetap identik. Tes subset tidak dijumlahkan dengan 1636 Node; 1190 pemeriksaan VM tetap 23 suite.

Masih ada masalah teks kosmetik: judul pilihan titik sesi tetap menyebut belum diterapkan sesudah Apply karena preview pilihan dipertahankan. Nilai koordinat, sumber aktif dan kedua formulir tetap benar. Judul netral akan diperbaiki pada batch runtime berikutnya.

[Bukti terikat sumber](webapp/function-coverage-coordinate-entry.json) · [Ringkasan runtime](PERSONAL-COORDINATE-ENTRY-RUNTIME.md)
