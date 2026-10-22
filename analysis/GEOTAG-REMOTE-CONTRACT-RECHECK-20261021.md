# Recheck kontrak geotag dan koordinat jarak jauh — 21 Oktober 2026

**Belum ditemukan jalur resmi yang menyatakan bahwa koordinat berkas/GNSS dapat menggantikan kunjungan pada `geotag/UploadGeotag`.** Alur Penandaan Lokasi native yang ditelusuri mempunyai pemeriksaan positif jarak pin terhadap posisi perangkat. Personal Swaplotting menerima titik kamera peta melalui dua endpoint lain; implementasi itu tidak membuktikan pengecualian geotag Berkas.

Ini audit REA statis terbatas atas sumber bukti yang sudah ditahan dan implementasi saat pembacaan. Satu-satunya berkas yang dibuat adalah laporan ini. Tidak ada perubahan runtime, katalog, tes atau bukti lama; tidak ada request provider/server, login, upload, Activity, lokasi/kamera, emulator restart, setup REA, atau percobaan menghindari validasi. Pernyataan tentang server saat ini tetap belum terverifikasi. Pemeriksaan hash dan decode instruksi lokal bukan eksekusi APK atau uji penerimaan server.

## Identitas dan pemeriksaan ulang bukti

Artefak adalah Sentuh Tanahku **6.1.5 / build 1037**, dengan original ARM64 `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so`. Hash yang dihitung ulang cocok dengan seluruh ledger yang dipakai:

```text
ELF SHA-256   bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683
Pool SHA-256  871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04
Pool path    analysis/recovered/blutter-unique/pp.txt
```

Skill [Reverse Engineer Anything](../tools/Reverse-Engineer-Anything/skills/reverse-engineer-anything/SKILL.md) dibaca dan diterapkan melalui artefak/ledger yang sama. Tidak ada provider baru atau sesi binary baru yang dibuka. Pemeriksaan ulang lokal meliputi:

- Semua **60 referensi / 57 alamat unik** pada delapan finding geotag tersedia. **56 referensi** assembly plain cocok persis dengan decode ARM64 dari ELF asli, tanpa perbedaan. Empat referensi Blutter beranotasi didecode terpisah dan diperiksa pada instruksi mesin yang terlihat: `d97624 = ldur w2,[x0,#0xf]`, `d9762c = tbnz w2,#4,#d9764c`, `d97654 = bl #d97668`, dan `d27e2c = bl #752658`. Ini tidak mengulang seluruh verifikasi semantik atau semua instruksi ledger.
- **39 pin langsung** ELF/pool/sumber/dependensi dari ledger final-submit Swaplotting cocok, tanpa mismatch. Dependensi transitif tidak dihitung ulang seluruhnya dalam recheck ini.
- **45 pin sumber/dependensi langsung** pada ledger peta Swaplotting cocok, tanpa mismatch. Receipt map lama dibaca sebagai bukti historis; verifier yang menulis receipt tidak dijalankan ulang.
- Katalog `operations.mjs` diparse sebagai data literal, tanpa mengimpor atau menjalankan modul aplikasi. Snapshot saat pembacaan berisi **176 operasi / 92 enabled**. Angka ini bukan bukti cakupan menu atau penerimaan upstream.

## Perbedaan tiga alur

| Alur | Sumber koordinat yang dibuktikan | Operasi/hasil | Batas kesimpulan |
| --- | --- | --- | --- |
| Penandaan Lokasi Berkas, controller **CAb** | Titik pilihan disimpan terpisah dari posisi platform; keduanya masuk penghitungan jarak | `POST geotag/UploadGeotag` | Ada gate klien ≤10 m serta pernyataan kondisi fisik. Belum ada mode remote eksplisit yang dibuktikan. |
| Personal Swaplotting, controller **bCb** | `cameraPosition.target`, fallback target kamera awal | `POST /apis/SwaplottingTerdaftar` atau `/apis/SwaplottingBelumTerdaftar` | Dua formulir personal tersendiri. Titik kamera tidak menyatakan kehadiran, ketelitian survei, atau geotag Berkas telah terpenuhi. |
| Titik pengukuran webapp | Masukan pengguna atau impor berlabel survey/GNSS eksternal, dengan deklarasi WGS84 | Perbandingan lokal; dapat dipilih sebagai titik formulir personal Swaplotting | Provenance/waktu/akurasi yang dilaporkan tetap lokal, tidak menjadi posisi perangkat atau field tambahan pada API yang tidak mendukungnya. |

