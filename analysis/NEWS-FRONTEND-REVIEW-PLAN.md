# Rencana review frontend Berita / Pengumuman

Review read-only pada 2026-10-19. Sumber native: [NEWS-FLOW.md](NEWS-FLOW.md) dan [ledger kanonis](recovered/news-flow/flow.json), SHA256 `9628b9d094cb486c82a86f8a27d90426a3d15737d32fc2d7e3fd36e1615f6aa9`. Laporan verifier yang sudah ada mencatat 25 hash sumber, 5.213 instruksi ELF unik, 224 marker, 268 referensi pool, 18 konstanta, 17 dispatch, dan 17 dependensi. Verifier tidak dijalankan ulang dalam review ini.

Frontend sedang diubah oleh root saat review berlangsung. Catatan di bawah membandingkan alur generik awal dengan kontrak native dan memberi kriteria implementasi; ini bukan sertifikasi build akhir. Tidak ada perubahan runtime/shared source, koneksi jaringan, restart, akses kredensial, atau pengujian produksi dari review ini.

## Kontrak native dan gap awal

| Bagian | Bukti native | Gap / batas frontend awal |
| --- | --- | --- |
| Entry | Home membuat Berita dan Pengumuman; heading Berita **Siaran Pers Kementerian**. Init memanggil controller tanpa gate sesi. | `dashboard()` hanya menawarkan tautan; `flowPage()` generik meminta klik Tampilkan data. Halaman mandiri browser adalah adaptasi, bukan route Android yang terbukti. |
| Request | GET `Berita/GetBerita?limit=8` dan GET `Pengumuman/GetPengumuman?limit=5`; optional session melalui main transport. | Registry sudah enabled/optionalSession. Jangan menambah login gate, ID detail, parameter kategori, body, atau limit lokal. |
| Parser | Hanya HTTP 200; body String didecode JSON; baca `message` List. `body.error` dan `body.data` tidak dibaca. | `flowData()` membuka lapisan `data`; `dataItems()` menerima banyak alias. Parser generik tidak cukup untuk kontrak ini. |
| Model | `id,title,category,banner,url` semuanya String nullable; wrong type gagal cast seluruh mapping. | Jangan mengubah angka menjadi string, menganggap `data` sebagai daftar, atau membuat tanggal/deskripsi/HTML artikel. |
| Cache | Singleton `wCb`: daftar news +17, announcement +1b; shared busy +23. List nonempty mencegah request; list empty dapat diambil ulang saat init berikutnya. | Map generik per-route belum berbagi cache dengan home. Loading generik bukan native init/cache. |
| Kartu | Semua item sesuai urutan server, tanpa filter/sort/paginasi/pemotongan lokal. Horizontal tinggi180, banner200×100 cover, title plain text tiga baris; null title/banner menjadi string kosong. | Kartu generik menampilkan facts, pagination20, dan ikon; `category`/`id` bukan metadata tampilan native di alur ini. |
| Detail | Callback menangkap objek terpilih berdasarkan indeks, membaca `url`, membuka WebView; tidak ada request detail berdasarkan ID. | `showFlowDetail()` generik membuka modal facts. Isi artikel tidak tersedia dari respons daftar. |

Tab Pengumuman Yuridis dan Sertipikat Hilang mempunyai kontrak terpisah. Jangan menganggap keduanya bagian dari model lima field Pengumuman ini. Integrasi renderer khusus harus dibatasi ke endpoint umum / tab `umum`.

## Cache, state owner, dan lifecycle

Rekomendasi browser: satu owner cache publik yang dipakai home dan halaman feed, dengan state terpisah per jenis: `rows`, `status`, `error`, `requestToken`, serta penanda autoload per entry/mount. Cache dapat ditempatkan di `flowResults` agar `clearPrivate()` membuang owner lama; kunci harus tidak berbenturan dengan state generic Pengumuman lain.

1. Cache nonempty dipakai ulang saat berpindah home ↔ halaman feed; tidak ada fetch tambahan otomatis.
2. Empty valid dan error tidak boleh memicu request dari setiap `render()`. Native init hanya berjalan saat widget diinisialisasi; render browser jauh lebih sering. Tandai percobaan entry itu telah dilakukan. Re-entry atau tombol retry boleh memulai lagi.
3. Satu pending request per feed; dua feed dapat dimuat bersamaan. Loading independen dan pesan empty/error/retry adalah **adaptasi browser**. Native memakai satu shared busy dan skeleton sama untuk waiting/error/empty; jangan mengklaim UI tersebut identik.
4. Validitas hasil async harus mengikat `sessionEpoch`, identitas owner cache, dan token request. Hasil dari refresh lebih lama, owner yang dibuang, logout, pergantian akun, atau init lama tidak boleh mengganti hasil baru.
5. Jika cache memang tetap hidup ketika meninggalkan route, penyelesaian request boleh mengisi cache yang masih valid, tetapi jangan membuka dialog/mengganti halaman. Relevansi route cukup mengendalikan render. Alternatif membatalkan owner saat navigasi juga boleh, namun harus didokumentasikan sebagai adaptasi dan diuji agar pending state tidak macet.
6. Tautan kartu menggunakan objek/index yang tampil; ID bisa null atau duplikat. Tidak boleh mencari ulang berdasarkan ID atau mengirim `id` ke endpoint detail yang tidak terbukti.
7. Ketika main state/catalog belum siap atau konfigurasi belum tersedia, jangan menandai request seolah sudah berhasil dijalankan. Autoload berikutnya harus tetap dapat terjadi setelah prasyarat siap.

