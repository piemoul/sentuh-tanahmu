# Audit cakupan fungsi webapp — 20 Oktober 2026

**Webapp belum setara 1:1 dan belum teruji end to end untuk semua fungsi.** Audit baca-saja ini mencakup **29 item navigasi APK, 38 route browser dan 176 operasi katalog**. Terdapat **77 enabled (64 read, 13 write)**, **99 disabled**, serta satu login khusus yang bukan eksekusi katalog. Label efek registry tidak dengan sendirinya membuktikan efek persisten server. Enabled berarti adapter dapat dipanggil, bukan 77 penerimaan produksi.

Snapshot app.js SHA-256: 4848c908b59cc17ca0fd4d73b500cd8b304ac20bee8cb55e32b47d5a9afce502; operations.mjs: 5b78af7c6bd45245f3b71bc0e3629775dfd066aff9835d82ce81e55a3b7da103. Empat hash runtime yang diperiksa cocok dengan [rekap Daring](webapp/daring-form-summary.json). Rekap itu menyimpan 1.129 tes Node, 1.190 pemeriksaan VM/23 suite, 19 pemeriksaan browser desktop 1280×720, tiga request identitas sintetis dan **nol submisi identitas produksi**. Audit ini tidak menjalankan ulang tes, membuka sesi, membaca kredensial atau menghubungi produksi.

[coverage-latest.json](webapp/coverage-latest.json) masih mengikat sumber pendahulu 72692b… dan 76 adapter; namanya tidak menjadikannya bukti rilis Daring kini. File historis tersebut tidak diubah. [Inventaris mesin](webapp/function-coverage-20261020.json) mencatat semua route, operation IDs, indeks fungsi, sumber native, cakupan tes dan hash referensi.

## Gap menu yang diprioritaskan

1. **Antrian Daring:** Mulai Mengantri nonaktif. Daftar/detail/Panggilan tersedia, tetapi pemilihan kantor, lokasi, tanggal dan ketersediaan belum ada. Tiga GET prasyarat sudah mempunyai audit terarah dan merupakan implementasi baca berikutnya dengan bukti paling siap. Identitas/booking POST/OTP/socket tetap lingkup terpisah.
2. **Buku Tamu:** tile resmi menuju guestbook, tetapi route tidak ada pada flowDefinitions/externalPages/profileMenus. Ia selalu membuka unavailablePage. Base GET/POST masih interpolasi runtime yang belum terikat; form dan hasil tidak boleh ditebak.
3. **Cari Bidang:** layar meminta ID persil teknis. Alur NIB/jenis hak/wilayah belum direkonstruksi sebagai UX. Audit widget→lookup→returned ID diperlukan. GetByPersilId hanya membuktikan tujuh String nullable, tanpa koordinat/geometri.

Gap lain terlihat langsung: Swaplotting hanya baca generik; Akun dan Keamanan/Pengaturan adalah subset browser; Keuntungan berisi paragraf lokal sedangkan native membuka laman; FAQ mengarah ke Bantuan generik dengan suffix berbeda dari native; Daring berhenti pada batas OTP; peta langsung dalam detail Berkas belum mempunyai binding data terbukti.

## Matriks 29 item navigasi

Kolom adapter adalah enabled/kontrak terkait pada baris, **bukan persentase kesetaraan**. Satu kontrak dapat dipakai beberapa menu; jangan menjumlahkan antarbaris. Bukti callback native lengkap dan bukti nama/menu saja tetap dibedakan dalam JSON. Baris sumber mengacu app.js pada hash snapshot di atas.

