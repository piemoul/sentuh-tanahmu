# KKPR hasil Scan — validasi webapp

Build lokal `fbf9da2c57a186fa3b42e490988503ae6374cacd58eb7bb0ee7d0deac849cad3` menyambungkan hasil Scan bertipe `KKPR` ke satu dialog **Lokasi Kegiatan**. Ia hanya membaca `apis/GetKKPRDetail` memakai konteks sesi dan kode asli hasil Scan; tidak jatuh ke pembacaan PBT atau peta dokumen umum. Backend, katalog 176 operasi/76 adapter, dan batas autentikasi tidak berubah pada batch ini.

`scan-location.js` menambahkan proyeksi KKPR setelah seluruh prefix PBT/controller lama yang tetap identik (`88a32541dcc902a5e0789bc5e737553af40ee35553eca7adb4b9da384665e9da`). Cabang global ditentukan oleh geometri `batas` pertama: MultiPolygon membaca exterior setiap komponen batas; cabang Polygon memproses outline batas kemudian exterior Polygon batasizin yang berhasil. Daftar **Bidang 1..N** dan jumlahnya memakai indeks padat hasil ring yang berhasil, bukan ID properti atau slot fitur asli. Rata-rata ordinat mentah, termasuk vertex penutup, dihitung sebelum normalisasi LatLng. Ring pertama yang berhasil menjadi pusat awal dengan zoom 19; pemilihan baris mengubah pusat/pin dan tautan arah secara lokal tanpa pembacaan API baru.

Peta memakai raster OpenStreetMap dan layer bidang Bhumi yang telah disetujui, dengan pin acuan dokumen. Ia tidak menggambar vector bidang pengganti. Tautan Google Maps hanyalah aksi arah eksplisit dari pusat terpilih, memakai tab terisolasi. Tidak ada key Google, pengambilan GPS, aktivasi geotag, atau pengiriman posisi/kunjungan baru. Koordinat rusak menampilkan peringatan dan hanya hasil proyeksi yang sudah berhasil; tampilan parsial ini adalah adaptasi diagnostik browser, bukan klaim bahwa native memublikasikan map-record lengkap setelah exception.

## Bukti native

- [Alur Scan sebelumnya](recovered/scan-flow.json) dan [tujuan lokasi](recovered/scan-location-followup/flow.json).
- [Model/peta KKPR](recovered/scan-kkpr-map-followup/flow.json), checksum `8aec89db…01d24`.
- [Kontrol dan indeks KKPR](SCAN-KKPR-CONTROLS-FOLLOWUP.md), ledger `0398c9ae8bcded7009f474cc272c95c24350c63c9636922c8f4d3003e19c425d`, diverifikasi ulang dari ELF oleh root. Verifier mencocokkan 9 sumber baru/786 instruksi, 7 sumber warisan/4.648 instruksi, serta binding pool, kelas, dispatch dan marker terkait. Ini analisis statis, bukan pengamatan APK berjalan.

Supplement baru memperjelas bahwa map `XDb+2b` adalah dense-index ke marker-ID, bukan grouped polygon records. Bukti lama tidak ditulis ulang. Konstruksi provider RDTR/RTRW ditemukan, tetapi origin, getTile, autentikasi dan syarat akses belum terbukti. Tidak ada provider baru atau proxy URL bebas yang ditambahkan.

## Pengujian sumber dan browser

