# Fixture browser Berita / Pengumuman

`webapp/tests/news-browser-fixture.mjs` menyajikan `publicRoot` aktual dengan backend dan registry aktual. Tidak ada copy/injeksi `app.js`, perubahan Docker, atau konfigurasi dari artefak. Seluruh request upstream diintersep oleh transport sintetis dalam proses; hanya dua route GET Berita/Pengumuman diterima. Import modul tidak membuat atau menjalankan server.

Jalankan setelah sumber frontend siap:

```powershell
tools/runtime/node.exe webapp/tests/news-browser-fixture.mjs
```

Preview: `http://localhost:4175/#/dashboard`. Port terikat loopback. Fixture ini belum dijalankan oleh pembuat fixture; pengujian browser dilakukan terpisah.

- Berita: request pertama HTTP 503; berikutnya mengembalikan 10 item untuk membuktikan tidak dipotong ke limit request 8.
- Pengumuman: langsung HTTP 200 dengan `error:true` dan 7 item dalam `message`, untuk membuktikan parser native tidak mengganti sumber daftar atau menolak flag itu.
- Judul memiliki teks HTML inert; terdapat field null, record kosong, dan kategori yang tidak seharusnya dirender.
- URL javascript/data/http/berkredensial/control character/null tidak layak dibuka. Banner seluruhnya null/kosong/invalid, sehingga tidak ada image URL eksternal untuk diambil browser.
- Ekspektasi kartu: Berita 10 kartu (3 link, 7 disabled); Pengumuman 7 kartu (3 link, 4 disabled). Kedua feed memiliki 0 elemen image dari banner fixture.
- Link valid merupakan **HTTPS localhost stub**, hanya untuk inspeksi atribut `href`, `target`, `rel`, dan `referrerpolicy`. Fixture tidak menyediakan artikel atau server HTTPS. Jangan melakukan navigasi artikel untuk QA ini.

`analysis/webapp/news-fixture-transport.json` dibuat saat fixture dikonstruksi dan diperbarui setiap request. Isinya method/path/status, jumlah panggilan, boolean assertion, cakupan data sintetis, serta hash 16 file sumber—termasuk app, styles, server, parser/transport/registry backend. Tidak ada body, query values dinamis, headers, token, atau artikel yang dicatat.

Setelah QA, verifikasi sumber masih sama dengan awal fixture:

```powershell
tools/runtime/node.exe webapp/tests/news-browser-fixture.mjs --verify
```

Mode `--verify` tidak menjalankan server. Ia menyimpan hash akhir dan `sourceUnchanged` ke laporan yang sama. Jika sumber berubah selama QA, laporan mencatat nama file yang berubah; hasil browser harus diuji ulang pada startup fixture baru. SIGINT/SIGTERM juga menutup server dan membandingkan hash secara normal, tetapi penghentian paksa proses Windows mungkin melewati handler; karena itu `--verify` tersedia secara eksplisit.

Validasi saat authoring: syntax Node lulus. Regresi backend terpisah: `analysis/webapp/news-backend-verification.json`, 157/157 tes Node lulus, termasuk 12 kelompok uji Berita/Pengumuman baru. Belum ada klaim hasil browser atau akses server produksi dari fixture ini.
