# Audit independen cakupan request dan kesetaraan browser

**Pembaruan cakupan:** ini review fase awal sebelum audit seluruh callsite HTTP selesai. [Audit kontrak lanjutan](request-contracts.md) kini menjadi rujukan endpoint, method, dan field yang ditelusuri. [Verifikasi independen ARM64](http-callsite-verification.json) mengonfirmasi 100 POST dan 69 GET langsung ke tiga wrapper yang dikenali. Runtime dicatat dalam [laporan pengujian APK](runtime/README.md). Batas kesetaraan browser di bawah tetap perlu dibuktikan; jumlah string kandidat 148 bukan denominator audit terbaru.

Objek: Sentuh Tanahku 6.1.5, paket `id.go.bpn.sentuh`, artefak XAPK lokal. Audit ini bersifat baca-saja terhadap APK, hasil ekstraksi, dan hasil Blutter; tidak ada permintaan ke backend BPN, login, unggah dokumen, atau perubahan APK. Tanggal laporan mengikuti sesi pengguna: 17 Oktober 2026, America/Los_Angeles.

## Kesimpulan

**Bukti saat ini belum cukup untuk menyatakan seluruh parameter pengajuan telah dipulihkan atau seluruh fungsi APK dapat digantikan webapp.** Bukti kuat tersedia untuk nama fitur, sejumlah rute, struktur penyimpanan lokal, fixture sertipikat, dan batas native. Rangkaian lengkap `form → validasi → serializer → request → hasil server` belum terbukti untuk setiap fungsi.

Inventaris berisi **148 kandidat endpoint**, bukan 148 kontrak API lengkap dan bukan bukti bahwa semua endpoint telah ditemukan. Dump Blutter baru mencakup **2.276 file assembly** dengan nama keluaran yang dibedakan agar tidak saling menimpa di Windows. Keberhasilan dump ini tidak mengembalikan sumber Dart, nama model lengkap, atau seluruh kontrak server. Banyak pemanggilan tetap berupa alamat dan `__unknown_function__`.

Sasaran aktif yang diaudit adalah **penggantian penuh dengan webapp yang memakai lokasi nyata saat pengiriman**. Tidak ada implementasi pengiriman, pemalsuan lokasi, atau pengelakan pemeriksaan perangkat dalam pekerjaan ini. Temuan web-ke-APK disimpan sebagai catatan arsitektur alternatif di bagian akhir.

## Sumber yang diperiksa

| Sumber lokal | Bukti yang dapat dipakai | Batas bukti |
|---|---|---|
| `recovered/manifest-id.go.bpn.sentuh.xml` | Izin Android, aktivitas, layanan, intent filter | Izin/deklarasi tidak membuktikan setiap fitur selalu memakainya |
| `recovered/native-plugin-boundaries.json` | 37 plugin terdaftar beserta offset DEX | Kehadiran plugin tidak membuktikan pemanggilan pada alur tertentu |
| `recovered/endpoint-candidates.json` | 148 string mirip endpoint, dengan offset `.rodata` | Belum membuktikan method, host efektif, body, header, requiredness, atau akses akun |
| `recovered/application-strings.json`, `validation-evidence.json` | Label aplikasi dan pesan validasi | Pesan bukan kode validasi lengkap; cakupan formulir belum pasti |
| `recovered/sqlite-schemas.json`, `offline-schemas.sql` | Empat skema SQL lokal yang tervalidasi | Kolom database bukan otomatis field request HTTP |
| `recovered/certificate-schema.json` | 14 field fixture sertipikat, empat field catatan | Fixture satu dokumen bukan schema seluruh respons backend |
| `recovered/feature-evidence-ledger.json` | 20 kelompok fitur dan batas implementasi | Ledger fitur bukan bukti kesetaraan runtime |
| `recovered/blutter-unique/asm`, `pp.txt`, `objs.txt` | Assembly, object pool, sebagian metadata tipe dan closure | Obfuscation/AOT serta pemanggilan tak bernama masih menghalangi pemetaan lengkap |
| `recovered/blutter-build-unique.log` | Dart 3.12.2, Android arm64, snapshot `ace654289f5abc240509fc941453ebc5`, dump selesai | Dump berhasil bukan dekompilasi Dart yang setara dan dapat dibangun |

Gunakan `blutter-unique`, bukan dump `blutter/asm` lama yang mengalami benturan nama file pada Windows. Nomor offset `.rodata`, alamat instruksi, offset pool `pp+`, dan nomor baris keluaran adalah ruang referensi yang berbeda; jangan dipertukarkan.