- [937/937 tes Node](webapp/scan-kkpr-backend-tests.json): termasuk 24 proyeksi/panel KKPR baru, 52 tes host Scan/PBT/KKPR dan 22 tes fixture HTTP baru. Jumlah ini bukan jumlah fitur produksi yang terbukti.
- [23 suite fungsi aktual / 1.190 pemeriksaan](webapp/scan-kkpr-regressions.json): seluruh regresi lulus; hash input stabil dan 277 receipt historis/15 ledger native baseline tidak berubah.
- [33 pemeriksaan browser desktop](webapp/scan-kkpr-browser.json), viewport 1280×720, [79 request bisnis sintetis](webapp/scan-kkpr-browser-transport.json): 17 profile, 16 classifier, 16 PDF, 16 metadata, 14 KKPR. Satu bootstrap profile mendahului pengambilan hash input. Seluruh pemeriksaan acceptance menggunakan 11 input stabil.
- [9 pemeriksaan browser sempit](webapp/scan-kkpr-mobile.json), viewport aktual 558×668, [16 request sintetis](webapp/scan-kkpr-mobile-transport.json): 4 profile dan masing-masing 3 classifier/PDF/metadata/KKPR. Ini resolusi browser, bukan hardware Android.
- Dua pengamatan assertion draft desktop disimpan terpisah: literal koordinat dibulatkan tidak sama dengan mean asli yang belum dibulatkan; AX diff tidak menyertakan teks yang tidak berubah. Assertion akhir memakai koordinat terpilih persis dan teks DOM. Satu timeout selector mengira `.notice.warning`, sedangkan renderer nyata memakai `.notice.notice-warning`. Perbaikan hanya pada observasi, tanpa perubahan runtime atau request bisnis tambahan.
- Seluruh tile browser berasal dari PNG lokal valid. Tidak ada request provider/produksi, kamera/GPS, fallback generic/PBT, request tak terduga, pending response, atau console warning/error pada kedua fixture. Classifier tetap diperlakukan sebagai operasi write konservatif; 19 pemanggilan sintetis bukan mutasi produksi.
- [Review sumber](webapp/scan-kkpr-host-review.json): 15 pemeriksaan statis, 15 hash input stabil, tanpa temuan material. Reviewer menulis fixture/tes host, bukan implementasi runtime; review ini bukan suite independen duplikat atau bukti browser/produksi.

## Deployment dan batas penerimaan

[Deployment KKPR](webapp/scan-kkpr-deployment.json) mencocokkan 15 file frontend dan 23 file backend pada container berjalan. Frontend dilayani melalui bind mount read-only yang sudah ada; container backend tidak direstart dan sesi dipertahankan. `docker compose build webapp` memperbarui image mandiri tanpa merekreasi container. [Enam hash image tanpa mount/jaringan](webapp/scan-kkpr-image.json) dan [tujuh file statis publik](webapp/scan-kkpr-public-assets.json) cocok. Cloudflare Tunnel dan binding host loopback tetap sama.

[Preview publik setelah refresh](webapp/scan-kkpr-authenticated-preview.json) menunjukkan akun terhubung dan form Scan kosong, tanpa mengirim kode asli, classifier, posisi, atau dokumen. Setelah pengujian sempit, tab dikembalikan ke preview publik yang masih terhubung. Kedua server fixture telah dihentikan. Pembacaan Bhumi akun sebelumnya adalah [bukti terpisah](webapp/bhumi-live-followup-summary-2026-10-20.json), bukan penerimaan KKPR baru.

Penerimaan kode/dokumen KKPR asli oleh server, RDTR/RTRW, Google/vector parity, SDK/pixel parity, semua fungsi aplikasi, dan hardware tetap belum terbukti. Native fallback berasal dari cached global yang asal/umurnya tidak diketahui; browser memakai fallback tetap tanpa mengarang GPS. JSON guard ukuran/angka, batas Web Mercator sekitar ±85,0511°, dan penolakan `pertimbangan` JSON nonnull merupakan batas representasi yang dinyatakan. Panel/arah dapat tersedia ketika peta menolak lintang di luar Web Mercator. Upload geotag tetap nonaktif dan tidak ada penggantian bukti kunjungan fisik.

[Ringkasan terikat checksum](webapp/scan-kkpr-verification-summary.json) menyimpan seluruh scope dan receipt. Goal seluruh aplikasi belum selesai. Perubahan batch KKPR belum dipush ulang; checkpoint GitHub sebelumnya tetap `f2ea136a368f8614960b3b58169acf7e2c3cfd7d`.
