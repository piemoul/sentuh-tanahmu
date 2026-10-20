# KKPR: daftar, detail lokal, dan geometri dari APK 6.1.5

Audit statis ini membuktikan bahwa pilihan kartu KKPR membuka detail dari **objek baris yang sama**, tanpa memanggil `apis/GetKKPRDetail`. Daftar berasal dari `GET KKPR/GetKKPRList?nomorIdentitas=...`. Data geometri pada baris juga diteruskan langsung ke peta. Audit tidak mengakses akun, kredensial, sesi browser, atau server produksi.

Artefak: `analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so`, SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. REA memakai hasil Blutter yang sudah ada, dump ARM64 terbatas, dan pemeriksaan ulang instruksi dengan Capstone terhadap ELF asli. Ini bukti struktur program, bukan observasi runtime aplikasi atau penerimaan server.

Ledger mesin: [recovered/kkpr-flow.json](recovered/kkpr-flow.json). Potongan kode: [recovered/kkpr-flow](recovered/kkpr-flow). Pembentuk ledger: [rea/build_kkpr_flow.py](rea/build_kkpr_flow.py). Verifier: [rea/verify_kkpr_flow.py](rea/verify_kkpr_flow.py).

## Permintaan, hasil, dan lifecycle

| Bukti | Perilaku |
| --- | --- |
| `0xd30938`, `0xd309e8`, `0xd309fc` | Controller mengambil nomor identitas dari profil terautentikasi `+0xf`; null menjadi string kosong. Tidak ada parameter identitas bebas baru yang dibuktikan. |
| Builder `0xd30b80`; path `0xd30bf0`; GET `0xd30c18` | `KKPR/GetKKPRList?nomorIdentitas=` diikuti nilai profil. |
| `0xd30c30` | Hanya HTTP 200 masuk jalur hasil normal. |
| `0xd30c38`, `0xd30c6c`, `0xd30c7c` | Membaca body; body String di-decode JSON, lalu membaca tepat `message`. |
| `0xd30d60`, `0xd30d68` | `message` harus List; dipetakan oleh `0x76128c` menjadi `List<pEb>`. Field body `error` tidak dibaca di builder ini. |
| `0xd30d98`, `0xd30dc4`, `0xd30aac..0xd30af0` | Nonlist/null/missing `message` atau HTTP bukan 200 menghasilkan flag error internal dan list kosong; controller memancarkan list kosong. Array langsung di tingkat body bukan kontrak normal native. |
| Factory `0x9fc8bc`; init `0x761200`; bootstrap `0xd307d8` | Widget `aEb` CID 6238 → state `_bEb` CID 5418. Bootstrap memanggil helper otorisasi `0xd1cf2c` dan controller daftar `0xd30938`, lalu memasang listener pencarian/list. Efek otorisasi keseluruhan tidak diaudit. |
| `0x8fa000`, `0x8fa050` | Refresh dan coba lagi memanggil controller daftar. |

Tabel dispatch yang sudah tersedia membuktikan factory, init, dan build melalui rumus `index = 4096 + CID + selector`; 11 entry relevan diverifikasi ulang. Proteksi sesi/autentikasi yang ada tidak diubah oleh temuan ini.

## Model JSON

Parser `pEb` CID 613 di `0x761380` membaca **32 field String?** berikut dengan huruf tepat seperti tertulis. Tidak ada fallback PascalCase. Nilai null dan string kosong tidak disamakan oleh parser.

```text
kkprId, nomor, jenisKkpr, tanggalTerbit, tanggalCetak, kodeKbli,
judulKbli, alamatUsaha, luasDimohon, luasDisetujui, namaPemilik,
koefDasar, koefLantai, indikasiUtama, garisSempadan, jarakBangunan,
koefDasarHijau, koefTapak, jaringanUtilitas, hasilKkpr,
jenisManfaatRuang, judulDelineasiKkpr, indikasiZonasi, kategoriKkpr,
sumberDana, kodeUnik, adaBangunan, jumlahLantai, luasLantai,
kodeIndeks, namaIndeks, nilaiIndeks
```

