# Aktivitas: dokumen non-PBT, metadata, dan viewer PDF

Alur Aktivitas non-PBT dapat menggunakan unduhan dokumen yang sudah dibuktikan: **POST `apis/GetDocument`**, kemudian **POST `apis/GetDocumentType`**, keduanya memakai **contentId utuh sebagai q**. Native tetap menuju viewer setelah metadata gagal. Hanya hasil boolean `showRoute` dipakai oleh builder viewer; `error` dan `type` hasil metadata tidak dipakai. PDF yang sudah tervalidasi sebaiknya tetap tersedia ketika metadata gagal dibaca.

Audit statis ini memakai APK Sentuh Tanahku 6.1.5 ARM64, SHA-256 ELF `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Tidak ada request produksi, pembacaan credential/sesi pengguna, mutasi server, perubahan app/backend/tests, atau perubahan shared Blutter. Ledger dan verifier berada di [recovered/activity-document-flow.json](recovered/activity-document-flow.json), [recovered/activity-document-flow](recovered/activity-document-flow), [build_activity_document_flow.py](rea/build_activity_document_flow.py), dan [verify_activity_document_flow.py](rea/verify_activity_document_flow.py).

## Masuk dari item Aktivitas

[ACTIVITY-FLOW.md](ACTIVITY-FLOW.md) sudah membuktikan urutan router. Cabang yang relevan adalah lower(activityType) mengandung `scandokumen`, setelah cabang bidang/berkas/antrian, dan lower(subTitle) **tidak** mengandung `pbt`. Cabang PBT tetap memakai alur bidang yang terpisah.

Helper `0xd87754` menyimpan q pada context `+0xf`. Ia mengambil nama dari slot statis `0x1780` (`0xd877e4`); slot null menjadi string kosong (`0xd877f0`). Asal slot adalah **`account/account_summary.data.nama`**, sesuai [KKPR-DOCUMENT-FLOW.md](KKPR-DOCUMENT-FLOW.md). Tidak ada penggantian dengan username, NIK, atau nama dokumen. Tidak ada suffix `:KKPRKU`, pemotongan colon, atau transformasi q dalam helper Aktivitas ini.

Urutan lengkap helper:

1. `GetDocument(q,name)` pada `0xd8780c`, await `0xd87818`; path hasil disimpan context `+0x13` (`0xd87820`).
2. `GetDocumentType(q)` pada `0xd8784c`, await `0xd87858`; tuple hasil disimpan context `+0x17` (`0xd87860`).
3. Builder `0x87ea4c` dipasang (`0xd878a8`) dan navigasi dipanggil (`0xd878c0`).

Tidak ada pemeriksaan metadata.error, metadata.type, atau kode error path di antara langkah tersebut. Exception yang lolos helper ditangani cabang luar `0xd878c8`, yang selesai tanpa hasil UI baru. Kekurangan native berupa kode error `1001`–`1009` sebagai calon pathname juga berlaku di sini; browser tidak perlu menirunya. Download harus berhasil sebagai PDF tervalidasi terlebih dahulu.

## Kontrak GetDocumentType dan seluruh fallback

Helper `0xd41720` memakai **main client FRb**, diambil melalui service `+7` lalu client `+7` (`0xd41758..0xd41760`). Konteks Authorization/refresh/TLS normal yang sudah tersedia tetap dipakai. Request **POST `apis/GetDocumentType`** (`0xd417bc`, call `0xd417d4`) adalah form-urlencoded (`0xd417a8`) dengan tepat satu key **`q`** (`0xd4177c`) dan nilai yang sama dengan unduhan.

HTTP **200** diperlukan (`0xd417f0`); body null langsung memakai fallback (`0xd41804`). Di cabang HTTP200/non-null, key bersifat case-sensitive dan diproses sebagai berikut:

| Field | Tipe dan aturan native | Bukti |
| --- | --- | --- |
| `error` | bool; null/missing menjadi **true**. Nilai selain bool menghasilkan fallback keseluruhan. | `0xd41808`, default `0xd41830`, tipe `0xd41868` |
| `data.showRoute` | int; hanya nilai **1** menghasilkan true. Integer lain menghasilkan false. | key `0xd418bc`, tipe `0xd4191c`, perbandingan `0xd419f4` |
| `data.type` | String; null/missing menjadi **`''`**. Nilai nonstring menghasilkan fallback keseluruhan. | key `0xd4196c`, default `0xd41994`, tipe `0xd419d4` |

Aturan `showRoute` null perlu diperhatikan: native terlebih dahulu menggantinya dengan **String kosong** (`0xd418e4`), lalu memeriksa tipe **int**. Pemeriksaan ini gagal dan catch mengembalikan fallback keseluruhan. Dengan demikian `data` null/missing, `showRoute` null/missing, string angka, bool, atau tipe salah bukan bentuk sukses dengan nilai 0. Ia menjadi fallback `(true,false,'')`. Kesalahan bentuk body/data yang memicu kegagalan akses atau tipe juga masuk catch tersebut.

Tuple `yVb<bool,bool,String>` memakai `+0xb = error`, `+0xf = showRoute === 1`, dan `+0x13 = type` (`0xd41a08..0xd41a14`). Fallback konstan pool **`0x34ce0`** telah diekspor secara allowlist dan berisi tepat **`(true,false,'')`**. HTTP bukan 200/body null memuatnya pada `0xd41a20`; exception/type/decode/access failure memuatnya pada `0xd41a30`.

`error:true` tidak menghentikan parsing. Misalnya bentuk bertipe valid `{error:true,data:{showRoute:1,type:'KKPR'}}` menghasilkan `(true,true,'KKPR')`. Tidak ada pesan error mentah dari helper ini yang dikembalikan atau ditampilkan. Respons server aktual belum diobservasi.

## Apa yang benar-benar diteruskan ke viewer

Builder `0x87ea4c` mengambil path hasil unduhan dari context `+0x13`, memeriksanya sebagai **String nonnullable** (`0x87eaa8`), lalu membangun File lokal. Widget **yGb** menerima:

| Offset yGb | Nilai dari cabang Aktivitas |
| --- | --- |
| `+0xf` | File dari path hasil GetDocument (`0x87eb1c`) |
| `+0x17` | q lengkap yang sama (`0x87eb24`) |
| `+0x1b` | Hanya tuple `+0xf`, boolean showRoute (`0x87eb08`, `0x87eb2c`) |
| `+0x1f`, `+0x23` | true (`0x87eb34`, `0x87eb38`); seluruh penggunaan lanjutan kedua flag tidak diperluas |
| `+0x27` | false (`0x87eb40`), melewati cabang post-load opsional |
| `+0x2b` | **String kosong literal**, bukan tuple.type (`0x87eb44..0x87eb48`) |

Tuple.error dan tuple.type tidak dibaca builder. Tidak ada judul dari title/subTitle item Aktivitas yang diteruskan. Karena judul widget tetap null, build viewer `0x9168d0` memakai **Dokumen Elektronik** (`0x916930`).

Lifecycle viewer memakai dispatch yGb CID6212 → `0x9ff33c`; state zGb CID5394 init → `0x7798ec`; build → `0x9168d0`. Init memanggil downloader `0xd3e0e8`, yang langsung mengembalikan File nonnull (`0xd3e128..0xd3e13c`). Tidak ada unduhan PDF kedua dan pemeriksaan `%PDF` cabang URL SPS tidak dijalankan lagi. Karena `+0x27=false`, post-load `0xd3d61c` melewati helper opsional pada `0xd3d69c` dan memperbarui state melalui `0x77acdc`.

Tampilan file memakai Future<File>. Keadaan memuat memiliki teks **Memuat dokumen...** (`0x917108`); snapshot waiting juga menghasilkan indikator progres (`0x91722c..0x917264`). Error snapshot atau data File yang tidak ada menampilkan **Gagal memuat dokumen, silakan coba lagi.** (`0x91729c`). File yang ada diteruskan ke komponen PDF (`0x9172fc..0x917480`). Audit ini tidak mengklaim seluruh kemampuan atau error internal SDK PDF.

Toolbar juga memiliki cabang terpisah dengan tag `digitalSignature`; aksi tersebut tidak diperluas dan tidak diperlukan oleh rekonstruksi baca/unduh ini. Flag post-load false membuktikan cabang tertentu dilewati, bukan bahwa seluruh antarmuka tanda tangan tidak ada.

## Ikon lokasi dan batas alur peta

`yGb+0x1b=true` menampilkan ikon lokasi; false menggantinya dengan widget kosong (`0x916abc`, cabang `0x916b20`). Elemen memakai tag **`location`** (`0x916bdc`) dan IconData MaterialIcons codepoint `0xe3ac`. Tidak ditemukan label teks untuk ikon tersebut dalam toolbar yang diperiksa. Callback adalah **`0xdac770`**, terikat di `0x916b74`. State `+0x2f` mencegah klik ulang selama callback berjalan: helper `0x6999cc` menyetel true dan `0x69a0a0` menyetel false setelah navigasi kembali.

Callback lokasi membandingkan widget `+0x2b` dengan literal `PetaBidangElektronik` dan `KKPR`. Namun builder Aktivitas selalu mengisi `+0x2b=''`, sehingga cabang Aktivitas menuju **generic mFb** melalui `0x917624`, terlepas dari nilai metadata.type yang diterima. q tetap lengkap dan disimpan pada **mFb `+0xb`** (`0x917654`, `0x917670`), dengan flag `+0x13=true`, `+0x17=false`. Ini **bukan** parameter persilid pada `+0xf` yang dipakai peta koleksi/sertipikat.

Batas pembacaan awal peta dapat dibuktikan tanpa memperluas UI peta:

`mFb+0xb` → init `0x770190` membaca `0x7701d4` → named argument **cth** ke constructor `0x770384` → controller `+7` (`0x770950`) → cabang `0x7709a0` memanggil `0xd39b74` → helper `0xd39e50` → **GET `/apis/getGeoJsonInfo`** (`0xd39f0c`, call `0xd39f1c`) dengan query key **q**.

Nilai q melewati wrapper `0x76e07c → 0x42ded4` sebelum masuk query (`0xd39ec4`); detail transformasinya belum dituntaskan. Model respons, render geometri, seluruh kontrol peta, dan permintaan tambahan setelah pembacaan awal tidak diaudit di sini. Ikon tidak berarti ada submisi koordinat. Webapp dapat menandai lokasi belum tersedia sampai alur GeoJSON dokumen dituntaskan, tanpa menebak q sebagai persilid.

## Kontrak implementasi browser

1. Gunakan nama dari ringkasan akun sesi aktif, dengan envelope HTTP200/error:false/data-object yang dikenali dan aturan `nama` null/missing menjadi `''`. Gunakan contentId utuh dari item terpilih sebagai q untuk kedua request.
2. Unduh dengan adapter GetDocument yang sudah ada dan validasi HTTP200, >200 byte, awalan `%PDF`, serta batas 20 MiB. Ini sengaja lebih kuat daripada pemeriksaan panjang native.
3. Setelah PDF sukses, minta GetDocumentType. Kegagalan metadata dapat menghasilkan peringatan lokal sambil mempertahankan link PDF yang sudah valid; jangan mengganti file sukses menjadi error total. Kegagalan sesi tetap mengikuti invalidasi sesi yang sudah ada.
4. Jangan memakai metadata.type sebagai judul atau memilih route berdasarkan nilai tersebut untuk cabang Aktivitas ini. Jangan mensyaratkan metadata.error=false agar PDF tetap tersedia. Bila metadata ditampilkan di browser, bedakan itu sebagai tambahan tampilan browser.
5. Preview/unduhan tetap milik sesi dan memakai route lokal yang tersedia. Tidak ada URL bebas, origin baru, credential baru, pelemahan TLS/attestation, signature upload, telemetry, penghapusan, atau mutasi GPS yang diperlukan oleh flow baca ini.

Peringatan metadata, tombol browser, dan pembatasan PDF adalah keputusan implementasi webapp, bukan salinan literal semua perilaku UI native. JSON pada browser juga tidak mempertahankan pembedaan representasi int/double setelah parsing; validasi nilai harus tetap menolak string/bool/fractional, tanpa mengklaim semua detail tipe Dart identik.

## Verifikasi dan batas

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/build_activity_document_flow.py
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_activity_document_flow.py
```

Verifier lulus: **22 hash sumber**, **4 ledger dependensi**, **1.771 instruksi tepat dari ELF**, **3 objek metadata allowlist**, dan **5 entry dispatch**. Tidak ada request produksi. Verifikasi ini membuktikan identitas dan konsistensi bukti statis, bukan penerimaan server atau uji akun nyata.

Yang masih dibatasi: contoh respons runtime, keberhasilan unduh akun nyata, detail encode q GeoJSON, model/render/aksi peta dokumen, seluruh kontrol SDK PDF, optional signature workflow, efek bootstrap platform, dan kebijakan server terkini. Bukti ini cukup untuk alur Aktivitas → PDF sesi sendiri → pembacaan metadata dengan penanganan kegagalan terpisah.
