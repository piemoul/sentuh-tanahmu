# Batas transport yang terbukti dari APK

Audit ini melengkapi katalog 170 bentuk request / 169 pemanggilan langsung. Ia memisahkan argumen pada builder dari perubahan selanjutnya di client. Tidak ada request produksi, autentikasi akun, atau nilai credential yang dicantumkan.

Base layanan awal dapat dibuktikan: Sentuh `sentuh.atrbpn.go.id`, Directus antrian `aplikasi.atrbpn.go.id/konsol/antrian/directus/`, SIPENTA `sipenta.atrbpn.go.id/tatausaha/apis/`, antrian backend `antre.atrbpn.go.id/be/api/`, notifikasi `sentuhnotif.atrbpn.go.id`, serta geocoding Bhumi. Konfigurasi status juga memiliki URL Gist tetap. Metadata initializer menghubungkan field ke selector; initializer `TRb.Thj` menghasilkan `true`, memilih produksi pada selector yang diperiksa. Perubahan berikutnya pada field konfigurasi mutable belum diuji.

Client utama memasang interceptor `LRb`. Setelah builder membuat request, interceptor ini dapat mengubah Content-Type menjadi form-urlencoded atau multipart. Untuk URI yang cocok dengan regex common yang spesifik, ia memasang nilai autentikasi aplikasi. Untuk jalur lain, ia membaca JSON sesi dari storage `token`, memakai `tokenType` dan `accessToken`, serta dapat menjalankan refresh biasa menggunakan `refreshToken`. Karena itu, header yang terlihat pada builder belum tentu header final. Sesi akun ini berbeda dari credential aplikasi dan token SIPENTA.

Tidak ditemukan penambahan checksum, hash, signature, versi aplikasi, device attestation, atau koordinat dalam handler awal request yang diperiksa: LRb mengubah tipe konten/autentikasi; handler request vWa dan dP hanya meneruskan request. Batas ini tidak mencakup semua jalur retry/error, native transport, atau validasi server. Logger memang memiliki request terpisah dengan device, latitude, longitude, params, body, URL, dan status; itu bukan bukti bahwa koordinat disisipkan ke setiap body bisnis.

Kontrak wire lengkap belum tersertifikasi. Penetapan setiap endpoint ke instance client, serializer final, perilaku native, CORS, aturan server, dan penerimaan sumber GNSS eksternal masih memerlukan bukti runtime. GET `berkas` yang memakai body `nik` tetap merupakan masalah kompatibilitas browser yang harus diselesaikan secara eksplisit.

Semua alamat instruksi, lokasi bukti, dan batas temuan tersedia di `recovered/transport-boundaries.json`. Generator: `rea/build_transport_boundaries.py`. Referensi lapisan autentikasi aplikasi: `recovered/auth-config-provenance.json`. Metadata aman: `recovered/transport-initializers.txt`.