| Kelompok | Menu/route | Status | Sumber app.js | Adapter | Belum tersedia/terverifikasi |
|---|---|---|---|---|---|
| primary | Beranda (`dashboard`) | partial | L119,L346 | 2/2 | Browser layout adapted; all native homepage variants/roles/pixels unverified. Enabled banner and Youtube/GetYoutubeList have no dedicated homepage rendering. |
| primary | Koleksi (`collections`) | partial | L203,L186 | 13/14 | Direct inline map in Berkas unresolved; no invented berkasId→persilId/q. Group/item mutation effects on production and edit group membership unverified. |
| primary | Scan (`scan`) | partial | L418 | 7/8 | Activation and TTE branches incomplete. Hardware camera/QR permissions unverified. RDTR/RTRW provider disabled; approved OSM/Bhumi raster is adaptation. |
| primary | Aktivitas (`activity`) | partial | L390,L382,L389 | 8/8 | Date/Unicode parity and all populated production route branches incomplete. Geotag activity opens readonly Berkas, not remote-presence submission. |
| primary | Profil (`account`) | partial | L348,L94 | 1/2 | Signup/reset password/account activation missing from login UI. Full role navigation and native logout confirmation not reproduced. |
| laci | Sertipikatku (`certificates`) | partial | L304,L327,L359 | 8/9 | Share/revoke/outbox/QR generation/native review unavailable. All Wakaf/HT/electronic branches and production PDFs unverified. |
| laci | Aktaku (`akta`) | partial | L374,L370 | 1/1 | PPAT rating/questions unavailable. All populated record/date/casing variants unverified. |
| laci | Berkasku (`files`) | partial | L269,L247 | 7/7 | Inline Berkas map absent. SPS PDF acceptance unverified. Sharing/rating/question submission/geotag capture/upload unavailable. |
| service | Cari Bidang (`parcel`) | technical_form_only | L51,L283 | 2/6 | Raw persil-ID forms replace unmapped native-facing NIB/right/office/wilayah lookup. GetByPersilId parser proves7nullableStrings, no geometry or coordinates. |
| service | Cari Berkas (`searchfile`) | partial | L491,L492 | 4/4 | All populated/server-error branches unverified; CAPTCHA remains manually entered. Inline Berkas map unresolved. |
| service | Antrian Daring (`queue`) | read_only_subset | L539,L537,L533 | 3/10 | Mulai Mengantri disabled. Three audited booking prerequisite GETs disabled; office/location/date preview absent. Identity enrollment/OTP,limit/create/cancel/socket lifecycle incomplete. |
| service | Swaplotting (`swaplotting`) | technical_read_form_only | L55 | 2/6 | Only generic read list/detail controls. Creation geometry/form/camera/submit path absent; enabled transport is not widget parity. |
| service | Info Layanan (`information`) | bounded_read_and_simulation | L504,L510 | 9/9 | Every input combination/formatter/pixels/Unicode unverified; browser guards narrower and documented. |
| service | Mitra Kerja (`partners`) | bounded_read | L462 | 5/5 | All office/province rows,Unicode/runtime branches not production-certified. |
| service | Buku Tamu (`guestbook`) | missing_screen | L180 | 0/2 | Route lacks flowDefinition/external/profile handler; unavailablePage always renders. GET/POST runtime base unresolved and disabled. Native form/validation/result workflow not traced. |
| information | Kantor Pertanahan (`office`) | bounded_read | L179 | 2/2 | Native map-office cluster/favorite controls absent. Physical-device geolocation and all offices/calendars unverified. |
| information | Kalender Kantor Pertanahan (`officecalendar`) | bounded_read | L179 | 1/1 | Every office/year/holiday/timezone not accepted against production. |
| information | Bantuan (`help`) | external_link_adaptation | L349 | 0/0 | Embedded WebView replaced with isolated new-tab link. Current remote content/reachability not verified by this audit. |
| information | Website (`website`) | external_link_adaptation | L349 | 0/0 | Embedded WebView replaced with isolated new-tab link. Current remote content/reachability not verified by this audit. |
| information | JDIH (`jdih`) | external_link_adaptation | L349 | 0/0 | Embedded WebView replaced with isolated new-tab link. Current remote content/reachability not verified by this audit. |
| information | PPID (`ppid`) | external_link_adaptation | L349 | 0/0 | Embedded WebView replaced with isolated new-tab link. Current remote content/reachability not verified by this audit. |
| profile | Akun dan Keamanan (`security`) | placeholder_subset | L353 | 2/11 | Only Data Akun/Status links; password,phone,PIN,delete/unlink absent. Copy says native verification unavailable despite initial Daring form now implemented. |
| profile | Pengaturan (`settings`) | placeholder_browser_settings | L353 | 0/3 | Version/memory/session/diagnostics only. Native controls,persistence and notifications not end-to-end mapped. |
| profile | Keuntungan Pakai Sentuh Tanahku (`benefits`) | placeholder_wrong_destination | L353 | 0/0 | Native shared-base+sentuh-tanahku page replaced with local paragraph. Shared base/origin unresolved. |
| profile | Hubungi Kami (`contact`) | bounded_static_destination | L350 | 0/0 | Native launcher/device handlers and complete mobile layout not certified. |
| profile | Pusat Bantuan (FAQ) (`faq`) | substituted_destination | L353 | 0/0 | Native suffix sentuh-tanahku-faq differs from browser generic Bantuan URL. Shared base/origin unresolved. |
| profile | Kebijakan Privasi (`privacy`) | configured_public_destination | L352 | 0/0 | Configured URL not proved equal to native runtime destination. |
| profile | Beri Kami Nilai (`rating`) | isolated_store_link | L351 | 0/0 | All package-flavor initializers/plugin-launcher parity unverified. |
| profile | Keluar (`logout`) | browser_session_action | L109 | 0/0 | Native confirmation dialog missing. Local session clear does not prove native server/device-session revocation. |

## Route internal dan tambahan

