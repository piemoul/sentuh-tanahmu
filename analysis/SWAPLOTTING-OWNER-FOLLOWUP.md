# Sumber pengguna dan kontak Swaplotting

Audit statis APK resmi 6.1.5 ini menutup rantai **profil → daftar lCb → pilihan formulir → nama/telepon/email**. Ia mengoreksi asumsi bahwa `iCb+27` adalah pemilik terpilih pada formulir. Pemilihan aktual disimpan di `_pCb+23` untuk tanah bersertipikat dan `_sCb+1b` untuk belum bersertipikat. Bukti lokal ini tidak menetapkan kepemilikan tanah, kewenangan perwakilan, kehadiran, atau penerimaan server.

Skill yang dipakai adalah [REA](../tools/Reverse-Engineer-Anything/skills/reverse-engineer-anything/SKILL.md), dengan snapshot ELF/pool yang sama dan tanpa setup atau eksekusi aplikasi. [Ledger baru](recovered/swaplotting-owner-followup/flow.json) SHA256 `02ecc3c52cf9ee22c73dfe40b0e9a5cbd2327d5c5779285ed1d4ecd71c8ccf22` mengikat 17 potongan baru/2.465 instruksi dan 14 sumber lama/7.318 instruksi. [Verifier mandiri](rea/verify_swaplotting_owner_followup.py) memeriksa 9.783 instruksi terhadap ELF asli, 97 anotasi pool baru, enam dispatch list, 148 pemeriksaan literal, serta 208 file bukti lama yang tetap identik. [Receipt](recovered/swaplotting-owner-followup/verification.json) berstatus PASS.

## Cached signin dan profil adalah dua sumber berbeda

`d2a508` membaca String lokal `user_plotting`, lalu `JRb/cfed14` menghasilkan cached signin `gyb?` yang disimpan pada `iCb+7`. Jika **signin null dan String tersimpan nonnull**, aplikasi mendecode daftar pengguna tersimpan, memparse setiap Map menjadi `lCb`, mempublikasikan `iCb+13`, lalu kembali. Kunci storage ini tidak mempunyai suffix akun pada literal yang dibuktikan.

Cabang lain menyelesaikan dependency `wCb648`, membaca subject `+13`, membangun `Stream<ayb?>`, dan memasang callback `d2b320` serta error callback `758d94`. Sumber `ayb840` ini adalah alur **`account/account_summary`**, dengan producer `d292c8 → 755510 → 506078`; sumber tersebut telah dibekukan pada ledger queue identity dan dipakai ulang serta diverifikasi terhadap ELF. Cached signin memilih cabang loader; field signin tidak menjadi pengganti profil pada rantai ini.

## Kandidat pengguna sendiri

Callback `d2b320` hanya membentuk kandidat sendiri untuk `ayb.userLevel` **2 atau 3**. Nilai null atau level lain masuk ke fallback daftar tersimpan. Kandidat mempunyai `id:0` dan `fromUserData:false`.

| Field profil `ayb` | Slot profil | Field `lCb` | Slot `lCb` |
|---|---|---|---|
| `nama` | `+1b` | `nama` | `+f` |
| `nomorHp` | `+33` | `noHp` | `+13` |
| `nomorIdentitas` | `+23` | `nik` | `+17` |
| `tempatLahir` | `+2b` | `tempatLahir` | `+1b` |
| `tanggalLahir` | `+2f` | `tglLahir` | `+1f` |
| `email` | `+f` | `email` | `+23` |

String profil null menjadi String kosong. Tanggal melewati `d2b9b4`: format masukan literal `d MMMM yyyy` dengan locale `id_ID`, keluaran `yyyy-MM-dd`; null, kosong, atau exception menghasilkan String kosong. Seluruh kelonggaran parser `intl`, timezone dan penerimaan format alternatif belum ditutup.

`ayb.isIkd` pada `+43` harus nonnull. **Exact false** memasukkan kandidat sendiri pada index 0; true melewati insertion, sedangkan null menuju NullCastError. Setelah daftar tersimpan diparse, cabang profil yang memenuhi syarat membentuk Map dengan key **NIK mentah `lCb+17`**. Nilai dengan key sama yang datang kemudian mengganti nilai sebelumnya. Karena itu data storage dapat mengganti kandidat pertama pada key yang sama; persamaan NIK bukan bukti otorisasi. Urutan iterasi map lintas implementasi tidak dibuktikan baru di audit ini.