Nama endpoint maupun kemiripan `Lat/Longi` dan `lat/lon` tidak membuktikan bahwa ketiganya dapat saling menggantikan.

## Gate lokasi native yang positif

[Ledger validasi geotag](recovered/geotag-validation-audit.json) dan [dataflow koordinat](recovered/geotag-coordinate-dataflow.json) membuktikan alur berikut pada rentang yang ditahan:

1. Callback stream posisi menyimpan objek posisi pada `CAb+0x17` (`750bd4`). Callback pilihan peta menyimpan titik terpisah pada `CAb+0x1b` (`8b7064`). Inisialisasi `d27450` memperoleh stream melalui singleton platform lalu memasang callback `750b8c`; detail provider di balik dispatch dinamis belum ditutup.
2. `751364..751370` membaca dua pasang latitude/longitude. Pemanggilan `751374` menuju helper jarak. Formula dan konstanta cocok dengan Haversine, radius **6.378.137 m**; identifikasi rumus merupakan inferensi statis kuat, bukan simbol asli atau validasi datum survei.
3. `751610..751644` membandingkan hasil terhadap **10.0**. Untuk pasangan koordinat finite/valid, jarak ≤10 m menghasilkan boolean valid; jarak >10 m menghasilkan false. Ini **bukan akurasi horizontal GPS ≤10 m** dan bukan jarak dari pin ke polygon/batas sertipikat.
4. Boolean tersebut dipakai screen/control `8b46bc..8b46e8`, closure pembentuk tombol `8b4a34`, dan callback capture `d9758c`. Pemeriksaan `d97624..d97654` mendahului capture `d97668`; ada state lain yang semantiknya belum seluruhnya dinamai. Gate bukan sekadar lingkaran dekoratif.
5. Titik pilihan diteruskan ke capture/preview (`d97920`, `d9792c`, `d98164`) dan jalur upload. Satu closure memformat dua koordinat ke tujuh desimal; closure dari model tersimpan meneruskan teks yang sudah ada. Karena itu aturan tujuh desimal tidak digeneralisasi ke semua caller.

Teks UI yang dipaketkan secara eksplisit menyebut batas pin terhadap posisi saat ini dan meminta pernyataan bahwa posisi penguasaan fisik sesuai keadaan aktual di lapangan. Ini bukti maksud dan perilaku klien, **bukan bukti kebijakan server atau jaminan kehadiran yang diautentikasi server**.

Model posisi mempunyai properti terpisah untuk latitude, longitude, accuracy, timestamp dan `is_mocked`. Serializer `752658` mengikat accuracy ke double `+0x2b` dan `is_mocked` ke `+0x57`. Perbandingan jarak yang ditelusuri hanya membaca pasangan koordinat. Adanya properti itu tidak membuktikan semua caller memeriksanya; tidak membuktikan pula bahwa app/SDK/server tidak memeriksanya di tempat lain. Nilai integer10 pada object settings stream belum memiliki identitas properti yang ditutup dan tidak boleh diberi arti “akurasi 10 m”.

## Kontrak upload tidak menyatakan pengecualian kunjungan

Builder native `d96914` membentuk **enam entri eksplisit**, dalam urutan:

```text
BerkasId, Lat, Longi, file, Lokasi, IsOffline
```

Map tersebut masuk serializer `707bd4` lalu main-client POST `6b9270` pada `d96b98`. Window builder mengikat key secara positif pada `d969a0`, `d969b4`, `d969c8`, `d969d8`, `d96b08`, `d96b40`, serta endpoint pada `d96b84`.

Tidak ada entri eksplisit bernama mode manual, GNSS eksternal, survei, sumber koordinat, atau pengecualian kunjungan dalam **builder ini**. Accuracy/timestamp/`is_mocked` juga bukan salah satu enam entri tersebut. Hal ini tidak menutup seluruh pipeline/native SDK, opaque file content, HTTP/session state, atau aturan tambahan server. Kontrak enam field bukan bukti bahwa server menerima koordinat pengganti.

