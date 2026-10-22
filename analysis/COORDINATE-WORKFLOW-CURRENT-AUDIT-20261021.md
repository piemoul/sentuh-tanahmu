# Koordinat ukur, Swaplotting, dan geotag — keadaan sumber 21 Oktober 2026

**Jalur positif yang sudah ada adalah persiapan/perbandingan koordinat lokal serta titik peta untuk draf personal Swaplotting. Itu tidak menjadi pengganti posisi perangkat atau kunjungan dalam geotag Berkas.** Audit ini membaca kode, tes dan bukti native yang sudah dibekukan; tidak melakukan disassembly baru, scan ulang binding peta Berkas, jaringan, browser, akun, GNSS/kamera hardware, atau pengiriman. Satu dokumen ini adalah satu-satunya file baru dari audit ini.

## Yang benar-benar didukung sekarang

| Alur | Perilaku yang ditemukan pada sumber saat audit | Batas |
| --- | --- | --- |
| `#/coordinates` | Input manual, impor CSV/GeoJSON Point/NMEA; maksimum500 titik sesi dan file2MiB pada UI; ekspor GeoJSON; pilih dua titik dan hitung jarak/arah lokal | Referensi diisi pengguna dan belum diverifikasi terhadap BPN. Tidak mengirim ke server dan tidak memindahkan GPS perangkat. |
| GNSS eksternal | Impor rekaman NMEA GGA/RMC dengan checksum; koordinat hemisfer dikonversi; fix invalid/estimated/manual/simulated yang dikenali dikeluarkan | Bukan koneksi live penerima GNSS, bukan otentikasi sensor. HDOP tidak diberi label akurasi meter. GGA tidak diberi tanggal buatan; RMC mempunyai tanggal UTC. |
| Personal Swaplotting | Longitude/Latitude manual atau pilihan eksplisit titik sesi `survey`/`external_gnss`; pengguna harus menyatakan WGS84 derajat desimal; **Terapkan ke peta** mengubah target lokal | Label CRS dan akurasi adalah laporan sumber. Tidak ada auto-apply, koreksi datum tersembunyi atau penggantian `navigator.geolocation`. |
| Dua formulir tanah | Draf registered/unregistered memakai snapshot titik/provenance yang dipilih; own-profile subset; kantor/desa asli; validasi9/14checks; kamera dokumen lokal serta tambah/foto ulang/hapus | **Kirim nonaktif**. Managed-user/identity/OTP dan unggahan personal belum diaktifkan. Foto browser bukan sertifikasi kesegaran/keaslian Android. |
| Peta BPN | Pembacaan boundary/dokumen memakai ID yang sudah diikat alur masing-masing; OSM sebagai dasar dan raster Bhumi sebagai overlay | Raster bukan koordinat ukur atau bukti pemilikan. Tidak ada cara yang dibuktikan untuk menyamakan arbitrary BerkasId dengan persilId. Tidak dilakukan audit negatif baru untuk hal itu. |

`gnss.js` mempertahankan `original` teks masukan, sumber, waktu, akurasi nullable dan catatan pada titik sesi. Impor melakukan normalisasi angka binary64, sumbu GeoJSON `[longitude,latitude]`, penolakan CRS projected yang dinyatakan, serta validasi waktu berzona. Metadata yang tidak ada tetap tidak diketahui. Parser menerima asumsi format EPSG:4326 ketika CRS tidak disertakan; itu kebijakan impor browser, bukan pengenalan datum otomatis.

`coordinate-comparison.js` menggunakan Haversine radius6378137m dan bearing. Output berisi `comparisonOnly:true` dan `provesPresence:false`, tanpa status lulus radius atau field upload. Titik identik menghasilkan jarak0 tetapi tidak menghasilkan bukti hadir. UI menyebut perhitungan sferis dan referensi belum diverifikasi.

Coordinate-entry Swaplotting menjaga raw teks manual, tanda-0, target binary64, dan anchor mesin peta secara terpisah. Pilihan sesi menyimpan source-index/reference/signature/generation; perubahan atau penghapusan record menolak Apply. Pan/reset melepas asosiasi sumber; zoom yang mempertahankan koordinat tidak mengubahnya. Kedua formulir menyalin provenance sehingga mutasi record sesi kemudian tidak mengubah formulir. Latitude peta dibatasi ±85.0511287798066 sebagai kemampuan WebMercator, bukan batas sensor/native global.

## Bukti native yang membedakan dua workflow

