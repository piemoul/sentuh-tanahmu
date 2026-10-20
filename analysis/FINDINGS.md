# Temuan statis Sentuh Tanahku 6.1.5

**Catatan fase:** dokumen ini menyimpan hasil ekstraksi dan audit format awal. Pemulihan AOT dan pemeriksaan builder HTTP dilakukan sesudahnya: lihat [audit kontrak terkini](request-contracts.md), [verifikasi byte ARM64](http-callsite-verification.json), dan [penelusuran koordinat geotag](recovered/geotag-coordinate-dataflow.json). Untuk percobaan APK asli pada emulator gunakan [laporan runtime](runtime/README.md). Pernyataan “belum dipulihkan/dijalankan” di bagian historis di bawah menggambarkan fase awal, bukan pengganti status pada laporan lanjutan.

Dokumen ini merekam inventaris dasar dari XAPK. Peta migrasi browser di bawah adalah hasil analisis kemungkinan implementasi, bukan klaim seluruh fitur telah diimplementasikan. Audit AOT lanjutan telah menelusuri 100 direct POST callsites dan 69 direct GET callsites; bukti metode, field, serializer, dan batasnya disimpan di `analysis/request-contracts.json` serta ledger `analysis/recovered/post-audit-reviewed-*.json` dan `get-audit-reviewed.json`. Kandidat string inventaris dasar tetap dibedakan dari konstruksi request yang benar-benar ditelusuri. Tidak ada akun atau API produksi digunakan untuk audit statis ini.

## Artefak dan reproduksibilitas

- Sumber: `Sentuh+Tanahku_6.1.5_APKPure.xapk`, paket `id.go.bpn.sentuh`, versionName `6.1.5`, versionCode `1037`, Android minimum 28, target/compile SDK 36.
- Seluruh 20 APK di dalam XAPK telah diekstrak. `extraction-manifest.json` mencatat path, panjang, dan SHA-256 setiap anggota; verifikasi independen melaporkan 21 arsip / 1.090 anggota cocok tanpa error.
- `scripts/analyze_artifact.py` membaca ELF, binary Android XML, Android resource tables, tabel string/type/class DEX, Flutter StandardMessageCodec, metadata raster, serta SVG. Dependensi dipin di `scripts/analysis-requirements.txt`.
- Jalankan dari akar proyek: `environment/python/Scripts/python.exe scripts/analyze_artifact.py`.
- Output dapat direproduksi di `analysis/recovered/`. Data opaque pada contoh sertipikat dan konfigurasi credential tidak dipindahkan ke fixture browser. String yang menyerupai Google API key, JWT, parameter credential, dan opaque payload panjang disamarkan pada output turunan; arsip asli tetap utuh.

## Arsitektur yang terkonfirmasi

`config.arm64_v8a/lib/arm64-v8a/libapp.so` adalah ELF64 little-endian `EM_AARCH64`, 14.943.120 byte, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Lima simbol dinamis yang tersisa adalah data/instruksi snapshot Dart VM dan isolate serta build ID. `.text` berukuran 10.622.864 byte; `.rodata` berukuran 4.232.080 byte. Feature string snapshot di offset file `0x354` dan `0x45d4` menyebut `product`, `no-code_comments`, `arm64 android compressed-pointers`.

Referensi `package:sentuh_tanahku/main.dart` tersisa di `0xea4f7`. Sumber Dart lengkap, `pubspec.yaml`, kernel debug, dan tabel simbol fungsi aplikasi tidak ditemukan pada aset yang diekstrak. JavaScript yang ada berasal dari paket PDFium/WebView, bukan bundle web aplikasi Sentuh Tanahku. Karena itu APK tidak bisa langsung dijalankan di browser hanya dengan mengganti ekstensi atau membungkus file Android.

`classes.dex` berisi 39.210 string, 6.719 deklarasi kelas, dan 40.785 method references. `classes2.dex` berisi 14 string, 1 kelas, dan 3 method references. Parsing DEX ini menginventarisasi deklarasi, bukan mendekompilasi method bodies ke source Java/Kotlin. `id.go.bpn.sentuh.MainActivity` dan `id.peruri.clarity.liveness.DigitrustLivenessActivity` terkonfirmasi di DEX dan manifest. Banyak nama kelas/metode telah disamarkan; body AOT belum didekompilasi menjadi kontrol alur sumber yang tervalidasi.

## Cakupan hasil pemulihan