## URL, banner, dan CSP

Native menyerahkan URL ke WebView dan banner ke image loader; validasi origin/scheme lengkap tidak terbukti. Pembukaan link yang diisolasi, validasi URL, fallback gambar, dan pemberitahuan URL tidak tersedia adalah **adaptasi browser**.

- Gunakan parser URL eksplisit untuk URL absolut; kebijakan yang sederhana adalah HTTPS, tanpa username/password. Tolak `javascript:`, `data:`, `blob:`, `file:`, URL relatif/protocol-relative dan nilai malformed. Jangan diam-diam mengubah HTTP menjadi HTTPS atau mengarang hostname; URL/banner aktual belum diperiksa dalam review ini.
- Judul tetap teks melalui escaping; banner tidak boleh mengubah title menjadi HTML. Tidak ada `srcdoc` atau rendering HTML dari list.
- Link artikel normal `target="_blank" rel="noopener noreferrer"` mengikuti pola `externalPage()` yang sudah ada dan menyediakan navigasi tanpa menambahkan request detail API. Ini mengganti native embedded WebView dengan tab browser dan harus disebut adaptasi.
- Jangan meneruskan token/header main API ke artikel/banner atau membuat proxy URL arbitrer. Caller native viewer tidak menyuplai header/method/body khusus. Cookie milik origin artikel tetap tunduk pada browser; jangan mengklaim bahwa semua cookie eksternal pasti tidak dikirim.
- CSP saat review di `webapp/server.mjs:23`: `img-src 'self' data: blob:`, `connect-src 'self'`, `default-src 'self'`, `object-src 'none'`, tanpa `frame-src`. Karena itu banner eksternal diblokir; iframe eksternal juga tidak diizinkan melalui default policy. `frame-ancestors 'none'` membatasi siapa yang dapat meng-embed webapp, bukan memberi izin webapp meng-embed artikel.
- Pembukaan tab biasa tidak memerlukan memperluas `connect-src` atau `frame-src`. Pertahankan keduanya; jangan mengaktifkan remote script.
- Banner berhasil memerlukan keputusan CSP tersendiri: origin gambar yang sudah dibuktikan dari data layanan, atau izin `https:` untuk gambar sebagai kebijakan web yang lebih luas. Pilihan kedua menerima gambar dari host HTTPS mana pun dan bukan bukti native allowlist. Origin aktual masih belum diketahui; jangan menyatakan banner remote telah berhasil hanya dari tes gambar lokal.
- Set `referrerpolicy="no-referrer"` pada gambar/link bila diperlukan untuk menjaga kebijakan eksplisit; server sudah mengirim `Referrer-Policy: no-referrer`. Fallback harus menangani null, URL ditolak, HTTP error, decode error, dan CSP block. Gunakan event listener yang menangkap error gambar, bukan inline `onerror` yang ditolak `script-src 'self'`; fallback tidak boleh berulang tanpa batas.

Iframe tidak disarankan sebagai syarat penyelesaian awal: selain CSP lokal, origin tujuan bisa menolak frame melalui kebijakannya sendiri. Tanpa pemeriksaan tujuan aktual, kesetaraan WebView tidak dapat dinyatakan.

## Regresi bermakna sebelum klaim selesai

