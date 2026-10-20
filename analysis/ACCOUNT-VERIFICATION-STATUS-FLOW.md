# Status verifikasi akun: bukti APK

Audit statis terbatas pada APK 6.1.5 yang diberikan, `libapp.so` SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`. Tidak ada request produksi, pengambilan kredensial, perubahan status akun, atau perubahan aplikasi dalam audit ini.

`GET account/CheckVerifStatusPerorangan` dipanggil pada `0xda15dc` oleh helper `0xda1588`. Caller tidak mengirim body, query, atau header khusus. Constructor `0x709030` mengambil dependency `FRb` dan menyimpannya di service `+7`; helper memakai client utama `FRb+7`, dengan batas autentikasi sesi yang sudah dibuktikan di [audit transport](TRANSPORT-BOUNDARIES.md).

Helper langsung mem-parsing `response.data` sebagai `Map<String,dynamic>` melalui `0x8dbbfc`, tanpa JSON-decode String atau pembandingan HTTP 200 di helper tersebut. Model `BCb` mempunyai tiga field nullable:

| JSON | Tipe | Offset model |
|---|---|---|
| `error` | `bool?` | `+7` |
| `message` | `String?` | `+0xb` |
| `data` | `String?` | `+0xf` |

Field hilang/null tetap null; tipe nonnull yang salah gagal cast. `data` bukan nested object status. Helper tidak melempar hanya karena `body.error == true`; consumer halaman profil yang ditelusuri memakai `message` sebagai kode. Ini tidak berarti semua penanganan error backend harus dilonggarkan.

Rantai consumer `0xda0e9c → 0xda14fc → 0xda1588` membaca `BCb.message` dan, selain kode khusus `"-1"`/`"3"`, memanggil `0xda0fcc(message ?? "", data ?? "")`. Helper itu membaca storage lokal `user` melalui `0xd2c74c`, mem-parsing model `gyb`, dan memeriksa `userLevel:int?` pada `+0x17`. Key `userLevel` terbukti di `0x6b1cb0`, cast int nullable di `0x6b1ce8`, dan penyimpanan di `0x6b1cfc`. Ini bukan `account_summary.statusVerifikasi` dan bukan request API tambahan.

Untuk cached `userLevel != 2`, kode pesan dipetakan sebagai berikut:

| `message` persis | Teks resmi dan bukti |
|---|---|
| `"0"` | “Permohonan verifikasi akun sedang dalam proses.”, literal `0xda10a4` |
| `"1"` | “Permohonan verifikasi kamu telah disetujui. Mohon untuk login kembali untuk memperbarui akun kamu.”, literal `0xda1110` |
| `"2"` | “Permohonan verifikasi kamu ditolak.” diikuti newline dan `data ?? ""`, literal `0xda1198`, concatenation `0xda11ac` |

Kode `"-1"`/`"3"` memilih jalur callback lain; audit ini tidak memberi label bisnis berdasarkan tebakan. Untuk kode tidak dikenal, jangan menebak akun sudah/belum terverifikasi. Detail seluruh aksi dialog, submit identitas, IKD, dan liveness belum diaudit di sini.

Implikasi yang langsung relevan: respons `{"error":false,"message":"1"}` adalah hasil pembacaan status dengan pesan persetujuan. Menampilkan heading generik “Error” diikuti `false` menyesatkan; status bisnis perlu ditampilkan terpisah dari kegagalan koneksi. Kesesuaian respons produksi dan hasil UI browser harus dicatat oleh pengujian runtime terpisah.

Ledger: [flow.json](recovered/account-verification-status/flow.json). Reproduksi bukti: `build_account_verification_status.py`, `finalize_information_services.py`, kemudian `verify_information_services.py account-verification-status` di `analysis/rea`. Verifier membandingkan ulang 10 source hashes, 1.569 instruksi ELF, 57 marker, dan dependency yang diikat hash. Tidak ada klaim seluruh fungsi verifikasi selesai.