| Hasil | Jumlah / lokasi |
| --- | --- |
| Binary AndroidManifest yang didekode | 20, `manifest-*.xml` |
| Android resource tables yang dibaca | 20, `resource-tables.json` dan `resources-*.xml` |
| String ASCII libapp dengan offset/section | 61.950, `aot-strings.redacted.jsonl` |
| Kandidat string aplikasi menurut kata kunci | 828, `application-strings.json` |
| Kandidat endpoint aplikasi | 148, `endpoint-candidates.json` |
| Kandidat route layar bernama | 11, `screen-route-candidates.json` |
| Aset Flutter fisik / logical keys | 196 / 157, `assets.json`, `asset-manifest.json` |
| Bukti kelompok fitur | 20, `feature-evidence-ledger.json` |
| Plugin native | 37, `native-plugin-boundaries.json` |
| SQL tabel lokal utuh | 4, `offline-schemas.sql`, `sqlite-schemas.json` |

String ASCII adalah kandidat, bukan AST atau daftar lengkap layar. Data zona waktu, string paket pihak ketiga, dan beberapa byte biner yang kebetulan printable ikut terinventarisasi. Daftar endpoint menunjukkan literal yang ada, bukan jaminan endpoint aktif, metode HTTP, request lengkap, akses publik, atau keterjangkauan saat ini. Peta fitur mengaitkan label dan endpoint berdasarkan maknanya; posisi menu dan urutan navigasi persis belum dibuktikan melalui runtime.

## Inventaris fitur dan bukti

Seluruh offset berikut adalah offset file `libapp.so`, bukan nomor baris atau alamat runtime. Ledger JSON menyimpan lebih banyak bukti per fitur.

| Kelompok | Bukti terpilih | Batas migrasi browser awal |
| --- | --- | --- |
| Navigasi | `Beranda` `0x48b7e`, `Berkasku` `0x4d851`, `Sertipikatku` `0x615e8`, `Aktivitas` `0x73b4d`, `Akun` `0x57c9c` | Navigasi lokal dapat direkonstruksi; layout asli belum diamati. |
| Sertipikat | `Sertipikat Elektronik` `0x48536`, `Sertipikat Analog` `0xf571b`, `Sertipikat Dibagikan` `0x10252f`, `Brankas/DetailSertipikatNew` `0x12ce09` | Skema dan contoh aman lokal; kepemilikan serta dokumen resmi tetap backend. |
| Berkas | `Cari Berkas` `0x61189`, `Perjalanan Berkas` `0x6e7d9`, `/berkas/CariBerkas` `0x1076da` | Pencarian/timeline fixture bisa lokal. |
| Info layanan | `Info Layanan` `0x10c8f6`, `Persyaratan` `0x132a5d`, `InfoLayanan/GetInfoLayanan` `0x10ceac` | Isi persyaratan lengkap bergantung layanan. |
| Simulasi biaya | `Simulasi Biaya` `0x11797a`, enam literal `InfoLayanan/SimulasiTipe1..6` | Formula tarif asli tidak berhasil dipulihkan; jangan menyebut kalkulator demo sebagai tarif resmi. |
| Antrian | `Antrian Daring` `0x717d5`, `Ambil Antrian` `0x1360e0`, `api/antrian` `0xf6495` | Tiket demo saja tanpa pemesanan resmi. |
| Pengumuman | `Pengumuman` `0xed7df`, `Pengumuman Yuridis` `0xeda81`, `Sertipikat Hilang` `0x45561` | Data contoh harus ditandai contoh; bukan pengumuman terkini. |
| Bidang/peta | `Lokasi Bidang Tanah` `0x1059b4`, `/apis/getGeoJsonInfo` `0x63999`, `legacy/GetParcelBoundaryById?persilid=` `0x10b4c1` | Sketsa koordinat lokal tidak sama dengan batas kadaster resmi. |
| Swaplotting | `Swaplotting Tanah Bersertipikat` `0x674b9`, `Swaplotting Tanah Belum Bersertipikat` `0x1210d2`, dua endpoint `Swaplotting*` | Pengiriman adalah operasi backend dan tidak dilakukan. |
| Offline/geotag | `Berkas Diunduh` `0x109e20`, SQL `geotag_drafts` `0x1032c8`, SQL `offline_berkas` `0x11d710` | Penyimpanan lokal bisa dimodelkan sesuai skema nyata. |
| Kantor/kalender | `kantornearby/getkantornearby` `0x601cc`, `KantorNearby/GetCalendar` `0x132dc0` | Favorit lokal; kalender/jarak resmi belum diambil. |
| Dokumen/scan | `apis/scanDocument` `0x44206`, `/apis/VerifyTTE` `0x11e406`, `apis/GetDocumentType` `0x11e431` | Pratinjau lokal berbeda dari verifikasi tanda tangan resmi. |
| Identitas | `auth/signin` `0x5e740`, `auth/signup` `0x600cb`, `account/account_summary` `0x1247c4` | Login demo tidak memberikan akun pemerintah. |
| IKD/liveness | `ikdv2/signinIKD` `0x11df21`, `PeruriLivenessSdk/VerificateUser` `0x106faa` | Memerlukan integrasi layanan resmi/native. |
| KKPR/akta/hak | `KKPR/GetKKPRList?nomorIdentitas=` `0x12cf2c`, `Akta/GetAktaList?nik=` `0x7c94f`, `legacy/GetSertipikatHT` `0x1222a8` | Data pengguna tidak ada di paket. |
| Mitra | `Mitra/GetPPATList?kantorId=` `0x1104a7`, `Mitra/GetSurveyorList?wilayahId=` `0x11e13b`, `Mitra/GetPenilaiList` `0xff882` | Direktori aktual tetap backend. |
| Survei | `Survei Nilai Tanah` `0xea5c7`, pertanian/nonpertanian, biaya bangunan, zonasi, jalan/fasilitas/risiko | Konstruksi request klien dipulihkan dalam audit lanjutan; aturan penilaian/validasi server tetap belum dibuktikan. |
| Koleksi/bagi pakai | `collection/GetUserCollection` `0xfcabe`, `legacy/BagiSertifikat` `0x5380b`, `berkas/BagikanBerkas` `0x49cf2` | Bookmark lokal tidak membagikan dokumen resmi. |
| Tanya/ulasan | `Tanya Berkas` `0xeeebe`, `TanyaJawab/SubmitPertanyaan` `0xecc64`, `berkas/postratingberkas` `0x12dc82` | Draft lokal; tidak ada pesan atau penilaian dikirim. |
| Aktivitas/notifikasi | `activity/GetUserActivity` `0x12816e`, `api/notifikasi` `0x5db5e`, `fcm/opt_in` `0x7a289` | Riwayat demo lokal; push produksi belum diintegrasikan. |