| Kelompok | Pemeriksaan yang perlu dibuktikan |
| --- | --- |
| Parser native | HTTP200/object dan String JSON berhasil; 201/204/non-200 gagal; malformed JSON dan message non-list gagal; message empty berhasil; `error:true` dengan message list valid tetap dibaca; `data` decoy tidak dipilih. |
| Model | Kelima field missing/null diterima; tipe non-string ditolak; item null/array/scalar ditolak; satu item rusak menggagalkan daftar, bukan difilter diam-diam. |
| Tampilan/data | Urutan server, duplicate/null ID, respons lebih dari limit8/5 tetap seluruhnya tampil; category/id/HTML tidak dirender sebagai facts; title berbahaya inert; title null tidak diisi judul buatan. |
| Autoload/cache | Home memulai tepat satu request per feed; standalone memakai cache yang sama; dua render saat pending tidak menggandakan fetch; nonempty skip; empty/error tidak loop; retry/re-entry terkontrol; katalog terlambat tetap memicu load yang sah. |
| Race/session | Respons tertunda setelah navigasi tidak membuka UI lama; logout/ganti owner menolak hasil lama; refresh lama tidak menimpa terbaru; dua feed tidak menimpa satu sama lain; error auth dari request basi tidak menghapus sesi baru. |
| Link/banner | Pemilihan memakai URL item tepat, tidak ada request detail/ID; HTTPS dengan query/fragment/karakter atribut tetap benar; scheme berbahaya, relative URL, userinfo, null/empty ditangani; atribut rel/target/referrer tepat; gambar gagal menjadi fallback tanpa loop. |
| Browser/CSP | Desktop/mobile menampilkan strip yang dapat dijangkau tanpa horizontal overflow halaman; judul tiga baris/cover/fallback; keyboard dapat memilih kartu/link; empty, forced503+retry, reload/cache; tidak ada script/event injection. Uji CSP menggunakan header server aktual, bukan hanya VM string. |
| Transport | Fixture memeriksa GET, path+query limit literal, tanpa body/field ekstra, respons `message`; optional-session anonim dan sesi sintetis terpisah; tak ada call detail, telemetry/token-forwarding buatan, atau jaringan produksi. |

Pemeriksaan tersebut adalah rencana, bukan hasil test yang sudah lulus.

## Harness yang tersedia dan batasnya

- `analysis/rea/review_frontend_flows.mjs` mengekstrak fungsi **actual source** ke VM. Satu check “live public message-array envelope…” memakai respons sintetis dan hanya membuktikan generic message-array rendering; namanya bukan bukti koneksi live, parser news ketat, cache, URL, banner, ataupun CSP.
- `webapp/tests/browser-fixture.mjs` belum memiliki branch Berita/Pengumuman khusus pada saat dibaca. Endpoint tak dikenal menghasilkan `{error:false,data:{status,path}}`, sehingga fixture ini belum membuktikan kontrak `message` kedua endpoint.
- `webapp/tests/office-browser-fixture.mjs` memberi pola yang lebih baik: salinan public files persis dengan manifest hash, banner fixture, transport in-process yang menolak route tak dikenal, saved call counts, dan nol request produksi. Fixture news terpisah dapat memakai pola ini tanpa mengubah fixture historis.
- Gunakan aset fixture lokal agar QA tidak menghubungi artikel/gambar produksi. Itu membuktikan layout/fallback dan link binding; keberhasilan pengambilan banner remote/CSP tujuan tetap harus dilaporkan terpisah.
- Bekukan source hash saat implementasi selesai, lalu jalankan actual-function tests dan browser fixture terhadap hash yang sama. Jangan menggabungkan hasil build lama sebagai bukti build baru.

Kesimpulan terbatas: kontrak list → selected URL siap diimplementasikan; belum ada bukti dalam review ini tentang respons server terkini, banner remote, frame policy tujuan, cookie WebView, atau kesamaan piksel Android.

## Handoff setelah implementasi

Root kemudian melaporkan dua pembacaan anonim HTTP200 dengan 8 Berita dan 5 Pengumuman dalam `analysis/webapp/news-live-check.json`; origin URL/banner yang diamati adalah `https://www.atrbpn.go.id`. Root membatasi izin CSP gambar ke origin tersebut. Ini merupakan bukti terpisah dari review read-only awal; catatan “origin belum diketahui” di atas menjelaskan keadaan sebelum handoff, bukan klaim atas laporan live tersebut.

Harness baru `analysis/rea/review_news_flow.mjs` telah menjalankan **57 pemeriksaan lulus, 0 gagal**, dengan **42 pemanggilan API sintetis dan 0 koneksi jaringan**, terhadap `webapp/app.js` SHA256 `5c0441b4de30b7de77edca528bccdfccb8b28db7f68aeaf37b897136b929546b`. Hasil disimpan di `analysis/webapp/news-flow-latest.json`. Selain fungsi actual source, harness menjalankan callback event aktual untuk reload, pergantian tab Pengumuman, dan fallback gambar. Tidak ada temuan correctness yang aktif pada cakupan tersebut.

Perbedaan penting yang diuji: frontend mempertahankan daftar terakhir saat refresh gagal/malformed, sedangkan controller native menerbitkan list kosong pada kegagalan. Retensi ini dicatat sebagai adaptasi browser, bersama loading per-feed, pesan error/retry, validasi HTTPS, dan tab eksternal. Harness tidak membuktikan rendering browser, penegakan CSP aktual, pengambilan banner remote, respons produksi, atau kesetaraan visual Android; bukti tersebut tetap terpisah.
