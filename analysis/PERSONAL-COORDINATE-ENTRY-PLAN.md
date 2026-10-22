# Personal Swaplotting: rencana input koordinat eksplisit

**Rencana ini belum diimplementasikan.** Tujuan langkah berikutnya adalah memusatkan peta personal Swaplotting dari koordinat manual atau titik pengukuran sesi yang dipilih secara eksplisit, lalu memakai lifecycle cameraTarget→point yang sudah ada. Ini bukan input Berkas geotag, pengganti GPS perangkat, bukti kunjungan atau kemampuan submit baru. Tidak ada perubahan runtime, tes, browser, akun atau jaringan pada penyusunan rencana. [JSON sumber dan kontrak](webapp/personal-coordinate-entry-plan.json) mengikat 79 runtime yang tetap identik.

[Observasi root](webapp/bhumi-swaplotting-guide-observation.json) mencatat ilustrasi bantuan resmi Bhumi dengan field Longitude/Latitude dan alternatif klik peta. Itu corroboration adanya UI manual di web resmi yang terpisah, bukan bukti UI native6.1.5, API/client/auth/wire, CRS/default/axis order, precision, eligibility atau penerimaan upload. Penulis rencana hanya membaca receipt dan hash capture; tidak mengamati ulang halaman atau gambarnya.

## Permukaan patch minimum

| Berkas | Perubahan yang diusulkan |
|---|---|
| assets/swaplotting/coordinate-entry.js (baru) | Parser pasangan field bernama, proyeksi kandidat sesi dan label provenance murni. Tidak memanggil normalizePoint atau toGeotagFields. |
| model.js + controller.js | Draf input browser; cameraTarget tetap numeric; targetProvenance terpisah; openForm menyalin menjadi point dan pointProvenance. |
| map.js | applyCenter terjaga owner, pemeriksaan range/proyeksi, penanganan echo programmatic serta anchor engine terpisah dari angka masukan. |
| host.js + view.js | Panel Longitude kemudian Latitude, konfirmasi format eksplisit, pilihan titik sesi opsional, Apply eksplisit, patch node stabil dan source/point readonly pada form. |
| app.js | Hanya teruskan getCoordinatePoints:()=>state.points ke host personal. Jangan mengikuti state.selectedPoint secara otomatis. |
| styles.css | Root menangani panel responsif, pesan error dan provenance kecil; tidak perlu mengubah style map/camera bersama. |

Backend, registry, API, gnss.js/import pipeline, Berkas/scan/geotag, queue, kamera/OTP/serializer tidak perlu berubah. Katalog tetap176/84/92; Kirim tetap nonaktif. Angka pada ilustrasi resmi tidak menjadi default baru.

## Kontrak masukan browser

- Field **Longitude (Bujur)** selalu memetakan lng; **Latitude (Lintang)** memetakan lat. Leaflet menerima [lat,lng]. Ini mapping bernama yang kita nyatakan; jangan menyimpulkan urutan axis server hanya dari nama EPSG.
- User menyatakan format geografis **WGS84 dalam derajat desimal** secara eksplisit; jangan preselect lalu menganggap itu CRS native/BPN. Tidak ada transformasi UTM/TM3/DMS, pertukaran axis, clamp atau wrap masukan otomatis.
- Gunakan text/inputmode decimal agar raw input dan -0 tidak hilang akibat format UI. Parser finite decimal/exponent merupakan kebijakan browser yang terdokumentasi, bukan emulasi formatter Dart. Tolak kosong/hex/koma/NaN/Infinity serta format tak didukung. Tentukan penanganan underflow nonzero→0 dengan jelas; jangan menyamarkannya sebagai pengukuran akurat.
- Batas geografis latitude±90/longitude±180 tetap berlaku. Map EPSG3857 yang sekarang mempunyai cap latitude±85.0511287798066; input geografis yang tidak bisa dipusatkan harus ditolak dengan pesan yang tepat, bukan diam-diam digeser. Longitude+180/-180 yang valid dipertahankan.
- Pertahankan raw String dan angka binary64 secara terpisah. structuredClone menjaga -0; JSON-roundtrip, String(-0), toFixed dan serialisasi GeoJSON dapat menghapus tanda atau representasi asal. Jangan memakai fixed7 dari toGeotagFields dan jangan mengklaim formatter wire native.
- Pertahankan zoom fractional saat ini. Zoom-ke-titik tambahan harus menjadi tindakan/adaptasi eksplisit; tidak ada bukti zoom17 atau default CRS dari ilustrasi.

## Titik sesi dan provenance

state.points sudah menyimpan latitude/longitude, source, accuracy, measuredAt, crs, original dan warnings. Impor saat ini memberi ID baru; tidak perlu membuka ulang file, receiver atau geolocation. Pilihan pengukuran hanya memakai record aktual source survey/external_gnss, tidak melabeli browser source sebagai GNSS eksternal. Tidak ada auto-apply dari selectedPoint.

Penting: normalizePoint saat ini memberi default source survey dan CRS EPSG:4326 jika kosong. Karena itu label crs pada record tidak membuktikan datum benar-benar dideklarasikan pada sumber. Tampilkan label aplikasi dan metadata sebagai keterangan pengguna, tetap minta konfirmasi format untuk pemusatan. Jangan memanggil normalizePoint lagi: ia juga membuat ID/default/warnings baru.