Offset mulai `+0x7`, bertambah empat byte per field, sampai `nilaiIndeks +0x83`. Ledger mencatat alamat load key, pool key, pemeriksaan tipe, dan store setiap field.

| Field tambahan | Tipe dan perlakuan native |
| --- | --- |
| `geometry` (`+0x87`) | Null tetap null. Nilai nonnull harus `Map<String,dynamic>`, lalu parser `qEb` CID 612 (`0x762288`). |
| `geometry.type` (`+0x7`) | String?. |
| `geometry.coordinates` (`+0xb`) | Dynamic, tanpa pemeriksaan struktur koordinat di parser ini. Renderer melakukan pemeriksaan saat digunakan. |
| `pertimbangan` (`+0x8b`) | Null tetap null. Nilai nonnull dipetakan dan dimaterialisasi menjadi `List<jEb>`. |
| `pertimbangan[].kkprPertimbanganId` | String?, parser `jEb` CID 619 (`0x7623d4`). |
| `pertimbangan[].keterangan` | String?. |

Model tidak membaca field CRS. Field JSON yang tidak dikenal tidak dipakai oleh parser tersebut. Browser dapat menyimpan payload asli untuk pemeriksaan tanpa menampilkannya seolah-olah bagian dari UI native.

## Tampilan daftar dan pencarian

- Judul: **KKPR** (`0x8f94ac`). Placeholder: **Cari KKPR** (`0x8f950c`).
- Keterangan: **KKPR yang ditampilkan terhubung dengan nomor identitas pengguna dan sudah diterbitkan** (`0x8f9700`).
- Kosong: **Kamu belum memiliki KKPR** (`0x8f9cac`), tombol **Coba Lagi** (`0x8f9dfc`). Spinner muncul ketika snapshot belum memiliki data atau flag loading controller aktif.
- Kartu `sEb` CID 5937, build `0xa3aa2c`, memuat tiga baris berurutan: `judulKbli ?? ''`, `nomor ?? ''`, `jenisKkpr ?? ''`. Judul diberi bobot tebal. Tidak ada badge status terpisah yang dibuktikan di kartu ini. Urutan hasil dipertahankan.
- Pencarian lokal `0x7627dc`, predicate `0x762908`: query dan field menjadi lowercase lalu diuji substring. Urutan native: `nomor`, **`nomor` lagi**, `judulKbli`, `jenisKkpr`. Pengecekan kedua nomor redundan; semantik efektif mencakup tiga field tersebut. Tidak ada trim atau request pencarian baru.
- Native menggunakan non-null assertion pada field pencarian yang dievaluasi. Pencarian browser yang aman terhadap null merupakan perbedaan ketahanan yang disengaja. Empat pasangan ASCII lowercase terverifikasi; kesetaraan seluruh Unicode tidak diklaim.

Tap `0xa3aecc` menavigasi melalui `0xa3af2c`. Builder `0xa3af44` membaca seluruh `pEb` dari kartu `+0xb` dan menyimpannya ke widget detail `YDb +0xb` pada `0xa3af78`. Tidak ada transformasi menjadi ID atau parameter `q` dalam navigasi ini.

## Detail lokal

`YDb` CID 6239 → `_ZDb` CID 5419. Init yang dipilih dispatch adalah `0xca30e8`, persis fungsi pengembali null tanpa kerja tambahan. Build `0x8f65c4` langsung membaca objek pilihan. Judul **Informasi KKPR**; header `judulKbli ?? '-'`; subjudul `nomor ?? '-'`; hasil menonjol `hasilKkpr ?? '-'`.

Bagian ringkasan `0x8f8c7c` tampil dengan urutan berikut. Semua fallback adalah null → `-`; string kosong tetap kosong. Tanggal ditampilkan apa adanya, tanpa formatter tanggal.

