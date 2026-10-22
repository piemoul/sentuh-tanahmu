# Mitra Kerja dan uji baca akun — 21 Oktober 2026

Perubahan ini memperbaiki lima adapter baca Mitra Kerja yang sudah aktif: kantor PPAT, daftar PPAT, provinsi Surveyor, daftar Surveyor, dan Penilai. Daftar valid tidak lagi ditolak hanya karena envelope mempunyai `error:true`. Field tetap divalidasi sesuai model nullable String native. ID induk kosong/null/spasi mengikuti nilai yang dipilih; query browser tetap memakai encoding URL yang aman. Halaman baru memuat data sekali, dan kegagalan tidak memicu retry otomatis.

Pencarian, pagination, kategori PPAT/PPATS dan Surveyor/Asisten, informasi jumlah akta, serta kembali ke daftar induk memakai data lokal. Respons permintaan lama tidak boleh mengganti hasil frame baru. Pesan respons lokal yang bukan JSON sekarang menyertakan status HTTP dan ID gateway yang lolos validasi; isi respons dan kredensial tidak ditampilkan.

Kontrak positif, sumber native dan batas adaptasi dicatat dalam [follow-up Mitra](MITRA-READ-CONTRACT-FOLLOWUP-20261021.md). Tidak ada operasi tulis baru: katalog tetap176 operasi,86 aktif, terdiri dari72 baca dan14 tulis. Hanya metadata lima operasi Mitra berubah. Runtime bertambah dari100 menjadi101 berkas dengan helper `private/mitra-response.mjs`.

## Verifikasi

- [Node diagnostik](webapp/mitra-read-node-diagnostics.json):1816/1816 lulus pada103 berkas tes.
- [VM diagnostik](webapp/mitra-read-vm-diagnostics.json):1190 lulus dalam pemetaan22 suite lama yang tidak berubah dan satu successor dengan koreksi dua ekspektasi ID native. Suite original tetap disimpan dengan47 lulus dan dua kegagalan guard yang diharapkan; original tidak diklaim hijau.
- [Ringkasan browser sintetis](webapp/mitra-menu-browser-summary.json) mengikat sumber aktual, transport lokal, observasi DOM dan screenshot. Semua respons provider digantikan data sintetis pada fixture; hasil ini tidak membuktikan penerimaan server asli. Kesalahan operator dan permintaan lokal yang ditolak dipertahankan dalam receipt, bukan dihapus.
- [Bukti image](webapp/mitra-read-image-final.json), [container/localhost](webapp/mitra-read-deployment-final.json), dan [domain publik](webapp/mitra-read-public-final.json) masing-masing berstatus `passed:true`:96/96 berkas image,96/96 container, dan62/62 berkas publik cocok. Delivery terdiri dari62 publik dan34 backend; container sehat dengan readonly root filesystem dan binding loopback.
- [Uji baca Mitra asli](webapp/mitra-read-live-summary.json) mencatat sembilan observasi UI positif setelah deployment, tanpa login. [Log aman](webapp/mitra-read-live-connection-summary.json) mencatat tepat satu HTTP200 pada masing-masing lima endpoint Mitra, tanpa kegagalan atau mutasi:kantor4354ms,PPAT21408ms,provinsi1416ms,Surveyor17069ms,Penilai1388ms. Kategori lokal dan pencarian tidak menambah pembacaan upstream. [Ringkasan release](webapp/mitra-read-release-summary.json) mengikat seluruh receipt.

Preview publik dibiarkan pada `https://sentuh.davay.space/#/partners`, filter Batam. [Screenshot aktual](webapp/mitra-read-live-preview.jpg) berisi data kantor publik, bukan dokumen atau geometri akun.

## Hasil akun sebelum pergantian backend

[Empat belas observasi UI akun](webapp/account-read-before-mitra-release.json) menyimpan12 hasil tampil dan dua observasi peta sertipikat yang belum lulus. Status Verifikasi dan SOP Berkas tampil tanpa error. Peta Koleksi Bidang mempunyai13/13 tile termuat, satu marker, dan tidak menambah polygon vektor buatan. Koleksi Berkas, Wakaf, Aktaku dan Berkasku mempunyai hasil kosong yang eksplisit; hasil kosong hanya menguji keadaan kosong.

Satu detail sertipikat mempunyai9 tile termuat dan satu image gagal/kosong. Upaya klasifikasi berikutnya gagal sebelum map terbentuk dengan pesan lama “Respons layanan lokal tidak dapat dibaca.” Ini dua observasi berbeda; tidak membuktikan tile mana/provider mana yang gagal.

[Agregat koneksi aman](webapp/account-read-before-mitra-connection-summary.json) dan [addendum SOP](BERKAS-SOP-CONNECTION-ADDENDUM-20261021.md) mencatat dalam jendela container yang luas: SOP HTTP200 dalam897ms, dua pembacaan boundary sukses, satu timeout boundary30007ms, serta14 permintaan Bhumi sukses dan satu `BHUMI_NETWORK_ERROR`. Hubungan satu-ke-satu dengan image DOM gagal tidak disimpan. HTTP200 PNG proxy juga belum membuktikan decode penuh image di browser. Tidak ada log mentah, identitas, query, token, geometry, koordinat atau isi dokumen disalin ke laporan.

## Batas yang masih terbuka

Tidak ada review, booking, penghapusan, unggahan dokumen, atau transaksi produksi yang dilakukan dalam kelanjutan ini. Tidak ada klaim seluruh menu/role/state telah setara1:1, APK asli berjalan di emulator, atau GNSS/perangkat fisik sudah diuji. [Audit koordinat](COORDINATE-WORKFLOW-CURRENT-AUDIT-20261021.md) membedakan draf koordinat ukur dari bukti hadir: geotag yang mensyaratkan kunjungan fisik tetap melalui alur resmi, dan upload yang belum terbukti tetap nonaktif. Goal keseluruhan belum selesai.

Perubahan frontend tidak memerlukan login berulang. Helper backend baru memerlukan satu recreate container; sesi backend berada dalam memori sehingga recreate itu mengakhiri sesi lama. Pengujian Mitra publik dicatat tanpa membuat permintaan login baru kepada pengguna.