## Aturan untuk menyatakan cakupan parameter

Sebuah string nama field hanya menjadi **kandidat** sampai ada bukti bahwa nilainya ditempatkan dalam query, header, JSON, form, atau multipart pada callsite yang tepat. Kedekatan di object pool tidak cukup. Contoh: `auth/signin`, `devicePlatform`, dan `password` tampak berdekatan pada `pp.txt` baris 31236–31238; ini belum membuktikan daftar field login lengkap, tipe nilainya, atau cara serialisasi.

Untuk setiap operasi, audit kontrak minimal harus memisahkan:

1. Endpoint dan host/version efektif, method HTTP, serta kondisi pemilihan endpoint.
2. Semua field path/query/header/body: nama persis, tipe, bentuk bersarang, sumber nilai, aturan omit/null, nilai default, dan requiredness kondisional.
3. Lampiran: nama multipart, jenis MIME, format/kompresi, batas ukuran/jumlah, metadata, serta hubungan file dengan identitas berkas.
4. Autentikasi: cara memperoleh sesi sah, masa berlaku, refresh, logout, sesi perangkat lain, dan hak akses per akun.
5. Ketergantungan state: ID keluaran langkah sebelumnya, OTP/transaksi, prasyarat verifikasi, status dokumen, dan hubungan antarentitas.
6. Validasi klien dan server; format tanggal, zona waktu, satuan, koordinat, pembulatan, enum, serta aturan bisnis.
7. Hasil: status HTTP, schema respons, identitas transaksi, keadaan pending/selesai, error, retry, deduplikasi, dan pemulihan saat jaringan terputus.

**Tidak ada operasi yang disertifikasi lengkap oleh audit independen ini.** Ini menyatakan batas pemeriksaan yang dilakukan, bukan klaim bahwa seluruh metadata tidak mungkin dipulihkan melalui analisis lanjutan.

### Empat hal yang tidak boleh tertukar

- `geotag_drafts` memiliki `id`, `user_id`, `berkas_id`, `image_path`, `latitude`, `longitude`, `created_at`, dan `is_offline_geotag`. Itu adalah skema penyimpanan lokal; `image_path` misalnya tidak membuktikan server menerima path filesystem sebagai lampiran.
- `offline_berkas` menyimpan `file_detail_json` dan sejumlah flag tampilan. Ini bukan bukti flag tersebut harus dikirim ulang ke server.
- `sertipikat.json` adalah contoh data paket. Pengenal opaque/encrypted, nomor dokumen, dan informasi pegawai tidak diperlukan untuk membuktikan nama field dan tidak disalin ke laporan ini.
- String error seperti batas lintang/bujur atau maksimum foto membuktikan pesan tersebut tersedia, bukan endpoint mana yang menerapkan batas itu atau apakah server mempunyai aturan tambahan.

## Matriks kesetaraan fungsi

| Kelompok fungsi | Bukti statis | Yang belum terbukti untuk penggantian browser |
|---|---|---|
| Akun, login, OTP, refresh | `auth/signin` (`0x5e740`), `auth/refresh_token` (`0x79379`), aktivasi/reset, plugin secure storage | Request/response lengkap; token/session lifecycle; pendaftaran klien web; cookie/CORS; pemetaan sesi dan identitas perangkat |
| Identitas, IKD, liveness | `PeruriLivenessSdk/*`, `ikdv2/*`; aktivitas `id.peruri.clarity.liveness.DigitrustLivenessActivity` | Dukungan SDK/flow web dari penyedia, challenge/result sah, prasyarat, pembuktian identitas, dan kontrak integrasinya |
| Biometrik dan PIN | Izin `USE_BIOMETRIC`/`USE_FINGERPRINT`, `local_auth_android`, rute `Pin/*` | Apakah biometrik membuka secret lokal atau memengaruhi sesi server; WebAuthn tidak otomatis menggantikan plugin Android |
| Sertipikat, berkas, akta, koleksi | Label menu, rute, fixture sertipikat, skema offline | Model lengkap per jenis dokumen, hak akses, pagination/filter, berbagi/revokasi, dokumen terenkripsi, dan makna status |
| Penandaan, geotag, swaplotting | Plugin lokasi/maps; `geotag/UploadGeotag` (`0xfdf7c`), kandidat `Swaplotting*`, database geotag | Field pengajuan, payload geometri, metadata foto, sumber akurasi, freshness, aturan server, bukti submit sah |
| Kamera, scan, foto, dokumen | CameraX/image picker/file picker/native EXIF; `apis/scanDocument` | Encoding, orientasi, EXIF yang diperlukan, kompresi, nama part, validasi QR/TTE, dan dukungan browser yang disetujui |
| Antrian daring | `api/antrian/*`, `api/booking/*`, label OTP/antrian | Identitas kantor/slot, lifecycle booking, OTP, idempotensi, pembatalan, kapasitas real time, status diterima |
| Info layanan, simulasi, pengumuman | Rute informasi dan `InfoLayanan/SimulasiTipe1..6` | Tarif/formula resmi tidak terbukti dari string; data server, aturan layanan, dan schema hasil belum lengkap |
| KKPR, survei nilai tanah, mitra | Label/rute dan sejumlah nama field | Model per layanan, domain enum, lampiran, dependensi transaksi dan peran akun |
| Aktivitas, notifikasi, dukungan | Firebase messaging, local notifications, rute aktivitas/tanya berkas | Registrasi push web, pembacaan/penghapusan notifikasi, sinkronisasi, payload pesan, serta izin operasional |

