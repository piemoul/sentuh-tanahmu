# Model Panggilan dan waktu mikrodetik

[queue-calls-models.mjs](../webapp/private/queue-calls-models.mjs) menyediakan `parseQueueCallsJson(raw)` dan `parseQueueCallsEnvelope(body)`, masing-masing menghasilkan `{data: rows}`. Komponen ini tidak mengaktifkan endpoint, membaca akun, memakai kamera/lokasi atau mengirim request.

Bukti native berasal dari [ledger Panggilan](recovered/queue-calls-flow/flow.json), SHA-256 `22c2af86cf5de0581049cdaa2dbf890c209d7749ba6a36019050846d23c121d9`, khusus [model `0x7465c4..0x74689c`](recovered/queue-calls-flow/calls-model.asm.txt). Body yang sudah didekode harus berupa Map dengan `data` List<Map>; `error` dan `message` tidak dibaca. Setiap row mempunyai enam String wajib: `id`, `tipe`, `pesan`, `pengirim`, `penerima`, `tanggal_dikirim`. Tidak ada default null, alias atau coercion. Tanggal diparse melalui `0x6beed4`; kegagalan satu row menggagalkan list. List kosong tetap sukses.

`id` dan `tipe` divalidasi lalu dibuang sesuai model yang dipakai UI. Output hanya menyimpan `pesan`, `pengirim`, `penerima`, tanggal mentah dan metadata waktu di bawah. Extra field/token tidak disalin. Parser mempertahankan urutan dan duplikat; sorting turun berdasarkan waktu dilakukan caller, sesuai comparator native. Entry raw melakukan satu JSON decode; envelope tidak mendekode String kedua. Getter, prototype khusus dan sparse array ditolak sebagai batas model JSON web. Error generic `QUEUE_CALLS_RESPONSE_UNRECOGNIZED`/502 tidak memuat payload atau tanggal.

## Kontrak waktu untuk browser

| Input | Tambahan field output |
|---|---|
| Memiliki `Z`/`z` atau offset eksplisit | `timeKind:'instant'`, `epochMicroseconds` String desimal; `localDateTime` tidak ada. |
| Tanpa zona | `timeKind:'local'`, `epochMicroseconds:null`, `localDateTime:{year,month,day,hour,minute,second,microsecond}`. Month 1–12; microsecond ialah total fraksi detik 0–999999. |

Grammar mengikuti sumber primer [Dart SDK 3.12.2 `DateTime.parse`](https://raw.githubusercontent.com/dart-lang/sdk/3.12.2/sdk/lib/core/date_time.dart): tahun bertanda opsional 4–6 digit, tanggal basic/extended, waktu opsional, fraksi titik/koma dan offset. Komponen overflow dinormalisasi; fraksi sesudah digit keenam dipotong. Teks mentah dipertahankan, tanpa trim atau fallback `Date.parse` host. Sumber SDK menguatkan native callsite; ini bukan audit instruksi baru atau eksekusi APK.

Perhitungan kalender mengikuti aritmetika Gregorian pada [patch VM versi target](https://raw.githubusercontent.com/dart-lang/sdk/3.12.2/sdk/lib/_internal/vm_shared/lib/date_patch.dart), memakai BigInt untuk mikrodetik. Rentang instant dibatasi `±8640000000000000000`, yakni batas DateTime 100 juta hari, lebih sempit daripada signed64. Nilai satu mikrodetik sebelum epoch adalah `"-1"`; tidak dibulatkan Number. Overflow integer signed64 tidak diemulasikan untuk input yang sangat jauh di luar rentang matematika tersebut.

Tanggal tanpa zona dinormalisasi sebagai komponen sipil, **bukan diasumsikan UTC atau zona container**. UTC getters hanya dipakai untuk normalisasi kalender yang bebas zona; epoch tidak diterbitkan. Browser mengikat komponen ke zona pengguna, memakai `setFullYear` agar tahun 0–99 tidak berubah menjadi 1900–1999, lalu mempertahankan sisa mikrodetik dalam kunci BigInt untuk sorting. Untuk instant negatif, konversi mikrodetik ke milidetik kalender perlu floor, bukan pembagian BigInt yang truncate ke nol.

Resolusi waktu lokal ambigu/tidak ada saat DST, riwayat timezone browser versus Android, dan tanggal lokal di tepi rentang tetap batas platform. Parser lokal secara konservatif mensyaratkan jam sipil sudah berada dalam rentang sebelum offset browser; tidak mencoba menerima tanggal luar batas yang mungkin menjadi valid setelah koreksi zona. Tidak ada klaim bahwa binding browser selalu identik dengan `_toLocalTimeOffset` Dart.

## Validasi komponen

[14 tes Node](../webapp/tests/queue-calls-models.test.mjs) lulus, nol gagal, **302,196 ms**. Tes mencakup field wajib, envelope tanpa error flag, kegagalan seluruh list, privasi, order/duplikat, compact/extended grammar, offset/overflow, tahun nol/negatif, presisi mikrodetik, batas ekstrem dan tanggal lokal. Proses anak sintetis dengan timezone UTC, Asia/Jakarta dan America/Los_Angeles menghasilkan metadata lokal yang sama, termasuk waktu gap/overlap DST; tes itu tidak menentukan instant DST yang benar.

```powershell
tools/runtime/node.exe --test webapp/tests/queue-calls-models.test.mjs
```

Tidak ada API produksi atau akun nyata dalam tes. Hanya sumber primer SDK yang dibaca melalui jaringan untuk corroboration tanggal; tidak ada dependency, runtime atau artefak native bersama yang diubah. Ini validasi parser, bukan bukti transport, sorting/render browser, penerimaan server atau penyelesaian seluruh menu Panggilan.
