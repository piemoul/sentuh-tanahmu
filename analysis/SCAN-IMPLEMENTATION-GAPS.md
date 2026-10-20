# Scan: gap implementasi yang perlu ditutup

Review read-only 19 Oktober 2026 ini membandingkan implementasi manual pada `app.js` SHA-256 `bd52dd13091b5e0125117d2010d2eadd89462689540ecbe30797e2e48eacd46e` dengan [audit Scan native](SCAN-FLOW.md) dan [ledger beku](recovered/scan-flow.json). Ini catatan sebelum implementasi Scan baru; bukan status deployment. Tidak ada kamera, akun nyata, endpoint atau submisi yang dijalankan.

## Klasifikasi efek yang benar

`apis/scanDocument` belum terbukti sebagai mutasi server. Flag katalog `effect:'write'`, `mutates:true` berasal **heuristik nama** pada [generator registry](../webapp/private/build-operations.py): operasi POST yang belum enabled dan tidak cocok pola `Get|Check|Cari|Simulasi|/all|last_user_review|account_summary` diberi label write. Callsite `0xd42440` tidak termasuk daftar `write_calls` eksplisit. Label tersebut bukan bukti adanya write, dan nama classifier/response tuple juga bukan bukti bahwa endpoint bebas logging atau efek persisten.

Bukti native yang tersedia sudah lebih luas daripada request-only: [helper klasifikasi](recovered/scan-document-caller/scan-classification-request.asm.txt), `0xd4232c..0xd4273c`, membuktikan POST form `q/name`, HTTP 200, parsing direct Map atau satu String JSON, serta tuple `(message,data)`. Efek pada server tetap **unknown**. Audit client tambahan dapat memisahkan panggilan klasifikasi dari aksi aktivasi berikutnya, tetapi tidak dapat membuktikan ketiadaan write di implementasi server yang tidak tersedia.

## Gap konkret pada snapshot web yang direview

| Bagian | Perbedaan yang memengaruhi implementasi |
|---|---|
| Kamera dan lifecycle | `flowDefinitions.scan` masih empat tab formulir. Tidak ada `getUserMedia`, decoder barcode, preview kamera atau penutupan stream/decoder pada navigasi/logout. Kamera dan input manual perlu menghasilkan satu raw `q` yang sama; tidak perlu menebak jenis dokumen dari prefix atau membuka URL hasil barcode. Izin, kegagalan perangkat/decoder, duplicate detection dan pembersihan stream perlu diuji sebagai perilaku browser tersendiri. |
| Urutan request | `runFlow` mengeksekusi hanya operasi tab yang dipilih. Native selalu mengklasifikasikan dahulu; empat tab GetDocumentType/KKPR/PBT/GetDocument bukan empat alternatif yang dibuktikan untuk main Scan. |
| Nama profil | Form GetDocument masih menerima `name` input/default kosong. Helper dokumen Aktivitas/KKPR memakai `nama ?? ''`, sehingga tidak dapat dipakai tanpa perubahan untuk main Scan yang memerlukan `nama ?? email ?? '-'`. Null profile bukan fallback; string kosong/spasi tetap dipertahankan. |
| Envelope classifier | [ApiClient](../webapp/private/api-client.mjs) generik menolak `data.error === true`. Native classifier menerima kedua nilai bool dan meneruskan `message/data` yang sama. Mengaktifkan registry saja akan memutus routing pada respons yang valid menurut native. `message` null/missing menjadi `Unknown Error`; `data` wajib String, termasuk boleh kosong. |
| Kegagalan classifier | Native non-200/exception memberi tuple `('error','1009')`, lalu caller masih masuk cabang dokumen karena selector ialah message. Web yang menghentikan alur pada error transport harus menyatakannya sebagai adaptasi, bukan menyamakan tuple classifier dengan error kode hasil GetDocument. |
| PDF dan metadata | Form manual tidak menyusun GetDocument → guard hasil → GetDocumentType → viewer. Link PDF sesi yang ada dapat dipakai, tetapi batas `%PDF`, >200 byte dan 20 MiB merupakan guard web. Native main viewer meneruskan `metadata.type`, berbeda dari Aktivitas; metadata gagal tidak menghilangkan PDF sukses. |
| Routing lokasi | `GetParcelBoundaryById` memilih **data classifier sebagai persil ID**. Cabang dokumen tetap memakai **q barcode asli**. Main viewer `type=PetaBidangElektronik/KKPR` mempunyai routing khusus; mengganti semuanya dengan lokasi generik Aktivitas tidak setara. |