Native personal Swaplotting memakai controller bCb661. Camera callback `8cc1e4 → d9d948` menyimpan camera.target pada bCb+b. Builder registered `8cabd4` dan unregistered `8cab6c` meneruskan objek target itu; bila belum ada target, keduanya memakai viewport awal. Native recenter perangkat `d9cc34` adalah input lain ke kamera, melalui izin/service/position SDK, lalu zoom17. Tidak ada perbandingan10m dalam fungsi recenter lengkap tersebut. Ketiadaan gate di fungsi itu **tidak** menetapkan ketiadaan aturan di child route, disclaimer, SDK atau server.

Sebaliknya, bukti native geotag CAb mengikat `750bd4/8b7064` untuk dua posisi terpisah dan `751364–751644` untuk jarak pin pilihan terhadap posisi perangkat saat ini. Batas10m **bukan akurasi GPS**, juga bukan jarak ke poligon BPN. UI meminta kesesuaian penguasaan fisik dengan kondisi aktual lapangan. Enam field upload yang terbukti adalah `BerkasId,Lat,Longi,file,Lokasi,IsOffline`; sedikitnya field ini tidak membuktikan bahwa server mengabaikan integritas, freshness atau syarat lain. Offline berarti pengiriman pengambilan kemudian, bukan pengecualian kunjungan.

`LokasiBidang/GetByPersilId` menghasilkan metadata tujuh String nullable, bukan koordinat. Ketika suatu alur sudah mempunyai returned persilId yang sah, boundary dapat diminta melalui adapter boundary yang aktif; centroid/vertex/viewport dari hasil itu tetap tidak diubah menjadi GPS perangkat atau sertifikat hadir. Audit ini tidak mengarang titik BPN, identitas parcel, nilai accuracy, timestamp atau attestation.

## Gate operasi aktual

Pemeriksaan langsung `getPublicCatalog()` pada sumber saat audit menghasilkan:

| Operasi | Status |
| --- | --- |
| `post-geotag-uploadgeotag-d96b98` | disabled, `native_required`, write; confirmation dan IsOffline tidak membuka gate |
| `post-apis-swaplottingterdaftar-d9f850` | disabled, `inspect_only`, write |
| `post-apis-swaplottingbelumterdaftar-da0be8` | disabled, `inspect_only`, write |
| Dua `PlotBidang/Instansi*` mutation | disabled, `inspect_only`; bukan keluarga personal `/apis/Swaplotting*` |
| `Map/GetDisclaimer` d29ef0; `legacy/Kantah` d10364; `legacy/Wilayah` d752bc | enabled read; personal controller hanya memakai tiga resep ini |
| `geotag/GetGeotagList`; `geotag/GetSuratPernyataanGeotag` | enabled read; dapat membaca hasil/dokumen, tidak menyelesaikan syarat penandaan baru |
| `LokasiBidang/GetByPersilId` dad6f4; boundary dbaeb8; `/apis/getGeoJsonInfo` | enabled read, dengan ID/q asli dari alur terkait; tanpa penerimaan produksi baru pada audit ini |
| Duplikat boundary d39898 dan disclaimer d3a3c0 | disabled; jangan memilih endpoint berdasar nama saja |

Frontend `ready()` juga mengecualikan UploadGeotag. Backend capability menyatakan `geotagSubmission:'official-app-required'`, `coordinateComparison:'local-only'`, `nativeAttestation:false`, `serverValidated:false`. Tes operasi menolak UploadGeotag sebelum upstream, termasuk confirmation dan IsOffline. Tes backend yang sudah ada meliputi JSON serta multipart/offline; audit ini membaca tes itu tetapi tidak menjalankan server lokalnya.

Helper `toGeotagFields()` yang mengeluarkan dua teks tujuh desimal ada di `gnss.js`, tetapi satu-satunya pemanggilnya pada sumber saat audit adalah tes. Ia **bukan** writer, jalur UI aktif, bukti penerimaan server, atau formatter personal Swaplotting. Bukti formatter personal menunjuk general native Double→String; fixed7 bukan aturan universal.

## Tindakan positif berikutnya

**Bangun review draf personal Swaplotting dan pure DTO/part-descriptor builder lokal.** Ini langkah fungsional yang memang dinyatakan eligible oleh ledger multipart dan belum ada pada runtime sekarang. Ia dapat memakai own-profile subset yang sudah dibuktikan, nilai asli kantor/desa/hak, snapshot titik formulir, dan byte-handle foto lokal. Tidak perlu menambah operasi API atau mengaktifkan geotag.

