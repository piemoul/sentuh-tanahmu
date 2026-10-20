# Pemeriksaan checksum dan integritas client

**Observasi lanjutan 19 Oktober 2026:** webapp yang telah di-login pengguna menerima HTTP 200 untuk daftar Antrian dan Panggilan sesudah satu redirect canonical 308. [Log terbatas](webapp/queue-calls-live-connection.json) dan [observasi browser](webapp/queue-calls-live-browser.json) hanya membuktikan dua pembacaan kosong tersebut diterima melalui profil client yang direkonstruksi. Tidak ada checksum/signature baru yang ditambahkan untuk mengatasi 308. Ini tidak menetapkan aturan semua endpoint, versi client masa depan, upload, booking, geotag atau attestation server; data terisi/detail antrean produksi belum diuji. Audit statis awal di bawah tetap mempunyai cakupan dan waktu sendiri.

**Hasil: belum ada bukti yang menetapkan bahwa backend mewajibkan checksum APK atau signature per request dari webapp. Ini juga belum membuktikan bahwa backend menerima client web tanpa pemeriksaan tambahan.** Audit dilakukan pada XAPK Sentuh Tanahku **6.1.5 / build 1037** yang disediakan, tanpa mencoba login atau request buatan ke server.

## Yang ditemukan

| Mekanisme | Bukti dari APK | Kesimpulan yang didukung |
| --- | --- | --- |
| `appVersion` | POST `account/account_summary` mengambil field `version` dari hasil native `getAll` dan mengirimnya sebagai string | Versi aplikasi memang dikirim pada operasi ini. Ini bukan field `buildSignature`; kewajiban versi minimum/current di server belum teruji. |
| `buildSignature` | Plugin `package_info_plus` membaca signing certificate aplikasi melalui Android PackageManager, lalu menghitung SHA-256 atas byte sertifikat | Ini fingerprint sertifikat penandatangan, bukan checksum keseluruhan file APK. Pembacaan nilai lokal tidak membuktikan pengiriman atau kewajibannya di backend. |
| Konfigurasi `AtrBpn` | Nilai deterministik dari konstanta bawaan APK dipakai dalam autentikasi aplikasi | Bukan hash body atau APK yang dihitung untuk setiap request pada jalur ini. Peran/hak nilai tersebut di server belum terverifikasi. Nilainya tidak disalin ke webapp. |
| Sesi pengguna | Token dari hasil login disimpan dan dipakai untuk Authorization serta refresh | Token pengguna berbeda dari konfigurasi aplikasi, versi, dan fingerprint sertifikat. Belum ada sesi pengguna yang diuji. |
| Handler awal request | Tiga handler yang ditelusuri mengubah Content-Type/Authorization atau meneruskan request | Belum ditemukan penambahan checksum/signature/attestation di handler tersebut. Batasnya mencakup fase yang ditinjau, bukan semua jalur native, retry/error, atau aturan server. |
| Integritas lokal | Hasil pemeriksaan lokal dibaca pada jalur koneksi; kegagalan memicu `HandshakeException` dengan pesan `Device integrity check failed` | Ada pemeriksaan di sisi client. Nama exception tidak membuktikan server telah memeriksa atau menolak suatu checksum. |
| Penolakan runtime S5 | APK pada emulator Android 16 menampilkan pesan penolakan komposit root/jailbreak/emulator/aplikasi tidak resmi | Startup terblokir sebelum menu/login. Subpemeriksaan pemicu S5 belum dipisahkan, dan tidak ada respons HTTP yang direkam untuk membuktikan penolakan server. |

String SHA-256/HMAC/RSA atau signature dokumen pada library tidak otomatis membuktikan signature request. Jalur `/apis/VerifyTTE` yang ditelusuri adalah verifikasi dokumen; mekanismenya dipisahkan dari identitas client.

## Implikasi untuk webapp

Kontrak autentikasi, serialisasi akhir, versi yang diterima, dan hasil request pada akun pengguna masih perlu diverifikasi pada lingkungan yang diterima aplikasi. Katalog 169 callsite langsung dan 541 path/pola field membantu pemetaan, tetapi tidak menyingkap seluruh aturan backend. Tidak ada checksum atau bukti integritas yang ditebak, dipalsukan, atau diuji lewat permintaan produksi dalam pekerjaan ini.

Istilah “client yang berlaku sekarang” belum dapat disamakan dengan file lokal. [Halaman resmi Google Play](https://play.google.com/store/apps/details?id=id.go.bpn.sentuh&hl=id) yang diperiksa menampilkan pembaruan 17 Oktober 2026, tetapi teks halaman yang tersedia tidak menetapkan version code atau kebijakan minimum versi backend. Temuan kode dalam laporan ini tetap khusus build 1037.

## Bukti yang dapat diperiksa

- [Audit integritas dan alamat instruksi](recovered/client-integrity-audit.json)
- [Batas transport dan interceptor](TRANSPORT-BOUNDARIES.md)
- [Audit native](recovered/native-integrity-audit.json)
- [Asal konfigurasi autentikasi](recovered/auth-config-provenance.json)
- [Kontrak request lengkap yang teramati](request-contracts.md)
- [Laporan emulator](runtime/README.md) dan [screenshot S5](runtime/emulator/api36/screenshots/03-security-refusal-s5.png)

Tidak ada APK yang dimodifikasi atau perlindungan yang dilewati. Kebijakan checksum/attestation server tetap **belum terverifikasi**.