Host menerima callback getCoordinatePoints. Ia menyimpan generasi daftar kandidat serta reference/fingerprint record; DOM hanya memilih index/generasi, bukan mengirim latitude/longitude/source seolah server mengesahkannya. Saat Apply, baca callback lagi dan cocokkan record yang sama. Record hilang/berubah, duplicate ID ambigu, pilihan stale atau owner berbeda membatalkan Apply; jangan diam-diam memakai nilai baru. Escape semua nama/catatan/warnings.

Pisahkan targetProvenance dari cameraTarget numeric. Tag manual-coordinate menyimpan raw input dan deklarasi format; tag session-point menyimpan ID lokal, declared measurement source dan snapshot metadata, bukan jaminan akurasi/otoritas. Pergerakan peta berikutnya mengganti association menjadi map-camera. Form memakai point yang tetap berasal dari cameraTarget dan pointProvenance snapshot terpisah; bukan mengubahnya menjadi fix perangkat.

## Apply, anchor, async dan lifecycle

1. Mengedit field hanya mengubah draf. Apply eksplisit memeriksa host/route/sesi, deklarasi format, map ready, range dan kandidat sumber yang masih sama. Map belum siap berarti tombol nonaktif; jangan antrekan Apply melewati resource load. Draf mentah tetap boleh diedit selama loading.
2. Validasi sebelum mutasi apa pun. applyCenter harus sinkron, guarded dan gagal atomik: target/source lama tetap bila map atau input ditolak. Ia tidak mengubah acceptance disclaimer, membuka form, menambah request selain tile map normal, atau mengaktifkan Kirim.
3. setView dapat menghasilkan moveend dan zoomend sinkron, lalu echo berikutnya. Jangan membiarkan callback setCameraTarget generik menghapus source manual/GNSS. Simpan angka target eksplisit persis, mute echo saat command dan rekam **anchor getCenter engine** setelah pemusatan secara terpisah.
4. Engine bisa membulatkan/proyeksi center atau menormalkan -0 menjadi+0. Event duplikat pada anchor yang sama tidak boleh menulis ulang angka masukan. Zoom-only menjaga angka/source yang dipilih sambil mengganti zoom. Jangan menebak epsilon. Center engine yang benar-benar berubah atau reset/pan eksplisit mengakhiri association pengukuran; label menjadi map-camera.
5. Saat resource map selesai atau disclaimer berubah, patch input/error/status/provenance dan pertahankan node input/caret/seleksi serta canvas map. Handler edit koordinat harus mempunyai jalur partial sendiri; jangan replace seluruh map.
6. openForm menyalin point+source snapshot. Callback lama setelah berpindah form/route/sesi tidak dapat mengubahnya. Perubahan record sesi berikutnya tidak diam-diam mengubah form yang sudah dibuka. Back mengikuti perilaku kini: hapus draf form/foto tetapi pertahankan target/source peta. Dispose/clearPrivate membersihkan raw input, kandidat dan provenance. Lifecycle foto dan reference yang sudah lulus tetap utuh.

## Tes esensial untuk implementasi nanti

| Area | Kasus minimum yang bermakna |
|---|---|
| Parser/source | Axis bernama, deklarasi CRS wajib, unsupported/blank/nonfinite/hex/koma/proyeksi; exact -0 kedua axis, ±180 dan cap Mercator; underflow eksplisit; raw/metadata di-escape; tidak membuat source/CRS default baru. |
| Controller | Apply hanya map screen; tidak mengakui disclaimer/memanggil read baru; initial fallback tidak berubah; snapshot ke kedua form exact termasuk -0; pan/reset mencabut association, zoom menjaga; back/dispose/source perubahan tidak menyelinap ke point lama. |
| Map | setView memunculkan dua event sinkron+late; satu Apply yang benar; roundoff engine dan normalisasi-0 tidak mengubah target raw; zoom-only dan pan/reset dibedakan tanpa epsilon; gagal atomik. |
| Host async/DOM | Map resource/disclaimer selesai saat koordinat fokus dan caret aktif; canvas/input tidak diganti; pending/failed mount menahan Apply; current candidate index/generation/reference; route/session/form/dispose/detached callback ditolak. |
| Regressi batas | Hanya tiga read personal dan tile map yang sudah ada; tidak ada Berkas geotag, device GPS, OTP/token/submit, fixed7 atau header/CRS wire baru; foto/removal dan Kirim disabled tidak berubah. |
| Browser berikutnya | Interaksi manual dan titik sesi dengan data sintetis; desktop dan iframe same-origin390×844; source/raw/point tampil konsisten, pan relabel jelas, fokus dan foto tetap berfungsi. Bukan hardware/mobile/server acceptance. |

Semua nama metode baru pada JSON adalah usulan, belum API runtime. Bukti CRS/datum berkas, transformasi survei, titik BPN authoritative, byte wire native Double/multipart, checksum dan penerimaan server tetap terbuka. Implementasi ini harus tetap personal Swaplotting; tidak meneruskan koordinat terukur ke Berkas geotag atau menyatakan kunjungan/radius/attestation terpenuhi.