Kontrak builder sudah cukup konkret:16key ordered registered dan20key unregistered; literal `id='id'`/`kluster='K4'`; trim hanya field tertentu dengan aturan whitespace native termasuk U+0085; nomor alas hak/bukti pajak tetap raw; scalar null menjadi String kosong; file parts berulang bernama `file` dalam urutan foto. View review sebaiknya menunjukkan isi yang akan dipakai, sumber koordinat yang dilaporkan, disclaimer server yang berlaku dan status **belum dikirim**. Nomor/identitas pribadi tidak dimasukkan ke laporan publik otomatis.

Formatter koordinat harus menerima teks yang secara eksplisit dinyatakan sebagai adaptasi browser atau memakai format yang benar-benar dibuktikan kemudian. Jangan memakai `toFixed(7)` untuk meniru personal writer. Compact-hex filename generator, default MIME resolver, bagian header/body yang belum tertutup, kamera/perangkat, server authorization dan respons produksi tetap dibedakan dari descriptor lokal. **Review lokal tidak cukup untuk mengaktifkan HTTP, mengaku submit diterima, atau mengisi pernyataan kunjungan.**

Peningkatan UX lokal lain yang aman: perjelas deklarasi CRS pada impor/referensi, sediakan pemeriksaan read-only sumber dokumen dan raw masukan sebelum perbandingan, dan tampilkan bahwa source/accuracy/time tidak diverifikasi. Ini memerlukan kontrak/tes baru yang jelas; jangan menyisipkan metadata arbitrer/private ke provenance formulir, karena tes saat ini sengaja mengecualikan `note` dan `original` dari applied provenance. Tidak ada kebutuhan untuk spoofer atau mock-location demi pekerjaan tersebut.

## Pemeriksaan yang dikerjakan dan sumber

53/53 tes existing lulus pada6file berikut: `gnss`, `coordinate-comparison`, `swaplotting-coordinate-entry`, `swaplotting-coordinate-controller`, `swaplotting-coordinate-host`, `swaplotting-coordinate-view`. Semuanya pure/synthetic, tanpa request jaringan, browser aktual, hardware atau provider. Ini subset terarah, bukan rerun seluruh suite atau penerimaan geotag/Swaplotting produksi.

Dokumen native yang dipakai: `GEOTAG-VALIDATION-AUDIT.md`, `SWAPLOTTING-MAP-FOLLOWUP.md`, `SWAPLOTTING-OWNER-FOLLOWUP.md`, `SWAPLOTTING-SERVICE-FOLLOWUP.md`, `SWAPLOTTING-MULTIPART-FOLLOWUP.md`, `SWAPLOTTING-COORDINATE-FORMAT-FOLLOWUP.md`, `SWAPLOTTING-CAPTURE-FOLLOWUP.md`. Rencana implementation-boundary lama menyebut owner unresolved; **owner-followup yang lebih baru** telah membuktikan subset own-profile level2/3 dengan isIkd exactfalse. Karena itu gap lama tidak diulang sebagai blocker own-profile sekarang. Managed-user tetap terpisah.

Pin bukti native yang dibaca:

| File `analysis/recovered/` | SHA256 |
| --- | --- |
| geotag-validation-audit.json | 80607424a210eeb6435808c13fd9b3b6c64717eb67771a8a6e3e4aec2f904bee |
| swaplotting-map-followup/flow.json | 07d83a8a74c6a8ea59cc6b8dc81ffe52473e64e849cd112a4ef1a9db5873fc9a |
| swaplotting-owner-followup/flow.json | 02ecc3c52cf9ee22c73dfe40b0e9a5cbd2327d5c5779285ed1d4ecd71c8ccf22 |
| swaplotting-service-followup/flow.json | f5be07485685102e41ee39e0718f4d241dee0224fd70b3b6e447a37e0bdd65f9 |
| swaplotting-multipart-followup/flow.json | 31e4d9bbbdfdd7d77226d9cde0dfe5f6220311c5233f41382b0d03ae373c833e |
| swaplotting-coordinate-format-followup/flow.json | 5a16064f32b7a5ff5bdc287df724ff6faaf1d3c5ceff9f152f0b5296c1be6fc2 |

Sumber runtime saat pemeriksaan: gnss2534efcc…, comparison7445eff2…, coordinate-entrya4a22638…, Swaplotting controller438515b9…, hostbdc89aa9…, viewfa80965f…, operations51e689d5…, http-apic7a1c58a…. Pin ini konteks sumber audit, bukan klaim bahwa pekerjaan lain setelah audit tidak boleh mengubah berkas tersebut. Tidak ada ledger/verifier lama ditulis ulang.