[Probe manual terdahulu](webapp/scan-document-before-fix.json) memakai hash sumber lama dan tetap historis; tabel di atas diperiksa kembali pada source saat review, tanpa mengulang probe atau menjadikan laporan lama sebagai hasil pengujian build kini.

## Bukti native tambahan yang paling sempit

1. **Batas aktivasi:** ikat `0xd427f4 → 0xd41a40('1010', classification.data)` ke dialog/callback, dan petakan request yang benar-benar dikirim oleh callback tersebut. [Closures yang sudah disimpan](recovered/scan-document-caller/scan-route-closures.asm.txt) cukup sebagai titik awal. Ini memisahkan classification dari aksi pengguna/aktivasi lanjutan; tidak mengubah validasi kehadiran atau membuktikan efek server classifier. Cabang aktivasi dapat tetap diberi status belum tersedia dalam alur baca yang terbatas.
2. **Lokasi bertipe:** ikat `yGb+0x2b` pada callback `0xdac770`, khusus dua branch `PetaBidangElektronik` dan `KKPR`, hingga constructor/ID request awal masing-masing. [Audit viewer Aktivitas](ACTIVITY-DOCUMENT-FLOW.md) sudah membuktikan comparator dan branch generik; belum cukup untuk memakai GetPBTElDetail/GetKKPRDetail berdasarkan tebakan tab.
3. **Bidang langsung:** telusuri `0x77ece8 → mFb+0xf` sampai init/controller yang membaca persil ID dan flag `true/false`; bedakan dari `mFb+0xb` yang membawa q dokumen. Ini dapat menggunakan bukti peta yang sudah ada tanpa mengaudit seluruh basemap.
4. **Kamera:** ikat pemanggilan sebelum navigasi pada `0xd75890 → 0xce969c`, dispose state scanner dan callback resume/back untuk memastikan penghentian duplikasi dan masa hidup native. Browser tetap memerlukan uji stream/decoder sendiri; nama API browser atau tampilan preview tidak membuktikan parity kamera APK.

Parser classifier, pengikatan nama dari summary sesi, orchestration dan renderer error dapat diuji sepenuhnya dengan fixture. Implementasi klasifikasi yang dipicu pengguna dapat memisahkan konfirmasi request berpotensi berefek dari routing baca; tidak perlu memaknai semua POST sebagai submisi administrasi atau menjalankan aktivasi/geotag untuk menyelesaikan bagian baca.

## Komponen parser setelah review

[scan-response.mjs](../webapp/private/scan-response.mjs) kini menyediakan `decodeScanClassification(body) → {message,data}` dan `scanProfileName(result) → String`, tanpa mengaktifkan endpoint atau mengirim request. Classifier memvalidasi kedua nilai Boolean `error` lalu mengembalikan tuple yang sama; handling HTTP dan fallback native berada pada caller. Nama memakai validator envelope/18 field `ayb` dari [kontrak profil](QUEUE-PROFILE-CONTRACT.md), kemudian fallback khusus Scan. Batas validator profil tetap sama: decoded object, main success envelope, integer aman JS, tanpa sumber profil browser atau fallback sign-in. Gate eligibility Antrian tidak diterapkan untuk nama Scan.

[Dua belas tes parser Scan](../webapp/tests/scan-response.test.mjs) dan 12 tes validator profil yang dipakai kembali lulus **24/24**, nol gagal, 104,5353 ms. Pengujian mencakup bool error true/false, default/null/kosong, larangan decode kedua, seluruh tipe profil, preservation String, accessor/prototype dan sanitasi error. Ini uji komponen sintetis tanpa jaringan; bukan validasi orchestration, kamera, UI, deployment atau server.
