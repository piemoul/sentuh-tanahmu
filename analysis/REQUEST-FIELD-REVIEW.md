# Audit independen field pengiriman Sentuh Tanahku

**Hasil review selesai: 12 kontrak builder, 231 path field** pada `recovered/reviewed-survey-contracts.json`. Ini subset yang telah ditelusuri dari serializer ke helper request; bukan klaim seluruh API produksi berhasil dipulihkan. Audit gabungan milik REA mencakup keluarga lain seperti autentikasi, geotag, dan dokumen. Tidak ada request, login, unggahan, atau perubahan data pemerintah dilakukan.

Reproduksi fragmen: `environment/python/Scripts/python.exe analysis/rea/build_reviewed_field_fragment.py`. Sumber setiap nama field mencakup file disassembly dan alamat instruksi. Type yang tidak dapat dibuktikan ditulis `unknown`; requiredness server seluruhnya `unknown`. Sebuah key yang selalu dikeluarkan serializer tidak otomatis wajib, non-null, atau valid menurut server.

## Metode dan cakupan

Scan string awal menemukan 148 kandidat path yang memiliki slash. Ini hanya hasil heuristik. Scan lanjutan atas sembilan nama survei tanpa slash menemukan 19 referensi pool melalui seluruh `.text`, tersimpan pada `recovered/survey-callsites/index.json`. Sebagian merupakan nama endpoint, sebagian key model yang digunakan ulang. Tujuh keluarga submit survei baru dapat diikat ke helper POST: kelas jalan, fasilitas, zonasi, risiko, foto, pertanian, nonpertanian. `surveydetail` terlihat pada penyusunan query `b`, `j`, `i`; tidak dihitung sebagai salah satu 12 kontrak submit di laporan ini.

Helper POST `0x6b9270` telah diverifikasi oleh agen REA terhadap literal metode di body helper, bukan disimpulkan dari nama URL. Map serializer, argumen `data`, serta opsi JSON/multipart ditelusuri secara statis. Ini tidak menggantikan spesifikasi resmi, rekaman request sah, validasi auth, atau pengujian penerimaan server.

## Kontrak yang di-review

| Endpoint literal | Transport | Field/nesting terkonfirmasi | Sumber utama |
| --- | --- | --- | --- |
| `api/booking/` | JSON | `loket`, `tanggal_booking`, `sumber`, `jumlah_berkas`, `pemohon.{nik,nama,tempat_lahir,tanggal_lahir,token,no_hp}` | Serializer `0x88c77c`; call `0xd8b640` |
| `/apis/SwaplottingTerdaftar` | Multipart | `id`, `kluster`, `namapemilik`, `kontaktelp`, `kontakemail`, `tipehakid`, `tipehak`, `kantorid`, `namakantor`, `wilayahid`, `namawilayah`, `nomorhak`, `reviu`, `lat`, `lon`, `file` | Builder `0xd9f348`; call `0xd9f850` |
| `/apis/SwaplottingBelumTerdaftar` | Multipart | `id`, `kluster`, `namapemilik`, `kontaktelp`, `kontakemail`, `alamat`, `alashak`, `nomoralashak`, `keteranganalashak`, `buktipajak`, `nomorbuktipajak`, `keteranganbuktipajak`, `kantorid`, `namakantor`, `wilayahid`, `namawilayah`, `reviu`, `lat`, `lon`, `file` | Builder `0xda05a8`; call `0xda0be8` |
| `PlotBidang/InstansiBelumBersertipikat` | Multipart + file `gambar` berulang | `nup`, `alamat`, `wilayahid`, `jenishakid`, `jenishak`, `nomorhak`, `luas`, `luasdelineasi`, `penguasaan`, `Pemilikan`, `Pemanfaatan`, `Penggunaan`, `delineasi`, `Permasalahan`, `Reviu`, `nib`, `nibel`, `dokumen`, `rutr`, empat `batasUtara/Timur/Selatan/Barat`, `gambar` | Builder `0xdda2ac`; call `0xddaa14` |
| `PlotBidang/InstansiBersertipikat` | Multipart + file `gambar` berulang | Field bersama pada baris sebelumnya, tanpa empat key batas dalam builder ini | Builder `0xddab10`; call `0xddb184` |
| `surveylbtkelasjalan` | JSON | `no_berkas`, `data.{provinsi,kota_kab,kecamatan,kelurahan_desa,detail_jalan[]}`; item: `nama_jalan`, `lebar_jalan`, `koordinat_titik`, `nama_kelas`, `keterangan_kelas` | Serializer `0x78cc18`; call `0xd4a688` |
| `surveylbtfasilitas` | JSON | `no_berkas`, wilayah di `data`, `data.fasilitas[]`: `nama_fasilitas`, `nama_jenis`, `keterangan_jenis`, `koordinat_titik` | Serializer `0x791218`; call `0xd4d0d4` |
| `surveylbtzona` | JSON | `no_berkas`, wilayah di `data`, `data.identifikasi[]`: `identifikasi_lokasi`, `nama_zonasi`, `keterangan_zonasi`, `nama_penggunaan`, `keterangan_penggunaan`, `koordinat_titik` | Serializer `0x796390`; call `0xd50518` |
| `surveylbtfaktorresiko` | JSON | `no_berkas`, wilayah di `data`, `data.detail_risiko[]`: `lokasi_risiko`, `koordinat_titik`, `faktor_risiko[]` dengan `nama_risiko`, `keterangan_risiko` | Serializer `0x7c1a98`; call `0xd6608c` |
| `surveyfoto` | Multipart | `no_berkas`, `foto`, `survey_id`, `survey`, `type` | Builder `0xd4ff20`; call `0xd50194` |
| `surveynonpertanian` | JSON | `no_berkas` + `data` berisi koordinat, wilayah, transaksi, responden, bidang/bangunan, kondisi fisik dan array komponen; semua key tingkat data tercantum di JSON | Serializer `0x7a63a0`; wrapper `0x7a6350`; shared call `0xd5c0c4` |
| `surveypertanian` | JSON | `no_berkas` + `data` berisi koordinat, wilayah, transaksi, responden, bidang, kemiringan, komoditas, jalan/akses, irigasi/drainase/utilitas; semua key tingkat data tercantum di JSON | Serializer `0x7ad724`; wrapper `0x7ad6d4`; shared call `0xd5c0c4` |

