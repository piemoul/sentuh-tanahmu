# Validasi Info Layanan webapp — 18 Oktober 2026

**Info Layanan beserta enam simulasi biaya sudah diimplementasikan dan aktif di [localhost](http://localhost:4173/#/information).** Build yang diuji memakai `webapp/app.js` SHA256 `490cbee11054ea6288f5d84ad3530ec1fcdb677a677f8a31894b0e11f98b9b7f` dan `webapp/styles.css` SHA256 `db3d18a3df59baa45660b8cedbfee09cdebe2ba4e837d44579f753c3194e454d`. Ini menutup bagian Info Layanan yang dijelaskan di bawah; seluruh aplikasi belum setara 1:1 dan goal keseluruhan belum selesai.

[Rekap verifikasi release](webapp/information-verification-summary.json) mengikat hash build, hasil tes, bukti native, transport fixture, pengamatan produksi dan deployment dalam satu laporan.

## Perilaku yang sudah tersedia

Daftar dimuat otomatis tanpa mewajibkan login, memakai model dan envelope native yang diaudit. Kelompok mengikuti urutan sumber; pencarian nama, deskripsi dan kelompok berlangsung lokal, tanpa memangkas spasi pencarian. Semua baris tersedia. Memilih layanan memakai ID baris tersebut, membuka halaman detail khusus, dan mempertahankan pencarian ketika kembali. Persyaratan memakai key asli `persayaratan`; Waktu Penyelesaian, Keterangan Tambahan dan Tarif mengikuti field serta kondisi tampil yang diaudit. Model tidak dikenal menampilkan kegagalan yang dapat dicoba ulang. Penjagaan request/detail/sesi mencegah hasil atau kegagalan autentikasi lama mengubah halaman atau sesi pengganti.

Formulir mengikuti `tipeSimulasi` dari respons detail. Tipe3 memakai `layananId` yang dikembalikan detail; provinsi dimuat untuk tipe1/2/3/5/6, sedangkan tipe4 tidak memerlukannya. Pilihan memakai nilai asli tanpa normalisasi payload. Tipe2 menyediakan tambah/hapus baris bidang secara lokal. Isian bilangan tetap dikirim sebagai String; nol di depan dipertahankan. Backend mengirim JSON untuk enam endpoint SimulasiTipe1–6 dengan sesi akun bila tersedia, dan mengizinkan jalur anonim yang juga berhasil diuji secara langsung.

Hasil memakai String biaya yang dikembalikan server: Biaya Pengukuran, Pemeriksaan Tanah dan Pendaftaran ditampilkan bila nonnull; Total Biaya selalu tampil dengan fallback `0`. Webapp menambahkan awalan `Rp ` tanpa menghitung ulang, menjumlahkan atau memformat ulang nilai. Permintaan gagal mempertahankan input dan menyediakan percobaan ulang. Tata letak sudah diperiksa di browser desktop dan ponsel.

## Bukti pengujian pada build ini

| Bukti | Hasil | Batas |
|---|---|---|
| [Tes Node lengkap](webapp/information-automated-tests.txt) | 126 lulus, 0 gagal; 635,1708 ms | Transport upstream buatan; bukan 126 fitur atau panggilan produksi. |
| [Regresi fungsi aktual](webapp/information-regressions.json) | 680 pemeriksaan dalam 16 rangkaian, seluruh exitCode0 | Termasuk 40 Info Layanan dan 41 simulasi; angka tersebut sudah termasuk dalam 680. |
| [Tes backend simulasi terfokus](webapp/information-simulation-backend-verification.json) | 8 lulus, 0 gagal | Sudah termasuk dalam 126 tes Node. Laporan awal ini mendahului uji produksi; keterbatasan penerimaan anonimnya diperbarui oleh bukti live di bawah. |
| [Browser dengan fixture](webapp/information-browser-checks.json) | 20 lulus, 0 gagal; tanpa overflow atau warning/error konsol | Menguji daftar/pencarian/detail, keenam tipe, pilihan asli, ID detail, tambah/hapus bidang, gagal/retry, desktop/ponsel. Tanpa login, CAPTCHA atau produksi. |
| [Transport fixture browser](webapp/information-browser-transport.json) | 21 panggilan: 18 HTTP200 dan 3 kegagalan503 yang disengaja | Nol request produksi; proses fixture sudah dihentikan. |
| [Verifikasi native independen](webapp/information-native-verification.json) | Empat verifier lulus terhadap ELF, pool, dispatch dan hash dependensi | Alur UI, layanan/model dan kedua kelompok formulir; verifier layanan juga mencakup ledger Status Verifikasi. Jumlah instruksi tidak dijumlahkan karena bukti bertumpang tindih. |

[Baseline historis Info Layanan](webapp/information-flow-before-fix.json) mempertahankan 6 kegagalan dari 17 pemeriksaan pada sumber `1c4834de…a528ff`: model yang terlalu longgar dan respons autentikasi dari detail yang sudah ditinggalkan. Laporan tersebut tidak dilabeli ulang sebagai hasil build baru. Hasil fungsi terfokus sekarang tersedia pada [alur](webapp/information-flow-latest.json) dan [simulasi](webapp/information-simulation-latest.json).

## Server asli dan browser localhost

[Batch live anonim](webapp/information-live-check.json), 17:51:52–17:51:56 UTC, berhasil melalui adapter Docker dengan **65 panggilan produksi**: satu daftar layanan, 57 detail layanan, satu daftar provinsi, dan masing-masing satu perhitungan untuk keenam tipe. Seluruhnya mendapat HTTP200 lokal/upstream dan respons yang dikenali. Daftar saat pengujian berisi 57 layanan dan 34 provinsi. Ini menguji seluruh detail pada daftar yang dikembalikan saat itu, bukan seluruh kemungkinan variasi input atau seluruh menu aplikasi.

Input perhitungan adalah contoh sintetis untuk estimasi: luas `100`, jumlah `1`, nilai per meter `1000000`, penggunaan `pertanian`, prosedur `konversi`, kewenangan `Kantor Petanahan`, dengan provinsi ACEH. Tidak ada data bidang pengguna, kredensial atau ID record yang disimpan dalam laporan; sesi lokal terisolasi telah ditutup. Tidak ada mutasi yang diminta. Perhitungan dimaksudkan sebagai estimasi sesuai alur client; laporan tidak membuktikan ketiadaan seluruh efek internal atau telemetry server.

[Pengamatan browser live terpisah](webapp/information-live-browser.json) pada 17:53:44 UTC membuka Peralihan Hak Jual Beli di localhost, mengisi nilai per meter `1000000` dan luas `100`, lalu menampilkan **Total Biaya Rp 150.000** dari respons server. Tidak ada alert, overflow atau warning/error konsol. Webapp tidak menghasilkan angka tersebut dari rumus lokal. Pengamatan ini terpisah dari batch65 di atas; laporan browser tidak menetapkan jumlah transportnya, sehingga tidak ada total panggilan gabungan yang diklaim.

## Deployment dan sesi

[Verifikasi deployment](webapp/deployment-latest.json) pada 17:49:27 UTC mencocokkan hash tiga berkas frontend dan tiga berkas backend dengan sumber. Docker Desktop menjalankan build ini melalui `http://localhost:4173`, dengan mount frontend baca-saja dan port tetap dibatasi loopback. Katalog berisi **171 bentuk request dan 66 adapter aktif**; enam adapter tambahan adalah simulasi biaya. Angka katalog bukan jumlah fitur yang sudah lengkap.

Rebuild backend untuk aktivasi adapter mengakhiri sesi login lama. Pengguna sudah diminta login kembali untuk melanjutkan pengujian akun; dokumen ini tidak menyatakan sesi akun baru telah terverifikasi. Info Layanan sendiri telah terbukti berfungsi anonim. Cloudflare Tunnel belum dijalankan, dan deployment ini tidak menerbitkan aplikasi ke domain publik.

## Perbedaan dan pekerjaan tersisa

- Browser membatasi setiap isian scalar sampai **16.000 karakter** dan tipe2 sampai **100 baris bidang**. Native widget mencatat maxlength99999; batas web bukan klaim batas server/native.
- Browser menolak ID layanan/provinsi yang kosong atau hanya whitespace dan memberikan error validasi/retry yang terlihat. Native mempunyai beberapa guard null saja atau pengembalian diam-diam; penanganan ini merupakan perbedaan yang disengaja.
- Numeric keyboard dan pemilihan formatter native sudah dibuktikan, tetapi hubungan initializer `Cra.Tvg` dengan kandidat regex angka belum lengkap. Browser mempertahankan raw String dan belum membuktikan kesetaraan seluruh pengetikan, paste, Unicode atau format angka native.
- Ukuran desktop/ponsel sudah diperiksa tanpa overflow pada kasus yang diuji; kesamaan setiap piksel, seluruh detail tema, semua kombinasi input, seluruh error server dan seluruh kondisi akun belum dibuktikan.
- Pencarian Cari Berkas produksi lengkap, dokumen/fitur akun yang belum mempunyai data uji, antrean lintas layanan dan alur lain masih memiliki gap tersendiri dalam [status kesetaraan](WEBAPP-PARITY-STATUS.md) dan [inventaris](webapp/coverage-latest.json).
- Unggah geotag, penggantian bukti kunjungan dan operasi yang belum diaudit tetap tidak diaktifkan oleh perubahan Info Layanan ini.

Audit native pendukung: [alur UI](INFORMATION-FLOW.md), [layanan dan model](INFORMATION-SERVICES-FLOW.md), [formulir1–3](INFORMATION-SIMULATION-A-FLOW.md), [formulir4–6 dan hasil bersama](INFORMATION-SIMULATION-B-FLOW.md). Semua pengujian dan jumlah historis untuk Status Verifikasi `ab52ff46…ae7480`, Cari Berkas `1c4834de…a528ff`, Mitra `8e2eeb01…042be2`, dan bootstrap/profil `607b2cd7…29c86c` tetap berasal dari build masing-masing; bukti tersebut tidak dijumlahkan sebagai hasil build ini.
