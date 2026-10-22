# Beranda 6.1.5: banner dan kanal video — final setelah review

Audit ini menutup rantai **widget → pembacaan → model → tap** pada varian Beranda publik yang terikat di sumber AOT. Audit tidak menjalankan APK, mengakses provider, mengubah webapp, atau mengaktifkan endpoint. Pemilihan seluruh varian Beranda menurut akun/peran belum dicakup.

## Sumber dan pemeriksaan

Ledger: `analysis/recovered/home-media-followup/flow-final.json`, SHA-256 `7af36973a49b99ec985a92deee583d04c1edf858a82d2cadef160aab468db4f7`.

Manifest ledger mencakup 24 rentang baru (3.699 instruksi) dan 12 rentang warisan (1.436 instruksi), total 5.135 alamat unik. Pembacaan ulang langsung ELF memeriksa semua instruksi, 94 marker, 293 anotasi pool, 184 catatan pool publik, 10 binding dispatch, dan 30 pemeriksaan semantik. Verifier mengikat 1.085 file bukti/dokumen terdahulu dan 80 file runtime saat ini tanpa perubahan. Hash ELF/pool tercantum dalam ledger.

Jalankan dari root workspace:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/recovered/home-media-followup/verify-final.py --verify-only
```

Verifier tidak menulis ulang receipt yang sudah ada; hasil harus identik byte. `verification-final.json` SHA-256: `d074f27138038cdec06672fcdd7e578c1a2a7959b6a4d13483ceb89170809ef1`. Manifest canonical adalah `sources`/`inherited_sources` pada ledger, bukan berkas eksplorasi. Attempt builder yang gagal sebelum ledger dibuat tetap disimpan; `freeze-attempt-corrections.json` mengoreksi penjelasan CID awal dan merekam penjagaan newline/marker author-side. Tidak ada byte proof lama yang ditulis ulang.

## Koreksi setelah review

Versi awal menggabungkan catch dengan fallback biasa sehingga menyebut secondary catch `[]` terlalu jauh. Successor ini mempersempit klaim tanpa menambah disassembly, request, atau perubahan runtime. Seluruh file awal tetap utuh dan salinan eksklusif beserta hash tersimpan di `analysis/recovered/home-media-followup/retained-initial/manifest.json`; ledger final mengikat predecessor tersebut. Dokumen awal `analysis/HOME-MEDIA-FOLLOWUP.md` dipertahankan sebagai versi pre-review; gunakan dokumen final ini dan `flow-final.json`/`verification-final.json`. Empat pemeriksaan semantik tambahan mengikat flag catch, perbedaan slot, dan alokasi daftar kosong oleh controller.

## Banner: observasi positif

`PBb5445.init75623c` memanggil controller `d22740`. Komposisi Beranda `8c0080` membaca subject banner `wCb+7`, melalui builder `891344` menjadi widget `Nz6257` dan state `JCb5653`. Dispatch build berujung pada `813c40`; daftar dipetakan menjadi kartu `8143c0` menurut urutan hasil, tanpa sorting lokal `sequenceId` pada build lengkap ini.

Controller melewatkan request bila daftar cache sudah tidak kosong. Cache awal kosong; hasil kosong dapat diminta lagi ketika init dipanggil kembali. Controller ini tidak memasang busy flag tersendiri. Snapshot null di builder dikenai null assertion. Perilaku carousel dengan nol item, placeholder gambar dan seluruh timing/plugin belum ditutup.

Service `d22804` memakai satu **GET `banner`** di `d22854`, melalui clone main client `746b44`; tidak ada query/body/options/header tambahan dari caller. Service lengkap ini langsung meng-cast `response.data` menjadi `Map<String,dynamic>`, tanpa pemeriksaan HTTP 200 lokal dan tanpa JSON String decode lokal. Ini tidak membuktikan bahwa transport akan meneruskan status non-200 atau bahwa server menerima suatu request.

Envelope `744e44` memvalidasi `error: bool?`, `message: String?`, serta empat `int?`: `totalRecords`, `resultsCount`, `pageSize`, `pageNumber`. Data/metadata diparsing sebelum caller menguji `error`. Caller mengharuskan error nonnull: null menyebabkan null-cast failure; false mengembalikan daftar bertipe; true mengembalikan daftar kosong. Metadata/data invalid tidak otomatis diabaikan ketika error true. Sebagian jenis exception `sa` diganti pesan umum; lainnya dilempar kembali.

Callback data `746c44` mengubah missing/null menjadi daftar kosong. Nilai nonnull diproses lewat dynamic `forEach`, dan tiap elemen di-cast ke Map sebelum parser `hyb`. Jalur array JSON terikat; jangan menggeneralisasi ini menjadi cast List eksplisit untuk semua objek Dart atau menganggap perilaku callback Map telah diaudit penuh.

| Model `hyb838` | Tipe/slot |
|---|---|
| bannerId | String? / +7 |
| sequenceId | int? / +b |
| bannerUrl | String? / +f |
| externalUrl | String? / +13 |
| path | String? / +17 |

Missing/null dipertahankan; tipe nonnull yang salah gagal cast. `int` native bukan jaminan JavaScript safe integer.

**Kartu memakai `path`, bukan `bannerUrl`, sebagai sumber gambar.** Builder `8143c0` mengambil `TRb.AYi`, mengganti pola RegExp `/+$` dengan string kosong, menambahkan satu `/`, lalu memakai `path+17` setelah penggantian pola `^/+` dengan string kosong. Path null memicu assertion. Maksud pola tersebut adalah merapikan slash pada batas base/path; implementasi lengkap SDK RegExp tidak diaudit ulang di sini.

Asal base tidak ditebak: bukti warisan `main-base-selector6b8fa0` dan `initial-production-flagca53e0` menutup initializer yang dikirimkan. `Thj` awal true memilih literal `https://sentuh.atrbpn.go.id/`; cabang dev juga ada. Nilai mutable `Thj`/`AYi` setelah override dan nilai runtime nyata tetap tidak diketahui. Field base situs profil `www.atrbpn.go.id` merupakan field berbeda.