Route bernama terpilih mencakup `/FormPage`, `/VerificationMethodPage`, `/ScanPage`, `/LivenessPage`, `/KtpPreviewPage`, `/OTPPage`, `/ContractSurveyScreen`, `/SurveyNilaiTanahMainScreen`, `/FormSurveiLingkunganZonasi` dan dua alias survei. Tidak ada bukti bahwa ini seluruh router aplikasi.

## Logika yang benar-benar dapat dipulihkan

Empat pernyataan SQL dipotong persis dari byte `libapp.so`, kemudian dijalankan di SQLite in-memory. `PRAGMA table_info` memvalidasi nama/tipe/default/primary-key. Ledger menyimpan rentang offset dan SHA-256 tiap potongan. File SQL hanya menambah komentar sumber dan tanda `;`, tanpa data pengguna.

- `key_value_store`: `key TEXT PRIMARY KEY`, `value TEXT NOT NULL`, `is_file INTEGER NOT NULL DEFAULT 0`, `updated_at INTEGER NOT NULL`.
- `migration_status`: `key TEXT PRIMARY KEY`, `migrated INTEGER NOT NULL`, `migrated_at INTEGER NOT NULL`.
- `geotag_drafts`: ID, user/berkas/image path, `latitude TEXT`, `longitude TEXT`, timestamp, flag `is_offline_geotag` default 0. Koordinat disimpan sebagai TEXT, bukan REAL; importer tidak boleh mengubahnya diam-diam.
- `offline_berkas`: ID, user/berkas, detail JSON, status cetak, flag tanya/SPS/geotag/shared/PPAT, optional JSON geotag, timestamp.

Pesan validasi membuktikan aturan UI yang dimaksud: latitude −90..90 (`0x4b64f`), longitude −180..180 (`0xf288e`), format `latitude,longitude` (`0x1245c0`), NIK 16 digit (`0x1031b8`), password minimal 12 karakter dengan kombinasi kelas karakter (`0x104628`), maksimum 4 antrian/hari/kantor (`0xffe28`), maksimum 5 foto (`0xfaa69`), minimum 1 bidang tanah (`0x112ec7`). Pesan bukan bukti enforcement lengkap, konteks semua formulir, atau nilai kebijakan server saat ini.

Formula simulasi tarif, transformasi geodesi, pemeriksaan kepemilikan, perhitungan harga tanah, dan alur kriptografi tidak dinyatakan berhasil dipulihkan. Adanya label angka/luas/biaya tidak cukup untuk menyimpulkan rumus. Enam endpoint simulasi merupakan bukti kuat adanya batas layanan, tetapi belum ada analisis call graph untuk membuktikan seluruh kalkulasi dikerjakan server.