`IsOffline` berada pada alur simpan-draf dan kirim setelah koneksi pulih. Teks paket dan model persistence mendukung retry pengambilan yang sudah disimpan. Tidak ada bukti yang menafsirkan `IsOffline` sebagai izin menandai lokasi dari jauh; mengubahnya tidak merupakan mode remote yang dinyatakan.

`LokasiBidang/GetByPersilId` juga tidak cukup untuk mengisi koordinat BPN secara otomatis. Parser tepat yang diaudit hanya menampung tujuh `String?`: `persilId`, `kantorId`, `namaKantor`, `wilayahId`, `namaWilayah`, `jenisHak`, `nomorSertipikat`. Endpoint itu memerlukan bukti layanan/geometri lain sebelum dipakai sebagai sumber koordinat. Raster Bhumi/preview peta sendiri tidak memberikan sertifikasi titik ukur atau kehadiran.

## Jalur peta personal Swaplotting yang terpisah

[Ledger peta Swaplotting](recovered/swaplotting-map-followup/flow.json) secara positif mengikat callback `8cc1e4 → d9d948`: `cameraPosition.target+0xf` disimpan ke `bCb+0xb` pada `d9d978..d9d98c`. Builder `8cab6c` dan `8cabd4` memakai titik tersebut, atau target kamera awal bila null, lalu mengirim satu `LatLng` ke widget/form. Tidak ada polygon yang diteruskan sebagai pengganti titik.

Recenter posisi asli adalah input kamera tersendiri. Native `d9cc34..d9ce68` memeriksa granted permission dan layanan posisi, meminta posisi dengan settings best/distanceFilter0, menyimpan hasil platform, lalu menggerakkan kamera ke zoom17. Pada **body lengkap terbatas itu** tidak ada pembacaan accuracy/time/`isMocked`, direct call helper jarak yang telah diketahui, atau perbandingan10m. Ini tidak mencakup provider internals, seluruh caller, child route, disclaimer atau server.

Disclaimer berasal dari `GET Map/GetDisclaimer` dan empat `String?`: `message`, `message2`, `message3`, `url`. Teks dinamis dapat memuat kewajiban tambahan. Keberhasilan membaca disclaimer atau menampilkan tombol persetujuan tidak membuktikan ketentuan terpenuhi; isi server tidak diganti oleh asumsi audit offline.

[Ledger final submit](recovered/swaplotting-submit-followup/flow.json) membuktikan dua writer personal, masing-masing **15 atau 19 scalar parts** kemudian repeated `file`, dengan auth sesi main FRb/LRb. Tidak ada `BerkasId`, `IsOffline`, flag kunjungan, atau permintaan untuk menganggap titik sebagai posisi perangkat dalam builder kedua writer. HTTP200 setelah transform respons menghasilkan helper true; body bisnis diabaikan. Helper true **bukan receipt hukum, kepemilikan, akurasi, kehadiran atau keberhasilan Penandaan Lokasi Berkas**.

Dengan demikian, mengoreksi **titik plot** memakai koordinat yang benar dan sumber yang dinyatakan adalah jalur fungsional terpisah yang dapat dipertahankan. Belum terbukti bahwa aplikasi atau pengelola menyatakan mode resmi remote/GNSS/survei untuk **geotag Berkas**. Dua fakta ini harus tetap dibedakan.

## Keadaan implementasi webapp saat pembacaan

Kondisi sumber aktual, bukan klaim deployment atau tes baru:

