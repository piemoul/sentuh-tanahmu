# Koleksi: audit statis Buat Grup — APK 6.1.5

Alur **Buat Grup** pada tab Bidang sudah ditelusuri dari kontrol native hingga respons, penutupan sheet, dan pemuatan ulang daftar grup. Audit ini hanya membaca ELF/pool lokal. Tidak ada APK dijalankan, request produksi, kredensial, mutasi koleksi, perubahan frontend/backend, geotag, atau visit-bypass. Ledger baca grup sebelumnya tetap utuh.

## Kontrol, input, dan hasil UI

Kontrol `0x900730` menampilkan **Buat Grup**, mengikat closure `0x90095c`, lalu membuka sheet melalui `0x9009ac → 0x900a74 → 0x900ad8`. Setiap pembukaan membuat text controller baru dengan teks kosong dan state menyimpan=false. Copy sheet yang benar:

- Judul: **Buat Grup Baru**.
- Keterangan: **Kelompokkan bidang-bidangmu dengan mudah.**
- Label: **Nama Grup**.
- Hint: **Contoh: Tanah Warisan, Investasi...**
- Tombol: **Batal** dan **Buat Grup**; selama menyimpan menjadi **Menyimpan...**.

Input MSb menerima controller tersebut dan integer `+0x2f=1`. Callsite tidak memasok callback validator/onChanged atau batas panjang nama numerik. Seluruh callback submit/controller yang dibekukan tidak memiliki pemeriksaan panjang maksimum atau duplikasi nama; perilaku lengkap widget Flutter/IME tetap di luar audit sempit ini.

Submit `0xda8b1c` membaca teks, memanggil trim `0x447974`, lalu **kembali diam-diam bila panjang hasil trim nol**, sebelum menyalakan state menyimpan atau memanggil service. Tidak ada error kosong inline dalam alur root ini. String pool **Nama grup tidak boleh kosong** dan **Gagal membuat grup** milik alur lain dan tidak dipakai sheet ini. Nilai text controller tidak diperlakukan sebagai nullable pada chain tersebut.

Trim memindai ujung kiri/kanan; karakter di tengah tetap utuh. Bukti lokal memuat whitespace U+0009–000D, U+0020, U+0085, U+00A0, U+1680, U+2000–200A, U+2028, U+2029, U+202F, U+205F, U+3000, dan U+FEFF. Tidak ada lowercase atau normalisasi nama. Kesetaraan grammar substring dan grapheme lengkap tidak diklaim.

Nama yang tidak kosong menyalakan state lokal melalui `0x9014d4`. Callback **Batal** dan submit dilepas selama menyimpan; input tidak diikat ke flag busy untuk dinonaktifkan. Lock untuk gesture dismiss/back tidak dibuktikan. **Batal** yang aktif menutup route melalui `0x9014fc → 0x5f3bbc → 0x4e5ffc`, tanpa controller/service create. Disposal controller lokal tidak terlihat dalam callback sempit ini.

Jika controller mengembalikan true dan context sheet masih mounted, UI menutup route. Selain itu, bila masih mounted, callback `0x9014ac` mengembalikan state menyimpan=false dan teks tetap ada. Tidak ada success toast atau subscription ke stream error controller pada builder sheet ini; pesan error controller tidak dirender sebagai banner sheet.

## Request dan respons

`0xda8cc0` meneruskan nama yang sudah ditrim ke service `0xda8e78`. Call HTTP **`0xda8f20`** memakai wrapper POST `0x6b9270` menuju path persis **`Collection/AddPersilCollectionGroup`**. Huruf C pada `Collection` besar. Body berupa **multipart FormData**, dengan satu field persis **`GroupName`**. Tidak ada JSON encode, query caller, options, atau header caller pada helper tersebut.

Client adalah jalur utama `service+7 → FRb+7`. Interceptor LRb yang sama dengan read grup memakai token sesi akun tersimpan, `tokenType + spasi + accessToken`, untuk Authorization. Bila token tidak ada, interceptor meneruskan request tanpa assignment header itu. Mekanisme expiry/refresh lama tetap berlaku; body iP mengatur multipart/form-data. Audit tidak membaca nilai token atau mengklaim seluruh byte final-wire.

