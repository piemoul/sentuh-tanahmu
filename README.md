# Sentuh Tanahku — workspace analisis

**Checkpoint 22 Oktober 2026:** source saat ini mencakup Buku Tamu/Simpan, Rating Berkas, Perjalanan Berkas, Rating PPAT, personal Swaplotting, Sertipikat Hilang/ulasan, Yuridis, pencarian bidang, integrasi Koleksi/PERSIL dan sinkronisasi sesi. Katalog **176 record / 94 aktif** bukan jumlah fitur yang sudah setara penuh dengan APK.

Suite lengkap pada workspace analisis lulus **2.520/2.520 tes**. Uji Buku Tamu terbaru mencakup **14 pemeriksaan browser**, termasuk 11 kelompok DOM fungsional, menggunakan data dan transport sintetis. Penerimaan transaksi produksi dan seluruh menu 1:1 belum terbukti. [Status checkpoint](analysis/CHECKPOINT-2026-10-22.md), [arsitektur](docs/ARCHITECTURE.md), [validasi](docs/VALIDATION.md), dan [peta Graphify](.graphify/GRAPH_REPORT.md).

Tes clone source: `cd webapp` lalu `npm run test:portable`. Runner menerapkan pengecualian bernama untuk bukti privat/historis yang tidak dipublikasikan; cakupannya lebih sempit daripada suite penuh. Seluruh source tes tetap disertakan. Lihat [scope portable](docs/PORTABLE-TEST-SCOPE.md).

**Publikasi source:** APK/ELF/pool, PKI, kredensial, `.env`, sesi dan data akun/log live tidak disertakan. Sejumlah tautan bukti pada audit historis merujuk artefak lokal yang memang tidak tersedia dalam clone. Konfigurasi layanan asli memerlukan artefak lokal yang diprovisikan secara sah. Repo tidak membagikan akses layanan. Unggah geotag dan booking akhir yang memerlukan FCM tetap dibatasi.