- `operations.mjs`: `post-geotag-uploadgeotag-d96b98` tetap **enabled=false**, `readiness=native_required`, enam field inspectable. `build-operations.py` memuat alasan bahwa perbandingan koordinat berkas tidak menggantikan pemeriksaan kunjungan.
- `http-api.mjs` menyatakan `geotagSubmission:'official-app-required'`, `coordinateComparison:'local-only'`, `nativeAttestation:false`, `serverValidated:false`. Nilai ini sesuai batas bukti; bukan flag server atau bukti penerimaan resmi.
- `app.js` mengecualikan endpoint `geotag/UploadGeotag` dari predicate `ready`. Titik pengukuran sesi diberi sumber, waktu/akurasi opsional, dan penjelasan bahwa metadata tidak ditambahkan ke request yang tidak mendukungnya.
- Dua operasi personal `/apis/Swaplotting*` kini **enabled=true**, `clientProfile:'swaplotting-post'`, `readiness:ready_unverified`; input katalog scoped adalah `reviewId`. Session backend menyusun wire dari staged bytes, sumber reference milik sesi dan recheck profil sendiri; bukan menerima pengganti identitas/pernyataan GPS dari browser. Gate profil yang dibaca adalah level2/3 dan `isIkd===false`.
- `assets/swaplotting/coordinate-entry.js` mendukung `manual-coordinate` atau session point `survey/external_gnss`, deklarasi WGS84 derajat desimal, pemeriksaan rentang dan batas Mercator. Fakta provenance menyebut deklarasi pengguna **belum diverifikasi**. Metadata sumber/waktu/akurasi ini tidak menjadi field GPS/presence baru.
- `private/swaplotting-post.mjs` menyatakan formatter `browser-binary64-string-preserve-negative-zero; native-text-parity-unproven`. Pilihan browser, batas Mercator, Blob/camera dan RNG bukan oracle byte Android.
- Kontrak geotag pada `tests/operations.test.mjs` tetap mengharapkan operasi inspect-only, termasuk bila `IsOffline:true`. Tes ini **hanya dibaca**, tidak dieksekusi dalam recheck.

Laporan release Swaplotting yang lebih baru telah menambah pengiriman personal. Kalimat “Kirim tetap nonaktif” pada dokumen draft/review historis tidak dipakai sebagai keadaan sekarang. Sebaliknya, enabled personal writer tidak mengubah status geotag Berkas dan tidak membuktikan penerimaan upstream.

## Integritas, checksum dan pembuktian server

[Ledger integritas klien](recovered/client-integrity-audit.json) dan [audit native](recovered/native-integrity-audit.json) membedakan tiga hal:

1. Ada pemeriksaan integritas lokal positif: flag slot `0x2f68` dibaca oleh jalur koneksi `6d0728`; cabang gagal menghasilkan `HandshakeException` dengan pesan `Device integrity check failed`. Penolakan emulator S5 historis adalah bukti startup lokal komposit, bukan respons server geotag.
2. `buildSignature` dari `package_info_plus` adalah SHA-256 byte sertifikat penandatangan aplikasi, bukan checksum keseluruhan APK. `account_summary` yang diaudit mengirim `appVersion` dari field versi; keberadaan signature lokal tidak membuktikan pengiriman atau syarat endpoint geotag.
3. Tiga initial request handler yang ditinjau tidak membuktikan penambahan checksum/attestation per request. Scan literal native terbatas tidak menemukan named Play Integrity/SafetyNet/Firebase App Check markers. **Keduanya bukan bukti ketiadaan mekanisme obfuscated/dinamis/native lain atau pemeriksaan server**.

Tidak ada nilai integrity, timestamp, fix, device ID, mock flag atau presence yang dibuat, diganti atau diturunkan untuk menghindari kontrol. Kewajiban versi/checksum/attestation server geotag tetap unknown; keberhasilan GET lain atau login tidak menutup pertanyaan ini.

## Sisa requirement dan bukti yang dapat menutupnya