Helper hanya menerima **HTTP 200**, memerlukan `Map<String,dynamic>` nonnull tanpa decode JSON String kedua, lalu memanggil parser **`0x74ae18`** untuk **yEb CID606**:

| Key JSON | Slot | Tipe |
| --- | --- | --- |
| `error` | `+7` | `bool?` |
| `message` | `+0xb` | `String?` |
| `data` | `+0xf` | `String?` |

Field hilang/null tetap null; String kosong tetap kosong. Tipe nonnull yang salah menggagalkan seluruh parser. `data` bukan objek grup atau list grup. HTTP 200 yang berhasil diparse menghasilkan tuple **(false, envelope), termasuk bila `envelope.error=true`**. Status lain yang kembali normal menghasilkan (true, null). Predicate transport default menerima 200–299, sehingga 201/204 biasa mencapai branch gagal helper; non-2xx biasanya melempar WO sebelum kembali. WO dengan response Map yang bisa diparse menghasilkan (true, envelope); response hilang, jenis exception lain, atau kegagalan cast/parse menghasilkan (true, null).

## Controller dan refresh

Controller menyalakan loading `+0x13=true`, mengosongkan error `+0x17`, lalu hanya memakai **tuple error `+0xb`** untuk memilih hasil. Pada true, error menjadi `envelope?.message ?? 'Gagal menambah grup koleksi'`; pesan kosong nonnull tidak diganti. Loading dibersihkan dan hasil false. Catch menyimpan **Terjadi kesalahan: ** ditambah exception, membersihkan loading dan kembali false. Finalizer luar juga membersihkan loading sebelum rethrow.

Pada tuple error=false, controller mengatur cache loaded grup **`+0x27=false`**, lalu menunggu **`0xd31e18(force=true)`**, yang memanggil **GET `collection/GetPersilCollectionGroup`** pada `0xd31fbc`. `envelope.error`, `message`, dan `data` respons create tidak digunakan di branch ini. Tidak ada insert grup optimistis, pemuatan ulang baris, invalidasi cache baris `+0x23`, atau pemanggilan orkestrator penuh.

Loader grup mengikuti [kontrak baca yang sudah dibekukan](COLLECTION-GROUPS-FOLLOWUP.md): tuple normal false memublikasikan `envelope?.data ?? []`; tuple normal true memublikasikan `[]`; keduanya menandai loaded=true. Catch memublikasikan `[]` dan membiarkan loaded=false. Karena loader menelan kegagalan baca, **controller create tetap mengembalikan true dan sheet menutup setelah refresh selesai meskipun refresh gagal/kosong**. Penerimaan server dan izin akun aktual tidak diuji.

Callback hapus grup `0x902460` dan kontrol kartu `0x8fea54`, `0x8fe068`, `0x8fdb68` tetap hanya diklasifikasikan. Audit tidak memperluas atau mengaktifkan callback itu.

## Bukti dan reproduksi

- [Ledger immutable](recovered/collection-group-create/flow.json), SHA-256 `8b4859d6587c4101712f42a089b3ea68b1cb3ed2d28cf908e33b1adc338b5fbc`.
- [Hasil verifier](recovered/collection-group-create/verification.json): **14 hash proof, 2.407 instruksi ELF, 111 marker, 114 binding pool, 3 objek publik, 10 dependensi, dan 4 metadata kelas — lulus**.
- [Builder](rea/build_collection_group_create.py) dan [verifier independen](rea/verify_collection_group_create.py).
- Jalankan `tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_collection_group_create.py` tanpa jaringan.
- ELF SHA-256 `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`; pool SHA-256 `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- Dependensi ledger baca grup masih SHA-256 `c5cc8bd27217e758ba1bb14c4dd6b2e46112e7b110e99bb88c6c89c89017a230`; range/ledger lama tidak ditulis ulang. File `.explore.*` bukan sumber kanonik.

Proof ini menutup kontrak statis alur create grup root; tidak mengklaim seluruh mutasi Koleksi, parity pixel, runtime native, atau penerimaan produksi. Dedicated UI create belum diimplementasikan oleh audit ini.
