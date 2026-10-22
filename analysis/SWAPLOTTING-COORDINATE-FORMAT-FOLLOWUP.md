# Representasi koordinat Swaplotting

Audit statis terbatas APK 6.1.5 ini menutup jalur aplikasi menuju formatter koordinat, bukan seluruh implementasi konversi angka pada engine. **Dua unggahan personal memakai konversi umum Double ke String; keduanya tidak menetapkan tujuh angka desimal.** Helper geotag yang memakai tujuh angka desimal adalah cabang lain dan tidak boleh disalin sebagai aturan universal.

[Ledger baru](recovered/swaplotting-coordinate-format-followup/flow.json) SHA256 `5a16064f32b7a5ff5bdc287df724ff6faaf1d3c5ceff9f152f0b5296c1be6fc2` mengikat ELF `bbc7f3bd…a683` dan pool `87148785…2e04` yang sama. [Verifier mandiri](rea/verify_swaplotting_coordinate_format_followup.py) menghasilkan [receipt PASS](recovered/swaplotting-coordinate-format-followup/verification.json): delapan potongan baru/406 instruksi, 15 potongan lama/4.398 instruksi, 4.804 instruksi unik, 15 binding pool baru, 73 pemeriksaan semantik literal, satu dispatch, serta tiga pemeriksaan bit signed-zero. Seluruh 777 berkas yang dilindungi tetap identik, termasuk 75 runtime dan 39 artefak native terdahulu.

## Nilai yang benar-benar diteruskan

| Bagian | Bukti APK | Batas kesimpulan |
|---|---|---|
| Unggahan terdaftar | `eCb+b` harus nonnull; komponen `+7` dan `+f` dibaca sebagai binary64, dibungkus `_Double` CID62, lalu dipanggil melalui `a944a0` pada `d9f714` dan `d9f798`. Hasil masuk ke field `lat` dan `lon`. | Tidak ada argumen presisi atau locale pada empat titik panggilan personal ini. Byte multipart akhir belum diuji. |
| Unggahan belum terdaftar | `hCb+7` mengikuti pola yang sama, dengan panggilan `da0aac` dan `da0b30`. | Tidak ada fixed-seven, skala, atau pembulatan desimal tambahan pada pemanggil yang ditelusuri. |
| Nilai peta bersama | `iUa.aQc/cff6a8 → 655644` membentuk `List<double>` dua elemen dari komponen `+7/+f`, dengan payload angka yang sama. | Ini bukan bukti format teks preview, JSON channel final, atau tampilan platform Google Maps. Nama metode tetap obfuscated. |
| Cabang geotag pembanding | Closure `8b4cc0` mengirim integer `7` ke helper `ca58d0`; closure `74a5d4` justru meneruskan String yang sudah tersedia. | Aturan tujuh desimal hanya terbukti pada cabang pertama itu. Keduanya tidak menetapkan serializer unggahan personal Swaplotting. |

Angka yang diterima formatter personal sudah berupa binary64. Audit ini tidak menutup proses pembacaan teks desimal asli GNSS, datum pengukuran, konversi satuan atau transformasi koordinat. Banyaknya angka desimal bukan bukti akurasi survei.

## Formatter dan signed zero

Dispatch CID62 dengan selector `ab4d` menunjuk `a944a0`. Nama debug body optimized itu tidak pulih; perannya diikat oleh dispatch, field core `_Double._ncc`, dan panggilan ke metode yang namanya terpulihkan: `[dart:core] _Double::_toString` pada `deda98..dedb1c`.

Wrapper menyimpan delapan pasangan angka/String dalam cache. Pemeriksaan `OptimizedIdenticalWithNumberCheck/4232ac` membandingkan payload **64 bit mentah** untuk Double. Writer cache menyimpan angka tanpa perubahan, menyimpan String yang dikembalikan native, lalu memajukan indeks melingkar. Cache tidak membulatkan koordinat.

`+0.0` mempunyai shortcut literal **`"0.0"`**. Bit `-0.0` berbeda, sehingga tidak disamakan dengan shortcut tersebut. Jika belum ada dalam cache, `-0.0` menuju native `_toString`; teks akhir pada engine APK belum diamati. Karena itu `String(number)` JavaScript tidak dapat diklaim sebagai pengganti persis: bahkan `String(0)` menghasilkan `"0"`, berbeda dari shortcut APK yang terbukti.

