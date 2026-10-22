# Perubahan gap menu terhadap snapshot 77 enabled

Snapshot [20 Oktober](WEBAPP-FUNCTION-COVERAGE-2026-10-20.md) tetap disimpan sebagai sejarah. Sumber sekarang mempunyai **176 operasi, 84 enabled: 71 read dan 13 write; 92 disabled**. Dibanding snapshot itu, tepat **tujuh GET** bertambah: tiga prasyarat Antrian, tiga lookup/referensi Cari Bidang, dan metadata Buku Tamu. Tidak ada tambahan enabled write. Enabled bukan penerimaan server atau kesetaraan 1:1. Inventaris 29 menu/38 route diwarisi; suplemen ini tidak mengaudit ulang seluruh menu.

| Fitur | Gap lama yang sudah dikerjakan | Gap yang masih terbuka |
|---|---|---|
| Antrian Daring | Mulai Mengantri kini membuka kantor→lokasi→kalender/tanggal→ketersediaan. Ada count 1–5 dan tinjauan lokal yang terikat baris/generasi/pemohon kini. | Kuota/closing/full belum diterapkan sebagai gate runtime; booking, identitas/OTP/token/socket belum selesai. Tombol akhir Ambil Antrian tetap nonaktif. |
| Buku Tamu | Route khusus, QR manual atau kamera opsional, metadata unit, sembilan field raw dan validasi lokal; hanya NIK/email cached signin diprefill. | Belum ada QR resmi/metadata unit produksi yang diterima. Simpan tetap nonaktif; parser/GET tidak membuktikan keaslian QR, kedatangan atau verifikasi petugas. |
| Cari Bidang | Form teknis persil-ID telah diganti Analog/jenis hak/kantor/wilayah/nomor dan Elektronik/NIBEL. Returned PersilId asli mengikat pembacaan boundary dan peta. | Lookup berisi dan boundary dengan data akun nyata belum diterima. Formatter/IME, semua cabang dan urutan preferensi kantor belum setara native secara menyeluruh. |
| Personal Swaplotting | Disclaimer→peta titik→dua form, kontak sendiri dari account_summary yang sesuai gate, validasi 9/14, foto kamera lokal/ulang/hapus maksimal lima penambahan. Long/Lat manual atau titik survey/external_gnss sesi kini dapat diterapkan secara eksplisit setelah deklarasi WGS84; sumber disalin readonly ke form. Preview kini berjudul netral. | Managed-user/lCb/DOB/otoritas/OTP, perangkat kamera/GNSS nyata, format wire/multipart dan upload/server acceptance belum selesai. Kirim tetap nonaktif; koordinat/foto tidak membuktikan kunjungan atau pemilikan. |
| Manfaat dan FAQ Profil | Tujuan sekarang mengikuti base+suffix native, bukan paragraf lokal atau Bantuan generik; tautan dibuka terisolasi. Privasi tetap sesuai tujuan yang sudah diaudit. | Reachability bukan persamaan lifecycle WebView Android, audit seluruh isi atau persetujuan hukum. |

## Batas penerimaan yang benar-benar tercatat

- **Antrian:** receipt historis UI akun mencatat 490 kantor, 3 lokasi dan 7 loket tanpa booking. Tidak ada trace HTTP; bukan penerimaan semua kantor atau rilis kini. Browser sintetis fitur tinjauan mencatat 22 pemeriksaan.
- **Cari Bidang:** receipt historis akun mencatat 533 kantor dan 73 wilayah; nomor/NIBEL tidak diisi, lookup/boundary tidak diminta. Browser desktop sintetis mencatat 27 pemeriksaan, bukan hasil pencarian produksi.
- **Buku Tamu:** 15 pemeriksaan browser memakai signin/QR/unit sintetis; belum ada penerimaan QR atau kedatangan produksi.
- **Swaplotting:** writer terpisah mencatat satu GET disclaimer dan satu GET kantor anonim, HTTP200 lokal/upstream; kantor menghasilkan 487 model bertipe. Koreksi autentikasi berlaku: optionalSession tanpa token akun tidak memasang Authorization menurut sumber, bukan klaim application Authorization. Review sumber bukan pengamatan paket jaringan independen. Wilayah/profil/form berisi produksi belum diterima. Browser koordinat memakai fixture sintetis, 41 pemeriksaan; replay label terbaru 11 pemeriksaan. Kamera berbasis canvas fixture dan frame CSS390×844 tidak mensertifikasi hardware atau Android.
- **Profil:** tiga tujuan resmi pernah merender konten sesuai secara anonim. Status HTTP, seluruh isi dan WebView Android tidak direkam.

Suite penuh terakhir yang **sudah tercatat** berisi 1.636 tes Node dan 1.190 pemeriksaan VM/23 suite. Suplemen ini tidak menjalankan ulang tes, jaringan, akun atau deployment. Receipt per fitur yang lebih lama tetap pada hash masing-masing; JSON mencatat kecocokan pin input langsung terhadap sumber kini dan tidak menganggap rerun terjadi. Receipt label terbaru mengikat seluruh80 runtime kini; sumber kamera/coordinate dan batas Kirim tidak berubah oleh koreksi teks itu. Angka fase yang tumpang tindih tidak dijumlahkan.

## Dasar memilih pekerjaan selanjutnya

Jangan mengusulkan lagi pembangunan awal chooser Antrian, layar Buku Tamu, form Cari Bidang, draf/foto/koordinat personal, atau tujuan Manfaat/FAQ sebagai fitur yang belum ada. **Peta inline detail Berkas tetap gap read-side nyata:** [audit dispatch baru](BERKAS-MAP-DISPATCH-FOLLOWUP.md) mengklasifikasikan sebelas indirect call menjadi skalar/String/SPS, tetapi belum mengikat Berkas terpilih ke request/center/geometri. WMS regional dan peta PERSIL yang sudah ada bukan pengganti binding tersebut. Homepage banner/YouTube masih belum dirender khusus pada dashboard kini; bukti widget→model→tap harus dibedakan dari ketersediaan adapter sebelum implementasi.

[JSON sumber dan receipt](webapp/current-menu-gap-delta.json) menyimpan delta tujuh ID, hash sumber dan batas klaim. Tidak ada runtime/backend/catalog enablement, login, jaringan atau write yang diubah oleh suplemen ini. **Tujuan seluruh fungsi 1:1/end to end belum selesai.**
