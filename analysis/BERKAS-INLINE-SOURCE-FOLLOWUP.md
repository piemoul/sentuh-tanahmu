# BERKAS: satu lead child sinkron setelah konfirmasi versi

Pengguna mengonfirmasi bahwa Sentuh Tanahku pada Oppo juga **6.1.5**, sama dengan nomor versi XAPK yang diaudit. Temuan ini menghilangkan penjelasan sederhana berupa perbedaan nomor versi. Nomor versi yang sama belum membuktikan hash build, konfigurasi runtime, kondisi akun, atau alur layar yang identik. Pengamatan pengguna bahwa peta tampil langsung pada detail Berkas tetap valid.

Audit baca-saja ini memakai skill REA dan satu sudut baru: helper **sinkron**, bukan closure, yang dipanggil pada body detail. Scan allocator MAb, seluruh caller root, dan enam closure yang sudah diaudit sebelumnya **tidak diulang**. Tidak ada server produksi, UI, APK, GPS, pengiriman, kredensial, aplikasi, backend, container, atau sesi yang dijalankan/diubah.

## Lead baru dan hasilnya

Di bawah label **Perjalanan Berkas**, `89bcc4` mempertahankan ABb pada x3; `89bccc` mengambil ABb.`perjalananBerkas`+2f pada x1; x2 menerima build context; `89bce4` langsung memanggil helper **`89d1dc`**. Jalur sinkron ini berbeda dari callback `8a8a24 → RAb` yang membuka riwayat pada audit terdahulu.

Helper `89d1dc–89d3f8` memilih satu **ringkasan perjalanan**:

1. Daftar kosong menampilkan `Belum ada aktivitas`.
2. Daftar berisi dipindai dari indeks terakhir ke awal; item terakhir dengan `isCurrent == true` dipilih.
3. Jika tidak ada item current dan ABb.`statusBerkas` adalah integer 0, helper membuat BBb dengan `taskNodeGroupId` kosong dan `namaGrup` = ABb.`namaProfile`.
4. Jika tidak ada item current dalam kondisi lain, helper **`60f89c` mengambil elemen pertama, indeks 0**. Ini dibuktikan dari instruksi, bukan dugaan nama fungsi.
5. Item pilihan/sintetis diteruskan ke renderer `89d3f8–89dc2c`. Tidak ada sort atau konversi ID geografis dalam selector ini.

Factory BBb `74ebd4–74eda0` membaca tepat empat field: `taskNodeGroupId` (+7, String?), `tanggalFlow` (+b, String?), `namaGrup` (+f, String?), `isCurrent` (+13, bool?). Renderer yang ditelusuri menggunakan tanggal dan nama grup untuk membangun teks/layout/dekorasi. Formatter publiknya menggunakan **`dd MMMM yyyy`** dan **`HH:mm`**. Internals layout/framework bersama dan parser tanggal yang lebih dalam tidak diaudit ulang.

Lead ini mengklasifikasikan child ringkasan perjalanan; **belum mengikat peta langsung ke request, geometri, atau kamera milik Berkas yang dipilih**. Tidak boleh menyimpulkan peta tidak ada atau mengarang `berkasId → persilId`, document `q`, atau koordinat kamera dari child ini. Pemeriksaan dihentikan pada batas baru tersebut; tidak diperluas menjadi pengulangan inventaris negatif lama.

## Dampak pada implementasi

Pemeriksaan sumber saat audit menemukan `berkasJourneyCurrent` sudah memakai selector last-current/status0/first yang sama. Bukti ini menguatkan selector yang ada; **tidak menemukan bug selector baru**. Browser menampilkan `tanggalFlow` mentah dan riwayat memakai ekspansi details. Formatter native dan navigasi RAb tersendiri tetap perbedaan UI yang dapat ditangani secara terpisah setelah review tampilan. Tidak ada runtime patch yang dibuat pada audit ini.

Sumber inline map yang dilaporkan pengguna masih memerlukan bukti baru dari route/state aktual atau binding child lain yang belum terpetakan. Bukti WMS regional yang telah tersedia tetap terpisah dari bukti geometri Berkas terpilih.

## Bukti beku

- ELF SHA-256: `bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683`.
- Pool SHA-256: `871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04`.
- [Ledger baru](recovered/berkas-inline-source-followup/flow.json), SHA-256 `338bfae162f5b692022d140fae4e2bff832d856a520dfd94c2bacbbbe730bf89`.
- [Verifier](rea/verify_berkas_inline_source_followup.py) dan [hasil](recovered/berkas-inline-source-followup/verification.json): **7 hash sumber, 892 instruksi ELF, 27 binding pool, 49 marker, 6 hash dependensi, 1 metadata kelas, dan 9 cek selector konkret lulus**.
- [Builder](rea/build_berkas_inline_source_followup.py) membekukan `.proof.asm.txt`; `.explore.*` hanya eksplorasi. Dokumen/ledger historis tidak ditulis ulang. Pin dependensi tidak mengklaim verifier BERKAS historis yang memiliki drift teks lama telah lulus.

Reproduksi offline:

```powershell
& tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_berkas_inline_source_followup.py
```