| Label native | Field |
| --- | --- |
| Nama Pemilik | `namaPemilik` |
| Jenis KKPR | `jenisKkpr` |
| Kategori KKPR | `kategoriKkpr` |
| Kode KKPR | `kodeUnik` |
| Kode KBLI | `kodeKbli` |
| Alamat Kegiatan | `alamatUsaha` |
| Tanggal Terbit | `tanggalTerbit` |
| Luas Dimohon | `(luasDimohon ?? '-') + ' m²'` |
| Luas Disetujui | `(luasDisetujui ?? '-') + ' m²'` |

Setelah ringkasan:

1. Peta hanya jika `geometry != null` (`0x8f6ac4..0x8f6ad8`).
2. **RTR/RDTR Dasar Penerbitan** selalu hadir, nilai `indikasiZonasi ?? '-'`.
3. **Dengan Mempertimbangkan** hanya jika `pertimbangan` nonnull dan tidak kosong (`0x8f6f5c..0x8f6f70`). Setiap item menjadi bullet `• ` + `(keterangan ?? '-')`, dengan urutan asli dan seluruh item.
4. **KETENTUAN**, helper `0x8f75d4`, sembilan baris berikut.
5. Tombol **Lihat Dokumen**, alur terpisah yang belum siap diaktifkan berdasarkan audit ini.

Ejaan label native, termasuk salah ketik dan huruf kecil, dipertahankan:

| Label native | Field |
| --- | --- |
| Jenis Peruntukan | `jenisManfaatRuang` |
| Koefisian Dasar Bangunan Maks. | `koefDasar` |
| Koefisien Lantai Bangunan Maks. | `koefLantai` |
| Koefisien Dasar Hijau Min. | `koefDasarHijau` |
| Indikasi Program Utama | `indikasiUtama` |
| Garis Sempadan Bangunan Min. | `garisSempadan` |
| Jarak Bebas Bangunan Min. | `jarakBangunan` |
| Keofisien Tapak Basement Maks. | `koefTapak` |
| jaringan Utilitas | `jaringanUtilitas` |

Seluruh baris ketentuan memakai fallback null → `-`. Tidak ada request tambahan untuk memperoleh 18 baris tersebut.

## Koordinat dan handoff peta

Mini-map `0x8f7e0c` memanggil polygon builder `0xda61c8` dan center selector `0xda6748`. Hanya tipe tepat `Polygon` dan `MultiPolygon` yang menghasilkan polygon.

| Bukti | Semantik |
| --- | --- |
| `0xda62a4..0xda62fc` | Polygon menggunakan `coordinates[0]`, ring luar. |
| `0xda64f8..0xda6504` | MultiPolygon mengiterasi polygon dan mengambil ring pertama masing-masing. |
| `0xda6358`, `0xda6680` | Daftar holes secara eksplisit kosong. Mini-map native mengabaikan ring lubang. |
| `0x8f8388`, `0x8f83d0`, `0x8f83fc` | Koordinat indeks 1 harus numerik lalu dikonversi ke double. |
| `0x8f8410`, `0x8f8454`, `0x8f8480` | Koordinat indeks 0 harus numerik lalu dikonversi ke double. |
| `0x8f8498..0x8f84d8` | Nilai indeks 1 di-clamp ke `[-90,90]` dan disimpan ke field latitude. |
| `0x8f84e0..0x8f8558` | Nilai indeks 0 dibungkus ke `[-180,180)` dan disimpan ke field longitude. |
| `0xcff684` | Alokasi model koordinat `iUa` CID 1636. |
| `0xda6844`, `0xda6984`, helper `0x8f85c4` | Center adalah rata-rata aritmetika vertex ring pertama; untuk MultiPolygon hanya polygon pertama. Vertex penutup yang berulang ikut rata-rata. |
| `0x8f7eec` | Zoom awal 20. |
| `0x8f8900..0x8f89e8` | Tap menuju widget peta `cEb`; parameter `+0xb = kodeUnik ?? '-'`, `+0xf = geometry` yang sama. |