## Aset dan identitas visual

Roboto regular dan bold 700 berasal dari `FontManifest.json`, bersama Material Icons. `AssetManifest.bin` didekode sebagai Flutter StandardMessageCodec dan seluruh byte habis terparse. Berkas `NativeAssetsManifest.json` memiliki native-assets kosong.

Aset asli menyediakan logo, ikon, state kosong, Lottie, serta varian 2x/3x dan dark. Contoh reusable: `assets/images/revamp/svg/logo_main_page.svg`, `ic_info_layanan.svg`, `ic_cari_berkas.svg`, `ic_menu_antrian.svg`, `ic_pengumuman.svg`, `ic_sertifikat_hilang.svg`, `ic_swaploting.svg`; juga `assets/images/icons/svg/sertipikatku.svg`, `berkasku.svg`, `akta.svg`, `kkpr.svg`, `location.svg` dan `survey.svg`. Ukuran/hash tiap aset dicatat, bukan diperkirakan.

Frekuensi literal warna SVG terbanyak: `#263238` 200, `#C60000` 193, `#EBEBEB` 83, `#FFC3BD` 48. Ini hitungan ilustrasi SVG termasuk varian yang berulang, bukan rekonstruksi pasti ThemeData Flutter.

`assets/json/sertipikat.json` adalah contoh sertipikat pemerintah, jenis Hak Pakai, luas 544, wilayah Denpasar/Bali, dengan empat catatan. Skema memuat jenis hak, lokasi, tanggal penerbitan/akhir hak, pemilik, luas, nomor keputusan, daftar catatan, serta ID/encrypted ID. Hanya schema/summary aman dipublikasikan di `certificate-schema.json`; contoh tersebut tidak dianggap sebagai data akun aktif atau dipakai untuk akses dokumen.

## Batas jaringan dan native

Literal host yang ditemukan meliputi Sentuh produksi dan pengembangan, layanan antrian, Sipenta, notifikasi, BHUMI, bantuan, JDIH/PPID, IKD dan Peruri. Keberadaan dua lingkungan tidak membuktikan environment mana dipilih pada setiap jalur. Tidak satu pun host dipanggil untuk analisis ini. API key/configuration, credential, dan nilai identitas tidak dibutuhkan untuk merekonstruksi tampilan lokal.

37 plugin native mencakup kamera/ImagePicker, geolocator/location/geocoding, Google Maps, permission handling, secure storage, local authentication, QR scanner, SQLite, native EXIF, notifications/FCM, Firebase, in-app WebView, TTS, share/file picker, serta root_checker_plus. Daftar memakai pesan GeneratedPluginRegistrant dengan offset DEX; keberadaan plugin tidak membuktikan semuanya aktif pada setiap layar. Browser memiliki padanan untuk sebagian input/file/geolocation/persistence, tetapi tidak menyediakan APK services, trust perangkat, IKD/liveness native, atau akses otomatis ke data resmi.

## Hal yang belum dibuktikan

Inventaris dasar ini tidak memuat rekaman runtime atau perbandingan visual aplikasi. Audit lanjutannya menggunakan object pool Dart dan disassembly ARM64 untuk menelusuri konstruksi request; ini bukan pemulihan sumber Dart lengkap. Ledger request kini membuktikan metode/argumen pada 169 direct callsites yang dikenal, dengan batas tersisa pada dispatch dinamis, header/interceptor, base URL runtime tertentu, tipe opaque, nested data dinamis, response contracts, dan seluruh validasi server. Tidak dilakukan pengujian credential/endpoint, pengambilan data akun, atau perubahan aplikasi pemerintah dalam audit tersebut. Ukuran/layout persis, routing penuh, validitas layanan terkini, dan hasil hukum/administratif tidak disimpulkan dari string statis.

GET `berkas` di alamat `0xd70234` secara eksplisit mengirim `{nik}` melalui named `data`, berbeda dari map query `Ikc`. Ini dicatat terpisah agar migrasi browser tidak tanpa sengaja memindahkan body menjadi query. Koordinat nearby/logging bertipe double, sementara field geotag/survei memiliki konstruksi sendiri; metadata akurasi, datum/epoch, dan provenance GNSS eksternal tidak boleh direka sebagai field API asli. Rincian field ukur tersimpan di `analysis/REQUEST-FIELD-REVIEW.md`.

Analisis lanjutan Route Spoofer dan implikasinya untuk GPS asli disimpan terpisah di `analysis/route-spoofer/`, sehingga bukti APK kedua tidak tercampur dengan Sentuh Tanahku.
