# Pembacaan referensi Swaplotting

Satu pembacaan nyata `legacy/Kantah` melalui API lokal yang sedang dideploy berhasil: HTTP 200 lokal dan upstream, **487 kantor**, seluruh respons lolos validasi model native. Kedua filter mengikuti APK: `nama=''` dan `tipeKantor=''`. Seluruh 487 ID tidak kosong; tidak ditemukan ID duplikat. Isi record dan kredensial tidak disimpan dalam receipt.

Preview `https://sentuh.davay.space/#/account` yang diperiksa melalui CUA masih menampilkan **Belum masuk** dan formulir login setelah reload. Karena itu pembacaan profil akun dan wilayah bersesi belum diuji dalam kelanjutan ini. Login pada browser atau origin lain tetap mungkin; penyebab hilangnya sesi lama tidak disimpulkan.

Tidak ada perubahan runtime atau restart backend. Seluruh 75 file runtime, 39 ledger native, 500 bukti historis dan 14 dokumen yang dibekukan tetap sama. Input eksekusi Node terdahulu (187) dan VM (65) juga tetap sama; suite tersebut tidak dijalankan ulang.

Tidak ada penerimaan disclaimer, akses kamera/GPS, identitas/OTP, unggahan, geotag, atau pembuatan antrean. Hasil ini hanya menutup pembacaan referensi kantor, belum membuktikan seluruh fungsi aplikasi atau kontrak checksum server.

Bukti: [receipt pembacaan](webapp/swaplotting-office-live.json), [prasyarat sesi yang terlihat](webapp/swaplotting-account-prerequisite-ui.json), [ringkasan sumber dan batas pengujian](webapp/swaplotting-read-followup.json).
