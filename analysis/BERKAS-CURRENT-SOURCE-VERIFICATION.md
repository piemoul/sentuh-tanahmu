# Pemeriksaan ulang sumber Berkas terhadap APK

Pemeriksaan independen sumber Berkas saat ini lulus terhadap ELF APK 6.1.5 yang dipatok. Ini memperkuat bukti instruksi yang dapat dipakai untuk pengembangan; **bukan pemulihan hash historis atau klaim semua fungsi Berkas selesai**. Aplikasi, container dan sesi tidak diubah.

[Laporan](recovered/berkas-current-source-verification/verification.json) dan [verifier](rea/verify_berkas_current_sources.py) memeriksa:

- 29 berkas sumber; 28 masih cocok dengan hash ledger historis.
- Seluruh 9.560 kemunculan instruksi pada 28 berkas assembly, mencakup 9.413 alamat instruksi unik, cocok dengan byte ELF. Tumpang tindih rentang tidak dihitung sebagai instruksi unik baru.
- Seluruh 21 instruksi eksplisit, 55 marker dan dua binding dispatch yang dipakai verifier lama tetap cocok.
- Sebelas anotasi pada sumber yang berubah cocok dengan sepuluh offset unik object pool yang tersedia; nilai pool tidak dikeluarkan dalam laporan.

Satu sumber, `analysis/recovered/request-callsites/range-006bbe60.asm.txt`, mempunyai hash sekarang `75d47b42385904ffc999c70968332dbd7b1ae12ff78b3f45e06ae4afb834d192`, sedangkan ledger historis mengharuskan `057615f021387f68e60aa7466446b739d47bf17dc7acedab49b49896e1469ab9`. Seluruh 148 instruksi dalam sumber sekarang cocok dengan ELF. Bukti ini tidak menentukan isi/extent berkas historis yang hilang atau penyebab perubahan teksnya.

Pencarian baca-saja terbatas menemukan dua salinan terkait: `kkpr-document-flow/account-envelope.asm.txt` dan `searchfile-flow/sop-envelope.asm.txt`. Keduanya mempunyai SHA-256 `bf1af0d9e2bb0496033f403213a4c3fd7cf71653eb14213fb6737775ca0f3c7b`, berisi 95 instruksi dari `0x6bbe60` sampai `0x6bbfd8`, serta identik dengan prefix sumber sekarang. Tiga versi `pp.txt` yang tersedia menghasilkan anotasi sama pada offset yang relevan. Variasi prefix/line ending/BOM/trailing newline dari metadata yang benar-benar tersedia tidak menghasilkan hash historis. Tidak ada rekonstruksi isi yang ditebak atau penggantian sumber kanonis.

Verifier historis dijalankan kembali dan **tetap gagal pada hash yang sama**. Ledger dan verifier tersebut tidak direbaseline. Laporan independen ini mencatat kegagalan historis secara eksplisit, memin hash sumber saat ini, dan memverifikasi instruksi langsung dari ELF; laporan tidak mengubah status gagal menjadi lulus. Anotasi semantik di luar pemeriksaan terpilih tetap mengikuti batas audit asalnya.

Tidak ada jaringan produksi, pembacaan akun, pengajuan, eksekusi APK, pengujian PDF baru atau perubahan runtime. Hasil akun sebelumnya tetap terbatas pada [laporan ketersediaan dokumen](ACCOUNT-DOCUMENT-AVAILABILITY-2026-10-19.md). Kesetaraan end-to-end seluruh fitur belum terbukti.

Reproduksi offline:

```powershell
tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_berkas_current_sources.py
```
