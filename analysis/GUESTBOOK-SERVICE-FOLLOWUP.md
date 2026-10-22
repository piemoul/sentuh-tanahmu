# Buku Tamu — kontrak service dan transport

Audit statis ini membuktikan **GET dan POST menuju URL awal `https://sentuh.atrbpn.go.id/bukutamu` melalui klien standalone**, bukan klien sesi utama atau Directus. Tidak ada request, QR baru, pendaftaran, check-in, submisi, eksekusi APK atau nilai kredensial yang dibaca/diturunkan. Target tetap APK 6.1.5 ARM64, ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.

[Ledger beku](recovered/guestbook-service-followup/flow.json) SHA-256 `9bceab7de8b363e521cea846abaa65ae03a925fa5a5f389ee249c014676f10dc` dan [verifikasi independen](recovered/guestbook-service-followup/verification.json) mencakup **9 sumber baru / 757 instruksi ELF**, 16 sumber dependency / 1.307 instruksi, 63 binding pool baru, 125 marker, delapan metadata kelas, enam header allocator, serta 11 hash dependency. Sebanyak 2.064 instruksi unik cocok dengan ELF. Jumlah ini hanya berlaku pada window yang disebut dalam ledger.

## Klien, URL dan autentikasi

Constructor `uBb` CID776 di `9f9808` memanggil `6b7fe0(null)` untuk membuat klien baru dan menyimpannya pada `uBb+b`. Ia juga memperoleh FRb melalui DI dan menyimpannya pada `+7`; kedua service yang ditelusuri **memakai `+b`**. Tidak ada pemasangan LRb, AP atau vWa di constructor tersebut. Factory bersama memasang interceptor default `kP` CID3750.

GET `d28a10` dan POST `d99af8` masing-masing menggabungkan field `TRb.AYi` dengan literal `bukutamu` secara langsung. Dependency [Daring](DARING-IDENTITY-RESPONSE-FOLLOWUP.md) mengikat initializer `TRb.AYi → 6b8fa0`, flag awal `TRb.Thj → ca53e0`, dan literal produksi yang dipilih. Nilai static dapat berubah sesudah inisialisasi; mutasi runtime tersebut tidak diamati.

Kedua service membentuk header `Authorization` dari prefix publik `AtrBpn ` dan field konfigurasi aplikasi opaque `TRb.oYi`. Nilai/initializer kredensial itu tidak dibaca atau diekspor. Tidak ada pembacaan token akun atau refresh pada constructor/service yang diperiksa. Perilaku ini tidak boleh diganti diam-diam dengan bearer akun utama atau bearer Directus.

GET tidak membawa body. Interceptor default tidak menambahkan Content-Type untuk body null. POST membawa FormData CID3744; bila Content-Type belum ada, interceptor menetapkan `multipart/form-data`. Boundary, header HTTP otomatis, kebijakan redirect, TLS aktif dan kesetaraan byte packet tidak diamati. Jangan meminjam retry Directus 1/3/5 detik atau interceptor refresh akun utama untuk klien ini.

## GET: query, model dan hasil

Callsite `d28bf4 → 7017a4` mengirim dua query berurutan: **`uid`, `unid`**, berasal dari argumen posisi kedua/ketiga service dan dipertahankan tanpa trim/default/coercion. Provenance QR serta cast String di controller merupakan lingkup audit UI terpisah.

Hanya HTTP200 memproses body yang sudah ditransformasi sebagai `Map<String,dynamic>`, tanpa dekode JSON String kedua. Generic `wyb<kBb>` membaca `data` lebih dulu, lalu memvalidasi `error:bool?` dan `message:String?`. Kedua field terakhir tetap diperiksa tipenya, walaupun service kemudian tidak memakainya untuk memilih hasil. Field ekstra diabaikan.

Callback `754c74` mengharuskan `data` nonnull berupa Map, lalu parser `754d00` membaca empat **String nullable**:

