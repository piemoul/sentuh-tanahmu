# Suplemen cakupan fungsi webapp — 20 Oktober 2026

**Webapp masih belum setara 1:1 dan belum lulus end to end untuk semua fungsi.** Snapshot ini melengkapi, tanpa mengubah, [audit sebelumnya](WEBAPP-FUNCTION-COVERAGE-2026-10-20.md). Inventaris tetap **29 menu native, 38 route browser, 176 operasi katalog**. Kini **83 enabled:70 read +13 write**, serta **93 disabled**. Enam tambahan sejak predecessor semuanya GET: tiga prasyarat Antrian dan tiga lookup/referensi Cari Bidang. Satu login khusus tetap di luar katalog. Angka enabled tidak berarti penerimaan server.

Sumber saat snapshot: app.js `2c56a73d3b430ef9c3b5b7d16d2dba626f85d81abbb0cecc920fbeeb75ac8d85`; operations.mjs `86edc4e3f59c31ff8be4d0bc4247ec1b5e2584a7a28c3a284df9e920be978c2f`. Semua **58 file** (32 publik,26 backend) cocok dengan hash sumber/deployment yang dicatat rilis profile-site. Receipt publik mencatat 32/32 file cocok dan HTTP200. Audit ini hanya memeriksa file/hash; tidak menghubungi server atau memeriksa ulang container. Receipt continuity mencatat StartedAt13:54 sebelum baseline14:07: backend tidak direstart selama batch profil; bukan sekadar membandingkan ID container.

## Perubahan yang terbukti

| Fitur | Cakupan kini | Batas |
|---|---|---|
| Antrian Daring | Pemilihan kantor→lokasi→kalender/tanggal→ketersediaan, tiga GET aktif | Booking tetap nonaktif; identitas/OTP/socket belum selesai |
| Cari Bidang | Form Analog/jenis hak/kantor/wilayah/nomor dan NIBEL→returned PersilId→jalur peta terikat; tiga GET aktif | Lookup/batas bidang data sungguhan belum diterima; fixture lookup/geometri terpisah |
| Keuntungan/FAQ/Privasi | Tiga tujuan publik sesuai base+suffix native; tautan terisolasi dan tiga halaman resmi dirender | Reachability terpisah dari tes frontend; statusHTTP, isi lengkap/legal acceptance dan lifecycle WebView belum diverifikasi |
| Buku Tamu | Audit statis baru menutup base, QR caller, form/validasi/read/write/result | Route runtime masih unavailable dan dua operasi nonaktif; bukan implementasi kunjungan |
| Swaplotting | Audit statis baru: map/point, disclaimer dinamis, dua formulir, referensi/validasi/service dan batas tambah pengguna/OTP | Runtime tetap pembacaan generik list/detail; form native/camera/submit belum diimplementasikan |

## Tes dan penerimaan aktual

Receipt terbaru mencatat **1.312/1.312 tes Node dari67 file**, **1.190 pemeriksaan VM/23 suite**, **8/8 pemeriksaan browser desktop profil** dan independent review tanpa temuan material. Seluruh input receipt terbaru masih cocok: Node160/160, VM53/53, browser4/4 dan independent12/12. Tes fokus7 profil sudah bagian dari suite tersebut; tidak dijumlahkan ulang. Receipt fase Antrian mencatat23 pemeriksaan desktop dan fase Cari Bidang27, masing-masing pada hash/scope rilisnya. Tidak ada tes yang dijalankan ulang oleh suplemen ini.

Penerimaan UI server yang baru tercatat terbatas pada **dua skenario referensi**:

- **Antrian:** satu kantor/lokasi/tanggal;490 baris kantor,3 lokasi dan7 loket tampil, tanpa error terlihat. Ketujuh tombol booking nonaktif. Semua9 input receipt cocok dengan sumber kini.
- **Cari Bidang:**533 baris kantor dan73 wilayah tampil pada satu pilihan kantor. Nomor sertipikat/NIBEL tidak diisi, lookup tidak dikirim, boundary tidak diminta. Ini receipt build sebelumnya:3/4 input masih cocok; app.js berubah setelah pembaruan tautan profil. Penerimaan pada hash app kini belum diulang.

Kedua receipt tidak merekam trace/status HTTP, sehingga jumlah request HTTP tidak diketahui. Jumlah baris bukan jumlah request atau bukti seluruh kantor. Tidak ada identifier akun, dokumen, lokasi pilihan, token, cookie atau container yang disalin. Delapan pemeriksaan profil memeriksa DOM/tautan secara anonim. Receipt terpisah mencatat **tiga halaman resmi** (FAQ, manfaat, privasi) berhasil dirender pada URL native yang tepat, tanpa login/submit atau persetujuan legal; tidak ada trace statusHTTP, audit isi lengkap atau bukti WebView Android. Kedua input receipt live ini cocok dengan sumber kini. Statistik produksi lain dari audit sebelumnya tetap historis dan tidak direvalidasi di sini.

## Hasil audit native baru dan gap

[Buku Tamu](GUESTBOOK-FOLLOWUP.md) dan [service](GUESTBOOK-SERVICE-FOLLOWUP.md) memisahkan pembacaan metadata QR dari pendaftaran kedatangan. QR caller bukan bukti autentisitas/kehadiran; verifikasi petugas tetap terpisah. Tidak ada QR buatan atau remote attendance.

[Swaplotting UI](SWAPLOTTING-FOLLOWUP.md), [service](SWAPLOTTING-SERVICE-FOLLOWUP.md) dan [map](SWAPLOTTING-MAP-FOLLOWUP.md) mengikat point ke camera target dan memperlihatkan dua formulir. Tidak adanya radius/checkbox di validator yang diaudit tidak membuktikan seluruh flow bebas persyaratan kehadiran/ownership. Disclaimer memuat teks dari server; jangan mengarang persetujuan. OTP tambah pengguna adalah cabang terpisah dan perbandingan client tidak membuktikan verifikasi server.

Gap tetap mencakup Buku Tamu/Swaplotting runtime native, booking, Daring OTP/liveness/final verification, mutasi akun, pemetaan inline Berkas, seluruh data/role/error branches, lifecycle/formatter, mobile serta pembanding APK resmi pascalogin. Receipt kesiapan mencatat tidak ada proses Android/listener terarah/interface PnP ADB yang teramati; adb devices tidak dijalankan dan jumlah target protokol ADB tidak diketahui. Ini belum menghasilkan pembanding pascalogin. Kontrak checksum/attestation server belum tertutup. Geotag write/upload tetap nonaktif; koordinat ukur bukan bukti kunjungan fisik. Tidak ada penerimaan mutasi produksi baru, restart, network, OTP atau submit yang dilakukan oleh suplemen ini.

[Inventaris suplemen JSON](webapp/function-coverage-followup.json) menyimpan hash sumber, receipt, native ledger, perbedaan enabled, angka penerimaan serta batasnya. Predecessor tetap utuh. Tujuan keseluruhan belum selesai.