Fallback profil null/level lain dengan String storage nonnull memparse dan mempublikasikan daftar tersimpan tanpa insertion profil atau dedup loop tersebut. Jika storage null, callback tidak mempublikasikan pengganti dan mempertahankan subject sebelumnya. Ini tidak menyatakan daftar tersebut sah untuk bertindak atas nama pemilik tanah.

## Schema dan pemilihan formulir

Parser `7593b0..759724` mengharuskan delapan key bertipe tepat: `id:int`, `nama/noHp/nik/tempatLahir/tglLahir/email:String`, dan `fromUserData:bool`. Seluruhnya nonnullable; missing/null atau tipe salah gagal. ID disimpan sebagai signed64 native, String dipertahankan mentah, key tambahan diabaikan. Serializer `759110` menulis delapan key yang sama. Keberhasilan parsing tidak memverifikasi identitas.

Kedua state formulir memulai pilihan lokal dengan lCb `id0`, enam String kosong dan `fromUserData:false`. Builder `8cf320`/`8d65e8` membaca daftar dari `iCb+13`. Snapshot hilang/kosong diarahkan ke tampilan kosong tersendiri. Untuk daftar nonkosong, bila `selected.id==0`, **`snapshot.first`** menjadi pilihan. Perilaku `isEmpty` dan `first` dibuktikan melalui dispatch List CID90/91/92 serta body helper terkait; tidak ada fallback pengguna buatan pada daftar kosong.

Pilihan nonzero dipertahankan pada prefix builder yang ditelusuri meskipun snapshot kemudian berubah; tidak ada pembuktian keanggotaan daftar terkini pada prefix itu. Tap row registered memanggil `8d173c → setState466d80 → 8d17d0`, menyimpan objek lCb yang ditangkap ke `_pCb+23`, lalu menutup picker. Tap unregistered `8d884c` memakai setState yang sama dan closure bersama `8b9610` untuk menulis `_sCb+1b`, lalu menutup picker.

`iCb+27` adalah **subject lCb yang berbeda**. Constructor membuatnya pada `9fad18..9fad58`; controller AddUser yang sudah dibekukan mempublikasikan kandidat baru di sana pada `d9e044..d9e054` sebelum batas identity/OTP. Audit ini tidak menjalankan atau memperluas alur tersebut.

## Tiga kontak berasal dari objek pilihan

| Nilai lCb terpilih | Argumen copy native | Model registered | Model unregistered |
|---|---|---|---|
| `nama` / `+f` | `Eyj` | `eCb+f` | `hCb+b` |
| `noHp` / `+13` | `Rnj` | `eCb+13` | `hCb+f` |
| `email` / `+23` | `VYi` | `eCb+17` | `hCb+13` |

Builder `8cf3b4`/`8d667c` melakukan tiga copy mentah tersebut. Registered melewati `759830` lalu mempublikasikan replacement model melalui `8cec14`; unregistered melewati controller `759e9c`. Descriptor argumen, nama parameter, pembacaan slot dan penulisan slot model semuanya terikat bukti. Tidak ada trim, perubahan huruf atau substitusi username pada handoff ini; String kosong tetap nilai yang diberikan.

## Batas implementasi dan gap tersisa

Browser dapat menerapkan **subset baca pengguna sendiri** dari `account_summary` yang tepercaya dan terikat sesi, dengan gate level2/3, `isIkd === false`, serta mapping/null rules di atas. Ini subset yang dinyatakan, bukan kesetaraan managed-user native. Jangan mengambil pemilik dari signin, username, browser-submitted profile, pengguna sembarang pertama, atau impor `user_plotting` yang belum memiliki sumber/otorisasi sah.

Masih terbuka: kewenangan pengguna/delegasi pada server; managed-user AddUser/edit/remove/enrollment/persistence dan identity/OTP; parser tanggal lengkap; unsubscribe/disposal/concurrent-init dan urutan emisi. Loader yang ditelusuri mengabaikan hasil subscription `b5077c` tanpa menyimpannya pada field; bukti tersebut tidak menjadi jaminan bahwa seluruh lifecycle aplikasi bebas race atau otomatis membatalkan listener. Cabang storage dan profile memiliki jalur completion berbeda, sehingga tidak ada klaim seluruh future selalu selesai.

Map/disclaimer, foto/capture, upload, angka koordinat, geotag/radius dan pembanding APK pascalogin tetap mengikuti batas ledger sebelumnya. Titik peta dan isi kontak tidak membuktikan kunjungan atau kepemilikan. Audit ini melakukan **0 request, 0 pembacaan nilai akun/kredensial, 0 identity/OTP, 0 submit/upload, 0 GPS/presence, 0 perubahan runtime/backend**, dan tidak mengubah tiga ledger lama atau receipt-nya.