| Pertanyaan | Hasil recheck | Bukti yang masih diperlukan |
| --- | --- | --- |
| Apakah batas10m merupakan ketelitian survei/GPS? | Tidak, pada path yang ditelusuri ia jarak pin terhadap posisi perangkat. | Runtime accepted-device dapat memperkuat perilaku UI; tidak diperlukan untuk mengubah makna dataflow statis. |
| Apakah native Penandaan Lokasi punya mode manual/GNSS/survei remote? | Tidak dibuktikan dalam UI/gate/builder/persistence yang ditinjau; absensi bersifat terbatas. | Kontrak resmi atau instruksi pengelola yang secara eksplisit membolehkan sumber dan mode tersebut, beserta flow/response yang sesuai. |
| Apakah koordinat dapat dipakai mengoreksi titik personal Swaplotting? | Native memakai target peta; browser mendukung input deklaratif terpisah. | Penerimaan writer akun nyata dan persyaratan disclaimer saat itu; tidak disamakan dengan geotag Berkas. |
| Apakah server geotag memerlukan visit, precision, freshness, foto tertentu atau attestation? | Belum diketahui. | Dokumentasi/lingkungan uji resmi atau observasi authorized pada alur yang memenuhi ketentuan, tanpa memalsukan kondisi. |
| Apakah geotag tanpa kunjungan pada objective sudah selesai? | **Belum**, dan bukan ditutup oleh release Swaplotting atau green fixture. | Interface resmi yang mengizinkan remote coordinate submission; pengujian yang membuktikan jalur itu dalam scope yang dinyatakan. |
| Apakah seluruh fungsi APK sudah setara end-to-end? | Audit ini tidak menyatakan demikian. | Matriks coverage seluruh route/fungsi dan bukti runtime/API yang sesuai masing-masing, termasuk akun nyata pada device yang diterima. |

Pekerjaan yang selaras dengan bukti dapat terus menguji baca Berkas, menampilkan sumber/koordinat referensi secara jujur, dan menguji titik personal Swaplotting tanpa mengubah maknanya menjadi bukti hadir. Requirement geotag remote tetap terbuka; tidak ada dasar dari hasil ini untuk menonaktifkan gate kunjungan atau menyatakan hadir dengan koordinat dokumen.

## Pin snapshot untuk peninjau berikutnya

Hash berikut dihitung dalam recheck ini. Bila source berubah, gunakan implementasi baru sebagai authoritative dan buat bukti penerus; jangan menganggap pin laporan ini sebagai pembekuan perkembangan selanjutnya.

| Sumber | SHA-256 |
| --- | --- |
| `recovered/geotag-validation-audit.json` | `80607424a210eeb6435808c13fd9b3b6c64717eb67771a8a6e3e4aec2f904bee` |
| `recovered/geotag-coordinate-dataflow.json` | `7578eabbe4b2c95ffe6a536bcc8e993f126016eedcf7e8f49ed51a571ed82d5a` |
| `recovered/swaplotting-map-followup/flow.json` | `07d83a8a74c6a8ea59cc6b8dc81ffe52473e64e849cd112a4ef1a9db5873fc9a` |
| `recovered/swaplotting-submit-followup/flow.json` | `e835a101543ad6d3c63ed31b2b9c947ec2deea6be32093e4d45c5266afe72d94` |
| `recovered/client-integrity-audit.json` | `d14e48b830dc4b19175649573c52132c5cb1e54d7292891c38410a2a81159132` |
| `recovered/native-integrity-audit.json` | `c31c249f6f869eb411c769eb0a04ecaf1821df48e47028af3fb88ad201424a97` |
| `../webapp/private/http-api.mjs` | `73b104a613917378d86168783bbf3b7d5900ef591064e16f304c9e616a017e10` |
| `../webapp/private/operations.mjs` | `2dff0ecc874739c488fe82f1e464d86b31fbe302f7410169b8558f25655e6e35` |
| `../webapp/private/build-operations.py` | `2d2fe193a186b32da5d71ec834153fc0ee7d47823c9b432c16b1da625393b9a0` |
| `../webapp/private/operations-runtime.mjs` | `5348afc8d69f3d754f4654008a4cf96353ac30bdf61b6d78a0e34ee4ae4477b8` |
| `../webapp/assets/swaplotting/coordinate-entry.js` | `a4a22638709cb34e9e4dc8c264a2037e3da753b018a14294937df06d62654a93` |
| `../webapp/private/swaplotting-post.mjs` | `c54342ecc7bce417bba93e1653003b4588115934d13d3a3d5d3bf3127e1f785f` |
| `../webapp/private/swaplotting-submit-session.mjs` | `3fc0e2fe088f65ced328bf07a30851b2df585855c2df83fde30062f74778b48e` |
| `../webapp/app.js` | `288c974ed11be11e5f929f07486f735ad9c4806536efb747fdf47c94d7f51e30` |

Tidak ada isi akun, token, key, nomor dokumen pribadi atau koordinat akun nyata dicantumkan. Contoh alamat dalam laporan adalah alamat instruksi mesin dari artefak yang diberikan.
