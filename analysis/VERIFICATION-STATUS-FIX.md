# Perbaikan tampilan Status Verifikasi — 18 Oktober 2026

Laporan pengguna tentang error berasal dari renderer generik yang menampilkan `Error false` dan `Message 1`. Pembacaan akun melalui browser menerima HTTP 200 dengan `{"error":false,"message":"1"}`. Ini bukan timeout atau penolakan login. [Audit APK](ACCOUNT-VERIFICATION-STATUS-FLOW.md) menghubungkan message `1` dengan persetujuan permohonan verifikasi.

Frontend `ab52ff4674c3ed02f2d6847442308499d72b34339527f2dce080f19125ae7480` sekarang membaca envelope BCb langsung: `error` bool nullable, `message` string nullable, dan `data` string nullable. Kode `0`, `1`, `2` menjadi **Verifikasi dalam proses**, **Verifikasi disetujui**, dan **Verifikasi ditolak**. Keterangan penolakan berasal dari `data` dan di-escape. Nilai kosong atau kode lain tetap netral; model salah ditolak; respons error tidak menghasilkan status persetujuan. Pembacaan tetap memakai endpoint dan sesi yang sama.

Perubahan hanya pada frontend dan CSS yang di-mount ke Docker. Hash tiga frontend dan tiga backend sesuai sumber; container tetap `bd366e21…f4e31`, sehat, dan tidak direstart. Login pengguna tetap aktif. Tidak ada pengiriman permohonan verifikasi, perubahan akun, atau penyimpanan token.

## Bukti pengujian

- [Baseline fungsi](webapp/verification-flow-before-fix.json): 9 lulus, 1 gagal; membuktikan pasangan mentah error/message yang membingungkan sebelum perubahan.
- [Regresi terfokus](webapp/verification-flow-latest.json): 25 lulus, 0 gagal, 9 panggilan sintetis, tanpa jaringan. Mencakup tipe nullable, 2xx, tiga kode, kode asing/prototype, escaping, dan kepemilikan request/sesi.
- [Regresi fungsi lain](webapp/verification-regressions.json): 574 lulus dalam 13 rangkaian pada sumber baru. Total 599 pemeriksaan fungsi; tes backend lama tidak dihitung sebagai pengujian ulang perubahan ini.
- [Browser](webapp/verification-browser-checks.json): 7 pemeriksaan lulus. Akun asli menampilkan persetujuan, login tetap aktif, tidak ada alert atau warning/error konsol. Desktop 1280×800 dan ponsel 390×844 tidak mengalami overflow horizontal. Screenshot desktop mengecualikan sidebar identitas akun.
- [Rekap bukti](webapp/verification-status-fix-summary.json): dua pembacaan verifikasi melalui UI, sebelum dan sesudah perbaikan, dikonfirmasi log Docker terbatas: HTTP 200 pada 17:16:21 UTC (56 ms) dan 17:20:09 UTC (54 ms). Hanya status, waktu, path tetap, hostname dan hash disimpan; tidak ada kredensial atau identitas akun.
- Verifier native `analysis/rea/verify_information_services.py` memvalidasi ledger akun beserta ledger Info Layanan secara terpisah dari tes aplikasi. Ledger akun final mempunyai 10 sumber, 1.569 instruksi ELF dan 57 marker.

## Batas

Hanya status persetujuan yang diamati pada akun asli; status lain diuji dengan respons sintetis. Kartu ini belum mereproduksi seluruh alur verifikasi Android, dialog berdasarkan cached `userLevel`, prompt login ulang, atau navigasi status `-1/3`. Native consumer mengabaikan `error`, sedangkan backend browser yang tidak diubah tetap menolak `error:true`; perbedaan ini tidak menyebabkan kasus yang dilaporkan. Rekonstruksi seluruh aplikasi tetap belum selesai.

Audit Info Layanan tetap tersedia untuk tahap berikutnya: [UI](INFORMATION-FLOW.md), [service/model](INFORMATION-SERVICES-FLOW.md), serta baseline `information-flow-before-fix.json`. Belum ada integrasi frontend Info Layanan pada perbaikan ini.
