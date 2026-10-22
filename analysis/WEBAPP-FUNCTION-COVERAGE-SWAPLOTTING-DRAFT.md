# Cakupan setelah personal Swaplotting — DRAFT

**Webapp belum setara 1:1 dan belum lulus end to end untuk seluruh fungsi.** Suplemen20 Oktober2026 ini memperbarui [cakupan Buku Tamu](WEBAPP-FUNCTION-COVERAGE-GUESTBOOK.md) tanpa mengubah bukti lama. Inventaris tetap **29 menu native,38 route browser,176 operasi:84 enabled (71 read,13 write),92 disabled**. Enabled adalah kesiapan adapter, bukan penerimaan server. [JSON draft](webapp/function-coverage-swaplotting-draft.json) mengikat sumber dan receipt.

Runtime Swaplotting kini mengikuti **disclaimer→peta titik→dua form tanah**. Tab generik PlotBidang bukan lagi representasi menu pribadi. Peta memakai viewport/zoom awal native, marker target kamera, OpenStreetMap dan layer raster Bhumi melalui proxy yang sudah ada. OSM/Leaflet adalah adaptasi browser; titik tidak menjadi GPS perangkat, koordinat hasil ukur, polygon, bukti kunjungan atau pemilikan.

| Bagian | Implementasi saat ini | Batas tersisa |
|---|---|---|
| Disclaimer | HTTP200, Map langsung empat String nullable, conditional JSON decode sekali. Pesan utama nonempty memerlukan Setuju lokal; sukses null/kosong melewati panel secara alami. | Bukan persetujuan hukum/server; teks/link di-escape dan URL dijaga browser. |
| Kantor/wilayah | Filter kantor kosong native, KantorId main asli, WilayahId terpilih. | Reference produksi dan seluruh variasi akun/error belum diterima. |
| Dua form | Literal pilihan native, pemeriksaan wajib9/14, draf mentah dan kontak readonly. | Pilih pengguna, foto dan Kirim masih nonaktif. |
| Pengguna sendiri | Profil account_summary tepercaya pada sesi kini; level2/3 dan isIkd exactfalse; nama/telepon/email raw, null→kosong. | Bukan seluruh lCb, tanggal, managed-user, kewenangan atau jaminan identitas. |

Katalog hanya berubah pada **tipeKantor.allowEmpty=true** milik get-legacy-kantah-d10364.175 record lain identik; tidak ada operasi baru enabled/disabled. Input tetap required-present dan kontrak filter Cari Bidang3,2,1 tidak diubah. GET Map/GetDisclaimer kini didecode secara khusus, tanpa menebak envelope error/data. Tiga read pribadi tidak mengirim NIK/kontak, body upload, header/origin arbitrer, Directus ID atau hasil dekripsi kantor terdekat.

[Follow-up pengguna](SWAPLOTTING-OWNER-FOLLOWUP.md) menutup rantai profil→daftar lCb→pilihan formulir→tiga kontak, mengoreksi iCb+27 sebagai subject AddUser yang terpisah. Browser menerapkan subset pengguna sendiri secara sengaja: tidak mengimpor user_plotting, memilih sembarang baris pertama, mengisi dari username/signin, atau melaksanakan enrollment/OTP. Profil hilang/tidak didukung tetap unresolved. String kontak null menjadi kosong; nilai raw dipertahankan. Bukti ini tidak menetapkan kewenangan atas tanah.

Receipt terbaru mencatat **1.493/1.493 tes Node dari79 file**, **1.190 pemeriksaan VM/23 suite**, serta review independen **14 frontend/host dan13 proyeksi kontak**. Fokus63 tes frontend (36 baru+27 peta bersama) dan141 backend (20 baru) termasuk suite Node penuh, tidak dijumlahkan ulang. Probe sintetis memeriksa node input/textarea/select serta caret saat reference selesai, canvas peta tetap, hasil/auth terlambat, pergantian route/sesi, penghapusan draf, dan sumber kontak. Ini tidak membuktikan IME/browser/mobile/hardware/server secara menyeluruh.

Percobaan Node awal1492/1493 dipertahankan: assertion lama mengharuskan guard Buku Tamu berada paling awal. Penggantinya mengeksekusi flowPage aktual untuk dua shortcut; runtime tidak diubah demi tes. Successor VM memindahkan tiga literal fixture query generik dari Swaplotting ke route lost dan mempertahankan103 assertion; writer/receipt lama utuh. Review independen memisahkan temuan runtime awal yang telah diperbaiki dari kegagalan fixture reviewer.

Tidak ada penerimaan browser atau deployment baru yang disimpulkan dari tes Node/VM.

**Draft:** browser final, image/deployment/public dan observasi publik masih menunggu receipt final root. Angka pengiriman dan penerimaan browser belum diklaim oleh draft ini.

Gap lain tetap mencakup foto/capture/autentisitas, full lCb/DOB/storage/pemilihan managed-user, identitas/OTP, upload/final submit; inline peta Berkas; booking/socket; Daring OTP/liveness/final verification; seluruh role/error/data branch, formatter/lifecycle, mobile dan pembanding APK resmi pascalogin. Dua typed read PlotBidang tetap keluarga repository terpisah; delineasi dibuang dan tidak dipakai membentuk geometry.

POST Swaplotting/Buku Tamu dan geotag write tetap nonaktif; confirm Daring yang sudah ada dipertahankan. Tidak ada bypass kehadiran/attestation. Koordinat hasil ukur tidak menggantikan kunjungan yang diwajibkan.38 ledger native,442 receipt historis,11 dokumen baseline dan korpus170 request tetap utuh. Penulis suplemen ini adalah pembuat adapter backend baca yang terpisah dan reviewer independen frontend publik; penyusunan suplemen hanya membaca file/hash, tanpa tes, jaringan, akun, browser atau Docker. **Tujuan keseluruhan belum selesai.**
