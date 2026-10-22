# Input koordinat personal Swaplotting

Longitude (Bujur) dan Latitude (Lintang) dapat diterapkan secara eksplisit ke peta personal setelah deklarasi WGS84 derajat desimal. Pilihan titik sesi hanya memakai catatan survey/external_gnss yang benar-benar dipilih dan masih cocok. Mengetik tidak memindahkan peta; tidak ada auto-apply dari selectedPoint.

Nilai koordinat dan teks masukan tetap terpisah dari anchor mesin peta. Nilai -0 dan presisi masukan dipertahankan saat mesin membulatkan center, zoom atau resize. Geser/reset mengakhiri kaitan sumber titik. Kedua formulir menyalin asal koordinat yang hanya dapat dibaca; perubahan record sesi kemudian tidak mengubah salinan pada formulir.

Validasi akhir: 1636 tes Node dan 1190 pemeriksaan VM / 23 suite. Subset penulis: 71 core, 33 peta, 23 host/view. Sebelas probe independen dan 56 tes terarah adalah hasil historis pada JS yang identik; successor membuktikan appendCSS satu aturan serta mengikat browser aktual terbaru, bukan mengklaim rerun. Browser sintetis menyelesaikan41 pemeriksaan; publik menguji2 pemeriksaan gate anonim.

Dua masalah dipertahankan sebagai riwayat: retry-map yang hidden masih tampak karena CSS display, dan drift saat Leaflet resize yang dapat merelabel sumber. CSS scoped serta guarded invalidateSize memperbaikinya. Dua koreksi ekspektasi jenis assertion browser dibedakan dari defect runtime dan tetap tersedia pada receipt rawChecks/attempts.

Image baru cocok 75/75 berkas tanpa jaringan/mount. Container lama cocok 75/75, 45 frontend publik cocok hash, dan 30 backend tetap sama. Container/image berjalan/StartedAt tidak diganti; frontend dilayani melalui bind readonly. Image baru dilaporkan terpisah dan tidak dianggap otomatis menjadi image container berjalan. Sesi akun tidak diuji.

Fixture video/foto dan data pengukuran bersifat sintetis. Iframe 390×844 hanya pengujian CSS desktop. Bhumi fixture memakai PNG transparan lokal; OSM boleh memuat tile publik. Fixture 4208 selesai normal, trackvideo habis dan listener tertutup. Tidak ada account/provider login, hardwarekamera/GNSS, upload, OTP, booking, geotag atau bukti kunjungan buatan.

Ini kemajuan fitur personal; bukan pengganti GPS perangkat atau syarat kunjungan/radius Berkas. Kirim tetap nonaktif. Format wire/checksum dan penerimaan server belum dibuktikan; seluruh fungsi 1:1/E2E belum selesai.

Satu keterbatasan teks masih diketahui: judul preview titik sesi tetap berbunyi “Pilihan titik sesi — belum diterapkan” setelah Apply yang berhasil. Koordinat dan sumber aktif serta kedua formulir tetap akurat. Ini akan diperbaiki dengan judul netral pada batch berikutnya; runtime dan bukti deployment batch ini dipertahankan.

[Ringkasan sumber](webapp/personal-coordinate-entry-summary.json) · [Cakupan fitur](WEBAPP-FUNCTION-COVERAGE-COORDINATE-ENTRY.md) · [Browser akhir](webapp/personal-coordinate-browser-final.json) · [Deployment](webapp/personal-coordinate-entry-deployment.json)
