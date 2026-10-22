# Daring OTP: bounded static follow-up

Membuka layar OTP native dapat mengirim pesan WhatsApp. Layar ini tidak aman diperlakukan sebagai pembacaan status biasa. Audit ini hanya membaca APK yang dibekukan; tidak menjalankan layanan, memasukkan identitas, membuat kode OTP, membuka kamera, atau mengubah aplikasi.

Ledger final: `analysis/recovered/daring-otp-followup/flow.json`, SHA-256 `13a243f7528fa5557f5a71cf3cffd1a5673f7d147d0c4f43a20a49884dac9516`.

Verifier `analysis/rea/verify_daring_otp_followup.py` lulus. Ia mendekode ulang setiap instruksi dari ELF dan memeriksa anotasi pool, class header, dispatch, branch penting, hash dependensi, serta ekspor metadata terbatas yang diulang identik. Cakupan: 15 window baru / 3.557 instruksi, 6 window warisan / 3.173 instruksi, total 6.730 instruksi unik; 111 binding pool baru, 229 marker, 9 class, 3 dispatch, dan 7 header allocator. Seluruh 23 input build Blutter bersama tetap identik.

Sumber tetap:

- ELF `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.
- Pool `analysis/recovered/blutter-unique/pp.txt`, SHA-256 `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- Form pendahulu `analysis/recovered/verification-daring-form-followup/flow.json`, SHA-256 `ea736769eab7c366ca146222ef8860817c0fd17242f0eb768f383c8a7c29c7b8`.
- Kontrak respons identitas pendahulu `analysis/recovered/daring-identity-response-followup/flow.json`, SHA-256 `ff50866326808280c90b2962cda3845b2e50ffe5124cdae2ad6d6c46d96a3243`.

Alur yang terikat positif:

1. Callback `90434c` membuat konfigurasi `mGb583` dan widget `oGb6214`. Judulnya **OTP Verifikasi**, instruksinya **Masukkan OTP yang telah dikirim ke nomor WhatsApp Anda**. Nomor berasal dari `OEb.NoHp` asli, controller tetap `JEb604`, callback hasil adalah `da9d0c`, dan tipe adalah enum `liveness`. Kunci timestamp dibentuk dari `otp_session_liveness_` ditambah nomor asli.
2. Factory `9ff0cc`, init `77684c`, dan build `914670` terikat melalui dispatch kelas. Init memasang `kGb584` lalu memulai initializer async. Tanpa countdown atau timestamp yang dapat dipakai, initializer menuju pengiriman. UI menampilkan enam karakter, countdown, **Kirim Ulang**, busy, dan pesan error. `nGb+1b` adalah slot error yang dibaca builder; `+17` slot tambahan.
3. **Kirim Ulang** menuju `daba94 → dabb20`; cabang liveness menghapus timestamp lokal sebelum memanggil pengiriman. Countdown default bernilai 90 dan callback timer mengurangi satu setiap tick. Penyimpanan timestamp dan pengembalian countdown memiliki cabang tersendiri; ini tidak membuktikan batas kirim ulang atau expiry yang ditegakkan server.
4. Metadata snapshot terbatas mengikat `dyn:yaj` pada controller aktual ke `de4940 → de4970`. Getter `yaj` dan closure juga terikat. Controller menyimpan state kode lokal sebelum memanggil `de4ba0` saat countdown lokal nol. Tidak ada nilai kode yang dibaca atau dihasilkan oleh audit ini.
5. `de4ba0` melakukan POST `common/send_otp_wa` melalui main client, dengan JSON dua kolom: `phone_number` asli dan `otp` hasil helper transformasi `6febc4`. Nilai key/IV helper tidak diekspor. Setelah respons, `error` yang hilang/null menjadi `true`; nilai nonnull wajib bool. Tuple layanan menggunakan **delivery success = !error**, dengan pesan tetap **Gagal mengirim OTP** atau **OTP berhasil dikirim**. Layanan tidak membandingkan status dengan 200 secara eksplisit; kebijakan transport bersama tetap berlaku.
6. Ada perbedaan penting dari respons layanan: `JEb.de4970` pada jalur respons normal akhirnya mengembalikan `true`, termasuk ketika bool delivery success layanan `false`. Maka respons helper ini tidak boleh disebut bukti bahwa pesan benar-benar terkirim. Exception layanan tetap dilempar dan ditangkap controller generic sebagai error.
7. Completion menerima String sepanjang enam karakter. `dac254` mengubahnya menjadi int dan menggunakan `Aaj` yang secara positif terikat melalui snapshot ke `de4e90 → 9044f4`. Fungsi tersebut membandingkan input dengan state kode pada `JEb+27`. Tuple true menuju `dac1c4`: hapus timestamp dahulu, lalu panggil konfigurasi `+17` dengan String enam karakter asli. Di pemanggil Daring, callback itu adalah `da9d0c`.

**Perbandingan tersebut adalah gate pada client.** Hasil cocok, respons pengiriman, atau navigasi menuju liveness tidak membuktikan challenge tervalidasi server, kepemilikan nomor, status akun terverifikasi, atau penerimaan provider. Temuan ini tidak memberikan izin untuk melewati OTP atau merekonstruksi jalan pintas verifikasi.

Worker native lain memeriksa secara terpisah batas callback `da9d0c` dan instruksi liveness dalam `analysis/recovered/daring-liveness-entry-followup/flow.json` (SHA-256 `8b34b26dbc0e827f926014d61f32d18762f6315ef11455d2b985cd60e818721e`). Worker itu juga melakukan sanity check read-only terhadap length gate, tuple gate, urutan penghapusan timestamp, argumen callback asli, dan slot error pada draft OTP ini; tidak menemukan kontradiksi. Ini bukan review seluruh ledger OTP.

Batas yang masih terbuka dan harus dijaga pada rencana implementasi:

- Algoritme, output, dan kompatibilitas helper transformasi OTP belum ditutup. Tidak ada key, IV, ciphertext, kode, atau credential yang diekspor. Adapter pengiriman belum siap disertifikasi dari bukti ini saja.
- Override/dispatch `qGb.dispose`, penutupan stream, pembatalan timer ketika meninggalkan page, pembersihan draft, dan penolakan hasil async yang terlambat belum terikat positif. Self-cancel timer bukan bukti cleanup page.
- Getter `Qsj` untuk tampilan tujuan pada controller aktual belum terikat. Cabang fallback masking ada, tetapi dispatcher yang bernilai nol saja bukan bukti getter tidak ada. Shared PIN/keypad rendering, filtering, IME, substring Unicode, dan pemicu completion internal belum diaudit.
- Helper clock native mengembalikan int, tetapi unit/epoch bootstrap dan semua kasus timestamp rusak atau di masa depan belum ditutup. Detail platform penyimpanan juga belum diperiksa.
- Tidak ada uji produksi, OTP nyata, provider, kamera, liveness, final submit, atau klaim kesetaraan end-to-end. Webapp tetap perlu menjaga batas tindakan sensitif dan verifikasi server yang sah.

Reproduksi pemeriksaan offline:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_daring_otp_followup.py
```

Script eksplorasi dan builder baru berada di `analysis/rea/explore_daring_otp_followup.py`, `prepare_daring_otp_metadata.py`, dan `build_daring_otp_followup.py`. Helper metadata memakai object Blutter yang sudah tersedia, membaca metadata yang diizinkan saja, dan tidak memanggil initializer aplikasi. Semua output audit berada dalam direktori baru; source aplikasi dan laporan historis tidak diubah oleh audit ini.