| Key | Slot kBb CID681 |
|---|---|
| `userId` | `+7` |
| `kantorId` | `+b` |
| `unitKerjaId` | `+f` |
| `namaUnitKerja` | `+13` |

Missing/null dipertahankan sebagai null; String kosong tetap kosong; angka tidak dijadikan String. `data` missing/null melewati callback dan hasil model tetap null.

Hasil service adalah tuple **`(error, model)`**. HTTP200 yang berhasil diparse mengembalikan **`(false, model atau null)`**, termasuk bila envelope `error:true`. Status lain yang dikembalikan normal atau jalur catch mengembalikan **`(true, null)`**. Karena default predicate transport menerima 200–299, 2xx selain200 dapat mencapai cabang error service; non2xx biasanya menjadi exception sebelum cabang status. Hasil `(true,null)` bukan bukti Buku Tamu sebelumnya sudah terisi, sedangkan `(false,null)` bukan izin untuk mengarang identitas kantor/unit.

## POST: dua belas field dan error bool

Builder `d99af8` memakai mBb CID679, menyusun Map dua belas entri lalu memetakannya ke FormData. Objek lookup `mBb+2b` wajib nonnull pada null assertion `d99b5c`. Tidak ada part file eksplisit.

| Urutan | Key | Sumber |
|---|---|---|
| 1 | `kantorId` | lookup kBb `+b` |
| 2 | `unitKerjaId` | lookup kBb `+f` |
| 3 | `userId` | lookup kBb `+7` |
| 4 | `nik` | mBb `+b` |
| 5 | `alamat` | mBb `+1b` |
| 6 | `namaLengkap` | mBb `+7` |
| 7 | `tempatLahir` | mBb `+17` |
| 8 | `tanggalLahir` | mBb `+13` |
| 9 | `noTelp` | mBb `+f` |
| 10 | `email` | mBb `+1f` |
| 11 | `instansi` | mBb `+23` |
| 12 | `keperluan` | mBb `+27` |

Tidak ada trim atau pemformatan ulang tanggal di service. Shared FormData mapper mengubah null menjadi String kosong; `String.toString()` mempertahankan String asli. Tipe input dan validasi widget tidak diklaim lengkap oleh tabel ini.

Callsite `d99dd8 → 6b9270` memakai POST. Service **tidak membaca body respons sama sekali**: HTTP200 menghasilkan **false**, status normal lain/catch menghasilkan **true**. Nilai bool itu adalah **error**, sehingga false baru diperlakukan caller sebagai keberhasilan. Menyamakannya dengan bool success akan membalik perilaku. Audit ini bukan bukti bahwa server menerima data, QR atau identitas tertentu.

## Batas kehadiran dan implementasi

Dua builder tersebut tidak menambahkan koordinat GPS, accuracy, isMocked, checksum/attestation perangkat atau radius kehadiran. Ini observasi terbatas terhadap dua request, bukan bukti ketiadaan pemeriksaan server atau alur QR/kunjungan lain. Bukti ini tidak mendukung QR palsu, remote check-in atau pernyataan kunjungan yang tidak terjadi.

Implementasi browser berikutnya perlu mempertahankan perbedaan klien, input QR/lookup yang sah, ownership sesi, Origin/CSRF dan tindakan submit eksplisit. Error jaringan/parsing harus dilaporkan jujur; body HTTP200 atau fallback lokal tidak boleh dianggap bukti verifikasi petugas/kartu pengunjung. Tidak ada runtime/backend/katalog yang diubah oleh audit ini.

Reproduksi offline:

```powershell
tools/runtime/blutter-python/Scripts/python.exe analysis/rea/build_guestbook_service_followup.py
tools/runtime/blutter-python/Scripts/python.exe analysis/rea/verify_guestbook_service_followup.py
```

Builder/verifier menolak penimpaan artefak beku yang berbeda. Verifier memeriksa hash, disassembly ELF, binding pool yang dihitung ulang, marker, class metadata dan header allocator; ia tidak mengesahkan cabang native yang tidak dibaca atau penerimaan server sekarang.