Pada miss biasa, `deda98` mengirim **satu receiver** melalui `CallBootstrapNative`, lalu memeriksa bahwa hasilnya String kelas94/95. Pointer native tetap opaque dan tidak diekspor atau dijalankan. Tidak ada `fractionDigits`, locale atau pembulatan geografis yang disisipkan sebelum batas tersebut. Ini tidak membuktikan semua aturan di dalam engine native.

## Presisi, exponent, locale dan pembulatan

Audit menggunakan ulang dua snapshot sumber primer resmi Dart3.12.2 yang sudah dibekukan pada pekerjaan sebelumnya: [native Double entry](https://raw.githubusercontent.com/dart-lang/sdk/3.12.2/runtime/lib/double.cc) dan [double conversion](https://raw.githubusercontent.com/dart-lang/sdk/3.12.2/runtime/vm/double_conversion.cc). Tidak ada unduhan atau request riset baru. Hash dan peran kedua sumber dicatat terpisah pada [source-corroboration.json](recovered/swaplotting-coordinate-format-followup/source-corroboration.json).

Sumber publik tersebut menunjukkan entry `Double_toString` dengan satu receiver dan converter `ToShortest`. Converter mempunyai batas decimal low `-6`/high `21`, karakter exponent `e`, tanda exponent positif, serta flag trailing decimal/zero. Ini corroboration tentang algoritme SDK, **bukan bukti bahwa native Flutter engine yang dikirim sama persis**. Hubungan lengkap `Number::ToString` ke converter dan implementasi double-conversion di engine belum ditutup baru.

Dengan demikian, pembulatan tie, mantissa sulit, bentuk exponent final, keluaran negatif nol/nonfinite dan semua detail locale engine belum menjadi golden contract APK. Tidak ada asumsi round-half-up, tujuh desimal, atau kesetaraan JavaScript yang ditambahkan. Temuan positifnya adalah nilai binary64 tidak diubah oleh wrapper dan pemanggil aplikasi sebelum native String conversion.

## Asal titik dan tampilan peta

Bukti peta lama digunakan ulang tanpa perubahan. Event kamera `8cc1e4 → d9d948` menyimpan `cameraPosition.target` ke `bCb+b`. Builder kedua formulir memakai titik itu; bila null, fallback berasal dari target kamera awal `bCb+33`, bukan hasil pengukuran berkas.

Routine current-position `d9cc34` dapat memusatkan kamera pada koordinat perangkat dengan zoom17. Ia tidak langsung menulis field titik payload `bCb+b`; event kamera berikutnya dapat memperbaruinya. Titik yang digeser pengguna dapat berbeda dari fix perangkat. Hubungan ini tidak menjadi bukti kunjungan, kepemilikan, datum atau akurasi.

Pemeriksaan direct-BL pada potongan map/form yang dipertahankan tidak menemukan panggilan langsung ke `a944a0` atau `ca58d0`. Batasnya eksplisit: pemanggilan dinamis, seluruh helper transitif dan label preview native di luar potongan tersebut belum ditelusuri. Helper nilai peta yang baru ditutup mempertahankan dua angka; ia tidak menetapkan format teks layar.

## Kontrak model murni yang aman untuk langkah berikutnya

Model baca/lokal dapat mempertahankan angka binary64 beserta teks desimal sumber, datum, akurasi dan provenance pada field yang terpisah bila sumber tersebut tersedia secara sah. Nilai asli tidak perlu dibulatkan untuk sekadar disimpan atau dipetakan. Jangan membuat presisi atau status pengukuran yang tidak diberikan sumber.

Untuk kesetaraan serializer personal, titik batas yang terbukti adalah **Double → core native String**, bukan `toFixed(7)` atau `String(number)`. Implementasi formatter dari algoritme SDK tertentu boleh dievaluasi sebagai adaptasi yang dinyatakan; klaim kesetaraan byte membutuhkan bukti engine atau oracle runtime yang diotorisasi untuk menutup gap native. Audit ini tidak mengaktifkan serializer unggahan atau mengubah frontend.

Verifier melakukan re-decode terhadap ELF dan memeriksa hash/pool/dispatch secara mandiri. Helper metadata yang sudah ada dijalankan hanya untuk membaca metadata core dari snapshot; tidak ada metode atau initializer Dart yang dieksekusi. Hasilnya identik dengan TSV lama dan 23 input build bersama tetap identik. Dua run verifier menghasilkan receipt yang identik per byte.

Tidak ada request aplikasi atau riset baru, akun/kredensial, Android, GPS/kamera, identitas/OTP, mutasi, upload, koordinat palsu, klaim kehadiran, checksum atau attestation yang dilakukan. Seluruh runtime dan bukti lama tetap dipertahankan.