Capitalization dipertahankan. `Reviu`, `reviu`, `Lat`, `lat`, dan field bersifat mirip tidak otomatis dapat dipertukarkan.

`jumlah_berkas` memiliki bukti integer boxing. `pemohon` pada booking memakai `Map<String,String>`, sehingga keenam nilai nested bertipe string di serializer; format tanggal serta aturan identitas tetap belum diketahui. Kebanyakan nilai model lain berada dalam `Map<String,dynamic>` dan tidak diberi tipe tebakan. Metadata credential hanya disebut nama field/header; nilainya tidak disertakan.

Untuk pertanian/nonpertanian, daftar key `data` terpulihkan, tetapi beberapa array komponen bertingkat belum ditelusuri sampai seluruh leaf. Karena itu jumlah 231 adalah jumlah path yang di-review, bukan jumlah semua parameter aplikasi atau seluruh leaf yang mungkin dikirim.

## Pemetaan koordinat untuk GNSS eksternal / hasil survei sebenarnya

| Representasi asli | Bukti dan implikasi |
| --- | --- |
| Geotag lokal: `latitude`, `longitude` | Schema SQLite exact menyimpan TEXT dan image path. Ini schema lokal, bukan nama field jaringan. |
| Geotag submit: `Lat`, `Longi` | Dikonfirmasi terpisah pada builder oleh agen REA; lihat audit gabungan. Jangan mengganti dengan `latitude/longitude` hanya karena nama schema lokal. |
| Swaplotting submit: `lat`, `lon` | Dua sumber double dibaca terpisah lalu melewati conversion helper `0xa944a0` sebelum FormData. Encoding akhirnya belum ditetapkan hanya dari nama helper. |
| Survei nilai tanah: `data.koordinat_titik`, `data.koordinat_take_titik`, `data.jarak` | Tiga key terpisah pada serializer pertanian/nonpertanian. Semantik titik objek, titik pengambilan dan jarak **belum dibuktikan penuh**; jangan mengisinya dengan satu nilai yang disamakan. |
| Survei lingkungan: `koordinat_titik` di item list | Ada per item jalan/fasilitas/zonasi/risiko. String/array/object, order axis dan format serialisasinya belum dipastikan. |
| PlotBidang: `delineasi` | Field geometri terpisah dari `luasdelineasi`, `luas`, dan deskripsi batas. Format WKT/GeoJSON maupun CRS tidak boleh diasumsikan. |

Input GNSS yang sah perlu menyimpan data mentah dan asal pengukuran: tipe receiver/file, waktu ukur, CRS/datum/epoch, satuan, kualitas fix, serta akurasi yang benar-benar disediakan sumber. Ini rancangan provenance lokal yang disarankan, **bukan field API asli yang berhasil ditemukan**. Perlu transformasi koordinat yang eksplisit jika datum/CRS berbeda. Jangan mengubah metadata quality menjadi angka yang tidak didukung pengukuran, dan jangan menyamakan input manual koordinat dengan posisi perangkat saat foto diambil.

Belum terbukti ada field submit asli yang membawa sumber receiver eksternal, CRS, epoch, covariance, horizontal accuracy, atau tipe RTK. Raw string umum `accuracy`, `is_mocked`, metadata EXIF dan plugin lokasi bukan bukti bahwa field tersebut termasuk payload setiap submit. Dukungan data GNSS pada webapp dan penerimaan data oleh layanan asli adalah dua hal yang harus diuji terpisah melalui integrasi yang berwenang.

## Bukti non-wire yang dipertahankan

- `recovered/certificate-schema.json`: schema contoh sertipikat bundled; bukan request submit. ID/encrypted ID/nomor dokumen/staf tidak disalin sebagai fixture pengiriman.
- `recovered/offline-schemas.sql` dan `sqlite-schemas.json`: empat schema database lokal exact, tervalidasi SQLite; bukan kontrak HTTP.
- `recovered/application-strings.json` dan `validation-evidence.json`: label dan pesan validasi, bukan skema wajib server.
- `recovered/manifest-summary.json`: inbound intent filters telah dipisahkan dari outbound package-visibility queries. Elemen HTTPS pada `<queries>` bukan bukti tautan inbound ke aplikasi.

Audit ini menghasilkan peta parameter yang dapat diperiksa dan dilanjutkan. Belum membuktikan kesetaraan seluruh fungsi webapp, autentikasi resmi, kebijakan origin/CORS, ketentuan penggunaan layanan, validasi foto/tanda tangan, maupun penerimaan server.