Tap `814a34` memakai `externalUrl+13` dalam label instrumentation dan continuation `814ae8`. Continuation mewajibkan URL nonnull, lalu `d7627c` melakukan `Uri.parse` → await `canLaunch` → bila true parse lagi dan `launch`; mode tidak diberikan sehingga wrapper launcher memakai default platform. Cabang false melempar. Instrumentation `6bd5d0`, telemetry, OS handler, keberhasilan membuka URL dan kebijakan keamanan link browser tetap batas terpisah. Sumber ini tidak membuktikan allowlist HTTPS atau penerusan kredensial ke URL eksternal.

## YouTube: observasi positif

Komposisi Beranda memuat label `Ikuti Kanal video Kami` dan widget `LCb6256` (`8c0b54`), state `MCb5436`, init `75b9a0`, lalu controller `d2d164`. Controller memakai daftar subject `wCb+1f`: daftar nonempty melewatkan request, daftar kosong dapat diminta lagi. Shared busy `+23` diaktifkan selama request, lalu dimatikan pada success/failure; exception membersihkan busy dan dilempar kembali. Tuple failure membuat controller menerbitkan daftar kosong.

Service `d2d320` memakai **GET `Youtube/GetYoutubeList`** pada `d2d384`, main clone yang sama, tanpa query/body/options/header tambahan dari caller. Ini berbeda dari envelope berita: status harus 200; response String didecode sekali; kemudian membaca **`data`**, bukan `message`, tanpa menguji body.error. Data harus List, termasuk daftar kosong yang valid; setiap elemen di-cast Map. Success adalah tuple `(false, List<CCb>)`; fallback non-200/non-List biasa mengembalikan `(true, [])`. Pada catch, flag true terbukti (`d2d56c/d2d570`), tetapi slot kedua disalin dari `[fp,-0x78]` (`d2d574/d2d578`), sedangkan initial empty list tersimpan di `[fp,-0x88]`. Pemetaan slot exception-handler belum ditutup, sehingga isi secondary catch **tidak diketahui**, bukan dijamin `[]`. Ini tidak mengubah hasil UI yang terbukti: controller mengabaikan secondary ketika flag true dan mengalokasikan daftar kosong baru pada `d2d264..d2d29c`.

| Model `CCb646` | Tipe/slot |
|---|---|
| channelTitle | String? / +7 |
| channelId | String? / +b |
| videoId | String? / +f |
| title | String? / +13 |
| thumbnailUrl | String? / +17 |
| publishedTime | String? / +1b |

Missing/null dipertahankan; tipe nonnull yang salah gagal cast. `publishedTime` tetap string mentah; tidak ada bukti field DateTime, watch URL, HTML, atau request detail tambahan.

Build lengkap `8e31c8` memperlihatkan daftar horizontal dengan tinggi 180, thumbnail 200×100 dan judul teks. `thumbnailUrl`/`title` null menjadi string kosong. Waiting/busy/error/null/empty memakai builder skeleton yang sama dengan empat item. Daftar hasil tidak dipotong atau disortir lokal pada fungsi ini. Ukuran skeleton berbeda dari thumbnail hasil; parity seluruh pixel/varian tidak diklaim.

Tap `8e3c28` memanggil helper auth bersama `d1cf2c` tanpa await atau percabangan hasil, lalu factory route `8e3cc8` menyalin `videoId+f` dan `title+13` (null → string kosong) ke `KCb5941`. Build `a39374` menciptakan flags `vZb`, controller **`tZb4932`** (`a394d0`, initial video ID tersimpan `+2b`), player widget **`pZb`**, dan wrapper `qF`. Tidak ada main API GET/POST detail pada build player ini. Batas positif berhenti di widget/controller tersebut: full SDK/iframe, callback, autoplay/fullscreen, cookie, platform rendering/network dan penerimaan provider belum ditutup. Jangan mengganti batas ini dengan asumsi watch-link atau embed browser yang dianggap 1:1.

## Auth dan implikasi implementasi

Kedua recipe diwariskan dari `DCb+7 FRb` melalui clone main yang telah diaudit untuk berita. Caller tidak menambahkan kredensial/header/checksum/GPS. Transport main, sesi tersimpan dan refresh tetap kontrak terpisah; tidak ada secret yang diekspor atau digunakan kembali. Metadata `optionalSession` di katalog tidak membuktikan penerimaan anonim oleh provider.

Webapp saat ini merender feed berita/pengumuman khusus, belum slot banner/kanal video tersebut. `get-banner-d22854` dan `get-youtube-getyoutubelist-d2d384` sudah enabled sebelum audit; katalog tetap **176 operasi / 84 enabled / 92 disabled** (71 read dan 13 write enabled), hash identik. Audit ini menghasilkan **nol** perubahan runtime, enablement, network, eksekusi APK, pembacaan akun atau submission.

Implementasi mendatang dapat memakai request/model/render yang telah terikat di atas, dengan parser terpisah bagi setiap envelope. Kebijakan URL, lifecycle browser, tampilan responsif serta player yang aman harus dinyatakan sebagai adaptasi web. Bukti statis ini tidak membuktikan seluruh fungsi 1:1, login/provider acceptance, server output nyata atau full end-to-end.
