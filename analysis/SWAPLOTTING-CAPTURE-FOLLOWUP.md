# Swaplotting: kamera dokumen dan draf foto lokal

Audit REA statis ini menutup jalur lokal dua formulir Swaplotting sampai hasil foto masuk ke model. Tidak ada perubahan aplikasi, request, akun, OTP, kamera, galeri, GPS, atau upload yang dijalankan. Bukti berasal dari ELF dan pool yang sama dengan empat ledger Swaplotting sebelumnya.

Ledger final: [flow.json](recovered/swaplotting-capture-followup/flow.json), SHA256 `468b6f6c3c20af3ecd764b9b9bdb4e6c87607ea982424df5dad20630d531b381`.

Verifikasi independen: [verification.json](recovered/swaplotting-capture-followup/verification.json), dengan [verifier](rea/verify_swaplotting_capture_followup.py). Hasil **PASS**: 23 jendela baru / 4.949 instruksi, 7 jendela warisan / 4.618 instruksi, total 9.567 instruksi unik; 132 binding pool, 20 record publik, 7 binding dispatch dan 135 pemeriksaan semantik. Sebanyak 795 berkas bukti/dokumen terdahulu tetap sama. Writer juga memeriksa 75 hash runtime baseline saat audit, tanpa mengubahnya. Pemeriksaan runtime ini merupakan konteks audit, bukan larangan terhadap implementasi berikutnya.

## Alur yang terbukti

| Tahap | Bukti positif dan batasnya |
|---|---|
| Tambah | Registered `8ce4b0`, unregistered `8d596c`: bila parameter path lama null dan panjang daftar >=5, tampilkan **Maksimal 5 foto** dan jangan buka kamera. Tidak ada pemeriksaan maksimum kedua pada callback hasil. |
| Layar bersama | Kedua builder memanggil allocator `d9dd40` → widget **rTb, CID 6125**; dispatch createState → `a06900` → **sTb, CID 5308**. Judul **Ambil Foto Sertipikat** dan instruksi **Pastikan Sertipikat masuk kedalam kotak dibawah ini**. |
| Akses kamera | `KRb` melalui DI mengawali enumerasi kamera `List<wN>` via singleton `ML._ELd`. State mempunyai jalur pemeriksaan/permintaan izin kamera sebelum inisialisasi. Jalur penolakan menampilkan **Gagal akses kamera** dan **Sentuh Tanahku membutuhkan akses kamera untuk upload dokumen.** Kesiapan enumerasi tidak dijamin hanya oleh konstruksi layar. |
| Konfigurasi | Konstruktor controller `7d1244` memasang enum **DN.medium**, indeks 1. Ini membuktikan preset; ukuran piksel, JPEG quality, dan konfigurasi Android sebenarnya belum terbukti. |
| Ambil | Callback shutter `9dca58` → `de0040` → `de01d8` menggunakan **takePicture**; controller memeriksa status belum siap/disposed/pengambilan sebelumnya dan menunggu hasil platform. Ini jalur kamera eksplisit, bukan bukti pemakaian image_picker atau galeri. |
| Preview | Hasil berkas lokal menjadi path pada state `+0x13`, dirender sebagai preview File. Setelah ada path, tombol **Foto Ulang** dan **Pakai Foto Ini** muncul. Foto ulang mengosongkan path; memakai foto memanggil callback widget `+0x17` dengan path tersebut dan menutup route kamera. |
| Hasil tambah | Callback memeriksa String, menyalin `List<String>`, lalu menambahkan path hasil. Daftar/model ini lokal; callback tidak mengirim formulir. |
| Hasil pengambilan ulang | Parameter opsional merupakan **path lama String, bukan indeks angka**. `List.map` mengganti semua elemen yang sama dengan path lama menggunakan path baru; urutan dan elemen lain tetap. Jalur ini melewati batas tambah lima foto. |
| Hapus | Dialog **Hapus Foto** / **Apakah Anda yakin ingin menghapus foto ini?** dengan **Batal** dan **Hapus**. Filter mempertahankan elemen yang tidak sama dengan path terpilih; seluruh path yang sama terhapus dari daftar. Tidak ada penghapusan berkas filesystem dalam callback hapus formulir yang lengkap ini. |
| Model | Named parameter obfuscated **Lyj** mengisi registered **eCb+0x33**, unregistered **hCb+0x4b**. Clone dipublikasikan melalui subject controller. Ledger layanan lama mengikat daftar path ini ke file factory `8d1ddc`; itu batas upload terpisah. |

