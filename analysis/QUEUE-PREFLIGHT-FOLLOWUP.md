# Antrian: preflight `full`, jam tutup, dan model kuota

Audit REA offline ini menutup aturan lokal yang sebelumnya masih terbuka pada [batas implementasi booking](QUEUE-BOOKING-IMPLEMENTATION-BOUNDARY.md). **Tidak ada perubahan aplikasi, pemeriksaan kuota nyata, booking, akun, token, socket, atau enablement operasi.** Preview antrian yang sudah terpasang tetap menyatakan kuota belum diverifikasi dan tombol akhir **Ambil Antrian** tetap nonaktif. Temuan berikut bukan izin untuk menambah gate jam tutup pada preview itu.

[Ledger](recovered/queue-preflight-followup/flow.json) SHA256 `68d899495e9abb17278eccad0e1129dc82124216e4538d8a7f5ea5fad140a9b8` memakai ELF/pool 6.1.5 yang sama. [Verifier mandiri](rea/verify_queue_preflight_followup.py) menghasilkan [receipt PASS](recovered/queue-preflight-followup/verification.json): **3 potongan baru / 570 instruksi, 17 potongan warisan / 1.508 instruksi, total 2.078 instruksi unik**, 116 marker, 69 pemeriksaan semantik literal, 49 anotasi pool, 12 record publik, dan 9 dispatch. Semua 695 input lama yang dilindungi serta 79 runtime tetap identik. Checkpoint root terpisah juga cocok: 79 runtime, 42 ledger native, 551 receipt historis, 21 dokumen, dan korpus 170 request.

## Urutan cabang yang benar

Callback loket `d8aa78` menjalankan urutan ini setelah gate baris `is_available` **integer 1** dan busy lokal false yang sudah dibuktikan sebelumnya:

1. Menunggu controller kuota `d8bcc4 → d8bee8`. Bila hasil controller menandakan error, tampilkan pesan hasil tersebut dan berhenti.
2. Bila `nzb.estimasi_message` tidak null dan mengandung substring lowercase **`full`**, tampilkan **seluruh pesan asli** lalu berhenti.
3. Evaluasi helper jam tutup `88ca38`. Hanya bila helper mengembalikan true, bandingkan `selectedDate.day` dengan `day` dari sampel waktu lokal baru. Bila sama, tampilkan pesan kantor tutup hari ini dan berhenti.
4. Selain itu, buka review melalui `d8ae90`.

Tidak ada GET availability baru pada window click/preflight/review yang diwarisi. Kuota POST bukan refresh GET, dan hasil aturan lokal bukan reservasi atau bukti kuota server yang masih berlaku.

## `full` adalah substring case-sensitive

Call `d8abc0` memakai selector **−4096**: String CID94 menuju `ca6c90`, CID95 menuju `ca6b7c`. Optional start index default **0**. Pola literal `full` berukuran empat code unit, sehingga jalurnya menuju general `indexOf` (selector −4090: `ca6470 → ca6188`). Loop menguji setiap posisi sampai `length − patternLength` secara inklusif; matcher `4311bc` membandingkan byte/UTF-16 code unit secara tepat.

Tidak ada trim, lowercase, normalisasi Unicode, pemeriksaan kata utuh, atau equality seluruh String pada caller ini.

| Estimasi asli | Cabang pesan penuh |
|---|---|
| null atau String kosong | Tidak |
| `full` | Ya |
| `fully booked` | Ya |
| `not full` | Ya |
| `FULL` atau `FulL` | Tidak |
| String dengan teks Unicode di sekitar `full` | Ya, bila empat code unit itu persis ada |

Nama `contains` bukan dugaan dari teks pesan: dispatch, fallback pencarian, loop posisi, dan komparator code unit diikat ke instruksi. Window warisan String satu-byte hanya diperlukan untuk jalur pola empat karakter menuju fallback; audit tidak mengklaim seluruh library String atau semua pola non-String telah ditutup.

## Jam tutup: waktu perangkat dan perbandingan nomor hari

Helper `88ca38..88cc48` membaca `nzb+0x2b` (`jam_tutup`). Model lama sudah membuktikan String nullable itu melalui `DateTime.parse` lalu `toLocal`. Bila null, helper langsung false. Bila ada, ia membuat **sampel DateTime.now lokal runtime/perangkat**, lalu membentuk cutoff:

| Bagian cutoff | Sumber |
|---|---|
| Tahun / bulan / tanggal | Tahun, bulan, tanggal dari sampel now pertama |
| Jam / menit / detik | Komponen lokal `jam_tutup` |
| Millisecond / microsecond | 0 / 0, default konstruktor |
| `isUtc` | false |

Tanggal asal `jam_tutup` dan pecahan detiknya tidak disalin ke cutoff. Helper memakai `DateTime.isAfter` melalui `b94318`: perbandingan payload microsecond **strict `>`**, sehingga tepat sama dengan cutoff bukan after. Array komponen yang dibaca terikat ke cache `6ae9b0`, perhitungan bagian `6aea34`, getter tanggal/tahun/bulan, konstruktor dan comparator yang diwarisi. Cabang native timezone pada `6aee34` tetap batas terpisah; audit tidak menutup database timezone, DST, normalisasi waktu tidak ada/ambigu, extreme years atau seluruh grammar DateTime.parse.

Temuan caller yang penting: `d8ac84` adalah getter **DateTime.day**, bukan seluruh tanggal. Setelah helper after-close true, `d8ac8c..d8aca0` mengambil **sampel now kedua**; `d8acf4` membandingkan hanya nomor hari. Bulan dan tahun tidak dibandingkan pada cabang pesan tutup ini.

