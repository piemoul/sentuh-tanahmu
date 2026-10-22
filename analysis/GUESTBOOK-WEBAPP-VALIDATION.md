# Buku Tamu dan PlotBidang — validasi webapp

Buku Tamu kini memiliki alur QR→metadata unit→sembilan isian lokal. GET memakai klien aplikasi tersendiri, bukan bearer akun, refresh utama atau Directus. Dua read PlotBidang juga telah diparse sesuai model native. Ini kemajuan implementasi, bukan kesetaraan seluruh aplikasi.

- **1.437/1.437 tes Node**, **1.190 pemeriksaan VM/23 suite**, **15/15 pemeriksaan browser desktop**.
-55tes client/model;30tes frontend;10probe independen backend dan10frontend.140author checks dan148scoped backend mencakup tes yang juga ada pada full suite, sehingga tidak dijumlahkan menjadi total baru.
- **35frontend +29backend** cocok dengan container sehat; **64file image mandiri** cocok tanpa jaringan; **35aset HTTPS** cocok. Katalog176/84: satu GET baru,175record lain identik.
- Baseline63runtime berubah tujuh file, enamruntime baru.37ledger,409receipt,6dokumen dan170kontrak awal dilindungi. Backend dibuat ulang satu kali; login lama berakhir.

[Rekap mesin](webapp/guestbook-summary.json), [review integrasi](webapp/guestbook-integration-review.json), [review frontend final](webapp/guestbook-frontend-review-integrated.json), [browser](webapp/guestbook-browser-final.json), [cakupan](WEBAPP-FUNCTION-COVERAGE-GUESTBOOK.md).

## Perilaku dan batas

QR diparse mentah: kd menjadi uid, id menjadi unid. Guard host HTTP(S) adalah adaptasi browser; GET tidak membuktikan keaslian QR atau kunjungan. Native envelope error/message nullable tetap diterima, termasuk errortrue dengan model sah. Metadata null menampilkan retry secara jujur. Prefill hanya NIK/email stored signin; seluruh sembilan isian diperiksa tanpa trim, formatter tanggal/angka baru atau substitusi data profil.

Simpan tetap nonaktif. Halaman tidak mengirim kedatangan, membuat QR, memverifikasi petugas, menghasilkan kartu pengunjung, atau menyatakan kehadiran.16panggilan browser adalah sintetis:4profile dan12metadata. Fixture dihentikan; port4200 ditutup. Bukti browser menggunakan akun/QR/unit sintetis, bukan penerimaan BPN. Screenshot JPEG1265×712 memiliki byte tangkapan asli yang tidak diedit; metadata PNG keliru pada receipt awal dikoreksi melalui successor.

PlotBidang berbeda dari menu pribadi Swaplotting. WQb enam field wajib dan UQb27metadata nullable dipertahankan. Delineasi divalidasi lalu dibuang seperti native, tanpa membangun peta dari area, batas teks atau metadata. Supplement native menutup whitespace Unicode dan specialdouble pada validasi discarded; sumber SDK3.12.2 hanya corroboration, bukan bukti bahwa libflutter sama.

Build tersedia di http://localhost:4173/#/guestbook dan https://sentuh.davay.space/#/guestbook. Cloudflare menampilkan gate login yang benar setelah restart. QR kantor asli, penerimaan TLS/response provider, kamera hardware dan mobile belum diuji. Exactemail tidak dibaca melalui browser karena redaksi reader, tetapi pemetaan prefill diuji dalam model/host.

Kesetaraan seluruh menu belum selesai: personal Swaplotting dan owner-source bridge, inline peta Berkas, booking, Daring OTP/liveness, mutasi akun dan seluruh data/role/error/provider masih terbuka. Geotag yang menggantikan kewajiban kunjungan tidak diaktifkan. Tidak ada commit/push baru pada batch ini.