## Batas berkas dan SDK

Hasil platform dibungkus sebagai **sO/XFile-style** yang menyimpan File dan path asalnya. Aplikasi juga menyusun tujuan dari hasil helper direktori, `/`, nilai dari DateTime, dan `.jpg`, lalu memanggil wrapper salin berkas. Callback pembaruan state tidak menunggu Future salinan tersebut; path yang ditampilkan dan dikembalikan tetap berasal dari berkas hasil pengambilan, bukan path tujuan salinan. Helper direktori, jam, keberhasilan salinan dan kebijakan pembersihan berkas belum ditutup oleh audit ini. Sufiks `.jpg` tidak membuktikan MIME atau encoding byte.

Dua implementasi SDK yang ada dalam ELF terikat secara positif ke selector `ML.takePicture`, tetapi pemilihan singleton/bootstrap runtime **belum terbukti**:

- **tN, CID 4327**: `e0a3a8` mengirim `cameraId` ke **plugins.flutter.io/camera**, method **takePicture**, menunggu path String dan membungkus berkas hasil.
- **LL, CID 4328**: `e0824c` menuju helper pesan `e08420` dengan channel **dev.flutter.pigeon.camera_android_camerax.ImageCapture.takePicture**; respons diperiksa sebagai String nonnull dan dibungkus menjadi berkas hasil.

Audit berhenti di batas Dart/SDK tersebut. Handler Android, pipeline CameraX, hardware, byte gambar, MIME, resolusi aktual, EXIF/orientasi, quality, kompresi, crop, watermark, provenance, kesegaran dan aturan server belum terbukti. Tidak ditemukan operasi decode/re-encode/crop/compress/watermark eksplisit pada wrapper aplikasi lengkap antara takePicture dan pengembalian path yang diperiksa; ini bukan klaim bahwa SDK/Android tidak memproses gambar, atau tidak ada aturan lain di seluruh aplikasi. Lifecycle dispose dan pensiunan callback async native juga belum ditutup.

## Implementasi browser yang didukung bukti

Batch berikutnya dapat mengimplementasikan kamera browser yang dimulai pengguna, preview, pakai/foto ulang, serta tambah/ganti/hapus draf foto lokal dengan batas tambah lima dan validasi agregat tidak kosong. API kamera browser, preferensi kamera environment, Blob/object URL sementara, MIME/encoding browser dan pemilihan ukuran merupakan **adaptasi browser yang harus dinyatakan**, bukan kesetaraan byte Android. Hentikan track dan pensiunkan callback ketika route/sesi berakhir; lepaskan object URL pada penggantian, penghapusan dan disposal. Jangan mengimpor galeri secara diam-diam atau menandainya sebagai foto kamera baru.

Hasil lokal ini tidak membuktikan identitas dokumen, kepemilikan tanah, penerimaan hukum, posisi GPS, kunjungan fisik atau freshness terverifikasi. Audit ini tidak mengaktifkan upload/submit, OTP/AddUser, perubahan geotag, watermark buatan maupun bypass presence/attestation. Keberhasilan end-to-end server belum diuji.

## Reproduksi dan preservasi

```powershell
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_swaplotting_capture_followup.py
```

Verifier membandingkan setiap instruksi ke ELF `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`, memvalidasi load/record pool `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`, metadata kelas, dispatch, dan pemeriksaan cabang/field publik. Verifier tidak mengimpor writer atau menjalankan aplikasi/plugin.

Empat ledger UI/service/map/owner, receipt, dokumen dan bukti lama dilestarikan. `flow.initial-range-draft.json` dan beberapa keluaran eksplorasi di direktori baru disimpan sebagai konteks historis nonfinal: kandidat awal mencakup lima instruksi prefix metode berikutnya. Flow final memakai batas tepat `7d1494` dan `e0a510`, serta nama proof `-exact`; hanya flow final di atas menjadi kontrak audit. Tidak ada klaim semantik dari prefix tambahan tersebut.