Docker Desktop melayani [localhost:4173](http://localhost:4173/). Rebuild/checkpoint lokal terbaru dicatat terpisah dalam `docs/VALIDATION.json`; hasil deployment tidak berarti penerimaan server BPN. Token sesi tetap berada di memori backend.

## Catatan rilis historis sebelum checkpoint ini

Angka tes, status adapter, dan batas fitur pada catatan berikut merekam sumber saat rilis masing-masing. Gunakan checkpoint di atas untuk status terbaru.

**Aksi Item Koleksi:** Edit Caption dan hapus item root kini mengikuti [audit edit](analysis/COLLECTION-ITEM-EDIT.md) dan [audit delete](analysis/COLLECTION-ITEM-DELETE.md). Caption mengganti judul; edit memakai cache baris terkini, sedangkan delete menyaring snapshot sebelum request setelah lookup ID pertama. Keduanya tanpa GET. Clone edit mempertahankan perilaku native groupId lokal menjadi null; efek membership server belum terbukti. [Rekap rilis](analysis/webapp/collection-item-actions-verification-summary.json): 417 tes Node, 1190 pemeriksaan fungsi/23 suite (74 terfokus sudah termasuk), 53 uji browser sintetis. Docker/aset publik cocok; 176 skema/75 adapter. Tidak ada mutasi akun produksi. Seluruh parity dan submisi geotag belum selesai.

**Rilis Aksi Grup sebelumnya:** Tambah ke Grup, Hapus Grup dan pelepasan dari grup kini mengikuti [audit assignment/removal](analysis/COLLECTION-GROUP-MOVE.md) dan [audit delete](analysis/COLLECTION-GROUP-DELETE.md). Assignment/removal memaksa refresh baris+grup; Hapus Grup hanya memfilter cache grup lokal. Dua skema DELETE tambahan memakai konfirmasi serta adapter path terbatas. [Rekap rilis](analysis/webapp/collection-group-actions-verification-summary.json): 401 tes Node, 1116 pemeriksaan fungsi/22 suite (81 terfokus sudah termasuk), dan 42 uji browser sintetis. Tidak ada mutasi akun asli. Docker/aset publik cocok, preview anonim; 173 skema/72 adapter. Efek server, seluruh parity dan submisi geotag belum terbukti.

**Rilis Buat Grup sebelumnya:** tombol dan formulir khusus kini mengikuti [audit APK](analysis/COLLECTION-GROUP-CREATE.md), termasuk trim nama, cegah submit kosong, status menyimpan dan refresh grup saja. Adapter memvalidasi model respons nullable bool/String/String pada HTTP200. [Rekap rilis](analysis/webapp/collection-group-create-verification-summary.json): 389 tes Node, 1035 pemeriksaan fungsi/21 suite (50 terfokus sudah termasuk), dan 21 uji browser sintetis. Tidak ada mutasi akun produksi yang dijalankan. Docker dan aset publik cocok; preview masih meminta login. Mutasi Koleksi lainnya, submisi geotag dan parity penuh belum selesai.

**Rilis baca Koleksi sebelumnya:** tab **Berkas/Bidang**, kartu bidang, jumlah/isi grup serta pembukaan peta kini mengikuti [audit baca APK](analysis/COLLECTION-GROUPS-FOLLOWUP.md). Isi grup memakai snapshot Koleksi yang sama, tanpa endpoint detail baru. Dua adapter Koleksi memvalidasi model HTTP200 sebelum mengikuti semantik native. [Rekap rilis](analysis/webapp/collection-groups-verification-summary.json): 377 tes Node, 985 pemeriksaan fungsi/20 suite (79 terfokus sudah termasuk), dan 25 uji browser desktop/mobile. Fixture mencatat 27 panggilan API serta 24 tile PNG lokal, tanpa produksi. Docker sudah dibangun ulang; 7 hash frontend/20 backend dan 4 aset publik cocok. Preview akun anonim siap untuk login ulang. Mutasi grup, submisi geotag dan parity penuh belum selesai.

**Bukti rilis pin sebelumnya:** pin acuan dari data bidang kini tampil di tengah; tampilan awal/reset/resize menyesuaikan seluruh cakupan dengan zoom awal maksimal20. Satu peta Koleksi akun terverifikasi pada zoom20 dengan pin dan kedua layer termuat. Backend tidak direstart pada rilis pin tersebut; status sesi terbaru ada pada rekap Koleksi. [Validasi](analysis/MAP-PIN-WEBAPP-VALIDATION.md):364 tes Node,906 pemeriksaan fungsi dan9 pemeriksaan browser terfokus.

**Pembaruan peta:** sesuai pilihan terbaru pengguna, peta dasar memakai raster OpenStreetMap dengan overlay batas bidang WMS Bhumi, tanpa key Google atau vektor bidang buatan browser. Kredensial Bhumi tetap di backend. Peta gabungan pada satu Koleksi akun berhasil memuat6 tile OSM dan6 tile Bhumi tanpa gagal; titik masuk peta langsung di detail BERKAS dan kesetaraan menyeluruh masih memerlukan verifikasi. [Konfigurasi dan batas pembuktian](analysis/OFFICIAL-MAP-SETUP.md). Bukti Google terdahulu tetap historis. [Validasi OSM/Bhumi](analysis/OSM-BHUMI-WEBAPP-VALIDATION.md):358 tes Node,906 pemeriksaan fungsi,15 pemeriksaan browser; desktop dan390px mobile terverifikasi.

Workspace reverse engineering untuk **Sentuh Tanahku 6.1.5** (`id.go.bpn.sentuh`, version code 1037), dari XAPK yang disediakan.

**Target terbaru:** webapp dengan fungsi Sentuh Tanahku dan input koordinat dari GNSS eksternal atau hasil pengukuran yang sebenarnya. Pengguna meminta audit seluruh parameter submit terlebih dahulu dan satu worker untuk pengujian APK end-to-end. Audit statis dan pengujian runtime dicatat terpisah; keberhasilan ekstraksi tidak berarti fungsi server telah teruji.

**Status implementasi:** webapp mengikuti kelompok menu/aset APK, dengan login, pembacaan data, review payload, serta perbandingan koordinat lokal. Katalog saat checkpoint 22 Oktober memuat 176 bentuk request dan 94 operasi aktif (74 baca, 20 tulis), ditambah login khusus. [Daftar/detail Antrian dan Panggilan](analysis/QUEUE-WEBAPP-VALIDATION.md) sudah diterapkan. Uji akun sendiri menerima HTTP 200 untuk daftar dan Panggilan yang kosong; detail/data terisi produksi belum terbukti. Kesetaraan seluruh fungsi belum tercapai. Unggah geotag tetap nonaktif; aplikasi tidak mengganti bukti kunjungan fisik dengan koordinat jarak jauh. Kedua XAPK asli tetap utuh. Lihat [panduan webapp](webapp/README.md), [status pengujian](analysis/WEBAPP-PARITY-STATUS.md), dan [peta menu](analysis/official-menu-map.json).

## Hasil yang sudah tersedia

- Kedua XAPK diekstrak dan setiap anggota diverifikasi: Sentuh Tanahku 1.090 anggota, Route Spoofer 367 anggota. APK sumber tetap utuh.
- Reverse-Engineer-Anything diklon dan dibangun di environment lokal. Snapshot Flutter AOT juga dianalisis menggunakan Blutter untuk Dart 3.12.2.
- Audit request memeriksa 100 POST dan 69 GET langsung ke tiga wrapper HTTP yang dikenali. Jumlah ini diverifikasi lagi dari byte instruksi ARM64. Jumlah callsite bukan jumlah fitur atau jaminan seluruh request aplikasi telah ditemukan.
- Kontrak per endpoint, semua field yang ditemukan, bukti instruksi, dan bagian yang masih belum diketahui tersedia di [request-contracts.md](analysis/request-contracts.md), [JSON](analysis/request-contracts.json), dan [CSV](analysis/request-fields.csv).
- Worker terpisah memasang 20 APK dari XAPK yang diberikan pada dua emulator lokal. Android 11 mengalami crash penerjemah ARM64. Android 16 mencapai UI asli lalu menampilkan penolakan keamanan komposit **S5**; menu publik dan login belum terjangkau. Bukti dan status tiap skenario tersedia di [laporan runtime](analysis/runtime/README.md) serta [screenshot S5](analysis/runtime/emulator/api36/screenshots/03-security-refusal-s5.png).
- Penelusuran koordinat ke request geotag tersedia di [geotag-coordinate-dataflow.json](analysis/recovered/geotag-coordinate-dataflow.json). Satu jalur memformat dua koordinat menjadi string tujuh desimal; jalur lain meneruskan nilai tersimpan. Ini bukan ukuran akurasi pengukuran.
- [Audit validasi geotag](analysis/GEOTAG-VALIDATION-AUDIT.md) membuktikan pemeriksaan jarak titik terhadap posisi perangkat saat itu (10 m), terpisah dari akurasi GNSS. Perbandingan koordinat berkas tidak menggantikan bukti kunjungan.
- [Audit menu resmi](analysis/OFFICIAL-MENU-FINDINGS.md) memetakan 29 item dan lima model respons. Kesetaraan visual seluruh layar belum dapat diperiksa karena APK menolak emulator pada S5.

## Menjalankan webapp di Docker Desktop

Klik dua kali **START-WEBAPP.cmd**, atau dari PowerShell di folder ini:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-webapp-docker.ps1
```

Buka **[http://localhost:4173](http://localhost:4173)** atau **[https://sentuh.davay.space](https://sentuh.davay.space)**. Kedua launcher memakai alamat lokal. Docker menampilkan binding `127.0.0.1:4173`; tunnel Docker memakai `http://host.docker.internal:4173`. Domain HTTPS dan localhost mempunyai sesi login terpisah. Gunakan `-NoBrowser` untuk menjalankan tanpa membuka browser. Perubahan frontend cukup dimuat ulang; gunakan `-Rebuild` untuk perubahan backend atau konfigurasi mount. Docker Desktop harus aktif dalam mode Linux containers. [Panduan Cloudflare](DOCKER.md) dan [validasi akses](analysis/CLOUDFLARE-ACCESS-VALIDATION.md) mencatat konfigurasi serta batas pengujian lokasi.

Alternatif Node native, saat container Docker dihentikan:

```powershell
.\tools\runtime\node.exe --openssl-legacy-provider .\webapp\server.mjs
```

Untuk menghentikan container:

```powershell
docker compose stop webapp
```

## Ruang lingkup dan batasan

Target implementasi adalah **klien browser dengan fungsi asli dan koordinat pengukuran nyata**. XAPK berisi Flutter AOT ARM64, bukan source Dart atau bundle Flutter Web. APK/ELF Android tidak dapat dijalankan langsung oleh browser. Perilaku native penuh belum teruji.

Logo, ikon, font, nama fitur, deklarasi Android, struktur data, dan builder request dipelajari dari artefak. Webapp menggunakan hasil audit tersebut untuk menyiapkan permintaan yang dapat diuji pengguna. Operasi yang belum cukup dipahami tetap dapat diperiksa kontraknya, tetapi eksekusinya belum tersedia.

Adapter login, sesi, dan request diuji menggunakan upstream buatan lokal. Login akun sebenarnya, data milik akun, alur identitas native, serta penerimaan pengiriman di backend masih perlu dibuktikan oleh pengujian pengguna. Field request yang ditemukan secara statis tidak membuktikan validasi server atau keberhasilan transaksi. Pengujian runtime memakai perilaku startup APK asli; rincian aktual tersedia dalam laporan runtime.

Token akses/refresh disimpan di memori server lokal. Titik koordinat dan riwayat pengujian berada di memori halaman; ekspor titik sebelum memuat ulang. Webapp tidak menulis password atau token akses ke penyimpanan browser. Persiapan koordinat tidak merupakan bukti batas tanah.

## Struktur workspace

| Lokasi | Isi |
| --- | --- |
| `webapp/` | Source webapp tanpa dependensi build; server lokal dan pengujian |
| `analysis/unpacked/xapk/` | Seluruh anggota XAPK, termasuk 20 APK |
| `analysis/unpacked/apk/` | Seluruh anggota setiap APK/split, termasuk DEX, ELF, manifest, resource dan aset |
| `analysis/extraction-manifest.json` | Ukuran dan SHA-256 setiap file hasil ekstraksi |
| `analysis/extraction-verification.json` | Verifikasi ulang integritas seluruh hasil ekstraksi |
| `analysis/recovered/` | Hasil analisis format, string ber-offset, dan metadata yang dipulihkan |
| `analysis/rea/` | Evidence lengkap dari CLI Reverse-Engineer-Anything |
| `analysis/FINDINGS.md` | Temuan, peta fitur, dan batas bukti statis awal |
| `analysis/recovered/blutter-unique/` | Objek Dart dan disassembly statis dari snapshot AOT asli |
| `analysis/recovered/request-callsites/` | Referensi instruksi ARM64 untuk kandidat pemanggilan endpoint |
| `analysis/request-contracts.md`, `.json`, `request-fields.csv` | Audit kontrak request lanjutan; status wajib/opsional dan kelengkapan tidak ditebak |
| `analysis/CLIENT-INTEGRITY.md` | Pemeriksaan checksum/signature, versi client, dan batas bukti kewajiban server |
| `analysis/TRANSPORT-BOUNDARIES.md` | Pemilihan layanan, header/interceptor, dan sesi setelah builder request |
| `analysis/recovered/geotag-coordinate-dataflow.json` | Bukti aliran koordinat dari dua closure pembentuk widget ke field request geotag |
| `analysis/http-callsite-verification.json` | Verifikasi independen byte instruksi ARM64: 100 POST dan 69 GET ke tiga wrapper yang diketahui |
| `analysis/audit-verification.json` | Verifikasi bahwa lokasi bukti kontrak merujuk file/instruksi yang tersedia |
| `analysis/runtime/` | Inventaris runtime, persiapan emulator, dan matriks pengujian APK dengan status tiap alur |
| `tools/Reverse-Engineer-Anything/` | Clone repository yang diminta beserta CLI hasil build |
| `tools/runtime/` | Node/npm lokal, launcher REA, versi dan hasil diagnosis |
| `environment/python/` | Python virtual environment khusus analisis |
| `scripts/` | Ekstraksi, verifikasi, dan launcher |

File `Route+Spoofer_1.1.8_APKPure.xapk` menjadi target tambahan setelah pengguna mengarahkan pekerjaan ke diagnosis GPS. Bukti terpisah disimpan di `analysis/route-spoofer/`.

## Mengulang ekstraksi dan verifikasi

```powershell
.\environment\python\Scripts\python.exe .\scripts\unpack.py
.\environment\python\Scripts\python.exe .\scripts\verify-extraction.py
.\environment\python\Scripts\python.exe .\scripts\verify-extraction.py --manifest analysis\route-spoofer\extraction-manifest.json
.\environment\python\Scripts\python.exe .\scripts\verify-http-callsite-audit.py
.\environment\python\Scripts\python.exe .\scripts\verify-audit.py
```

Source XAPK tetap utuh. SHA-256 sumber:

```text
2924560074809229440abf3cbd63d1f4870a5888525e61a5d9455799b05987cb
```

## REA dan environment

Repository: https://github.com/teonett/Reverse-Engineer-Anything

Commit: `472b72a53068a8e2ec78fe239d687023482daaa7`. CLI dibangun dari clone, bukan sekadar diunduh tanpa digunakan. Jalankan CLI lokal:

```powershell
.\tools\runtime\rea.cmd inspect-artifact "$PWD\Sentuh+Tanahku_6.1.5_APKPure.xapk" --json
```

Node 24.21.0 dan npm 11.16.0 disimpan khusus di `tools/runtime`; tidak mengubah instalasi Node global. Python venv memakai runtime Python 3.12.14. Tidak ada perubahan konfigurasi MCP global. Warning MCP dari `doctor` tidak mencegah CLI langsung bekerja. Provider Android JADX milik REA belum mendukung Windows; hasil analisis alternatif dan batasnya dicatat di laporan.

## Pengujian webapp

Perintah berikut menjalankan pengujian lokal tanpa menghubungi API produksi. Hasil verifikasi dan pemeriksaan browser dicatat di `analysis/webapp-validation.md`.

```powershell
Push-Location webapp
..\tools\runtime\node.exe --test tests/*.test.mjs
Pop-Location
```

Server hanya menyajikan file webapp yang diizinkan; XAPK, hasil ekstraksi, konfigurasi environment, dan source server tidak disajikan. Asset/font disimpan lokal sehingga UI tidak memerlukan CDN. Koordinat berasal dari input pengukuran atau file GNSS yang diimpor.
