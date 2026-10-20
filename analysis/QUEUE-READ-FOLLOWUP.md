# Queue read follow-up: query String

Audit statis APK 6.1.5. Temuan baru yang ditutup adalah **encoding String query daftar antrean**. Tidak ada jaringan, eksekusi APK, pembacaan identitas akun, pemulihan bearer, perubahan runtime, atau aktivasi adapter antrean.

Bukti: [ledger](recovered/queue-read-followup/flow.json), [hasil verifikasi](recovered/queue-read-followup/verification.json), dan [verifier](rea/verify_queue_read_followup.py). ELF SHA256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683` dipin.

Verifikasi lulus **18 hash sumber, 1.926 instruksi, 46 marker, 7 label pool publik, 9 dependensi, dan 5 vektor encoding sintetis**. Sebanyak 186 instruksi tambahan dibatasi pada constructor/allocator dan wrapper entry interceptor; sisanya menggunakan jendela yang sudah dibuktikan. Sumber kanonis lama tidak diubah atau direbaseline.

## Kontrak query yang kini tertutup

GET `api/antrian/saya` memakai **FRb+0xb Directus**, bukan main account FRb+7. Sumber `nik` tetap daftar identitas lokal `qzb.nik` yang digabung dengan koma, bukan satu NIK profil yang diasumsikan.

1. Controller membaca `qzb+0x17`, melakukan join koma pada `0xd1e798`, lalu meneruskan String hasilnya.
2. Service menyimpan argumen pada stack `-0x88`; `0xd1eaec` membaca nilai yang sama dan `0xd1eaf0` memasukkannya langsung sebagai query `nik`.
3. Tidak ada inner pre-encode pada caller. Encoder bersama: `0x6bc664 → 0x6bc738 → 0x6bc798`, String encoder context+0x27 → closure `0x6bd4d4 → 0x42eb74 → 0x42ded4`.
4. Encoder memakai UTF-8 dengan karakter aman alnum dan `-._~`. Spasi menjadi `+`, koma `%2C`, persen `%25`, asterisk `%2A`, dan hex escape kapital. Surrogate UTF-16 terisolasi menjadi U+FFFD sesuai dependensi encoder beku.

Contoh sintetis: `fixture-A,fixture-B` menghasilkan `nik=fixture-A%2Cfixture-B`; `A B+C%` menghasilkan `nik=A+B%2BC%25`.

Ini **satu pass encoding**, berbeda dari query Document Geo yang mempunyai pre-encode tambahan. Jangan menyalin double encoding ke antrean atau menganggap `URLSearchParams` biasa ekuivalen untuk seluruh karakter karena kebijakan `*`/`~` berbeda.

String join kosong tetap menghentikan request. Bukti ini mencakup teks query sebelum parser URI bersama, bukan rekaman paket atau seluruh transformasi interceptor. Detail antrean mengonkatenasi full selected ID ke path; semantik reserved characters pada ID/path tersebut belum ditutup oleh proof query String ini.

## Batas serah terima

| Batas | Titik native | Status |
| --- | --- | --- |
| Interceptor request/response/error | `vWa` CID3748; wrapper request `0xbcca00 → 0xbcca40`, response `0xbca8e8 → 0xbca928`, error `0xbcb220 → 0xbcb260` | Entry terikat; body dan inherited dispatch belum diaudit. Jangan menyebutnya pass-through/logging-only. |
| Retry | `AP` CID3749, ctor `0x6bb644`, default retries3 disimpan di +0xf; error wrapper `0xbcaa08 → 0xe1888c` | Default constructor bukan bukti jumlah percobaan aktual, eligible status, delay, atau credential retention. |
| Status/decoding | Queue options `0x6b823c/0x6b8584`, composer `0x6fe754`, dispatch `0xd05178` | Shared default 2xx predicate sudah ada dalam bukti Cari Berkas, tetapi active queue binding dan perilaku setelah interceptor belum lengkap. Service queue sendiri tidak memeriksa HTTP200. |
| Identitas/sesi | Loader `0xd1ed00`; subscription+0x4f, dynamic call `0xd1efc8`, await `0xd1efdc`, bind `0xb5077c`, store `0xd1f054`; callback `0xd1f080`, error `0x72bdbc` | Exact cancellation, first/seed emission, persistence editor dan logout/account-switch belum lengkap. |

Audit body interceptor dan lifecycle identitas telah diserahkan kepada worker lain. Follow-up ini berhenti pada batas query String dan entry-wrapper yang sudah dicatat; tidak memperluas audit SDK.

[QUEUE-TRANSPORT-FLOW.md](QUEUE-TRANSPORT-FLOW.md) tetap menjadi bukti client terpisah, origin awal, bundled-configuration provenance, dan konstruksi HTTP/TLS. Provenance bukan bukti credential/configuration integrasi browser yang didukung, penerimaan server kini, atau kewajiban client certificate. Main-account token tidak dianggap sebagai token antrean.

Cakupan queue tetap **unavailable_notice**. Tidak ada adapter baca, booking, deletion, atau identity editor yang diaktifkan. Tidak ada server acceptance baru.

Reproduksi offline: `tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_queue_read_followup.py`.

Ledger SHA256: `ddea16d6b4e1df93f1c2dbd52ccbf9d51c51f152e288b4e6ff36204090292a47`.
