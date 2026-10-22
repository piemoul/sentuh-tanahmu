# Rilis Pengumuman Yuridis — 21 Oktober 2026

Pengumuman Yuridis kini memiliki pemilihan kantor, daftar/pencarian, detail enam fakta, pembacaan lokasi, ulasan terakhir pengguna, dan composer ulasan dengan konteks Yuridis yang dibuktikan dari APK. Build telah diganti dan diperiksa pada localhost serta HTTPS. **Ini penyelesaian increment Yuridis, bukan kesetaraan seluruh aplikasi atau penerimaan seluruh fungsi server.** Ringkasan mesin: [yuridis-release-summary.json](webapp/yuridis-release-summary.json).

Sumber aplikasi saat verifikasi: `43a2a3824f93d385b64cabfa1945a550e6ee9b981f87151213dbd992010278f9`. Inventaris berisi **120 file runtime**, **176 operasi**, **88 aktif:74 baca/14 tulis**. Tepat tiga record katalog berubah: feed Yuridis, last-user review, dan scope writer ulasan bersama; **173 record lain serta daftar14 ID operasi tulis tetap sama**. Sepuluh file lama berubah dan enam file runtime ditambahkan. Angka operasi aktif bukan jumlah fungsi produksi yang telah diterima.

## Perilaku yang diimplementasikan

Kantor memakai urutan/ID respons asli dan kantor favorit profil bila cocok, dengan fallback ke kantor pertama. Feed membaca `announcement/yuridis_byKantor`; model GGb terpisah mempertahankan sepuluh String nullable serta luasPersil integer, termasuk integer lebar yang dikirim sebagai string desimal secara eksplisit. Pencarian lokal hanya mencocokkan nomorBerkas, wilayah dan pemohon tanpa memangkas spasi; urutan sumber, duplikasi dan indeks pilihan dipertahankan.

Detail memakai baris terpilih, tanggal formatter yang telah tersedia, dan enam fakta native; tidak mengarang PDF atau endpoint detail. Peta memakai persilId asli untuk metadata lokasi, kemudian persilId yang dikembalikan untuk batas bidang. Last-user review memakai tepat `sertipikatSaya` dan persilId asli, tanpa pagination; decoder mengikuti early-null/singleton native. Composer dimulai kosong, mempertahankan input/foto pengguna, meminta konfirmasi, dan memuat ulang ulasan setelah hasil yang benar-benar diterima. Lifecycle, request lama, sesi dan hasil pengiriman yang belum diketahui memiliki penjagaan tersendiri. Tidak ada ulasan atau transaksi produksi yang dikirim selama penerimaan ini.

[Audit native](YURIDIS-READ-FLOW.md) dan [rencana implementasi](YURIDIS-IMPLEMENTATION-PLAN-20261021.md) membatasi klaim:42 pin sumber dan4.415 kemunculan instruksi statis. Pemilih kantor browser, penanganan null/error, responsivitas dan lifecycle adalah adaptasi web. Seluruh picker native, piksel, tata bahasa tanggal, peran pengguna dan perangkat asli belum terbukti1:1.

## Bukti pengujian dan delivery

| Bukti | Hasil dan batas |
| --- | --- |
| [Node final](webapp/yuridis-node-final.json) | **2038/2038 lulus**,120 file tes;0 gagal/dibatalkan/dilewati. Transport lokal sintetis. |
| [VM final](webapp/yuridis-vm-final.json) | **1190 pemeriksaan/23 suite lulus** dengan mapping harness yang berlaku. Harness historis asli tetap dicatat terpisah: Mitra47 lulus/2 gagal; Akta exit1 tanpa laporan JSON. Keduanya tidak disebut lulus. |
| [Browser sintetis](webapp/yuridis-browser-summary.json) | **27/27 kelompok lulus** pada aplikasi/handler/decoder/serializer nyata dengan transport injeksi. Desktop1280×720 dan mobile390×844; daftar, pencarian, detail, ulasan tunggal, peta raster, composer, hasil sukses/error, race dan cleanup.33 panggilan sintetis, termasuk2 POST eksplisit:1 diterima dan1 tidak.0 provider/produksi/GPS/kamera,0 warning/error/CSP. Foto tidak dipasang melalui browser. |
| [Image retry](webapp/yuridis-image-retry.json) | **115/115 file image cocok** tanpa mount/network/server probe. Container yang melayani sebelumnya tidak diubah oleh verifier. |
| [Deployment final](webapp/yuridis-deployment-final.json) | **115 file container +79 publik localhost +79 publik HTTPS cocok**. Container pengganti healthy, read-only, port localhost4173; verifier tidak melakukan build/restart atau operasi provider. |
| [UI layanan asli](webapp/yuridis-live-ui-observations.json) dan [koneksi](webapp/yuridis-live-feed-connection-summary.json) | **Satu feed anonim HTTP200**,487 opsi kantor, kantor pertama hasil dipilih,0 kartu dengan keadaan kosong yang benar, tanpa error dan refresh tersedia. Ini tidak menguji detail berisi, ulasan akun atau peta nyata. |

