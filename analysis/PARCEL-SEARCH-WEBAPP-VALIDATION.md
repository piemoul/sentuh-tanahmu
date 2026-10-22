# Cari Bidang — validasi webapp

Pencarian resmi **Sertipikat Analog / Sertipikat Elektronik (NIBEL)** sudah diterapkan pada route Cari Bidang. Form ID teknis diganti oleh jenis hak, Kantor Pertanahan, Desa/Kelurahan dan nomor hak, atau NIBEL. Ini merupakan kemajuan fungsi, bukan klaim kesetaraan seluruh aplikasi.

## Bukti penerapan

- **1.305/1.305 tes Node**, **1.190 pemeriksaan VM/23 suite**, **27/27 pemeriksaan browser desktop**.
- **42 tes model/controller**, **97 tes backend/registry**; reviewer independen menjalankan11probe dan29tes backend tanpa temuan material.
- **31 frontend +26 backend** cocok pada container sehat; **57 file image mandiri** cocok tanpa jaringan; **31 aset HTTPS Cloudflare** cocok. Katalog176/83 aktif: tepat3GET baru,173record lainnya utuh.
- Baseline58runtime berubah hanya6file;4runtime baru ditambah.32ledger,377receipt dan korpus170request terdahulu tidak diubah. Backend direstart sekali untuk adapter; sesi lama berakhir dan login diminta terpisah.

[Rekap mesin](webapp/parcel-search-summary.json), [browser](webapp/parcel-search-browser-final.json), [review backend](webapp/parcel-search-backend-review.json), [audit form](PARCEL-SEARCH-FOLLOWUP.md), [audit input tambahan](PARCEL-SEARCH-INPUT-FOLLOWUP.md).

## Alur dan data

Kantor memakai main KantorId, wilayah memakai WilayahId melalui projection native Byb.Kode, tidak menukar dengan raw Cyb.Kode. HGU/HPL menerima wilayah kosong. Nomor hak dipertahankan sebagai teks. NIBEL menghapus semua titik ASCII saja; tidak menebak filter/truncation lain. PersilId dari hasil dicheck kosong memakai whitespace native (termasuk U+0085), lalu ID asli dikirim ke boundary. Metadata integer luas/batas tidak diubah menjadi geometri.

Boundary server memasok kamera/pin untuk peta OSM+Bhumi yang sudah ada. Revisi hasil mengikat target Simpan ke Koleksi agar snapshot/render tidak mengubah ID atau menghidupkan peta lama. Pergantian kantor menghapus wilayah lama; tab mempertahankan input; edit dan navigasi mengakhiri outcome lama.

Browser menguji validasi, analog, NIBEL, tidak ditemukan, empty geometry, malformed null-only, HTTP error, retry, HGU, pin/zoom/reset/layer, form retirement dan respons lambat setelah navigasi. Seluruh22panggilan main dan49tile adalah sintetis lokal. Kedua layer menggunakan PNG lokal; screenshot bukan bukti penerimaan server/layer produksi. Fixture dihentikan dan port ditutup.

## Batas penerimaan

Build tersedia di http://localhost:4173/#/parcel dan https://sentuh.davay.space/#/parcel. Penerimaan dengan akun asli dan data pencarian sah masih menunggu login pengguna. Tidak ada submisi identitas, booking, kunjungan, OTP atau geotag produksi.

Layout responsif tersedia, tetapi viewport mobile baru belum diuji. Native formatter/IME, pengurutan preferensi kantor dan shared URL escaping belum sepenuhnya dibuktikan. Input/body bounds, URLSearchParams, integer64→decimalString dan guard geometri adalah adaptasi browser yang dicatat. Telemetry native tidak diaktifkan oleh alur baca ini.

Peta langsung pada detail Berkas masih memerlukan binding data. Buku Tamu runtime, kelanjutan OTP/liveness, booking dan gap menu lainnya belum selesai. Geotag yang menggantikan kewajiban hadir tetap nonaktif. Tidak ada klaim commit/push baru.
