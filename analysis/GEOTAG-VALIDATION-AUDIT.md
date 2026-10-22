# Audit statis validasi Penandaan Lokasi (6.1.5 / 1037)

**Hasil: batas 10 m adalah jarak titik penandaan yang dipilih terhadap posisi perangkat saat ini. Ini bukan ambang akurasi GPS dan bukan jarak ke poligon sertipikat.**

Callback posisi dan callback pin memasukkan dua pasang koordinat ke fungsi jarak. Hasilnya dibandingkan dengan 10.0 dan dipakai oleh UI serta callback pengambilan penandaan. Rumus yang teridentifikasi adalah Haversine dengan radius 6.378.137 m; penghitungan ini sendiri tidak membuktikan datum atau ketelitian survei.

Aplikasi menyatakan “Penandaan Lokasi maks 10m dari posisi kamu.” dan meminta pernyataan bahwa posisi penguasaan fisik sesuai kondisi aktual di lapangan. Bukti ini menjelaskan alur klien; kebijakan maupun pemeriksaan server tetap belum terverifikasi.

| Bukti | Konteks |
|---|---|
| `0x750bd4`, `0x8b7064` | Posisi perangkat dan titik pilihan disimpan terpisah. |
| `0x751364`–`0x751374`, `0x751610`–`0x751644` | Jarak koordinat dihitung lalu dibandingkan dengan 10 m. |
| `0x8b46bc`, `0x8b46e8`, `0xd97624`–`0xd97654` | Nilai validasi masuk ke UI dan callback pengambilan. |
| `0x7527cc`, `0x752ac4` | Accuracy dan is_mocked merupakan properti terpisah; keberadaannya bukan bukti skema upload atau semua pemeriksaan. |
| `0xd97920`, `0xd9792c`, `0xd98164` | Titik pilihan diteruskan ke preview dan jalur upload yang sudah diaudit. |

Builder upload yang sudah ditelusuri memiliki enam entri eksplisit: `BerkasId`, `Lat`, `Longi`, `file`, `Lokasi`, `IsOffline`. Accuracy/timestamp/is_mocked tidak menjadi entri eksplisit di builder ini. Ini tidak membuktikan bahwa server tidak melakukan pemeriksaan lain.

Draf offline menyimpan pengambilan untuk dikirim ketika koneksi pulih. Tidak ada bukti dalam penelusuran ini bahwa draf memberi pengecualian untuk menandai tanah dari jauh.

`GET LokasiBidang/GetByPersilId` memakai query `persilId`, tetapi parser respons yang terpulihkan hanya membaca tujuh String nullable: `persilId`, `kantorId`, `namaKantor`, `wilayahId`, `namaWilayah`, `jenisHak`, `nomorSertipikat`. Parser ini tidak memberikan koordinat/geometri. Nama endpoint saja tidak cukup untuk mengisi titik BPN pada peta.

Batas audit: hanya artefak yang diberikan; tidak ada eksekusi atau permintaan server, perubahan validasi, atau percobaan bypass. Penegakan server saat ini, seluruh pemeriksaan native/mock-location, datum koordinat, dan jalur resmi pengajuan jarak jauh belum diketahui. Perbandingan koordinat baca-saja harus mempertahankan sumber/datum/waktu dan tidak dijadikan bukti kehadiran fisik.

Bukti lengkap dan alamat instruksi: [geotag-validation-audit.json](recovered/geotag-validation-audit.json). Jejak pengiriman koordinat sebelumnya: [geotag-coordinate-dataflow.json](recovered/geotag-coordinate-dataflow.json).
