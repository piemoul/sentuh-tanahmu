# Batas implementasi lanjutan booking Antrian

**Langkah normal berikutnya adalah memilih jumlah berkas dan loket lalu meninjau booking, tetapi dua POST belum siap diaktifkan.** Preread saat ini sudah membaca kantor, lokasi, kalender, tanggal dan loket; tombol Ambil Antrian masih disabled. Dokumen ini memisahkan bukti native, implementasi browser dan pertanyaan yang belum tertutup. Ia tidak memesan appointment atau menguji akun/server.

[JSON boundary](webapp/queue-booking-implementation-boundary.json) mengikat75 file runtime saat ini dan bukti sebelumnya. Audit memakai REA serta ELF/pool6.1.5 yang sama, lalu menambahkan [ledger completion](recovered/queue-booking-completion-followup/flow.json):6 potongan,4.195 instruksi unique,218 anotasi pool dan66 marker;20 dependency lama utuh. [Verifier offline](rea/verify_queue_booking_completion_followup.py) PASS. Tidak ada pengujian aplikasi, jaringan, akun, OTP, booking, socket atau perubahan runtime.

| Tahap | Native yang kini dibuktikan | Status webapp |
|---|---|---|
| Jumlah berkas | Default1; lima pilihan1–5, disimpan di _Lzb+27. | Belum ada pilihan jumlah. Angka4 dalam pesan quota adalah appointment per hari/kantor, bukan batas berkas. |
| Pilih loket | Row harus is_available integer1 dan local busyfalse; closure d8aa78. | Semua tombol Ambil Antrian masih disabled; belum menyimpan selected loket/review. |
| Preflight | Click menunggu quota POST, memeriksa String estimate dengan literal full dan helper jam tutup, baru membuka review. | Belum diimplementasikan; bukan pembacaan availability GET baru. |
| Review | Loket terpilih, jumlah berkas, jumlah_antrian, estimasi_message dan peringatan panggilan; Batal dan Ambil Antrian terpisah. | Aman dibuat sebagai preview lokal yang jujur menyatakan quota belum diperiksa. Final action tetap disabled. |
| Final booking | Token resolver→DTO JSON→create POST; sukses mempublikasikan hasil dan memulai refresh list. | Tidak aktif. Token provider, POST retry/idempotency, converter dan layar hasil belum lengkap. |

Rantai native utama: **889a88→d8aa78→d8bcc4→d8bee8 (quota)→88ca38 (closing check)→d8ae90→88ac64 (review)→d8b058 (final click)→d8b390→d8b5a8 (create)**. Tidak ditemukan pemanggilan langsung GET api/antrian dalam window click/review/confirm ini. Data row tetap hasil yang ditangkap; socket bukan jaminan freshness yang telah dibuktikan. Pemeriksaan ulang GET pada implementasi browser nanti harus disebut sebagai adaptasi dan tetap tidak menghilangkan race server.

## ID, client dan dua POST

| Kontrak | Sumber tepat |
|---|---|
| POST api/booking/limit/ | JSON nik dari qzb terpilih; kantorid dari **jyb.id antrean**; tanggal_booking dari tanggal terpilih berformat yyyy-MM-dd saat row dibangun. |
| POST api/booking/ | JSON loket dari **nzb.id yang benar-benar dikembalikan**; tanggal_booking diformat kembali saat final click; sumber literal sentuh; jumlah_berkas integer pilihan1–5; pemohon berisi nik/nama/tempat_lahir/tanggal_lahir/token/no_hp. |
| Calendar yang sudah ada | Main POST KantorNearby/GetCalendar memakai **jyb.kantor_id canonical** secara langsung. Ini ID berbeda; tidak memakai decoder Kantor Terdekat. |

Kedua booking POST memakai wrapper→**FRb+0xb Directus**, initial base https://aplikasi.atrbpn.go.id/konsol/antrian/directus/, path berakhiran slash dan options application/json. Konstruksi application bearer diwarisi dari ledger transport; nilai tidak diambil/ditampilkan. Jangan mengirim main account bearer ke sana. FRb+7 hanya konteks kalender yang sudah ada; FRb+0xf dengan base antre.atrbpn.go.id/be/api/ bukan client dua POST ini. Registry tetap176/84: post-api-booking-limit-d8bf80 dan post-api-booking-d8b640 disabled. Placeholder auth:none pada record disabled bukan bukti bahwa upstream anonim.