- **services** — serviceDirectory. Bukti: Static route navigation. Batas: Directory only,not feature completion.
- **accountsummary** — flowPage/native account-summary validator. Bukti: queue-profile/backend/bootstrapVM. Batas: All account roles/server variants unproved.
- **verification** — status→methods→Daring5fields→review→ValidateKTPDataV2. Bukti: daring-model,daring-form-ui,daring-identity-backend;19recordeddesktopchecks,3syntheticidentityrequests,0productionidentity. Batas: OTP/liveness/finalverification unavailable; Luring/IKD continuations disabled; mobile/fullIME/formatter unverified.
- **announcements** — General dedicatedfeed;Yuridis/Lost technicalkantorIdforms. Bukti: news-read/fixturebrowser;onlygeneralfeedhistoricallylive. Batas: Yuridis/Lost officepicker/list/detail UI not end-to-end mapped.
- **news** — dedicated cards. Bukti: news-read/fixturebrowser/historicalpublicfeed. Batas: All article/WebView behavior unproved.
- **lost** — generic kantorId form. Bukti: catalog/unit only. Batas: Native officepicker/announcementdetail absent or unverified.
- **kkpr** — list→typed detail→document/read map. Bukti: legacy activity-kkpr and kkpr-documentVM;newScanKKPRseparatefixtures. Batas: List/detail map toolset incomplete; production document acceptance absent.
- **coordinates** — manual/GeoJSON/CSV/NMEA→compare/export. Bukti: gnss/coordinate-comparison tests,no upstreamwrite. Batas: Not native geotag capture or visit evidence; no presence/attestation bypass.
- **testing** — readiness and session history. Bukti: server/network-diagnostics tests. Batas: Success is not production feature acceptance.
- **catalog** — generic scoped enabled-operation forms. Bukti: catalog-integration mocked contract coverage. Batas: Operation availability is not complete menu workflow;99disabled remain.

## Batas bukti penerimaan server

- **Info Layanan:** rekap historis mendukung 65 request publik (daftar, 57 detail, provinsi, enam tipe simulasi) HTTP 200 dan satu simulasi Jual Beli di browser. Bukan semua kombinasi input.
- **Mitra:** lima jalur baca historis HTTP 200 dengan satu kantor/satu provinsi; bukan seluruh data.
- **Kantor/Kalender:** satu pencarian contoh dan satu kalender, 485/124 baris; pusat pencarian contoh, bukan GPS perangkat/kunjungan.
- **Antrian:** daftar dan Panggilan 308→200 dengan data kosong; detail terisi, booking, realtime belum diterima/diuji.
- **Berkas/Sertipikat:** delapan detail Aktif dan delapan Selesai adalah pembukaan per tampilan, bukan 16 record unik. SPS kosong, satu sertipikat analog dan nol elektronik; PDF elektronik/SPS belum terbukti.
- **Peta:** satu PERSIL Koleksi historis memuat OSM/Bhumi dan pin; bukan inline Berkas, seluruh geometri/layer/viewport.
- **Scan/Daring/mutasi Koleksi:** fixture menguji cabang serta ownership/race; tidak membuktikan penerimaan produksi Scan, identitas baru, aktivasi/liveness atau efek mutasi Koleksi. Kamera hardware belum diverifikasi.

Semua hasil historis tetap pada hash/sesi masing-masing, bukan tes baru build kini. Keberadaan file tes dicatat sebagai cakupan kode; hasil lulus hanya dari receipt dengan lingkup tertentu. Tidak ada penjumlahan ulang angka fase lama menjadi klaim penerimaan menyeluruh.

## Geotagging

[Audit validasi](GEOTAG-VALIDATION-AUDIT.md) membuktikan batas 10 m antara pin dan posisi perangkat serta pernyataan kondisi aktual di lapangan. Itu bukan ambang accuracy GPS atau jarak ke poligon sertipikat. Upload tetap disabled. Koordinat GNSS/hasil ukur bisa dibandingkan lokal dengan sumber/waktu/akurasi, tetapi tidak dijadikan bukti hadir atau memalsukan kunjungan. Pemeriksaan server dan jalur resmi pengajuan jarak jauh belum terbukti.

## Bukti lulus untuk pekerjaan berikutnya

1. **Antrian: booking prerequisite reads** — Implement scoped office→location→date→availability preview from frozen read/selection/date ledgers; direct calendar kantor_id must not use nearby decrypt. Keep identity/booking/OTP/socket separate. Bukti yang diperlukan: Model/null/int/date validation; request/race fixtures; browser pickers/calendar; later one authorized real readonly example.
2. **Buku Tamu: missing screen** — Focus existing GET/POST caller audit on runtime base,widget,validation,body and result. Implement only proven endpoint/fields with explicit review for submission. Bukti yang diperlukan: Frozen widget→serializer→response proof before adapter/UI; synthetic transport and browser checks.
3. **Cari Bidang: native-facing lookup** — Bind existing NIB/right/wilayah lookup callers through returned persil ID; replace raw-ID forms with proven controls and authoritative map entry. Bukti yang diperlukan: Widget/lookup response ledger; fixtures per branch; accepted legitimate returned-ID readonly example. Never invent coordinates from7String metadata.

Native emulator belum menyediakan pembanding pascalogin. Bukti statis dan fixture tidak menggantikan penerimaan server atau pengamatan APK resmi pada data sama. Tujuan keseluruhan tetap belum tercapai.
