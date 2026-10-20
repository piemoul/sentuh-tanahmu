# Kantor Pertanahan dan Kalender Kantor — bukti layanan native

Audit statis ini memakai `libapp.so` APK 6.1.5 dengan SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Tidak ada panggilan produksi atau kredensial akun yang dibaca. `analysis/recovered/office-services/flow.json` mengikat rentang instruksi, pool, dispatch, dan dependensi. UI, pilihan kantor, tahun, dan tampilan kalender dimiliki audit `office-ui` terpisah.

## Kontrak permintaan

| Fungsi | Rantai | Permintaan | Nilai |
| --- | --- | --- | --- |
| Kantor sekitar | `d215c4 → d2188c → d21a34` | POST `kantornearby/getkantornearby`, JSON String | `latitude` dan `longitude` angka dari posisi; `radius: 0.1`, `isKalender: 1`, `limit: null` pada pemanggil yang ditelusuri |
| Kalender kantor | `d210d4 → d211ac → d2127c` | POST `KantorNearby/GetCalendar`, form URL encoded | `kantorId` String setelah dekripsi `760034`; `tahun` String dari pemanggil UI |

Constructor `700b68` mengambil dependency FRb, menyimpan FRb pada service ODb+7, lalu service pada JDb+7. Kedua layanan memakai FRb+7, yaitu klien utama. Tidak ada guard sesi atau header autentikasi khusus di kedua pembangun permintaan. LRb memakai sesi tersimpan bila ada dan meneruskan permintaan bila token tidak tersedia. Ini mendukung adapter `optionalSession` pada tingkat klien; penerimaan anonim server tidak dibuktikan oleh audit statis.

Pencarian kantor menyandikan `Map<String,num?>` menjadi JSON String. Interceptor kP dipasang pertama oleh `6b8194`; handler `bcc750` memilih `application/json` untuk body String ketika content-type belum ada (`bcc8e8..bcc8f8`). LRb dipasang sesudahnya dan mempertahankan content-type untuk String. Kalender menyetel form URL encoded secara eksplisit; jalur Map LRb memilih tipe yang sama. Audit ini tidak mengulang seluruh penulisan socket atau jalur retry.

## Respons dan model

Kedua helper menerima `response.data` sebagai `Map<String,dynamic>`. Tidak ada pembandingan HTTP 200 atau JSON decode untuk body String di dalam helper yang ditahan. Kebijakan HTTP klien bersama tetap berlaku.

Envelope `744e44` membaca `error: bool?`, `message: String?`, serta `totalRecords`, `resultsCount`, `pageSize`, `pageNumber` sebagai `int?`. Callback `data` dijalankan sebelum memeriksa `error`. Data null menghasilkan daftar kosong; data nonnull diiterasi, dan setiap elemen dicast menjadi `Map<String,dynamic>`. `error == false` mengembalikan daftar, `error == true` mengembalikan daftar kosong, dan `error == null` memicu null assertion. Data yang salah tipe dapat gagal meskipun error true.

| Model | Field | Tipe native |
| --- | --- | --- |
| NDb (kantor sekitar) | `kantorId`, `namaKantor`, `alamat` | String wajib, tanpa fallback |
| NDb | `latitude`, `longitude`, `jarak` | num wajib, tanpa konversi String |
| NDb | `statusAntrian`, `statusPeralihanEl`, `statusKiosk` | int wajib |
| FDb (kalender) | `tanggal`, `keterangan`, `tipe`, `tipeLiburId` | String nullable |

Model kalender tidak memparse tanggal. Pengelompokan, tanggal aktif, serta warna/item kalender merupakan tanggung jawab UI. Postprocess `745cb8` membuat marker dari koordinat kantor dan menerbitkannya ke JDb+1f; daftar NDb asal tidak diubah dan tidak ditambah sentinel kantorId null. Controller juga menerbitkan kantor ke +2b serta cache global2f18. Alur ini menunjukkan maksud pencarian/pembacaan; perilaku telemetry atau mutasi internal server tidak teramati.

Pada kegagalan, service menerjemahkan exception `sa` menjadi pesan umum; lainnya dilempar kembali. Kalender memiliki penanganan khusus WO CID3758 menjadi daftar kosong. Controller membersihkan busy dan mempertahankan daftar lama bila exception tertangkap. Kalender mengembalikan daftar kosong dari catch tanpa secara eksplisit mengganti subject lama.

## ID kantor untuk kalender

Helper `760034` membuka ID terenkripsi yang diterima dari daftar kantor. Alurnya: Base64 decode (`b22d98 → b2884c`), AES-128-CBC dengan PKCS7 (`6d0ea0`), lalu UTF-8 decode dengan replacement (`6d0c8c → b2aa78`). Parameter arah false pada `6d0d8c` diteruskan ke Fvb CID916, init `c903c0` dan process `c9da88`. Factory menyusun `AES/CBC/PKCS7`; key dan IV berasal dari dua String pool terpisah, masing-masing 16 byte ASCII. Nilainya tidak disalin ke ledger, laporan, atau frontend.

ID yang dikirim ke GetCalendar adalah hasil dekripsi. Ini bukan checksum, attestation, atau enkripsi ulang ID. Tidak ada salt, IV acak, atau fallback ke input semula dalam helper; input Base64 atau padding salah dapat melempar sebelum request kalender.

Implementasi privat `webapp/private/calendar-reference.mjs` dan tambahan lazy `config.calendarOfficeId` di `configuration.mjs` mengikuti alur tersebut. Adapter memiliki batas lokal tambahan: Base64 standar yang canonical dan padded, maksimum 16000 karakter, ciphertext tidak kosong dan kelipatan 16 byte. Batas ini tidak diklaim berasal dari validasi UI native. Semua kesalahan input menjadi kode umum `INVALID_CALENDAR_OFFICE_REFERENCE`; material cipher dan nilai input tidak dikembalikan bersama kesalahan. Sumber konfigurasi/hash, origin, TLS, dan perilaku autentikasi tetap memakai konfigurasi yang sudah ada.

## Verifikasi

Jalankan `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_office_services.py`. Hasil saat dibekukan: 35 hash sumber, 3926 kemunculan instruksi (3882 unik), 212 marker, 212 referensi pool, 12 blok konstanta, 4 dispatch, 9 dependensi; dua panjang literal diverifikasi tanpa mencetak nilainya.

Pengujian lokal `office-configuration.test.mjs` dan `tls-configuration.test.mjs`: 10 lulus. Cakupan mencakup vektor sintetis tetap, UTF-8/teks kosong, padding/input salah, pembatasan panjang, kepemilikan salinan key/IV, binding konfigurasi artefak dengan ID sintetis, dan privasi/isolasi origin TLS. Tidak ada request jaringan dari pengujian ini. Hasil tersebut tidak menggantikan pengujian native runtime atau penerimaan kalender live.

Primitive AES lengkap, izin/provider lokasi Android, kebijakan server, dan seluruh retry/serialisasi socket berada di luar audit bounded ini. Tidak ada perubahan spoofing GPS, geotag, atau syarat kunjungan.
