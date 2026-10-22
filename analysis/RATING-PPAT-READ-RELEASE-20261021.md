# Rating PPAT: questionnaire baca dari Aktaku

Aktaku kini membuka questionnaire dari baris asli yang mempunyai sertipikat dan `readyToRatingPPAT ?? true`. Entry menyalin `aktaId ?? ''`/`namaPPAT ?? ''` tanpa trim. Layar anak tetap di route Aktaku sebagai adaptasi browser; Kembali mempertahankan pencarian dan halaman induk tanpa membaca daftar ulang. Pemilik layar terikat pada sesi, navigasi, reader, response dan identitas baris yang sama. Ganti route/sesi, reload daftar, atau Back membuang questionnaire dan pilihan lokal.

Adapter baru hanya mengaktifkan GET `RatingPPAT/GetRatingQuestions`, main client/session, tanpa query/body/parameter Akta. Tepat HTTP200, shared transform, satu optional service String JSON decode, kemudian `data` List bertipe. `error:true` tidak menolak daftar valid hanya pada resep ini. `kategori`, `bobot` dan `nilai` tetap divalidasi sebagai String nullable walaupun dibuang. Nested list null tidak disamakan dengan list kosong; urutan dan duplikasi tidak dihapus.

Nama JSON yang benar adalah **`pertanyaanRatingPPATId` pada grup maupun opsi**, bukan alias `id`. Penyebutan `id` dalam catatan gap sebelumnya adalah shorthand yang tidak boleh dijadikan nama field implementasi. Tidak ada fallback ke alias, indeks, label atau nilai numerik untuk request native.

Tampilan mengikuti [bukti UI](RATING-PPAT-UI-FOLLOWUP.md): nomor sumber+indikator, deskripsi dari pertanyaan opsi pertama, seluruh jawaban sebagai pilihan radio. Map memakai ID grup→ID jawaban asli; groupID null diabaikan, answerID null menjadi String kosong, ID duplikat berbagi key, dan count mengikuti ukuran map terhadap jumlah grup. DOM memakai indeks sumber untuk nama radio. Normalisasi browser pada opsi ber-ID sama adalah adaptasi yang dicatat dalam modul. Error/retry eksplisit dan penjagaan respons basi juga adaptasi browser.

**Kirim Rating selalu nonaktif.** Tidak ada callback POST, pilihan dikirim, atau dialog sukses buatan. Mengisi seluruh pilihan atau mendapat list kosong tidak membuktikan penerimaan rating. POST `RatingPPAT/PostRatingPPAT` tetap nonaktif. Rilis ini bukan workflow tulis Rating lengkap.

## Verifikasi lokal

- [Node terbaru](webapp/rating-ppat-read-node-after-newline.json):1881/1881 lulus pada109 berkas tes; termasuk12 backend,23 model/host dan7 integrasi Aktaku baru.
- [VM terbaru](webapp/rating-ppat-read-vm-after-newline.json):1190 pada23 suite. Pemetaan mempertahankan successor Mitra dan mengganti hanya dated Aktaku suite dengan successor dua assertion groups yang kini mempunyai bukti entry native. Original Aktaku berhenti pada guard lama dan tidak mempunyai report JSON; tidak ada jumlah fail buatan. Original Mitra tetap47 lulus/dua guard failure yang diharapkan, bukan hijau. Suite Aktaku nonmapped lama mempunyai dependency formatter yang hilang dan tetap dicatat sebagai gagal historis, bukan bagian dari23 suite lulus.
- [Browser aplikasi penuh](webapp/rating-ppat-browser-summary.json): akun/profil/Akta/pertanyaan sintetis, actual index/app/CSS/controller/view serta decoder byte Rating aktual. Menguji original index di halaman2 dan hasil filter, Back, pilihan lokal tanpa request tambahan, null/duplikasi, HTML escaping, respons String, empty,503, model salah tipe, serta sukses/401 tertunda dari owner lama. Screenshot desktop/mobile390 diperiksa visual.
- [Perbaikan newline](webapp/rating-ppat-read-newline-fix.json) mempertahankan kegagalan Node awal dan app preimage CRLF. Perubahan line ending yang tidak disengaja menggagalkan extractor tes lama sebelum lima tes terdaftar. App dikembalikan ke LF; extractor tidak diubah. Dua receipt `*-final.json` pertama bukan bukti sumber terbaru. Fixture awal belum pernah dibuka di browser dan dihentikan lewat API fixture sebelum perubahan; koreksi alasan stop yang hardcoded disimpan dalam catatan.
- [Preimage migrasi tes](webapp/rating-ppat-read-test-preimages/manifest.json) mempertahankan16 tes katalog sebelum penyesuaian satu GET aktif dan dua ekspektasi tahap lanjut. Batas write14, sole operation delta dan typing tidak dilonggarkan.

## Delivery dan batas live

[Image](webapp/rating-ppat-read-image-final.json), [deployment](webapp/rating-ppat-read-deployment-final.json), dan [domain](webapp/rating-ppat-read-public-final.json) merupakan bukti terpisah yang wajib `passed:true`:108 runtime,103 berkas delivery (68 publik/35 backend), katalog176 dengan87 aktif (73 baca/14 tulis). Helper backend memerlukan satu recreate; frontend menggunakan mount yang sudah ada. Tidak ada perubahan konfigurasi host atau penerobosan TLS/attestation.

[Ringkasan release](webapp/rating-ppat-read-release-summary.json) mengikat sumber/receipt. Pengujian fixture tidak membuktikan penerimaan GET server asli atau adanya Akta eligible pada akun pengguna. Uji live harus memakai sesi yang pengguna masukkan sendiri dan hanya membaca data; jangan membuat ID Akta saat daftar kosong. Sampai ada receipt live tersendiri, tandai bagian itu belum diuji. Tidak ada rating, dokumen, geotag atau transaksi produksi dikirim dalam rilis baca ini.

![Questionnaire dengan data sintetis](webapp/rating-ppat-browser-desktop.jpg)

## Pekerjaan berikutnya

[Audit Perjalanan Berkas RAb](BERKAS-JOURNEY-UI-FOLLOWUP.md) kini menutup layar snapshot, urutan, placeholder status0, indeks aktif, tanggal dan jam. Layar baca tersebut dapat dibangun tanpa endpoint baru. Detail marker/painter pixel tetap dibedakan dari kontrak data. Final booking, Rating POST, uji akun populated/error/role, transaksi produksi dan runtime APK/perangkat tetap belum selesai. Koordinat ukur tidak diubah menjadi bukti kunjungan untuk geotag yang mensyaratkannya; goal keseluruhan belum selesai.