Akibat literalnya, pilihan pada bulan/tahun lain yang mempunyai nomor hari sama dapat terkena pesan tutup-hari-ini, sedangkan nomor hari berbeda melewatinya. Dua sampel now juga bisa melewati tengah malam. Mengubahnya menjadi pemeriksaan same-calendar-date atau memakai satu sampel clock akan menjadi adaptasi yang harus disebutkan, bukan parity native.

Clock ini bukan clock server, bukan jam kantor yang dipilih, dan tidak dibuktikan memakai zona kantor pertanahan. Tidak ada sumber waktu server yang dibaca pada window ini. Audit tidak menetapkan akurasi perangkat ataupun penerimaan tanggal/jam oleh server.

## Model kuota dan pemetaan error

Parser `88cc48..88cd30` mengharuskan:

- `is_available`: **Boolean nonnull**, disimpan pada model `fzb+7`.
- `jumlah_antrian`: **integer nonnull**, divalidasi lalu dibuang. Tidak ada pemeriksaan positivity atau kalkulasi sisa kuota di parser ini.

Ini berbeda dari `nzb.is_available` GET yang berupa integer dan gate-nya nilai 1. Boolean true tidak boleh diganti integer/String `1`. Jumlah integer nol/negatif tetap lolos pemeriksaan tipe native; jumlah tersebut bukan batas jumlah berkas dan tidak dipertahankan sebagai output fzb. Integer wide perlu validasi signed64/lossless pada adapter browser nanti; angka JSON yang jatuh menjadi double tidak memenuhi model int.

Service memeriksa `message: String?` **sebelum** cabang `error == false`. Pada cabang false, `data` harus Map dan harus lolos parser fzb; sukses menghasilkan tuple `(false, fzb, message)`. Cabang error menghasilkan `(true, null, message)`. Ada penanganan exception tersendiri, tetapi **tidak ada pembandingan HTTP200 eksplisit di body service ini**. Ini tidak membuktikan bahwa transport menerima sembarang status: final-wire, Dio/interceptor, retry dan efek samping POST tetap terbuka.

Controller `d8bcc4` mempertahankan perbedaan berikut:

| Hasil layanan/model | Hasil controller |
|---|---|
| Service error atau model null | Error, pesan asli atau fallback `Terjadi Kesalahan` bila null |
| fzb tersedia false | Error, pesan asli atau fallback maksimum 4 appointment per hari/kantor bila null |
| fzb tersedia true | Bukan error, pesan asli atau fallback `Batas booking tersedia` bila null |
| Catch controller | Error dengan `Terjadi kesalahan` |

Hanya null yang memakai fallback; String kosong tetap kosong. Angka 4 pada fallback membicarakan jumlah appointment per kantor/hari, bukan batas dokumen. Pilihan jumlah berkas 1–5 yang sudah terpasang adalah kontrol lain. Respons yang malformed tidak menjadi eligibility atau quota-success sintetis.

## Proposal model murni, belum diimplementasikan

Bukti ini berguna untuk fixture offline yang sempit:

- Parser fixture kuota memvalidasi Boolean dan integer wajib, membuang jumlah, serta mempertahankan pesan nullable.
- Predicate estimasi menerima String nullable dan mengembalikan pesan asli bila mengandung `full` persis.
- Predicate waktu menerima komponen lokal yang sudah tervalidasi, sampel clock pertama/second-day terpisah, dan konstruktor cutoff yang diinjeksi. Batas timezone/parser native tetap eksplisit.
- Evaluator menguji urutan quota-error → full-message → closed-today → review; tidak memanggil API atau membuat booking.

Kasus penting adalah substring awal/tengah/akhir dan huruf besar; null/empty; tepat cutoff/+1 microsecond; tanggal/pecahan closing yang diabaikan; bulan/tahun lain dengan nomor hari sama; pergantian hari antara dua clock; Boolean versus integer/String; integer wajib yang dibuang; pesan null versus kosong; serta error/data malformed. Kasus ini dapat menjadi golden branch tests setelah parent menyetujui model, tanpa menambahkan runtime yang belum dipakai.

**Belum ada model atau gate runtime baru dari audit ini.** Preview lokal tetap quota-unverified. Sebelum kuota nyata, masih perlu kontrak POST wire/auth/error/efek samping dan identitas/office yang sah dari cache server sesi, serta context row/date/generation yang belum menjadi cache review server. Sebelum create juga perlu provenance token, DOB/full managed identity, kewenangan, idempotency/timeout-reconciliation, hasil/konfirmasi dan socket. Tidak ada arbitrary NIK, bearer pengganti, token buatan, booking nyata atau bypass presence.

## Reproduksi dan preservasi

```powershell
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_queue_preflight_followup.py
```

Verifier membaca ELF/pool, membandingkan setiap instruksi dan slice warisan, mengikat dispatch/public records/marker, dan memeriksa hash file terdahulu. Ia tidak menjalankan writer atau aplikasi. Output verification deterministik hanya dibuat bila belum ada; run berikutnya harus byte-identik.

Eksplorasi `.explore.asm.txt`, `flow.initial-draft.json`, dan `build_queue_preflight_followup_initial.py` tetap disimpan sebagai percobaan nonfinal. Draf awal mempunyai placeholder CID yang tidak diperlukan; ledger final menghapusnya dan tidak menebak CID fzb. Hanya ledger dan verifier final di atas menjadi kontrak audit. Seluruh runtime, katalog 176/84, korpus, laporan dan proof lama tetap utuh.
