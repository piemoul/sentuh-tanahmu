# Antrian: Map ke JSON UTF-8 dan converter hasil create

Audit REA offline ini menutup transformasi body dua POST booking pada APK6.1.5. **Kuota dan review dapat diteruskan; full create tidak diaktifkan.** Tidak ada request, provider, eksekusi APK, perubahan runtime/katalog atau booking nyata. Laporan/receipt sebelumnya tetap utuh.

[Ledger](recovered/queue-booking-wire-followup/flow.json) mengikat **8 window wire /792 instruksi**, ditambah **1 helper converter /49 instruksi**,15 sumber assembly warisan dan8 dependency. [Verifier](rea/verify_queue_booking_wire_followup.py) membandingkan byte ELF, seluruh instruksi baru, anotasi pool, marker dan hash sumber. [Receipt](recovered/queue-booking-wire-followup/verification.json) adalah hasil verifikasi statis, bukan E2E server.

## Transformasi yang kini tertutup

Kedua callsite memberikan Map hasil serializer dan options `application/json`: quota `d8bf40→88ab94`, create `d8ba1c→88c77c`, lalu `6b9270` menetapkan POST. Composer `d00690→6fe4d8` mempertahankan body ke request `+57`. Dispatcher `d052f4` menunggu `d0c910` sebelum adapter.

Body non-FormData menuju `d0cad0→d0d274→6fb39c`. Untuk body bukan String dan MIME JSON, `6fb468→d064f4` lolos ke `6fb480→6b27e0→b371fc→b294c8`: **Map menjadi String JSON**. Cabang URL-form `6fb5d0` dan generic `.toString` `6fb68c` tidak dipakai oleh kedua Map JSON ini. Tidak ada penambahan field checksum atau signature dalam jalur yang dipin; ini bukan klaim seluruh server tidak memerlukannya.

Sesudah await, `d0caec→b2a318` mengubah String menjadi **byte UTF-8**. `d0caf4` membaca panjang byte; `d0cb18..44` memasangnya sebagai `content-length`, kemudian `d0ccdc` membentuk stream request. Worker surrogate yang dipin menulis `EF BF BD`. Seluruh escaping JSON, writer Map internal, malformed Unicode dan representasi angka di luar DTO ini tidak disertifikasi menyeluruh.

Options caller memberi `Content-Type: application/json`. Composer memasukkannya ke headers; `kP` melihat nilai nonnull pada `bcc7fc` dan meneruskan request. Tidak ada `Accept` eksplisit pada kedua caller/options/composer yang dipin. Authorization application queue dan `User-Agent: Dart/Flutter` diwarisi dari audit Directus; nilainya tidak diambil. Ini bukan inventaris semua header otomatis Dart HTTP.

Shared transport menerima **200≤status<300**. Booking service tidak menambah gate HTTP200 atau JSON decode kedua. **POST redirect tetap terbuka**: method/status/header/downgrade pada redirect tidak tertutup oleh bukti ini. Menolak redirect dan tidak mengulang create otomatis merupakan adaptasi browser, bukan native parity.

## Perbaikan ketepatan envelope dan error kuota

Instruksi quota `d8c020..044` dan create `d8b680..6a4` membandingkan `error` secara dynamic dengan literal `false`; tidak tampak assert Boolean seperti pada RatingPPAT. Pada JSON biasa hanya literal false sukses; null/missing/true/String/angka bukan sukses. Ini memperjelas prose lama “nullable bool”; tidak membuktikan nonbool melempar type error.

Quota membaca `message:String?` sebelum cabang error. Catch WO CID3758 membaca `response.data['message']` secara dynamic lalu tetap mensyaratkan String nullable (`d8c180..1a8`); String kosong dipertahankan. Null memakai exception.message `+1b`. Tidak ada `.toString` pada message kuota. Non-WO menghasilkan error/null/null; malformed message saat catch dapat keluar ke catch controller. Controller memakai fallback null-only `Terjadi Kesalahan`, sedangkan catch controller `Terjadi kesalahan`.

## Converter create yang kini dipersempit

Seluruh parser `88bb58..88c77c` sudah berada pada sumber completion yang diwarisi. Record hasil hanya menyimpan **id,nomor,nama** (nullable String→kosong). Field lain tetap dievaluasi lalu dibuang: jumlah_berkas nullable int→0; kode nullable String→kosong; lokasi Map dengan id/nama/alamat; kantor Map dengan id/nama; pemohon Map dengan nik/nama/tempat_lahir/token dan tanggal_lahir. `no_hp` tidak dibaca pada parser response ini. Nested null memakai objek default, nonnull tetap memerlukan Map.

`booking` nullable List dipetakan dan dimaterialisasi. Callback `88c6d4` membaca dynamic `['kode']`; nilai nonnull dipanggil `.toString`, null→String kosong. Jadi kode tiap item bukan cast String ketat. Perilaku arbitrary non-Map entry atau custom-object `.toString` tidak ditutup.

Tanggal response `tanggal_booking` dan `pemohon.tanggal_lahir` nullable String→kosong lalu memanggil helper kecil **d20ebc..d20f80**, kini dipertahankan. Helper memanggil **6beed4** (DateTime.parse); catch CID **331,332,1101,4239,4240,7569** menghasilkan null, error lain dilempar ulang. Caller null membuat waktu lokal now, lalu membuang hasilnya. Ini berbeda dari tiga parser strict DOB **outbound** yang sudah dibuktikan sebelumnya. Seluruh grammar DateTime.parse, zona/DST dan normalisasi tetap belum disertifikasi.

## Batas implementasi

Langkah konkret berikutnya adalah quota→full/closing→review dengan identitas, queue-office.id, row availability dan generation milik sesi backend. Header/body, quota parser dan gate native cukup untuk fixture sintetis; tidak diperlukan FCM untuk tahap ini.

Create masih memerlukan dependency **FCM yang sah**, full applicant snapshot, review/pending/outcome ownership dan rekonsiliasi timeout. Hanya hasil provider null yang native ubah menjadi `"-"`; unsupported/error browser belum terbukti null. Socket tidak dipanggil/ditunggu dalam chain booking yang dipin, sehingga bukan prerequisite yang terbukti; realtime parity tetap belum tertutup. Current upstream acceptance, POST redirect dan booking nyata tidak diuji.

Reproduksi lokal: `tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_queue_booking_wire_followup.py`. ELF/pool tetap `bbc7f3bd…a683` /`87148785…2e04`. Satu kegagalan awal builder pada alamat marker `.toString` dipertahankan sebagai preimage/failure tersendiri; bukti UI/produk tidak diubah untuk meloloskan pemeriksaan.
