# Profil: base website dari snapshot APK 6.1.5

Audit ini menutup satu gap pada bukti tujuan halaman Profil terdahulu: static slot `0x2fd8` yang dipakai builder Privacy, FAQ, dan Manfaat berisi **`https://www.atrbpn.go.id/`** pada snapshot APK yang dipasok. Suffix lama tetap dipertahankan. Tidak ada endpoint yang ditebak dari nama domain Bantuan.

| Menu | Builder | Suffix | Judul native |
|---|---|---|---|
| Kebijakan Privasi | `93c5f0` | `privacy-policy` | Website |
| Pusat Bantuan | `93c6e0` | `sentuh-tanahku-faq` | FAQ |
| Keuntungan | `93c904` | `sentuh-tanahku` | Website |

Ledger baru [profile-base-followup/flow.json](recovered/profile-base-followup/flow.json), SHA256 `2b2e3d29edcf53291e676f2f10dcaf34c5105c91a8a90a125bf53b390801f03f`, melengkapi ledger tujuan terdahulu yang tidak diubah. Verifier independen membaca ulang 180 instruksi ELF dan tiga slot load, memeriksa 18 dependency serta 23 input build Blutter bersama, lalu menjalankan ulang helper metadata terisolasi. Hasil slot identik byte per byte.

Helper hanya membaca satu slot yang ditetapkan, index1531 (`0x2fd8 / 8`), memeriksa StringCID94, dan hanya mengeluarkan URL publik yang diizinkan. APK, initializer, dan method aplikasi tidak dijalankan. Tidak ada jaringan, pembacaan kredensial, ekspor static field lain, atau perubahan build bersama. Percobaan awal tanpa dependency DLL pada child PATH gagal dan tetap tercatat; runner berikutnya memakai direktori DLL lokal yang sudah tersedia.

```text
tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_profile_base_followup.py
```

Hasil PASS membuktikan nilai snapshot dan konstruksi URL pada jalur yang dibatasi. Ia tidak membuktikan bahwa field tidak pernah berubah saat runtime, bahwa halaman publik sekarang tersedia atau berisi konten tertentu, maupun siklus Android WebView. Initializer package/flavor untuk rating tetap di luar lingkup.

Frontend kini memakai URL native untuk FAQ dan Manfaat melalui tautan eksternal terisolasi. URL Privacy yang sudah ada ternyata cocok dan tidak diubah. Pembukaan tab eksplisit merupakan adaptasi browser dari native WebView; bukan klaim kesamaan pixel atau lifecycle. Tujuh tes fokus, review independen, dan pemeriksaan DOM browser tercatat terpisah dalam receipt `profile-site-*`.