Plugin `root_checker_plus`, device-info, dan mobile-device-identifier menunjukkan ketergantungan Android yang perlu dipahami. Ini **tidak membuktikan Play Integrity/attestation tertentu dipakai server**, tidak membuktikan bahwa semua pengajuan mengirim field perangkat, dan tidak menghasilkan implementasi pengelakan. Nama API attestation, format pembuktiannya, serta ketentuan penyedia harus dibuktikan tersendiri jika memang digunakan.

## Lokasi nyata saat pengiriman

Web Geolocation dapat memperoleh posisi setelah izin pengguna, tetapi tidak menjamin sumber satelit GNSS tertentu atau akurasi identik dengan aplikasi Android. `accuracy` adalah estimasi ketidakpastian, bukan sertifikasi hasil ukur. Spesifikasi web menyediakan posisi/timestamp dan mekanisme error; keputusan apakah bukti itu diterima suatu layanan tetap milik kontrak layanan. [Spesifikasi W3C Geolocation](https://www.w3.org/TR/geolocation/).

Kondisi penerimaan belum diketahui: maksimum umur posisi, ambang akurasi, apakah wajib posisi baru atau boleh cache, satuan radius, kebutuhan foto, pengaitan waktu foto dengan waktu koordinat, serta apakah server memakai posisi untuk kedekatan kantor atau lokasi bidang. Tidak sah menyimpulkan seluruhnya hanya dari field `latitude`/`longitude` pada SQLite.

Bukti uji minimum untuk integrasi sah: sumber posisi yang benar-benar dipilih pengguna; perangkat/browser yang dipakai; keluaran posisi aktual dengan timestamp/accuracy; kebijakan layanan tentang posisi tersebut; hasil kasus izin ditolak, posisi kedaluwarsa, akurasi kurang baik, dan jaringan terputus; serta satu pengajuan sandbox yang diterima dengan bukti transaksi. Jika sumbernya perangkat GNSS eksternal, diperlukan jalur integrasi yang didukung sumber tersebut dan kontrak layanan—bukan mengasumsikan browser menerima data perangkat itu secara otomatis.

## Hambatan browser dan autentikasi

Browser tidak menjalankan plugin CameraX, Android Keystore/secure-storage plugin, Peruri Android activity, atau pemeriksaan Android sebagai JavaScript. Kamera web dan pemilih file dapat menjadi padanan antarmuka untuk sebagian kebutuhan, tetapi kesetaraan bukti identitas/liveness dan metadata tidak mengikuti hanya karena keduanya menghasilkan gambar. Akses kamera juga mempunyai izin dan aturan konteks web. [W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/).

Untuk request lintas origin, browser menerapkan CORS dan, bila diperlukan, preflight. Request berkredensial memerlukan pengaturan respons server yang sesuai; wildcard origin tidak menggantikan izin origin untuk respons berkredensial. **Konfigurasi CORS backend Sentuh Tanahku belum diuji dan tidak dapat disimpulkan dari APK.** Menambahkan proxy tidak dengan sendirinya membuktikan otorisasi integrasi atau kesetaraan autentikasi. [WHATWG Fetch: CORS dan credentials](https://fetch.spec.whatwg.org/#cors-protocol-and-credentials).

String sesi berakhir (`0x58f34`) dan login perangkat lain (`0x62d13`) menunjukkan aplikasi memiliki pesan terkait lifecycle sesi. Itu belum membuktikan kebijakan jumlah perangkat, mekanisme pencabutan sesi, atau cara aplikasi web bisa berbagi sesi. Akun biasa juga bukan bukti tersedianya hak admin: istilah “admin” perlu berarti pengelolaan data akun sendiri kecuali backend secara sah memberikan peran lain.

## Bukti minimum sebelum menyatakan siap terhubung

| Kebutuhan | Bukti minimum yang sah |
|---|---|
| Klien web dan autentikasi | Dokumen/konfigurasi integrasi yang didukung penyedia atau lingkungan uji yang diotorisasi; flow autentikasi, scopes/roles, refresh/logout, serta origin yang didukung |
| Daftar semua operasi | Daftar fitur yang disepakati lalu pemetaan tiap tombol/pengajuan ke callsite dan kontrak; fitur yang server-driven dicatat tersendiri |
| Parameter lengkap | Schema/serializer terpulihkan dan ditelusuri, atau dokumentasi API resmi; contoh request/response uji yang sudah disanitasi untuk setiap cabang penting |
| Native/identitas | Dokumentasi jalur web resmi dari penyedia SDK dan hasil uji yang membuktikan challenge/liveness/biometrik didukung |
| Pengiriman dokumen | Contoh lampiran nonproduksi, batas MIME/ukuran/jumlah, penerimaan server sandbox dan nomor transaksi, termasuk retry tanpa duplikasi |
| GPS nyata | Penetapan sumber yang didukung, pemeriksaan freshness/accuracy yang disetujui layanan, serta pengujian posisi dan gagal izin pada perangkat sasaran |
| Kesetaraan hasil | Perbandingan keluaran APK dan web pada data uji sama, termasuk error/status tertunda, tanpa hanya membandingkan tampilan |

Catatan diagnostik harus menghapus password, OTP, token, data identitas, dan isi dokumen asli. Bukti minimum tersebut tidak mensyaratkan ekstraksi token dari aplikasi, manipulasi lokasi, atau penonaktifan pemeriksaan keamanan. Data uji atau kontrak penyedia lebih berguna daripada menebak body berdasarkan string.

## Catatan arsitektur alternatif: login web lalu memakai APK asli

Ini bukan sasaran utama terbaru, tetapi penting bila model pendamping kembali dipilih. Manifest utama yang diperiksa tidak mendeklarasikan activity dengan `ACTION_VIEW` + `BROWSABLE` serta scheme/host callback. `MainActivity` pada baris 82–91 hanya mempunyai launcher dan event Firebase. Entry HTTPS pada baris 29–32 berada di **`<queries>`**, yaitu visibilitas aplikasi tujuan, bukan filter penerimaan URL. Karena itu label `deep_links` pada keluaran ringkasan manifest lama tidak boleh dipakai sebagai bukti callback login.

Dokumentasi Android menjelaskan bahwa tautan browser memerlukan filter penerimaan yang sesuai; kategori `BROWSABLE` merupakan bagian penting. [Android: Create deep links](https://developer.android.com/training/app-links/create-deeplinks).

Kehadiran WebView/Custom Tabs atau string `auth/*` tidak membuktikan OAuth browser-to-native, client registration, redirect URI, PKCE, atau mekanisme transfer sesi. Untuk autentikasi native berbasis browser, RFC 8252 menggambarkan authorization request dan redirect kembali ke aplikasi; mekanisme ini harus benar-benar didukung oleh APK dan server, bukan ditambahkan sepihak di webapp. [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html).

Kesimpulan terbatas: **tidak ada jalur handoff sesi browser → APK yang terbukti dalam manifest dan artefak yang diperiksa.** Ini bukan bukti matematis bahwa backend tidak punya mekanisme lain; mekanisme seperti itu tetap perlu dokumentasi atau bukti runtime yang sah. Login di webapp sendiri tidak boleh diklaim otomatis membuat APK asli terautentikasi.

## Status akhir audit

Inventaris statis dapat dipakai untuk memprioritaskan pemulihan kontrak dan mendokumentasikan field kandidat. Hasilnya belum boleh dipromosikan menjadi schema pengiriman final atau klaim “semua fungsi sudah sama”. Prototipe lokal sebelumnya tidak menyediakan bukti backend parity dan tidak diuji ulang dalam audit ini. Tidak ada file frontend, APK, atau hasil audit agen lain yang diubah oleh audit ini.