Urutan sumber adalah **[longitude, latitude]**. Interpretasi angka sebagai derajat geografis disimpulkan dari clamp/wrap di atas; **tidak ada deklarasi CRS dari server atau transformasi proyeksi yang dibuktikan**. Nilai yang tampak seperti koordinat proyeksi tidak boleh diproyeksikan berdasarkan tebakan. Renderer browser dapat membatasi numeric finite/range, mempertahankan urutan `[lon,lat]`, dan membungkus geometri tervalidasi sebagai FeatureCollection.

Pembatasan browser terhadap angka tidak valid, fit-to-bounds, atau pemilihan center berbeda harus dicatat sebagai perbedaan dari native. Jika renderer mempertahankan holes, itu juga berbeda dari mini-map native. Tipe tidak dikenal menghasilkan set polygon kosong; center native memiliki fallback statis yang nilainya tidak perlu dibaca dan tidak diaudit. Kontrol, layer, sumber tile, aksi lokasi, serta perilaku lengkap layar peta yang diperbesar belum termasuk cakupan ini.

## Dokumen dan endpoint detail yang berbeda

Callback **Lihat Dokumen** `0xda6b70` membuat `q` dari `selected.kkprId + ':KKPRKU'` (`0xda6c1c..0xda6c50`). `name` berasal dari field statis offset `0x1780`, dibaca pada `0xda6bf0`, null menjadi `-`. **Makna dan asal pengisian field name belum terbukti.** Jangan menebak bahwa nilai itu sama dengan nama pemilik, nomor KKPR, atau nomor identitas.

Helper `0xd41dd0` dipanggil pada `0xda6cc8`; prefix transport yang diaudit menunjukkan `POST apis/GetDocument`, form `q,name`, `application/x-www-form-urlencoded`, opsi respons bytes. Jalur normal meminta HTTP 200, `List<int>`, dan ukuran lebih dari 200 byte. Pengikatan `name`, pemilihan transport, validasi file lengkap, serta lifecycle pembukaan file harus dituntaskan sebelum mengaktifkan aksi. Ini bukan download SPS `dokumen/GetDokumen`.

`POST apis/GetKKPRDetail` memang ada secara terpisah: builder `0xd31134`, call `0xd311e8`, form `q`. Namun navigasi kartu, init detail, dan build detail yang diaudit **tidak memanggil service/controller tersebut**. Pemetaan `q` dari kartu tidak dibuktikan. Nama endpoint saja tidak membenarkan menghubungkannya ke pilihan daftar.

## Verifikasi dan batas cakupan

Jalankan dari root workspace:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/build_kkpr_flow.py
& tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_kkpr_flow.py
```

Hasil: **25 hash sumber**, **6.609 instruksi tepat dari ELF**, **38 field model**, **11 entry dispatch**, **4 pasangan lowercase ASCII**, dan **5 konstanta koordinat** terverifikasi; **0 panggilan produksi**. Verifier memeriksa hash biner, instruksi, literal key yang dibatasi, tipe/store model, binding UI, cabang kondisi, navigasi, dan bukti kontrak permintaan. Hasil ini tidak membuktikan penerimaan server, visual native pada perangkat, seluruh fungsi map, atau alur dokumen akhir.

Untuk pengujian frontend, gunakan fungsi implementasi asli dengan fixture sintetis: envelope message valid/invalid, tipe dan kapitalisasi field, null versus kosong, tiga field pencarian tanpa trim, escape HTML, urutan 18 baris, seluruh pertimbangan, detail lokal tanpa request, Polygon/MultiPolygon ring luar, serta tombol dokumen yang tetap tidak mengirim permintaan selama parameter belum terbukti. Semua pengujian integrasi akun dan produksi merupakan pekerjaan terpisah dari ledger statis ini.