Image: `sha256:f253571e6ae2b88f7091fda24b3c6608166e4e4180c06b6f38aeaf4ef0b3bdad`. Container: `2efa17093911b65e5265be5d03764dbac7ee7a8761ce85ee9a3ba3774e7c6cd1`, mulai **2026-10-21T19:14:33.782121844Z**. [Deployment](webapp/yuridis-deployment-final.json) selesai **2026-10-21T19:15:03.632Z** pada [localhost](http://127.0.0.1:4173) dan [HTTPS](https://sentuh.davay.space). Penggantian backend mengakhiri sesi sebelumnya; observasi Yuridis asli dilakukan anonim setelah penggantian tersebut. Hash delivery membuktikan file yang dilayani pada waktu verifikasi, bukan jaminan seluruh API atau transaksi.

Uji asli dibatasi jendela **2026-10-21T19:15:20Z–2026-10-21T19:15:39Z**. Satu respons feed tercatat160ms; ini bukan jaminan latensi. Collector log tidak mengirim request aplikasi/provider. Nol mutasi yang diamati berarti nol event tulis dalam instrumentasi terklasifikasi pada jendela tersebut; bukan klaim atas semua aktivitas, transport lain atau waktu lain. JPEG awal tetap dipin, tetapi tidak dipakai sebagai bukti visual karena root menemukan render file tersimpan tampak kosong; bukti live memakai DOM agregat dan log. Tidak ada data akun berisi yang diuji. [Handoff preview](webapp/yuridis-preview-handoff.json) menunjukkan full reload pada halaman akun, form login aktif dan preview ditandai deliverable; autentikasi tidak diasumsikan dari state lama dan uji Yuridis terautentikasi masih menunggu.

## Kegagalan dan koreksi yang tetap dipertahankan

- [Node awal](webapp/yuridis-node-initial.json) tetap **2011 tes/1993 lulus/18 gagal**; bukan receipt lulus. Preimage dan migrasi ekspektasi katalog tetap tersimpan.
- [Image awal](webapp/yuridis-image-final.json) tetap gagal meski115 hash file cocok. Perbandingan metadata gagal karena urutan array Mounts Docker berubah. [Koreksi](webapp/yuridis-mount-order-correction.json) hanya mengurutkan observasi setelah pemeriksaan tujuan/read-only;0 perubahan aplikasi dan0 assertion keamanan dihapus. Receipt retry yang lulus tidak menimpa kegagalan itu.
- [Perintah collector dengan akhir jendela di masa depan](webapp/yuridis-live-collector-rejected-window.json) ditolak oleh guard. Hanya pengumpulan log request yang sama diulang dengan waktu akhir teramati; collector tidak diubah dan request provider tidak diulang.
- Laporan browser mempertahankan ekspektasi pencarian satu-spasi yang salah, koreksi selector marker/SVG, dan percobaan fokus body yang timeout. Kasus no-trim menggunakan dua spasi. Inspeksi screenshot mobile-detail oleh root terjadi setelah observasi awal disimpan; flag awal tetap dipertahankan. Semua itu dicatat sebagai koreksi pengukuran, bukan kegagalan produk yang diam-diam dihapus.

## Bukti sebelumnya dan pekerjaan yang masih terbuka

[Penerimaan Perjalanan Berkas sebelumnya](webapp/berkas-journey-live-summary.json) membuktikan satu Berkas nyata dari Aktivitas, satu baris perjalanan, Back/fokus dan buka ulang, dengan satu pembacaan utama HTTP200. Empat pemeriksaan itu **historis pada runtime/container pendahulu**. Hash receipt dipertahankan tanpa menganggap hash aplikasi lamanya masih menjadi sumber sekarang; bukti ini bukan penerimaan Yuridis.

[Follow-up antrean](QUEUE-BOOKING-FINAL-CONTRACT-FOLLOWUP.md) menutup provenance token Firebase Messaging, tujuan detail resmi setelah create, dispatch DOB ke DateTime.toString, dan kemungkinan retry POST native:25 window/1.969 instruksi. Ini bukti statis, bukan booking produksi; wire/redirect, provisioning, identity/OTP dan rekonsiliasi tetap belum lengkap. [Follow-up draf Berkas](BERKAS-DRAFT-CALLBACKS-FOLLOWUP-20261021.md),14 window/1.203 instruksi, mengikat callback ke pemulihan geotag_drafts lokal dan navigasi UAb, bukan peta langsung Berkas atau izin mengganti kehadiran fisik.

Yang belum dibuktikan: detail Yuridis berisi pada akun asli, last-user review nyata, peta bidang nyata, hasil kirim ulasan produksi, kamera/foto browser, seluruh menu/peran/error native, booking lengkap dan eksekusi APK pada perangkat. Peta/draf/HTTP200 biasa tidak membuktikan kunjungan fisik atau membolehkan pelolosan geotag tanpa kehadiran. **goalComplete tetap false.**

Writer laporan ini hanya membaca dan menghash sumber/receipt langsung, lalu menambahkan dua artefak ini. Ia tidak menjalankan provider, browser, Docker, deployment, perubahan runtime, commit atau push. Seluruh pin input diverifikasi lagi sebelum penulisan; receipt historis hanya dipin sebagai artefak, tanpa menelusuri ulang hash preimage sebagai sumber saat ini.