Token pada body pemohon berasal dari d8bbfc, yang memanggil d34fc8 lalu fallback6bc010 dan akhirnya String dash bila null. **Provider/provenance dan otorisasinya belum tertutup; jangan menggantinya dengan bearer akun, token buatan atau identitas input bebas.** DOB melewati d8ba70 dengan pola literal dd/MM/yyyy, dd-MM-yyyy dan yyyy-MM-dd; parser lengkap/leniency masih gap. Identitas harus tetap berasal dari cabang qzb yang sah; subset browser saat ini hanya profil sendiri yang sudah dikenali.

## Response dan validasi yang berbeda

Quota membaca message String nullable, lalu ordinary decoded JSON error==false dan Map data. Model fzb mengharuskan **is_available Boolean** dan **jumlah_antrian integer**; hanya Boolean disimpan, jumlah integer divalidasi lalu dibuang. Ini berbeda dari GET availability yang memakai is_available integer1. Controller membedakan quota available vs quota penuh, dengan fallback pesan maksimal4 appointment per hari di tiap kantor. Jangan hardcode pesan itu sebagai bukti eligibility atau mengubah tipe respons.

Create membaca ordinary JSON error==false lalu Map data melalui parser izb88bb58. Hasil hanya mempertahankan **id, nomor, nama**, String null menjadi kosong. Parser tetap memvalidasi/mengonversi lalu membuang jumlah_berkas, booking/kode, tanggal_booking, lokasi, kantor dan pemohon beserta DOB/token. Jangan memakai decoder detail bzb begitu saja, mengekspos nested pemohon, atau menganggap field yang dibuang sebagai data konfirmasi. Shared date/booking-code converters belum seluruhnya tertutup. Body service tidak mempunyai perbandingan HTTP200 tersendiri; status/MIME/interceptor/retry POST memerlukan bukti final-wire terpisah.

Pada sukses controller mempublikasikan record, memulai refresh list tanpa await dan mengembalikan false-error/id. Callback menutup/mengganti navigasi dan memanggil builder88c9b0→d88380 dengan hasil. Layout/lifecycle lengkap layar hasil belum dibuktikan. Tidak ada bukti bahwa timeout berarti booking gagal atau aman diulang. **Jangan menyalin retry GET ke create POST; idempotency dan rekonsiliasi hasil tidak diketahui.**

## Pekerjaan berikutnya yang terbatas

1. Implementasi lokal jumlah1–5, selected loket dan preview review. Ikat pada session, kantor/lokasi/tanggal dan generation availability; ganti pilihan/refresh harus mencabut review. Tetap tampilkan quota belum diverifikasi dan nonaktifkan final booking.
2. Tutup gap String full/closing-time, POST transport dan parser quota dengan fixture sintetis. Quota POST belum dijalankan dan kemungkinan side effect tidak diasumsikan nol. Backend harus mengambil NIK/office dari data server sesi, bukan input browser bebas.
3. Sebelum final booking, tutup token provider, DOB/response converter, layar hasil, kewenangan server dan timeout/idempotency. Tambahkan konfirmasi eksplisit yang terikat review server; jangan mencetak kode booking sukses optimistis.

Server saat ini menyimpan cache kantor/lokasi, belum cache row availability/review. Adapter booking berikutnya perlu membuktikan bahwa loket berasal dari response lokasi/tanggal sesi sekarang; nama loket atau arbitrary ID tidak cukup. Canonical kantor_id tidak boleh menggantikan queueoffice id pada quota. Pemeriksaan UI lokal bukan otorisasi server.

Socket tetap batas terpisah: initd1fc68 menerima lokasi, memakai **TRb.IYi**, transport websocket, header bernama Cookie dan roomMessage callbackd20b14. Origin aktual, nilai/provenance Cookie, join/payload/room filter, update dan disconnect/disposal belum tertutup. Jangan menyamakan origin/auth socket dengan Directus atau meneruskan cookie browser/main bearer. Tidak ada perluasan socket/crypto pada audit ini.

75 hash runtime tetap identik selama penulisan;38 ledger native baseline,442 receipt historis,11 dokumen baseline dan korpus170 request tetap utuh. Bukti baru ini tidak mengaktifkan write, membuat identitas, memesan antrean nyata, memalsukan kunjungan, atau menyatakan semua fungsi1:1/E2E selesai.
