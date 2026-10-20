// Generated from the fixed request corpus and supplemental SPS/collection evidence; do not include credentials.
const serviceData = {
  "main": {
    "id": "main",
    "baseUrl": "https://sentuh.atrbpn.go.id/",
    "allowedHost": "sentuh.atrbpn.go.id",
    "label": "Sentuh Tanahku"
  },
  "directus": {
    "id": "directus",
    "baseUrl": "https://aplikasi.atrbpn.go.id/konsol/antrian/directus/",
    "allowedHost": "aplikasi.atrbpn.go.id",
    "label": "Referensi antrean"
  },
  "antrian": {
    "id": "antrian",
    "baseUrl": "https://antre.atrbpn.go.id/be/api/",
    "allowedHost": "antre.atrbpn.go.id",
    "label": "Antrean"
  },
  "sipenta": {
    "id": "sipenta",
    "baseUrl": "https://sipenta.atrbpn.go.id/tatausaha/apis/",
    "allowedHost": "sipenta.atrbpn.go.id",
    "label": "SIPENTA"
  },
  "notifications": {
    "id": "notifications",
    "baseUrl": "https://sentuhnotif.atrbpn.go.id/",
    "allowedHost": "sentuhnotif.atrbpn.go.id",
    "label": "Notifikasi"
  },
  "bhumi": {
    "id": "bhumi",
    "baseUrl": "https://bhumi.atrbpn.go.id/",
    "allowedHost": "bhumi.atrbpn.go.id",
    "label": "Bhumi"
  }
};
const operationData = [
  {
    "id": "post-auth-signin-d8e744",
    "label": "Masuk akun",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/signin",
    "path": "auth/signin",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "application",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": true,
    "inspectOnly": false,
    "readiness": "dedicated_login",
    "reason": "Tersedia melalui formulir Masuk akun. Kredensial diproses oleh jalur login khusus, bukan eksekusi katalog.",
    "fields": [
      {
        "path": "devicePlatform",
        "label": "devicePlatform",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "username",
        "label": "username",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "password",
        "label": "password",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd8e744",
      "source": "analysis/recovered/request-callsites/00d8e5d8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested",
    "uiRoute": "/login",
    "dedicatedApi": "/api/login"
  },
  {
    "id": "post-auth-check-authorization-d02a7c",
    "label": "Periksa sesi akun",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/check_authorization",
    "path": "auth/check_authorization",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "fcmToken",
        "label": "fcmToken",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?"
      },
      {
        "path": "refreshToken",
        "label": "refreshToken",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?"
      }
    ],
    "evidence": {
      "callAddress": "0xd02a7c",
      "source": "analysis/recovered/request-callsites/00d02a64.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-auth-check-authorization-ikd-d1d2cc",
    "label": "Periksa sesi identitas digital",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/check_authorization_ikd",
    "path": "auth/check_authorization_ikd",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "no explicit data argument at reviewed call",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd1d2cc",
      "source": "analysis/recovered/request-callsites/00d1d2bc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-auth-refresh-token-d0de64",
    "label": "Perbarui sesi akun",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/refresh_token",
    "path": "auth/refresh_token",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "POST helper; exact Content-Type not resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "refreshToken",
        "label": "refreshToken",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?"
      }
    ],
    "evidence": {
      "callAddress": "0xd0de64",
      "source": "analysis/recovered/request-callsites/00d0dd78.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-auth-resend-activation-otp-d23528",
    "label": "Kirim ulang kode aktivasi",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/resend_activation_otp",
    "path": "auth/resend_activation_otp",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "email",
        "label": "email",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd23528",
      "source": "analysis/recovered/request-callsites/00d23510.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-auth-activate-account-d23df4",
    "label": "Aktifkan akun",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/activate_account",
    "path": "auth/activate_account",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "email",
        "label": "email",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "otp",
        "label": "otp",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "requestDate",
        "label": "requestDate",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd23df4",
      "source": "analysis/recovered/request-callsites/00d23ddc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-auth-send-reset-password-otp-d8ef14",
    "label": "Kirim kode pemulihan kata sandi",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/send_reset_password_otp",
    "path": "auth/send_reset_password_otp",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "email",
        "label": "email",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd8ef14",
      "source": "analysis/recovered/request-callsites/00d8eefc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-auth-validate-reset-password-otp-d8f3d8",
    "label": "Validasi kode pemulihan kata sandi",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/validate_reset_password_otp",
    "path": "auth/validate_reset_password_otp",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "email",
        "label": "email",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "otp",
        "label": "otp",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "requestDate",
        "label": "requestDate",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd8f3d8",
      "source": "analysis/recovered/request-callsites/00d8f3c8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-auth-signup-d90bd8",
    "label": "Daftar akun baru",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/signup",
    "path": "auth/signup",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "username",
        "label": "username",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?"
      },
      {
        "path": "email",
        "label": "email",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?"
      },
      {
        "path": "password",
        "label": "password",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?"
      },
      {
        "path": "devicePlatform",
        "label": "devicePlatform",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?"
      }
    ],
    "evidence": {
      "callAddress": "0xd90bd8",
      "source": "analysis/recovered/request-callsites/00d90bc8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-auth-change-password-db9ea4",
    "label": "Ganti kata sandi",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/change_password",
    "path": "auth/change_password",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "oldPassword",
        "label": "oldPassword",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "newPassword",
        "label": "newPassword",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xdb9ea4",
      "source": "analysis/recovered/request-callsites/00db9e94.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-auth-delete-user-db661c",
    "label": "Hapus akun",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/delete_user",
    "path": "auth/delete_user",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "password",
        "label": "password",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xdb661c",
      "source": "analysis/recovered/request-callsites/00db6604.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-auth-resetpassworduser-de792c",
    "label": "Atur ulang kata sandi",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "auth/resetPasswordUser",
    "path": "auth/resetPasswordUser",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "email",
        "label": "email",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "password",
        "label": "password",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xde792c",
      "source": "analysis/recovered/request-callsites/00de7914.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-apis-scandocument-d42440",
    "label": "Pindai dokumen",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "apis/scanDocument",
    "path": "apis/scanDocument",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "q",
        "label": "q",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "name",
        "label": "name",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd42440",
      "source": "analysis/recovered/request-callsites/00d42428.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-geotag-uploadgeotag-d96b98",
    "label": "Penandaan lokasi geotag",
    "group": "Peta dan geotag",
    "method": "POST",
    "endpoint": "geotag/UploadGeotag",
    "path": "geotag/UploadGeotag",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "multipart form-data",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "native_required",
    "reason": "Penandaan lokasi membutuhkan pemeriksaan posisi saat kunjungan dan pernyataan kondisi fisik melalui aplikasi resmi. Perbandingan koordinat berkas tidak menggantikan pemeriksaan tersebut.",
    "fields": [
      {
        "path": "BerkasId",
        "label": "ID berkas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; value serialization not fully proven"
      },
      {
        "path": "Lat",
        "label": "Lintang",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; value serialization not fully proven",
        "format": "decimal-coordinate",
        "description": "Nilai pengukuran Anda; teks desimal dipertahankan. Jalur APK tertentu memakai 7 angka desimal, tidak semua jalur."
      },
      {
        "path": "Longi",
        "label": "Bujur",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; value serialization not fully proven",
        "format": "decimal-coordinate",
        "description": "Nilai pengukuran Anda; teks desimal dipertahankan. Jalur APK tertentu memakai 7 angka desimal, tidak semua jalur."
      },
      {
        "path": "file",
        "label": "Foto PNG",
        "type": "file",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; value serialization not fully proven",
        "accept": "image/png",
        "maxBytes": 12582912,
        "description": "Foto PNG dikirim sebagai bagian multipart file; batas adapter lokal 12 MiB."
      },
      {
        "path": "Lokasi",
        "label": "Keterangan lokasi",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; value serialization not fully proven"
      },
      {
        "path": "IsOffline",
        "label": "Berasal dari draf offline",
        "type": "boolean",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; value serialization not fully proven",
        "default": false
      }
    ],
    "evidence": {
      "callAddress": "0xd96b98",
      "source": "analysis/recovered/request-callsites/00d96b84.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested",
    "coordinateNotice": "Koordinat referensi berkas hanya untuk perbandingan; tidak dikirim sebagai posisi perangkat atau bukti kunjungan."
  },
  {
    "id": "post-surveylbtkelasjalan-d4a688",
    "label": "Survei kelas jalan",
    "group": "Survei SIPENTA",
    "method": "POST",
    "endpoint": "surveylbtkelasjalan",
    "path": "surveylbtkelasjalan",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json (risiko additionally passes serialized data through 0x6b27e0)",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "no_berkas",
        "label": "no_berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data",
        "label": "data",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "object"
      },
      {
        "path": "data.provinsi",
        "label": "data.provinsi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kota_kab",
        "label": "data.kota_kab",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kecamatan",
        "label": "data.kecamatan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kelurahan_desa",
        "label": "data.kelurahan_desa",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.detail_jalan",
        "label": "data.detail_jalan",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>"
      },
      {
        "path": "data.detail_jalan[].nama_jalan",
        "label": "data.detail_jalan[].nama_jalan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.detail_jalan[].lebar_jalan",
        "label": "data.detail_jalan[].lebar_jalan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.detail_jalan[].koordinat_titik",
        "label": "data.detail_jalan[].koordinat_titik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.detail_jalan[].nama_kelas",
        "label": "data.detail_jalan[].nama_kelas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.detail_jalan[].keterangan_kelas",
        "label": "data.detail_jalan[].keterangan_kelas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      }
    ],
    "evidence": {
      "callAddress": "0xd4a688",
      "source": "analysis/recovered/request-callsites/range-0078cc18.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-surveylbtfasilitas-d4d0d4",
    "label": "Survei fasilitas",
    "group": "Survei SIPENTA",
    "method": "POST",
    "endpoint": "surveylbtfasilitas",
    "path": "surveylbtfasilitas",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json (risiko additionally passes serialized data through 0x6b27e0)",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "no_berkas",
        "label": "no_berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data",
        "label": "data",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "object"
      },
      {
        "path": "data.provinsi",
        "label": "data.provinsi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kota_kab",
        "label": "data.kota_kab",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kecamatan",
        "label": "data.kecamatan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kelurahan_desa",
        "label": "data.kelurahan_desa",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.fasilitas",
        "label": "data.fasilitas",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>"
      },
      {
        "path": "data.fasilitas[].nama_fasilitas",
        "label": "data.fasilitas[].nama_fasilitas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.fasilitas[].nama_jenis",
        "label": "data.fasilitas[].nama_jenis",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.fasilitas[].keterangan_jenis",
        "label": "data.fasilitas[].keterangan_jenis",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.fasilitas[].koordinat_titik",
        "label": "data.fasilitas[].koordinat_titik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      }
    ],
    "evidence": {
      "callAddress": "0xd4d0d4",
      "source": "analysis/recovered/request-callsites/range-00791218.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-surveylbtzona-d50518",
    "label": "Survei zona penggunaan",
    "group": "Survei SIPENTA",
    "method": "POST",
    "endpoint": "surveylbtzona",
    "path": "surveylbtzona",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json (risiko additionally passes serialized data through 0x6b27e0)",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "no_berkas",
        "label": "no_berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data",
        "label": "data",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "object"
      },
      {
        "path": "data.provinsi",
        "label": "data.provinsi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kota_kab",
        "label": "data.kota_kab",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kecamatan",
        "label": "data.kecamatan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kelurahan_desa",
        "label": "data.kelurahan_desa",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.identifikasi",
        "label": "data.identifikasi",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>"
      },
      {
        "path": "data.identifikasi[].identifikasi_lokasi",
        "label": "data.identifikasi[].identifikasi_lokasi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.identifikasi[].nama_zonasi",
        "label": "data.identifikasi[].nama_zonasi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.identifikasi[].keterangan_zonasi",
        "label": "data.identifikasi[].keterangan_zonasi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.identifikasi[].nama_penggunaan",
        "label": "data.identifikasi[].nama_penggunaan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.identifikasi[].keterangan_penggunaan",
        "label": "data.identifikasi[].keterangan_penggunaan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.identifikasi[].koordinat_titik",
        "label": "data.identifikasi[].koordinat_titik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      }
    ],
    "evidence": {
      "callAddress": "0xd50518",
      "source": "analysis/recovered/request-callsites/range-00796390.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-surveylbtfaktorresiko-d6608c",
    "label": "Survei faktor risiko",
    "group": "Survei SIPENTA",
    "method": "POST",
    "endpoint": "surveylbtfaktorresiko",
    "path": "surveylbtfaktorresiko",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json (risiko additionally passes serialized data through 0x6b27e0)",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "no_berkas",
        "label": "no_berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data",
        "label": "data",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "object"
      },
      {
        "path": "data.provinsi",
        "label": "data.provinsi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kota_kab",
        "label": "data.kota_kab",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kecamatan",
        "label": "data.kecamatan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kelurahan_desa",
        "label": "data.kelurahan_desa",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.detail_risiko",
        "label": "data.detail_risiko",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>"
      },
      {
        "path": "data.detail_risiko[].lokasi_risiko",
        "label": "data.detail_risiko[].lokasi_risiko",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.detail_risiko[].koordinat_titik",
        "label": "data.detail_risiko[].koordinat_titik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.detail_risiko[].faktor_risiko",
        "label": "data.detail_risiko[].faktor_risiko",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>"
      },
      {
        "path": "data.detail_risiko[].faktor_risiko[].nama_risiko",
        "label": "data.detail_risiko[].faktor_risiko[].nama_risiko",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.detail_risiko[].faktor_risiko[].keterangan_risiko",
        "label": "data.detail_risiko[].faktor_risiko[].keterangan_risiko",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      }
    ],
    "evidence": {
      "callAddress": "0xd6608c",
      "source": "analysis/recovered/request-callsites/range-007c1a98.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-surveyfoto-d50194",
    "label": "Foto survei",
    "group": "Survei SIPENTA",
    "method": "POST",
    "endpoint": "surveyfoto",
    "path": "surveyfoto",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "multipart FormData via 0x707bd4",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "no_berkas",
        "label": "no_berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "foto",
        "label": "foto",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "multipart file result; exact filename/MIME rules unresolved"
      },
      {
        "path": "survey_id",
        "label": "survey_id",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "survey",
        "label": "survey",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "type",
        "label": "type",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      }
    ],
    "evidence": {
      "callAddress": "0xd50194",
      "source": "analysis/recovered/request-callsites/range-00d4ff20.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-surveynonpertanian-d5c0c4",
    "label": "Survei tanah nonpertanian",
    "group": "Survei SIPENTA",
    "method": "POST",
    "endpoint": "surveynonpertanian",
    "path": "surveynonpertanian",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json via shared submit helper 0xd5bf78",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "no_berkas",
        "label": "no_berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data",
        "label": "data",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "object"
      },
      {
        "path": "data.koordinat_titik",
        "label": "data.koordinat_titik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.koordinat_take_titik",
        "label": "data.koordinat_take_titik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.jarak",
        "label": "data.jarak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.provinsi",
        "label": "data.provinsi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kota_kab",
        "label": "data.kota_kab",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kecamatan",
        "label": "data.kecamatan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kelurahan_desa",
        "label": "data.kelurahan_desa",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.alamat",
        "label": "data.alamat",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.status_kepemilikan",
        "label": "data.status_kepemilikan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.jenis_data",
        "label": "data.jenis_data",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.tgl_transaksi_penawaran",
        "label": "data.tgl_transaksi_penawaran",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.harga_jualbeli",
        "label": "data.harga_jualbeli",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.responden",
        "label": "data.responden",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.nama_responden",
        "label": "data.nama_responden",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.alamat_responden",
        "label": "data.alamat_responden",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.notelp_responden",
        "label": "data.notelp_responden",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.luas_tanah",
        "label": "data.luas_tanah",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.lebar_depan",
        "label": "data.lebar_depan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.panjang_kebelakang",
        "label": "data.panjang_kebelakang",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.keadaan_fisik",
        "label": "data.keadaan_fisik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.biaya_bangunan",
        "label": "data.biaya_bangunan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kesimpulan",
        "label": "data.kesimpulan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.keterangan",
        "label": "data.keterangan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.lebar_jalan",
        "label": "data.lebar_jalan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kelas_jalan",
        "label": "data.kelas_jalan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.aksesibilitas",
        "label": "data.aksesibilitas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.drainase",
        "label": "data.drainase",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.elevasi",
        "label": "data.elevasi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.zoning_nama_zoning",
        "label": "data.zoning_nama_zoning",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.zoning_keterangan_zoning",
        "label": "data.zoning_keterangan_zoning",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.luas_bangunan",
        "label": "data.luas_bangunan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.jenis_bangunan_nama_bangunan",
        "label": "data.jenis_bangunan_nama_bangunan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.jenis_bangunan_keterangan_bangunan",
        "label": "data.jenis_bangunan_keterangan_bangunan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.tahun_pembuatan",
        "label": "data.tahun_pembuatan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.tahun_renovasi",
        "label": "data.tahun_renovasi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.panjang_pagar",
        "label": "data.panjang_pagar",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.lebar_carport",
        "label": "data.lebar_carport",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.panjang_carport",
        "label": "data.panjang_carport",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.luas_carport",
        "label": "data.luas_carport",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.bentuk_tanah",
        "label": "data.bentuk_tanah",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "object; nested serializer present"
      },
      {
        "path": "data.letak_tanah",
        "label": "data.letak_tanah",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "object; nested serializer present"
      },
      {
        "path": "data.utilitas",
        "label": "data.utilitas",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.fasilitas",
        "label": "data.fasilitas",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.konstruksi_atas",
        "label": "data.konstruksi_atas",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.konstruksi_bawah",
        "label": "data.konstruksi_bawah",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.atap",
        "label": "data.atap",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.dinding",
        "label": "data.dinding",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.langit_langit",
        "label": "data.langit_langit",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.lantai",
        "label": "data.lantai",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.pagar",
        "label": "data.pagar",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.pintu_jendela",
        "label": "data.pintu_jendela",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.komponenfasilitas",
        "label": "data.komponenfasilitas",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.lantai_tingkat",
        "label": "data.lantai_tingkat",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      }
    ],
    "evidence": {
      "callAddress": "0xd5c0c4",
      "source": "analysis/recovered/request-callsites/range-007a63a0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-surveypertanian-d5c0c4",
    "label": "Survei tanah pertanian",
    "group": "Survei SIPENTA",
    "method": "POST",
    "endpoint": "surveypertanian",
    "path": "surveypertanian",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json via shared submit helper 0xd5bf78",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "no_berkas",
        "label": "no_berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data",
        "label": "data",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "object"
      },
      {
        "path": "data.koordinat_titik",
        "label": "data.koordinat_titik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.koordinat_take_titik",
        "label": "data.koordinat_take_titik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.jarak",
        "label": "data.jarak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.provinsi",
        "label": "data.provinsi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kota_kab",
        "label": "data.kota_kab",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kecamatan",
        "label": "data.kecamatan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kelurahan_desa",
        "label": "data.kelurahan_desa",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.alamat",
        "label": "data.alamat",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.status_kepemilikan",
        "label": "data.status_kepemilikan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.jenis_data",
        "label": "data.jenis_data",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.tgl_transaksi_penawaran",
        "label": "data.tgl_transaksi_penawaran",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.harga_jualbeli",
        "label": "data.harga_jualbeli",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.responden",
        "label": "data.responden",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.nama_responden",
        "label": "data.nama_responden",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.alamat_responden",
        "label": "data.alamat_responden",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.notelp_responden",
        "label": "data.notelp_responden",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.luas_tanah",
        "label": "data.luas_tanah",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.lebar_depan",
        "label": "data.lebar_depan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.panjang_kebelakang",
        "label": "data.panjang_kebelakang",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.bentuk_tanah",
        "label": "data.bentuk_tanah",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "object; nested serializer present"
      },
      {
        "path": "data.kemiringan_tanah",
        "label": "data.kemiringan_tanah",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.komoditas",
        "label": "data.komoditas",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.kesesuaian_komoditas",
        "label": "data.kesesuaian_komoditas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.lebar_jalan",
        "label": "data.lebar_jalan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.kelas_jalan",
        "label": "data.kelas_jalan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.aksesibilitas",
        "label": "data.aksesibilitas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.irigasi",
        "label": "data.irigasi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.drainase",
        "label": "data.drainase",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "data.utilitas",
        "label": "data.utilitas",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "array<object>; item schema not fully reviewed here"
      },
      {
        "path": "data.keterangan",
        "label": "data.keterangan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      }
    ],
    "evidence": {
      "callAddress": "0xd5c0c4",
      "source": "analysis/recovered/request-callsites/range-007ad724.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-api-booking-d8b640",
    "label": "Pesan antrean layanan",
    "group": "Antrean",
    "method": "POST",
    "endpoint": "api/booking/",
    "path": "api/booking/",
    "serviceId": "antrian",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "loket",
        "label": "loket",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "tanggal_booking",
        "label": "tanggal_booking",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "sumber",
        "label": "sumber",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "jumlah_berkas",
        "label": "jumlah_berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "integer (unboxed integer load/boxing at 0x88c808..0x88c81c)"
      },
      {
        "path": "pemohon",
        "label": "pemohon",
        "type": "object",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "object Map<String,String>"
      },
      {
        "path": "pemohon.nik",
        "label": "pemohon.nik",
        "type": "object",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "string (Map<String,String> type argument)"
      },
      {
        "path": "pemohon.nama",
        "label": "pemohon.nama",
        "type": "object",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "string (Map<String,String> type argument)"
      },
      {
        "path": "pemohon.tempat_lahir",
        "label": "pemohon.tempat_lahir",
        "type": "object",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "string (Map<String,String> type argument)"
      },
      {
        "path": "pemohon.tanggal_lahir",
        "label": "pemohon.tanggal_lahir",
        "type": "object",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "string (Map<String,String> type argument)"
      },
      {
        "path": "pemohon.token",
        "label": "pemohon.token",
        "type": "object",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "string (Map<String,String> type argument)"
      },
      {
        "path": "pemohon.no_hp",
        "label": "pemohon.no_hp",
        "type": "object",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "string (Map<String,String> type argument)"
      }
    ],
    "evidence": {
      "callAddress": "0xd8b640",
      "source": "analysis/recovered/request-callsites/range-0088c77c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-apis-swaplottingterdaftar-d9f850",
    "label": "Plot bidang yang sudah terdaftar",
    "group": "Peta dan geotag",
    "method": "POST",
    "endpoint": "/apis/SwaplottingTerdaftar",
    "path": "/apis/SwaplottingTerdaftar",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "multipart FormData via 0x707bd4",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "id",
        "label": "ID",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "kluster",
        "label": "kluster",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "namapemilik",
        "label": "namapemilik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "kontaktelp",
        "label": "kontaktelp",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "kontakemail",
        "label": "kontakemail",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "kantorid",
        "label": "kantorid",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "namakantor",
        "label": "namakantor",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "wilayahid",
        "label": "wilayahid",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "namawilayah",
        "label": "namawilayah",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "reviu",
        "label": "reviu",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "lat",
        "label": "lat",
        "type": "number",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "double source passed through conversion helper 0xa944a0 before multipart; encoding must be confirmed"
      },
      {
        "path": "lon",
        "label": "lon",
        "type": "number",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "double source passed through conversion helper 0xa944a0 before multipart; encoding must be confirmed"
      },
      {
        "path": "file",
        "label": "Foto PNG",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "multipart file-like object; exact file constraints unresolved"
      },
      {
        "path": "tipehakid",
        "label": "tipehakid",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "nomorhak",
        "label": "nomorhak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "tipehak",
        "label": "tipehak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar"
      }
    ],
    "evidence": {
      "callAddress": "0xd9f850",
      "source": "analysis/recovered/request-callsites/range-00d9f180.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-apis-swaplottingbelumterdaftar-da0be8",
    "label": "Plot bidang yang belum terdaftar",
    "group": "Peta dan geotag",
    "method": "POST",
    "endpoint": "/apis/SwaplottingBelumTerdaftar",
    "path": "/apis/SwaplottingBelumTerdaftar",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "multipart FormData via 0x707bd4",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "id",
        "label": "ID",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "kluster",
        "label": "kluster",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "namapemilik",
        "label": "namapemilik",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "kontaktelp",
        "label": "kontaktelp",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "kontakemail",
        "label": "kontakemail",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "kantorid",
        "label": "kantorid",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "namakantor",
        "label": "namakantor",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "wilayahid",
        "label": "wilayahid",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "namawilayah",
        "label": "namawilayah",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "reviu",
        "label": "reviu",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "lat",
        "label": "lat",
        "type": "number",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "double source passed through conversion helper 0xa944a0 before multipart; encoding must be confirmed"
      },
      {
        "path": "lon",
        "label": "lon",
        "type": "number",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "double source passed through conversion helper 0xa944a0 before multipart; encoding must be confirmed"
      },
      {
        "path": "file",
        "label": "Foto PNG",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "multipart file-like object; exact file constraints unresolved"
      },
      {
        "path": "alamat",
        "label": "alamat",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "alashak",
        "label": "alashak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "nomoralashak",
        "label": "nomoralashak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "keteranganalashak",
        "label": "keteranganalashak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "buktipajak",
        "label": "buktipajak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "nomorbuktipajak",
        "label": "nomorbuktipajak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "keteranganbuktipajak",
        "label": "keteranganbuktipajak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      }
    ],
    "evidence": {
      "callAddress": "0xda0be8",
      "source": "analysis/recovered/request-callsites/range-00da03e0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-plotbidang-instansibelumbersertipikat-ddaa14",
    "label": "Bidang instansi belum bersertipikat",
    "group": "Peta dan geotag",
    "method": "POST",
    "endpoint": "PlotBidang/InstansiBelumBersertipikat",
    "path": "PlotBidang/InstansiBelumBersertipikat",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "multipart fields plus repeated gambar file parts",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "nup",
        "label": "nup",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "alamat",
        "label": "alamat",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "wilayahid",
        "label": "wilayahid",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "jenishakid",
        "label": "jenishakid",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "jenishak",
        "label": "jenishak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "nomorhak",
        "label": "nomorhak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "luas",
        "label": "luas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "luasdelineasi",
        "label": "luasdelineasi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "penguasaan",
        "label": "penguasaan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "Pemilikan",
        "label": "Pemilikan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "Pemanfaatan",
        "label": "Pemanfaatan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "Penggunaan",
        "label": "Penggunaan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "delineasi",
        "label": "delineasi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "Permasalahan",
        "label": "Permasalahan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "Reviu",
        "label": "Reviu",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "nib",
        "label": "nib",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "nibel",
        "label": "nibel",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "dokumen",
        "label": "dokumen",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "rutr",
        "label": "rutr",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "batasUtara",
        "label": "batasUtara",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "batasTimur",
        "label": "batasTimur",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "batasSelatan",
        "label": "batasSelatan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "batasBarat",
        "label": "batasBarat",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "gambar",
        "label": "gambar",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "repeated multipart file entries produced in loop; count may be zero"
      }
    ],
    "evidence": {
      "callAddress": "0xddaa14",
      "source": "analysis/recovered/request-callsites/range-00dd9f00.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-plotbidang-instansibersertipikat-ddb184",
    "label": "Bidang instansi bersertipikat",
    "group": "Peta dan geotag",
    "method": "POST",
    "endpoint": "PlotBidang/InstansiBersertipikat",
    "path": "PlotBidang/InstansiBersertipikat",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "multipart fields plus repeated gambar file parts",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "nup",
        "label": "nup",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "alamat",
        "label": "alamat",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "wilayahid",
        "label": "wilayahid",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "jenishakid",
        "label": "jenishakid",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "jenishak",
        "label": "jenishak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "nomorhak",
        "label": "nomorhak",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "luas",
        "label": "luas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "luasdelineasi",
        "label": "luasdelineasi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "penguasaan",
        "label": "penguasaan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "Pemilikan",
        "label": "Pemilikan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "Pemanfaatan",
        "label": "Pemanfaatan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "Penggunaan",
        "label": "Penggunaan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "delineasi",
        "label": "delineasi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "Permasalahan",
        "label": "Permasalahan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "Reviu",
        "label": "Reviu",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "nib",
        "label": "nib",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "nibel",
        "label": "nibel",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "dokumen",
        "label": "dokumen",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "rutr",
        "label": "rutr",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown scalar/object"
      },
      {
        "path": "gambar",
        "label": "gambar",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "repeated multipart file entries produced in loop; count may be zero"
      }
    ],
    "evidence": {
      "callAddress": "0xddb184",
      "source": "analysis/recovered/request-callsites/range-00dd9f00.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-collection-addcollectionberkas-d92664",
    "label": "Simpan berkas ke koleksi saya",
    "group": "Koleksi",
    "method": "POST",
    "endpoint": "Collection/AddCollectionBerkas",
    "path": "Collection/AddCollectionBerkas",
    "serviceId": "main",
    "serviceMapping": "audited main-session collection bookmark",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final field encoding unresolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak bookmark native dan typed200 yEb; penerimaan server belum diuji. NIK simpan hanya dari stored sign-in user, bukan profil atau input browser.",
    "fields": [
      {
        "path": "BerkasId",
        "label": "ID berkas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String",
        "description": "String persis dari caller native; service tidak memangkas atau memvalidasi kosong.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Title",
        "label": "Judul",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String",
        "description": "String persis dari caller native; service tidak memangkas atau memvalidasi kosong.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Subtitle",
        "label": "Subjudul",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String",
        "description": "String persis dari caller native; service tidak memangkas atau memvalidasi kosong.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Nik",
        "label": "NIK akun",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "session",
        "recoveredType": "String",
        "description": "Hanya stored sign-in user.nomorIndukKependudukan; null/missing ditolak, String kosong dipertahankan. Browser tidak menerima input atau pengganti NIK.",
        "sessionKey": "storedSignInNik",
        "strictString": true,
        "allowEmpty": true
      }
    ],
    "evidence": {
      "callAddress": "0xd92664",
      "source": "analysis/recovered/collection-save-berkas/flow.json",
      "requestSource": "analysis/recovered/request-callsites/00d92650.asm.txt",
      "nativeProofSha256": "c04d52a1cf004e9959fe9d9c006ed52c4b02bc8dda22ac181edf301a597d6573"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-berkas-bagikanberkas-d92e38",
    "label": "Bagikan berkas",
    "group": "Berkas",
    "method": "POST",
    "endpoint": "berkas/BagikanBerkas",
    "path": "berkas/BagikanBerkas",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final field encoding unresolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "Berkasid",
        "label": "ID berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      },
      {
        "path": "EmailPenerima",
        "label": "EmailPenerima",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd92e38",
      "source": "analysis/recovered/request-callsites/00d92e24.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-tanyajawab-submitpertanyaan-d994f4",
    "label": "Kirim pertanyaan tentang berkas",
    "group": "Berkas",
    "method": "POST",
    "endpoint": "TanyaJawab/SubmitPertanyaan",
    "path": "TanyaJawab/SubmitPertanyaan",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "berkasid",
        "label": "ID berkas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "content",
        "label": "content",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd994f4",
      "source": "analysis/recovered/request-callsites/00d994e4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-collection-addcollectionpersil-daae30",
    "label": "Simpan bidang ke koleksi saya",
    "group": "Koleksi",
    "method": "POST",
    "endpoint": "Collection/AddCollectionPersil",
    "path": "Collection/AddCollectionPersil",
    "serviceId": "main",
    "serviceMapping": "audited main-session collection bookmark",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final field encoding unresolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak bookmark native dan typed200 yEb; penerimaan server belum diuji. NIK simpan hanya dari stored sign-in user, bukan profil atau input browser.",
    "fields": [
      {
        "path": "PersilId",
        "label": "PersilId",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String",
        "description": "String persis dari caller native; service tidak memangkas atau memvalidasi kosong.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Title",
        "label": "Judul",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String",
        "description": "String persis dari caller native; service tidak memangkas atau memvalidasi kosong.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Subtitle",
        "label": "Subjudul",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String",
        "description": "String persis dari caller native; service tidak memangkas atau memvalidasi kosong.",
        "default": "Lokasi Bidang",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Nik",
        "label": "NIK akun",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "session",
        "recoveredType": "String",
        "description": "Hanya stored sign-in user.nomorIndukKependudukan; null/missing ditolak, String kosong dipertahankan. Browser tidak menerima input atau pengganti NIK.",
        "sessionKey": "storedSignInNik",
        "strictString": true,
        "allowEmpty": true
      }
    ],
    "evidence": {
      "callAddress": "0xdaae30",
      "source": "analysis/recovered/collection-save-persil/flow.json",
      "requestSource": "analysis/recovered/request-callsites/00daae1c.asm.txt",
      "nativeProofSha256": "dcc8abd41209eb741106dda7e88b834b4ba731b8e89838622859ff425767f199"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-legacy-bagisertifikat-dbb800",
    "label": "Bagikan sertipikat",
    "group": "Sertipikat dan akta",
    "method": "POST",
    "endpoint": "legacy/BagiSertifikat",
    "path": "legacy/BagiSertifikat",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "sertifikatId",
        "label": "sertifikatId",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      },
      {
        "path": "duration",
        "label": "duration",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      },
      {
        "path": "recipientUsername",
        "label": "recipientUsername",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      },
      {
        "path": "recipientEmail",
        "label": "recipientEmail",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      },
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xdbb800",
      "source": "analysis/recovered/request-callsites/00dbb7f0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-berkas-postratingberkas-d915c4",
    "label": "Nilai layanan berkas",
    "group": "Berkas",
    "method": "POST",
    "endpoint": "berkas/postratingberkas",
    "path": "berkas/postratingberkas",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final field encoding unresolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "Berkasid",
        "label": "ID berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      },
      {
        "path": "rating",
        "label": "rating",
        "type": "integer",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "int"
      },
      {
        "path": "userComment",
        "label": "userComment",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd915c4",
      "source": "analysis/recovered/request-callsites/00d915b0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-ratingppat-postratingppat-d86e10",
    "label": "Nilai layanan PPAT",
    "group": "Sertipikat dan akta",
    "method": "POST",
    "endpoint": "RatingPPAT/PostRatingPPAT",
    "path": "RatingPPAT/PostRatingPPAT",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "aktaId",
        "label": "aktaId",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      },
      {
        "path": "PertanyaanRatingPPATId",
        "label": "PertanyaanRatingPPATId",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd86e10",
      "source": "analysis/recovered/request-callsites/00d86df8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-brankas-detailsertipikatnew-d43b54",
    "label": "Detail sertipikat di brankas",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "Brankas/DetailSertipikatNew",
    "path": "Brankas/DetailSertipikatNew",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "id",
        "label": "ID",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd43b54",
      "source": "analysis/recovered/http-callsite-audit/00d43b54.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-common-send-otp-wa-d0048c",
    "label": "Kirim kode verifikasi WhatsApp",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "common/send_otp_wa",
    "path": "common/send_otp_wa",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json; map encoded by 0x6b27e0",
    "auth": "application",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "phone_number",
        "label": "phone_number",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "otp",
        "label": "otp",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      }
    ],
    "evidence": {
      "callAddress": "0xd0048c",
      "source": "analysis/recovered/http-callsite-audit/00d0048c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-pub-producer-publish-message-atrbpnlog-d03858",
    "label": "Catat telemetri aplikasi",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "pub/producer/publish-message/atrbpnlog",
    "path": "pub/producer/publish-message/atrbpnlog",
    "serviceId": "notifications",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json; serializer result encoded by 0x6b27e0",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "app",
        "label": "app",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "version",
        "label": "version",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "username",
        "label": "username",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "email",
        "label": "email",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "type",
        "label": "type",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; helper 0xb08030 result"
      },
      {
        "path": "contentId",
        "label": "ID konten",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "description",
        "label": "description",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "platform",
        "label": "platform",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "device",
        "label": "device",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "latitude",
        "label": "Lintang",
        "type": "number",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "double"
      },
      {
        "path": "longitude",
        "label": "Bujur",
        "type": "number",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "double"
      },
      {
        "path": "ipAddress",
        "label": "ipAddress",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "url",
        "label": "url",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "method",
        "label": "method",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "httpStatus",
        "label": "httpStatus",
        "type": "integer",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "int"
      },
      {
        "path": "userAgent",
        "label": "userAgent",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "params",
        "label": "params",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; transformed by 0xd04960"
      },
      {
        "path": "body",
        "label": "body",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; transformed by 0xd04960"
      },
      {
        "path": "createdAt",
        "label": "createdAt",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; helper 0x6be088 result"
      }
    ],
    "evidence": {
      "callAddress": "0xd03858",
      "source": "analysis/recovered/http-callsite-audit/00d03858.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-kantornearby-getkantornearby-d21a34",
    "label": "Kantor pertanahan di sekitar lokasi",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "kantornearby/getkantornearby",
    "path": "kantornearby/getkantornearby",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "json",
    "recoveredTransport": "JSON-encoded map; content type not locally specified",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "latitude",
        "label": "Lintang",
        "type": "number",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "double",
        "strictNumber": true,
        "minimum": -90,
        "maximum": 90
      },
      {
        "path": "longitude",
        "label": "Bujur",
        "type": "number",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "double",
        "strictNumber": true,
        "minimum": -180,
        "maximum": 180
      },
      {
        "path": "radius",
        "label": "radius",
        "type": "number",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "double",
        "default": 0.1
      },
      {
        "path": "isKalender",
        "label": "isKalender",
        "type": "integer",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "int",
        "default": 1
      },
      {
        "path": "limit",
        "label": "limit",
        "type": "number",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "num? (Map<String,num?>)",
        "default": null,
        "preserveNull": true
      }
    ],
    "evidence": {
      "callAddress": "0xd21a34",
      "source": "analysis/recovered/http-callsite-audit/00d21a34.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-account-account-summary-d2939c",
    "label": "Ringkasan akun saya",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "account/account_summary",
    "path": "account/account_summary",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "Map passed as data; content type inherited and not set in this builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "appVersion",
        "label": "Versi kontrak APK",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String",
        "default": "6.1.5",
        "description": "Versi artefak sumber untuk uji kompatibilitas; bukan checksum aplikasi web."
      }
    ],
    "evidence": {
      "callAddress": "0xd2939c",
      "source": "analysis/recovered/http-callsite-audit/00d2939c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-ikdv2-resetnik-d2dd34",
    "label": "Atur ulang kaitan NIK identitas digital",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "ikdv2/resetNIK",
    "path": "ikdv2/resetNIK",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "Map passed as data; content type inherited and not set in this builder",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [
      {
        "path": "nikReset",
        "label": "nikReset",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "token",
        "label": "token",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd2dd34",
      "source": "analysis/recovered/http-callsite-audit/00d2dd34.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-apis-getkkprdetail-d311e8",
    "label": "Detail dokumen KKPR",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "apis/GetKKPRDetail",
    "path": "apis/GetKKPRDetail",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "q",
        "label": "q",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd311e8",
      "source": "analysis/recovered/http-callsite-audit/00d311e8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-perurilivenesssdk-validatedukcapilfr-d33530",
    "label": "Validasi kecocokan wajah Dukcapil",
    "group": "Verifikasi identitas",
    "method": "POST",
    "endpoint": "PeruriLivenessSdk/ValidateDukcapilFR",
    "path": "PeruriLivenessSdk/ValidateDukcapilFR",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "multipart/form-data; FormData allocation 0xd15344 and population 0x707bd4",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [
      {
        "path": "Nik",
        "label": "NIK akun",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "nama",
        "label": "nama",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "Base64Photo",
        "label": "Base64Photo",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      }
    ],
    "evidence": {
      "callAddress": "0xd33530",
      "source": "analysis/recovered/http-callsite-audit/00d33530.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-apis-getpbteldetail-d3d134",
    "label": "Detail PBT elektronik",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "apis/GetPBTElDetail",
    "path": "apis/GetPBTElDetail",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "q",
        "label": "q",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd3d134",
      "source": "analysis/recovered/http-callsite-audit/00d3d134.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-apis-getdocument-d41ee8",
    "label": "Unduh dokumen dari kode",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "apis/GetDocument",
    "path": "apis/GetDocument",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "q",
        "label": "q",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "name",
        "label": "Nama dari profil akun",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String",
        "default": "",
        "description": "Field nama pada account/account_summary; bukan username atau nama file. Nilai kosong dipertahankan sesuai fallback client."
      }
    ],
    "evidence": {
      "callAddress": "0xd41ee8",
      "source": "analysis/recovered/http-callsite-audit/00d41ee8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-common-kecamatan-d60d28",
    "label": "Daftar kecamatan",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "common/kecamatan",
    "path": "common/kecamatan",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "Map passed as data; content type inherited and not set in this builder",
    "auth": "application",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "kabupatenkotaId",
        "label": "ID kabupaten/kota",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String?"
      }
    ],
    "evidence": {
      "callAddress": "0xd60d28",
      "source": "analysis/recovered/http-callsite-audit/00d60d28.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-activity-adduseractivity-d74ab4",
    "label": "Catat aktivitas akun saya",
    "group": "Aktivitas",
    "method": "POST",
    "endpoint": "activity/AddUserActivity",
    "path": "activity/AddUserActivity",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "multipart",
    "recoveredTransport": "multipart/form-data; FormData allocation 0xd15344 and population 0x707bd4",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "activityType",
        "label": "Jenis aktivitas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "Adapter memakai teks; tipe yang diterima server belum diuji."
      },
      {
        "path": "contentId",
        "label": "ID konten",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "Adapter memakai teks; tipe yang diterima server belum diuji."
      },
      {
        "path": "title",
        "label": "Judul",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "Adapter memakai teks; tipe yang diterima server belum diuji."
      },
      {
        "path": "subtitle",
        "label": "Subjudul",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "Adapter memakai teks; tipe yang diterima server belum diuji."
      },
      {
        "path": "status",
        "label": "Status",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "Adapter memakai teks; tipe yang diterima server belum diuji."
      }
    ],
    "evidence": {
      "callAddress": "0xd74ab4",
      "source": "analysis/recovered/http-callsite-audit/00d74ab4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-berkas-cariberkas-d88218",
    "label": "Cari berkas milik saya",
    "group": "Berkas",
    "method": "POST",
    "endpoint": "/berkas/CariBerkas",
    "path": "/berkas/CariBerkas",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "Map passed as data; content type inherited and not set in this builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "nomor",
        "label": "Nomor berkas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?",
        "default": null,
        "preserveNull": true
      },
      {
        "path": "tahun",
        "label": "Tahun",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?",
        "default": null,
        "preserveNull": true
      },
      {
        "path": "kantorId",
        "label": "ID kantor",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?",
        "default": null,
        "preserveNull": true
      },
      {
        "path": "berkasId",
        "label": "ID berkas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?",
        "default": null,
        "preserveNull": true
      }
    ],
    "evidence": {
      "callAddress": "0xd88218",
      "source": "analysis/recovered/http-callsite-audit/00d88218.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-bukutamu-d99dd8",
    "label": "Buku tamu kantor",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "${TRb.AYi}bukutamu",
    "path": "bukutamu",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "multipart/form-data; FormData allocation 0xd15344 and population 0x707bd4",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "kantorId",
        "label": "ID kantor",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "unitKerjaId",
        "label": "unitKerjaId",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "userId",
        "label": "userId",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "alamat",
        "label": "alamat",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "namaLengkap",
        "label": "namaLengkap",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "tempatLahir",
        "label": "tempatLahir",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "tanggalLahir",
        "label": "tanggalLahir",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "noTelp",
        "label": "noTelp",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "email",
        "label": "email",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "instansi",
        "label": "instansi",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "keperluan",
        "label": "keperluan",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      }
    ],
    "evidence": {
      "callAddress": "0xd99dd8",
      "source": "analysis/recovered/http-callsite-audit/00d99dd8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-infolayanan-simulasitipe1-da2f48",
    "label": "Simulasi biaya layanan tipe 1",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "InfoLayanan/SimulasiTipe1",
    "path": "InfoLayanan/SimulasiTipe1",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "json",
    "recoveredTransport": "application/json; serializer result encoded by 0x6b27e0",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "WilayahId",
        "label": "WilayahId",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Luas",
        "label": "Luas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true,
        "default": ""
      },
      {
        "path": "Penggunaan",
        "label": "Penggunaan",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Prosedur",
        "label": "Prosedur",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      }
    ],
    "evidence": {
      "callAddress": "0xda2f48",
      "source": "analysis/recovered/http-callsite-audit/00da2f48.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-infolayanan-simulasitipe4-da3f14",
    "label": "Simulasi biaya layanan tipe 4",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "InfoLayanan/SimulasiTipe4",
    "path": "InfoLayanan/SimulasiTipe4",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "json",
    "recoveredTransport": "application/json; serializer result encoded by 0x6b27e0",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "NilaiPerMeter",
        "label": "NilaiPerMeter",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": false
      },
      {
        "path": "Luas",
        "label": "Luas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": false
      }
    ],
    "evidence": {
      "callAddress": "0xda3f14",
      "source": "analysis/recovered/http-callsite-audit/00da3f14.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-collection-addpersilcollectiontogroup-da897c",
    "label": "Masukkan bidang ke grup koleksi",
    "group": "Koleksi",
    "method": "POST",
    "endpoint": "Collection/AddPersilCollectionToGroup",
    "path": "Collection/AddPersilCollectionToGroup",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "multipart",
    "recoveredTransport": "multipart/form-data; FormData allocation 0xd15344 and population 0x707bd4",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "collectionGroupId",
        "label": "ID grup koleksi",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "ID grup terpilih tanpa trim.",
        "strictString": true,
        "allowEmpty": false
      },
      {
        "path": "collectionId",
        "label": "ID koleksi",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic",
        "description": "row.id ?? '' asli; String kosong dipertahankan sesuai caller native.",
        "strictString": true,
        "allowEmpty": true
      }
    ],
    "evidence": {
      "callAddress": "0xda897c",
      "source": "analysis/recovered/http-callsite-audit/00da897c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-review-all-dace58",
    "label": "Daftar ulasan",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "review/all",
    "path": "review/all",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "Map passed as data; content type inherited and not set in this builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "reviewType",
        "label": "reviewType",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "contentId",
        "label": "ID konten",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "pageNumber",
        "label": "pageNumber",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "pageSize",
        "label": "pageSize",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xdace58",
      "source": "analysis/recovered/http-callsite-audit/00dace58.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-pin-updatepin-db2e2c",
    "label": "Ganti PIN",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "Pin/UpdatePin",
    "path": "Pin/UpdatePin",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded; explicit pin= string body",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "pin",
        "label": "pin",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String; percent-encoded argument"
      }
    ],
    "evidence": {
      "callAddress": "0xdb2e2c",
      "source": "analysis/recovered/http-callsite-audit/00db2e2c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-account-validatepassword-db5060",
    "label": "Validasi kata sandi akun",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "account/ValidatePassword",
    "path": "account/ValidatePassword",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "Map passed as data; content type inherited and not set in this builder",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "password",
        "label": "password",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xdb5060",
      "source": "analysis/recovered/http-callsite-audit/00db5060.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-account-addkantorfavorit-db757c",
    "label": "Tambahkan kantor favorit",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "account/AddKantorFavorit",
    "path": "account/AddKantorFavorit",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "kantorId",
        "label": "ID kantor",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xdb757c",
      "source": "analysis/recovered/http-callsite-audit/00db757c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-legacy-hapuskotakkeluar-dba864",
    "label": "Hapus entri kotak keluar",
    "group": "Sertipikat dan akta",
    "method": "POST",
    "endpoint": "legacy/HapusKotakKeluar",
    "path": "legacy/HapusKotakKeluar",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "Map passed as data; content type inherited and not set in this builder",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "id",
        "label": "ID",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xdba864",
      "source": "analysis/recovered/http-callsite-audit/00dba864.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-kiosk-verification-ddc6ac",
    "label": "Verifikasi layanan kios",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "kiosk/Verification",
    "path": "kiosk/Verification",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "multipart/form-data; FormData allocation 0xd15344 and population 0x707bd4",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [
      {
        "path": "token",
        "label": "token",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "username",
        "label": "username",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "nama",
        "label": "nama",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "tanggalLahir",
        "label": "tanggalLahir",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "tempatLahir",
        "label": "tempatLahir",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      }
    ],
    "evidence": {
      "callAddress": "0xddc6ac",
      "source": "analysis/recovered/http-callsite-audit/00ddc6ac.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-review-post-deb030",
    "label": "Kirim ulasan",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "review/post",
    "path": "review/post",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "multipart/form-data; FormData allocation 0xd15344 and population 0x707bd4",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "contentId",
        "label": "ID konten",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "reviewType",
        "label": "reviewType",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "comment",
        "label": "comment",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; map value declared dynamic"
      },
      {
        "path": "rating",
        "label": "rating",
        "type": "integer",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "int"
      },
      {
        "path": "reviewPhoto{n}",
        "label": "reviewPhoto{n}",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "multipart file object (lP), conditional, n starts at 1"
      }
    ],
    "evidence": {
      "callAddress": "0xdeb030",
      "source": "analysis/recovered/http-callsite-audit/00deb030.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-fcm-opt-out-d02578",
    "label": "Nonaktifkan notifikasi perangkat",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "fcm/opt_out",
    "path": "fcm/opt_out",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "sendNotif",
        "label": "sendNotif",
        "type": "boolean",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "bool"
      }
    ],
    "evidence": {
      "callAddress": "0xd02578",
      "source": "analysis/recovered/http-callsite-audit/00d02578.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-berkas-getberkas-d15068",
    "label": "Daftar berkas saya",
    "group": "Berkas",
    "method": "POST",
    "endpoint": "Berkas/GetBerkas",
    "path": "Berkas/GetBerkas",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "selesai",
        "label": "Berkas sudah selesai",
        "type": "boolean",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "bool literal; concrete wire formatting unresolved",
        "default": false
      }
    ],
    "evidence": {
      "callAddress": "0xd15068",
      "source": "analysis/recovered/http-callsite-audit/00d15068.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-geotag-getgeotaglist-d25618",
    "label": "Geotag pada berkas",
    "group": "Peta dan geotag",
    "method": "POST",
    "endpoint": "geotag/GetGeotagList",
    "path": "geotag/GetGeotagList",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "BerkasId",
        "label": "ID berkas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "Adapter memakai teks; tipe yang diterima server belum diuji."
      }
    ],
    "evidence": {
      "callAddress": "0xd25618",
      "source": "analysis/recovered/http-callsite-audit/00d25618.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-common-send-otp-wa-d2af40",
    "label": "Kirim kode verifikasi WhatsApp",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "common/send_otp_wa",
    "path": "common/send_otp_wa",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json; map through0x6b27e0",
    "auth": "application",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "phone_number",
        "label": "phone_number",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "otp",
        "label": "otp",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd2af40",
      "source": "analysis/recovered/http-callsite-audit/00d2af40.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-common-send-otp-wa-db5610",
    "label": "Kirim kode verifikasi WhatsApp",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "common/send_otp_wa",
    "path": "common/send_otp_wa",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json; map through0x6b27e0",
    "auth": "application",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "phone_number",
        "label": "phone_number",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "otp",
        "label": "otp",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xdb5610",
      "source": "analysis/recovered/http-callsite-audit/00db5610.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-common-send-otp-wa-de4ce0",
    "label": "Kirim kode verifikasi WhatsApp",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "common/send_otp_wa",
    "path": "common/send_otp_wa",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json; map through0x6b27e0",
    "auth": "application",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "phone_number",
        "label": "phone_number",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "otp",
        "label": "otp",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xde4ce0",
      "source": "analysis/recovered/http-callsite-audit/00de4ce0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-ikdv2-verificateaccount-d2dfe4",
    "label": "Verifikasi akun identitas digital",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "ikdv2/VerificateAccount",
    "path": "ikdv2/VerificateAccount",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [
      {
        "path": "token",
        "label": "token",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd2dfe4",
      "source": "analysis/recovered/http-callsite-audit/00d2dfe4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-perurilivenesssdk-verificateuser-d32bb8",
    "label": "Verifikasi data pengguna",
    "group": "Verifikasi identitas",
    "method": "POST",
    "endpoint": "PeruriLivenessSdk/VerificateUser",
    "path": "PeruriLivenessSdk/VerificateUser",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [
      {
        "path": "Nik",
        "label": "NIK akun",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "Nama",
        "label": "Nama",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "TglLahir",
        "label": "TglLahir",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "Tempatlahir",
        "label": "Tempatlahir",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "NoHp",
        "label": "NoHp",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd32bb8",
      "source": "analysis/recovered/http-callsite-audit/00d32bb8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-perurilivenesssdk-getlivenessphoto-d33820",
    "label": "Ambil foto verifikasi wajah",
    "group": "Verifikasi identitas",
    "method": "POST",
    "endpoint": "PeruriLivenessSdk/GetLivenessPhoto",
    "path": "PeruriLivenessSdk/GetLivenessPhoto",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [
      {
        "path": "sessionId",
        "label": "sessionId",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd33820",
      "source": "analysis/recovered/http-callsite-audit/00d33820.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-apis-verifytte-d3db70",
    "label": "Periksa tanda tangan elektronik",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "/apis/VerifyTTE",
    "path": "/apis/VerifyTTE",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "file",
        "label": "Foto PNG",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "q",
        "label": "q",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd3db70",
      "source": "analysis/recovered/http-callsite-audit/00d3db70.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-review-last-user-review-d42f30",
    "label": "Ulasan terakhir pengguna",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "review/last_user_review",
    "path": "review/last_user_review",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "reviewType",
        "label": "reviewType",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "contentId",
        "label": "ID konten",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd42f30",
      "source": "analysis/recovered/http-callsite-audit/00d42f30.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-common-kabupatenkota-d615c8",
    "label": "Daftar kabupaten/kota",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "common/kabupatenkota",
    "path": "common/kabupatenkota",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "application",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "provinsiId",
        "label": "ID provinsi",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String?"
      }
    ],
    "evidence": {
      "callAddress": "0xd615c8",
      "source": "analysis/recovered/http-callsite-audit/00d615c8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-berkas-getstatuscetak-d87ca8",
    "label": "Status cetak berkas",
    "group": "Berkas",
    "method": "POST",
    "endpoint": "berkas/getStatusCetak",
    "path": "berkas/getStatusCetak",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "berkasid",
        "label": "ID berkas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd87ca8",
      "source": "analysis/recovered/http-callsite-audit/00d87ca8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-api-verifikasi-d890bc",
    "label": "Verifikasi pemohon antrean",
    "group": "Antrean",
    "method": "POST",
    "endpoint": "api/verifikasi/",
    "path": "api/verifikasi/",
    "serviceId": "antrian",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json; map through0xb371fc",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "nama",
        "label": "nama",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "tempat_lahir",
        "label": "tempat_lahir",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "tanggal_lahir",
        "label": "tanggal_lahir",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd890bc",
      "source": "analysis/recovered/http-callsite-audit/00d890bc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-pub-validasi-nik-d9bc3c",
    "label": "Validasi data NIK",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "pub/validasi_nik",
    "path": "pub/validasi_nik",
    "serviceId": "unmapped",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "name",
        "label": "name",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "tempat_lahir",
        "label": "tempat_lahir",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "tanggal_lahir",
        "label": "tanggal_lahir",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd9bc3c",
      "source": "analysis/recovered/http-callsite-audit/00d9bc3c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-infolayanan-simulasitipe2-da3490",
    "label": "Simulasi biaya layanan tipe 2",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "InfoLayanan/SimulasiTipe2",
    "path": "InfoLayanan/SimulasiTipe2",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "json",
    "recoveredTransport": "application/json; serializer0x8ea594 then0x6b27e0",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "WilayahId",
        "label": "WilayahId",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "data",
        "label": "data",
        "type": "array",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "List<Map<String,dynamic>>",
        "arraySchema": "information-simulation-type2",
        "minItems": 1,
        "maxItems": 100,
        "description": "Baris simulasi tipe 2. Batas 100 baris adalah batas adapter browser, bukan batas native/server.",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "fields": [
            {
              "path": "Jumlah",
              "label": "Jumlah",
              "type": "string",
              "strictString": true,
              "clientRequired": true,
              "allowEmpty": false
            },
            {
              "path": "Luas",
              "label": "Luas",
              "type": "string",
              "strictString": true,
              "clientRequired": true,
              "allowEmpty": false
            },
            {
              "path": "Penggunaan",
              "label": "Penggunaan",
              "type": "string",
              "strictString": true,
              "clientRequired": true,
              "allowEmpty": true
            }
          ]
        }
      }
    ],
    "evidence": {
      "callAddress": "0xda3490",
      "source": "analysis/recovered/http-callsite-audit/00da3490.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-infolayanan-simulasitipe5-da4268",
    "label": "Simulasi biaya layanan tipe 5",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "InfoLayanan/SimulasiTipe5",
    "path": "InfoLayanan/SimulasiTipe5",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "json",
    "recoveredTransport": "application/json; serializer0x8ec47c then0x6b27e0",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "WilayahId",
        "label": "WilayahId",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Luas",
        "label": "Luas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true,
        "default": ""
      },
      {
        "path": "Penggunaan",
        "label": "Penggunaan",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Kewenangan",
        "label": "Kewenangan",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      }
    ],
    "evidence": {
      "callAddress": "0xda4268",
      "source": "analysis/recovered/http-callsite-audit/00da4268.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-collection-addpersilcollectiongroup-da8f20",
    "label": "Buat grup koleksi bidang",
    "group": "Koleksi",
    "method": "POST",
    "endpoint": "Collection/AddPersilCollectionGroup",
    "path": "Collection/AddPersilCollectionGroup",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "GroupName",
        "label": "Nama grup",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "Adapter memakai teks; tipe yang diterima server belum diuji."
      }
    ],
    "evidence": {
      "callAddress": "0xda8f20",
      "source": "analysis/recovered/http-callsite-audit/00da8f20.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-review-last-user-review-dad1dc",
    "label": "Ulasan terakhir pengguna",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "review/last_user_review",
    "path": "review/last_user_review",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "reviewType",
        "label": "reviewType",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "contentId",
        "label": "ID konten",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xdad1dc",
      "source": "analysis/recovered/http-callsite-audit/00dad1dc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-pin-validatepin-db3730",
    "label": "Validasi PIN",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "Pin/ValidatePin",
    "path": "Pin/ValidatePin",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "pin",
        "label": "pin",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String; transformed by0x76e07c before concatenation"
      }
    ],
    "evidence": {
      "callAddress": "0xdb3730",
      "source": "analysis/recovered/http-callsite-audit/00db3730.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-account-resetnikuser-db7eb0",
    "label": "Atur ulang NIK akun",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "account/resetNIKuser",
    "path": "account/resetNIKuser",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "password",
        "label": "password",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xdb7eb0",
      "source": "analysis/recovered/http-callsite-audit/00db7eb0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-plotbidang-getdetail-dd980c",
    "label": "Detail plot bidang",
    "group": "Peta dan geotag",
    "method": "POST",
    "endpoint": "PlotBidang/GetDetail",
    "path": "PlotBidang/GetDetail",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "id",
        "label": "ID",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "Adapter memakai teks; tipe yang diterima server belum diuji."
      }
    ],
    "evidence": {
      "callAddress": "0xdd980c",
      "source": "analysis/recovered/http-callsite-audit/00dd980c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-review-berkas-deb878",
    "label": "Ulasan penyelesaian berkas",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "review/berkas",
    "path": "review/berkas",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "BerkasId",
        "label": "ID berkas",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "FcmId",
        "label": "FcmId",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "Rating",
        "label": "Rating",
        "type": "integer",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "int (explicit boxing); multipart stringification unresolved"
      },
      {
        "path": "Sesuai",
        "label": "Sesuai",
        "type": "integer",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "int (explicit boxing); multipart stringification unresolved"
      },
      {
        "path": "Comment",
        "label": "Comment",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "reviewPhoto{n}",
        "label": "reviewPhoto{n}",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "file part"
      }
    ],
    "evidence": {
      "callAddress": "0xdeb878",
      "source": "analysis/recovered/http-callsite-audit/00deb878.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-fcm-opt-in-d02e3c",
    "label": "Aktifkan notifikasi perangkat",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "fcm/opt_in",
    "path": "fcm/opt_in",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "token",
        "label": "token",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?"
      },
      {
        "path": "deviceId",
        "label": "deviceId",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String?"
      }
    ],
    "evidence": {
      "callAddress": "0xd02e3c",
      "source": "analysis/recovered/http-callsite-audit/00d02e3c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-kantornearby-getcalendar-d2127c",
    "label": "Kalender layanan kantor",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "KantorNearby/GetCalendar",
    "path": "KantorNearby/GetCalendar",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "kantorId",
        "label": "ID kantor",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String",
        "strictString": true,
        "description": "Referensi kantor dari daftar terdekat; backend menerapkan transformasi native."
      },
      {
        "path": "tahun",
        "label": "Tahun",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String",
        "strictString": true,
        "description": "Tahun kalender yang ditampilkan."
      }
    ],
    "evidence": {
      "callAddress": "0xd2127c",
      "source": "analysis/recovered/http-callsite-audit/00d2127c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-geotag-getsuratpernyataangeotag-d26d20",
    "label": "Unduh surat pernyataan geotag yang ada",
    "group": "Peta dan geotag",
    "method": "POST",
    "endpoint": "geotag/GetSuratPernyataanGeotag",
    "path": "geotag/GetSuratPernyataanGeotag",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "multipart",
    "recoveredTransport": "FormData object plus explicit Content-Type application/x-www-form-urlencoded; final header/body reconciliation unresolved",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "geotagId",
        "label": "geotagId",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "Adapter memakai teks; tipe yang diterima server belum diuji."
      }
    ],
    "evidence": {
      "callAddress": "0xd26d20",
      "source": "analysis/recovered/http-callsite-audit/00d26d20.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-login-d2c20c",
    "label": "Masuk layanan SIPENTA",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "login",
    "path": "login",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd2c20c",
      "source": "analysis/recovered/http-callsite-audit/00d2c20c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-ikdv2-signinikd-d2e560",
    "label": "Masuk melalui identitas digital",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "ikdv2/signinIKD",
    "path": "ikdv2/signinIKD",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [
      {
        "path": "token",
        "label": "token",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd2e560",
      "source": "analysis/recovered/http-callsite-audit/00d2e560.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-perurilivenesssdk-checkregisterednik-d32fc4",
    "label": "Periksa NIK terdaftar",
    "group": "Verifikasi identitas",
    "method": "POST",
    "endpoint": "PeruriLivenessSdk/CheckRegisteredNIK",
    "path": "PeruriLivenessSdk/CheckRegisteredNIK",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [
      {
        "path": "Nik",
        "label": "NIK akun",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd32fc4",
      "source": "analysis/recovered/http-callsite-audit/00d32fc4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-review-inappreview-d36ddc",
    "label": "Kirim penilaian aplikasi",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "review/inAppReview",
    "path": "review/inAppReview",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "rating",
        "label": "rating",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "review",
        "label": "review",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd36ddc",
      "source": "analysis/recovered/http-callsite-audit/00d36ddc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-apis-getdocumenttype-d417d4",
    "label": "Jenis dokumen dari kode",
    "group": "Layanan lainnya",
    "method": "POST",
    "endpoint": "apis/GetDocumentType",
    "path": "apis/GetDocumentType",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "q",
        "label": "q",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd417d4",
      "source": "analysis/recovered/http-callsite-audit/00d417d4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-common-kelurahan-d60928",
    "label": "Daftar kelurahan/desa",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "common/kelurahan",
    "path": "common/kelurahan",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "application",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "kecamatanId",
        "label": "ID kecamatan",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String?"
      }
    ],
    "evidence": {
      "callAddress": "0xd60928",
      "source": "analysis/recovered/http-callsite-audit/00d60928.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-kiosk-jsondecryptor-d70dac",
    "label": "Baca data terenkripsi kios",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "kiosk/JsonDecryptor",
    "path": "kiosk/JsonDecryptor",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [
      {
        "path": "encryptedData",
        "label": "encryptedData",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd70dac",
      "source": "analysis/recovered/http-callsite-audit/00d70dac.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-berkas-berkassop-d87ea8",
    "label": "Tahapan layanan berkas",
    "group": "Berkas",
    "method": "POST",
    "endpoint": "berkas/berkassop",
    "path": "berkas/berkassop",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "berkasid",
        "label": "ID berkas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd87ea8",
      "source": "analysis/recovered/http-callsite-audit/00d87ea8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-api-booking-limit-d8bf80",
    "label": "Periksa batas pemesanan antrean",
    "group": "Antrean",
    "method": "POST",
    "endpoint": "api/booking/limit/",
    "path": "api/booking/limit/",
    "serviceId": "antrian",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "kantorid",
        "label": "kantorid",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "tanggal_booking",
        "label": "tanggal_booking",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xd8bf80",
      "source": "analysis/recovered/http-callsite-audit/00d8bf80.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-api-verifikasi-d9e270",
    "label": "Verifikasi pemohon antrean",
    "group": "Antrean",
    "method": "POST",
    "endpoint": "api/verifikasi/",
    "path": "api/verifikasi/",
    "serviceId": "antrian",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json; map encoded via0xb371fc",
    "auth": "none",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "nama",
        "label": "nama",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "tempat_lahir",
        "label": "tempat_lahir",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "tanggal_lahir",
        "label": "tanggal_lahir",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xd9e270",
      "source": "analysis/recovered/http-callsite-audit/00d9e270.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-infolayanan-simulasitipe3-da3a30",
    "label": "Simulasi biaya layanan tipe 3",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "InfoLayanan/SimulasiTipe3",
    "path": "InfoLayanan/SimulasiTipe3",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "json",
    "recoveredTransport": "application/json; serializer0x8eb64c then0x6b27e0",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "WilayahId",
        "label": "WilayahId",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Luas",
        "label": "Luas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true,
        "default": ""
      },
      {
        "path": "Penggunaan",
        "label": "Penggunaan",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "LayananId",
        "label": "LayananId",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      }
    ],
    "evidence": {
      "callAddress": "0xda3a30",
      "source": "analysis/recovered/http-callsite-audit/00da3a30.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-infolayanan-simulasitipe6-da474c",
    "label": "Simulasi biaya layanan tipe 6",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "InfoLayanan/SimulasiTipe6",
    "path": "InfoLayanan/SimulasiTipe6",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "json",
    "recoveredTransport": "application/json; serializer0x8e85a0 then0x6b27e0",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "WilayahId",
        "label": "WilayahId",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Luas",
        "label": "Luas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true,
        "default": ""
      },
      {
        "path": "Penggunaan",
        "label": "Penggunaan",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      },
      {
        "path": "Prosedur",
        "label": "Prosedur",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "String asli dari formulir APK; tidak dipangkas atau diubah menjadi angka. Pilihan wajib non-null; string kosong dipertahankan bila form native mengizinkannya.",
        "strictString": true,
        "allowEmpty": true
      }
    ],
    "evidence": {
      "callAddress": "0xda474c",
      "source": "analysis/recovered/http-callsite-audit/00da474c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-perurilivenesssdk-validatektpdatav2-da9a78",
    "label": "Validasi data KTP",
    "group": "Verifikasi identitas",
    "method": "POST",
    "endpoint": "PeruriLivenessSdk/ValidateKTPDataV2",
    "path": "PeruriLivenessSdk/ValidateKTPDataV2",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [
      {
        "path": "Nik",
        "label": "NIK akun",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "Nama",
        "label": "Nama",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "Tempatlahir",
        "label": "Tempatlahir",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "TglLahir",
        "label": "TglLahir",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "NoHp",
        "label": "NoHp",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xda9a78",
      "source": "analysis/recovered/http-callsite-audit/00da9a78.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-pin-authenticate-db2818",
    "label": "Autentikasi untuk pengaturan PIN",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "Pin/Authenticate",
    "path": "Pin/Authenticate",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "application/x-www-form-urlencoded",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "password",
        "label": "password",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String; transformed by0x76e07c before concatenation"
      }
    ],
    "evidence": {
      "callAddress": "0xdb2818",
      "source": "analysis/recovered/http-callsite-audit/00db2818.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-common-send-otp-wa-db43b8",
    "label": "Kirim kode verifikasi WhatsApp",
    "group": "Layanan dan wilayah",
    "method": "POST",
    "endpoint": "common/send_otp_wa",
    "path": "common/send_otp_wa",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "application/json; map through0x6b27e0",
    "auth": "application",
    "authenticated": false,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "phone_number",
        "label": "phone_number",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      },
      {
        "path": "otp",
        "label": "otp",
        "type": "unknown",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved"
      }
    ],
    "evidence": {
      "callAddress": "0xdb43b8",
      "source": "analysis/recovered/http-callsite-audit/00db43b8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-account-gantinomorhp-db5e40",
    "label": "Ganti nomor telepon akun",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "account/GantiNomorHP",
    "path": "account/GantiNomorHP",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "password",
        "label": "password",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      },
      {
        "path": "noHp",
        "label": "noHp",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xdb5e40",
      "source": "analysis/recovered/http-callsite-audit/00db5e40.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-account-resetnikikd-db8f2c",
    "label": "Atur ulang NIK identitas digital",
    "group": "Akun dan verifikasi",
    "method": "POST",
    "endpoint": "account/resetNIKIkd",
    "path": "account/resetNIKIkd",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "form",
    "recoveredTransport": "not resolved from explicit call options",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String"
      }
    ],
    "evidence": {
      "callAddress": "0xdb8f2c",
      "source": "analysis/recovered/http-callsite-audit/00db8f2c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-plotbidang-daftarplot-ddbb60",
    "label": "Daftar plot bidang saya",
    "group": "Peta dan geotag",
    "method": "POST",
    "endpoint": "PlotBidang/DaftarPlot",
    "path": "PlotBidang/DaftarPlot",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit data/options argument",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xddbb60",
      "source": "analysis/recovered/http-callsite-audit/00ddbb60.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "post-activity-deleteuseractivity-de6c94",
    "label": "Hapus aktivitas akun saya",
    "group": "Aktivitas",
    "method": "POST",
    "endpoint": "activity/deleteUserActivity",
    "path": "activity/deleteUserActivity",
    "serviceId": "main",
    "serviceMapping": "audited main-session activity list/delete",
    "encoding": "multipart",
    "recoveredTransport": "FormData via constructor0x707bd4; final per-field stringification not fully resolved",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak aktivitas native dipulihkan; penerimaan server belum diuji. Penghapusan cache lokal mengikuti controller native meski hasil layanan false.",
    "fields": [
      {
        "path": "userActivityId",
        "label": "ID aktivitas",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "dynamic; concrete wire type unresolved",
        "description": "userActivityId asli dari model aktivitas; null/missing model menjadi ''. String kosong dan spasi dipertahankan, bukan contentId.",
        "strictString": true,
        "allowEmpty": true
      }
    ],
    "evidence": {
      "callAddress": "0xde6c94",
      "source": "analysis/recovered/activity-delete/flow.json",
      "requestSource": "analysis/recovered/http-callsite-audit/00de6c94.asm.txt",
      "nativeProofSha256": "6b9fe33d129a6919110c1c5bfa4f4ccc1260320946a30d92733395bc846a6c80"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-announcement-yuridis-bykantor-d0fb64",
    "label": "Pengumuman yuridis per kantor",
    "group": "Informasi publik",
    "method": "GET",
    "endpoint": "announcement/yuridis_byKantor?kantorId={value}",
    "path": "announcement/yuridis_byKantor",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "kantorId",
        "label": "ID kantor",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd0fb64",
      "source": "analysis/recovered/http-callsite-audit/00d0fb64.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-kantah-d10364",
    "label": "Cari kantor pertanahan",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "legacy/Kantah?nama={value}&tipeKantor={value}",
    "path": "legacy/Kantah",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "nama",
        "label": "nama",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "",
        "description": "Nama kosong memuat daftar kantor; kontrak pemilih Cari Berkas dari APK."
      },
      {
        "path": "tipeKantor",
        "label": "tipeKantor",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd10364",
      "source": "analysis/recovered/http-callsite-audit/00d10364.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-announcement-sertipikat-hilang-bykantor-d10a9c",
    "label": "Pengumuman sertipikat hilang",
    "group": "Informasi publik",
    "method": "GET",
    "endpoint": "announcement/sertipikat_hilang_byKantor?kantorId={value}",
    "path": "announcement/sertipikat_hilang_byKantor",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "kantorId",
        "label": "ID kantor",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd10a9c",
      "source": "analysis/recovered/http-callsite-audit/00d10a9c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-pin-getpin-d1c6d8",
    "label": "Status PIN akun",
    "group": "Akun dan verifikasi",
    "method": "GET",
    "endpoint": "Pin/GetPin",
    "path": "Pin/GetPin",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd1c6d8",
      "source": "analysis/recovered/http-callsite-audit/00d1c6d8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-akta-getaktalist-d1ccc4",
    "label": "Daftar akta saya",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "Akta/GetAktaList?nik={value}",
    "path": "Akta/GetAktaList",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "session",
        "recoveredType": "String in constructed URL; input type not inferred",
        "sessionKey": "nik",
        "description": "Diambil dari akun yang sedang masuk; bukan NIK pengguna lain."
      }
    ],
    "evidence": {
      "callAddress": "0xd1ccc4",
      "source": "analysis/recovered/http-callsite-audit/00d1ccc4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-ratingppat-getratingquestions-d1d6bc",
    "label": "Pertanyaan penilaian PPAT",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "RatingPPAT/GetRatingQuestions",
    "path": "RatingPPAT/GetRatingQuestions",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd1d6bc",
      "source": "analysis/recovered/http-callsite-audit/00d1d6bc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-activity-getuseractivity-d1dc68",
    "label": "Aktivitas akun saya",
    "group": "Aktivitas",
    "method": "GET",
    "endpoint": "activity/GetUserActivity",
    "path": "activity/GetUserActivity",
    "serviceId": "main",
    "serviceMapping": "audited main-session activity list/delete",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Daftar aktivitas bertipe; createdAt dipertahankan sebagai String/null tanpa membuat timestamp browser.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd1dc68",
      "source": "analysis/recovered/activity-delete/flow.json",
      "requestSource": "analysis/recovered/http-callsite-audit/00d1dc68.asm.txt",
      "nativeProofSha256": "6b9fe33d129a6919110c1c5bfa4f4ccc1260320946a30d92733395bc846a6c80"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-api-antrian-path-argument-1-d1e130",
    "label": "Detail antrean",
    "group": "Antrean",
    "method": "GET",
    "endpoint": "api/antrian/{path_argument_1}",
    "path": "api/antrian/{path_argument_1}",
    "serviceId": "directus",
    "serviceMapping": "audited FRb +0xb Directus read client",
    "encoding": "none",
    "recoveredTransport": "runtime path segment concatenated to literal route",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Pembacaan antrean akun sendiri; identitas dari summary backend dan ID detail dari daftar/aktivitas sesi. Booking dan enrollment belum tersedia.",
    "fields": [
      {
        "path": "path_argument_1",
        "label": "ID antrean terpilih",
        "type": "string",
        "strictString": true,
        "location": "path",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "description": "ID utuh yang dikembalikan daftar atau aktivitas akun ini; bukan nomor antrean atau kode booking."
      }
    ],
    "evidence": {
      "callAddress": "0xd1e130",
      "source": "analysis/recovered/queue-flow.json",
      "transportSource": "analysis/recovered/queue-interceptor-followup/flow.json",
      "identitySource": "analysis/recovered/queue-identity-followup/flow.json"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested",
    "clientProfile": "queue-read"
  },
  {
    "id": "get-api-antrian-saya-d1eb1c",
    "label": "Antrean saya",
    "group": "Antrean",
    "method": "GET",
    "endpoint": "api/antrian/saya",
    "path": "api/antrian/saya",
    "serviceId": "directus",
    "serviceMapping": "audited FRb +0xb Directus read client",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Pembacaan antrean akun sendiri; identitas dari summary backend dan ID detail dari daftar/aktivitas sesi. Booking dan enrollment belum tersedia.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd1eb1c",
      "source": "analysis/recovered/queue-flow.json",
      "transportSource": "analysis/recovered/queue-interceptor-followup/flow.json",
      "identitySource": "analysis/recovered/queue-identity-followup/flow.json"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested",
    "clientProfile": "queue-read"
  },
  {
    "id": "get-items-kantor-d1fa00",
    "label": "Referensi kantor antrean",
    "group": "Antrean",
    "method": "GET",
    "endpoint": "items/kantor?limit=1000&sort=nama",
    "path": "items/kantor",
    "serviceId": "directus",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "limit",
        "label": "limit",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "1000"
      },
      {
        "path": "sort",
        "label": "sort",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "nama"
      }
    ],
    "evidence": {
      "callAddress": "0xd1fa00",
      "source": "analysis/recovered/http-callsite-audit/00d1fa00.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-api-notifikasi-d22468",
    "label": "Panggilan antrean saya",
    "group": "Antrean",
    "method": "GET",
    "endpoint": "api/notifikasi",
    "path": "api/notifikasi",
    "serviceId": "directus",
    "serviceMapping": "audited FRb +0xb Directus notifications read",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Panggilan dibaca dari identitas profil backend sesi ini; tidak menerima NIK browser atau melakukan mark-read.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd22468",
      "source": "analysis/recovered/queue-calls-flow/flow.json"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested",
    "clientProfile": "queue-read"
  },
  {
    "id": "get-banner-d22854",
    "label": "Banner layanan",
    "group": "Informasi publik",
    "method": "GET",
    "endpoint": "banner",
    "path": "banner",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd22854",
      "source": "analysis/recovered/http-callsite-audit/00d22854.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-collection-getcollectionid-d25250",
    "label": "Status koleksi berkas",
    "group": "Koleksi",
    "method": "GET",
    "endpoint": "collection/GetCollectionId",
    "path": "collection/GetCollectionId",
    "serviceId": "main",
    "serviceMapping": "audited main-session collection bookmark",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak bookmark native dan typed200 yEb; penerimaan server belum diuji. NIK simpan hanya dari stored sign-in user, bukan profil atau input browser.",
    "fields": [
      {
        "path": "id",
        "label": "ID",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value",
        "strictString": true,
        "allowEmpty": true,
        "description": "Composite ID String dari detail ABb; dipertahankan tanpa trim."
      },
      {
        "path": "type",
        "label": "type",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String",
        "default": "BERKAS",
        "description": "Jenis tetap BERKAS sesuai caller native.",
        "strictString": true,
        "allowEmpty": false
      }
    ],
    "evidence": {
      "callAddress": "0xd25250",
      "source": "analysis/recovered/collection-save-berkas/flow.json",
      "requestSource": "analysis/recovered/http-callsite-audit/00d25250.asm.txt",
      "nativeProofSha256": "c04d52a1cf004e9959fe9d9c006ed52c4b02bc8dda22ac181edf301a597d6573"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-common-getwilayahbylocation-d2673c",
    "label": "Wilayah pada koordinat",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "common/GetWilayahByLocation",
    "path": "common/GetWilayahByLocation",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "longitude",
        "label": "Bujur",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      },
      {
        "path": "latitude",
        "label": "Lintang",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd2673c",
      "source": "analysis/recovered/http-callsite-audit/00d2673c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-tanyajawab-gettanyajawabberkas-d2826c",
    "label": "Tanya jawab pada berkas",
    "group": "Berkas",
    "method": "GET",
    "endpoint": "TanyaJawab/GetTanyaJawabBerkas?berkasid={value}",
    "path": "TanyaJawab/GetTanyaJawabBerkas",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "berkasid",
        "label": "ID berkas",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd2826c",
      "source": "analysis/recovered/http-callsite-audit/00d2826c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-bukutamu-d28bf4",
    "label": "Buku tamu kantor",
    "group": "Layanan lainnya",
    "method": "GET",
    "endpoint": "${TRb.AYi}bukutamu",
    "path": "bukutamu",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "uid",
        "label": "uid",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      },
      {
        "path": "unid",
        "label": "unid",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd28bf4",
      "source": "analysis/recovered/http-callsite-audit/00d28bf4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-map-getdisclaimer-d29ef0",
    "label": "Ketentuan penggunaan peta",
    "group": "Peta dan geotag",
    "method": "GET",
    "endpoint": "Map/GetDisclaimer",
    "path": "Map/GetDisclaimer",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd29ef0",
      "source": "analysis/recovered/http-callsite-audit/00d29ef0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-berita-getberita-d2cb24",
    "label": "Berita pertanahan",
    "group": "Informasi publik",
    "method": "GET",
    "endpoint": "Berita/GetBerita?limit=8",
    "path": "Berita/GetBerita",
    "serviceId": "main",
    "serviceMapping": "audited cloned main client with LRb/AP",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak daftar dan model nullable dipulihkan dari APK; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "limit",
        "label": "limit",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "8"
      }
    ],
    "evidence": {
      "callAddress": "0xd2cb24",
      "source": "analysis/recovered/news-flow/flow.json",
      "requestSource": "analysis/recovered/http-callsite-audit/00d2cb24.asm.txt",
      "nativeProofSha256": "9628b9d094cb486c82a86f8a27d90426a3d15737d32fc2d7e3fd36e1615f6aa9"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-pengumuman-getpengumuman-d2cf54",
    "label": "Pengumuman",
    "group": "Informasi publik",
    "method": "GET",
    "endpoint": "Pengumuman/GetPengumuman?limit=5",
    "path": "Pengumuman/GetPengumuman",
    "serviceId": "main",
    "serviceMapping": "audited cloned main client with LRb/AP",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak daftar dan model nullable dipulihkan dari APK; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "limit",
        "label": "limit",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "5"
      }
    ],
    "evidence": {
      "callAddress": "0xd2cf54",
      "source": "analysis/recovered/news-flow/flow.json",
      "requestSource": "analysis/recovered/http-callsite-audit/00d2cf54.asm.txt",
      "nativeProofSha256": "9628b9d094cb486c82a86f8a27d90426a3d15737d32fc2d7e3fd36e1615f6aa9"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-youtube-getyoutubelist-d2d384",
    "label": "Video informasi",
    "group": "Informasi publik",
    "method": "GET",
    "endpoint": "Youtube/GetYoutubeList",
    "path": "Youtube/GetYoutubeList",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd2d384",
      "source": "analysis/recovered/http-callsite-audit/00d2d384.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-ikdv2-generate-token-d2f02c",
    "label": "Buat sesi identitas digital",
    "group": "Akun dan verifikasi",
    "method": "GET",
    "endpoint": "ikdv2/generate_token",
    "path": "ikdv2/generate_token",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Alur identitas atau komponen native belum dipetakan untuk browser.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd2f02c",
      "source": "analysis/recovered/http-callsite-audit/00d2f02c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-infolayanan-getinfolayanandetail-d2f3c0",
    "label": "Persyaratan dan detail layanan",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "InfoLayanan/GetInfoLayananDetail?id={value}",
    "path": "InfoLayanan/GetInfoLayananDetail",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "id",
        "label": "ID",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd2f3c0",
      "source": "analysis/recovered/http-callsite-audit/00d2f3c0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-infolayanan-getinfolayanan-d2f77c",
    "label": "Daftar layanan pertanahan",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "InfoLayanan/GetInfoLayanan",
    "path": "InfoLayanan/GetInfoLayanan",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd2f77c",
      "source": "analysis/recovered/http-callsite-audit/00d2f77c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-infolayanan-getprovinsi-d2fc78",
    "label": "Provinsi untuk informasi layanan",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "InfoLayanan/GetProvinsi",
    "path": "InfoLayanan/GetProvinsi",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd2fc78",
      "source": "analysis/recovered/http-callsite-audit/00d2fc78.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-subyeksosial-getsubyeksosial-d3065c",
    "label": "Data subyek sosial",
    "group": "Layanan lainnya",
    "method": "GET",
    "endpoint": "SubyekSosial/GetSubyekSosial?username={value}",
    "path": "SubyekSosial/GetSubyekSosial",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "username",
        "label": "username",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd3065c",
      "source": "analysis/recovered/http-callsite-audit/00d3065c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-kkpr-getkkprlist-d30c18",
    "label": "Dokumen KKPR saya",
    "group": "Layanan lainnya",
    "method": "GET",
    "endpoint": "KKPR/GetKKPRList?nomorIdentitas={value}",
    "path": "KKPR/GetKKPRList",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "nomorIdentitas",
        "label": "NIK akun",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "session",
        "recoveredType": "String in constructed URL; input type not inferred",
        "sessionKey": "nik",
        "description": "Menggunakan nomor identitas dari profil akun yang aktif."
      }
    ],
    "evidence": {
      "callAddress": "0xd30c18",
      "source": "analysis/recovered/http-callsite-audit/00d30c18.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-collection-getusercollection-d31a50",
    "label": "Koleksi saya",
    "group": "Koleksi",
    "method": "GET",
    "endpoint": "collection/GetUserCollection",
    "path": "collection/GetUserCollection",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd31a50",
      "source": "analysis/recovered/http-callsite-audit/00d31a50.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-collection-getpersilcollectiongroup-d31fbc",
    "label": "Grup koleksi bidang saya",
    "group": "Koleksi",
    "method": "GET",
    "endpoint": "collection/GetPersilCollectionGroup",
    "path": "collection/GetPersilCollectionGroup",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd31fbc",
      "source": "analysis/recovered/http-callsite-audit/00d31fbc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-wxb-kyi-d38d58",
    "label": "Status konfigurasi aplikasi",
    "group": "Layanan lainnya",
    "method": "GET",
    "endpoint": "${Wxb.KYi}?rahasia={runtime_value}",
    "path": "${Wxb.KYi}",
    "serviceId": "unmapped",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "runtime base plus known URL/query structure",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "rahasia",
        "label": "rahasia",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd38d58",
      "source": "analysis/recovered/http-callsite-audit/00d38d58.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-getparcelboundarybyid-d39898",
    "label": "Batas bidang tanah",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "legacy/GetParcelBoundaryById?persilid={value}",
    "path": "legacy/GetParcelBoundaryById",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "persilid",
        "label": "persilid",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd39898",
      "source": "analysis/recovered/http-callsite-audit/00d39898.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-apis-getgeojsoninfo-d39f1c",
    "label": "Lokasi bidang dari dokumen",
    "group": "Layanan lainnya",
    "method": "GET",
    "endpoint": "/apis/getGeoJsonInfo",
    "path": "/apis/getGeoJsonInfo",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "q",
        "label": "Kode dokumen",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String; percent-encoded by helper 0x76e07c",
        "strictString": true,
        "description": "ID dokumen utuh dari aktivitas. Encoding khusus dilakukan oleh adapter; jangan encode atau mengganti dengan ID bidang."
      }
    ],
    "evidence": {
      "callAddress": "0xd39f1c",
      "source": "analysis/recovered/http-callsite-audit/00d39f1c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-map-getdisclaimer-d3a3c0",
    "label": "Ketentuan penggunaan peta",
    "group": "Peta dan geotag",
    "method": "GET",
    "endpoint": "Map/GetDisclaimer",
    "path": "Map/GetDisclaimer",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd3a3c0",
      "source": "analysis/recovered/http-callsite-audit/00d3a3c0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-mitra-getpenilailist-d3aa20",
    "label": "Daftar penilai tanah",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "Mitra/GetPenilaiList",
    "path": "Mitra/GetPenilaiList",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd3aa20",
      "source": "analysis/recovered/http-callsite-audit/00d3aa20.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-mitra-getkantorppat-d3af08",
    "label": "Kantor layanan PPAT",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "Mitra/GetKantorPPAT",
    "path": "Mitra/GetKantorPPAT",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd3af08",
      "source": "analysis/recovered/http-callsite-audit/00d3af08.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-mitra-getppatlist-d3b428",
    "label": "Daftar PPAT",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "Mitra/GetPPATList?kantorId={value}",
    "path": "Mitra/GetPPATList",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "kantorId",
        "label": "ID kantor",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd3b428",
      "source": "analysis/recovered/http-callsite-audit/00d3b428.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-mitra-getwilayahsurveyor-d3b910",
    "label": "Wilayah surveyor",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "Mitra/GetWilayahSurveyor",
    "path": "Mitra/GetWilayahSurveyor",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd3b910",
      "source": "analysis/recovered/http-callsite-audit/00d3b910.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-mitra-getsurveyorlist-d3be30",
    "label": "Daftar surveyor",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "Mitra/GetSurveyorList?wilayahId={value}",
    "path": "Mitra/GetSurveyorList",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "optionalSession",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "wilayahId",
        "label": "wilayahId",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd3be30",
      "source": "analysis/recovered/http-callsite-audit/00d3be30.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-bhumi-haiiizzzzzzz-d4004c",
    "label": "Sesi peta Bhumi",
    "group": "Peta dan geotag",
    "method": "GET",
    "endpoint": "Bhumi/haiiizzzzzzz",
    "path": "Bhumi/haiiizzzzzzz",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd4004c",
      "source": "analysis/recovered/http-callsite-audit/00d4004c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-kotakkeluarsertifikat-d42bb4",
    "label": "Kotak keluar pembagian sertipikat",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "legacy/KotakKeluarSertifikat",
    "path": "legacy/KotakKeluarSertifikat",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "sertifikatid",
        "label": "sertifikatid",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      },
      {
        "path": "limit",
        "label": "limit",
        "type": "integer",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "int"
      },
      {
        "path": "start",
        "label": "start",
        "type": "integer",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "int"
      },
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd42bb4",
      "source": "analysis/recovered/http-callsite-audit/00d42bb4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-getinfosertifikat-d4340c",
    "label": "Detail sertipikat analog saya",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "legacy/GetInfoSertifikat",
    "path": "legacy/GetInfoSertifikat",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "sertifikatId",
        "label": "sertifikatId",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd4340c",
      "source": "analysis/recovered/http-callsite-audit/00d4340c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-dokumen-generateqrvalue-d43858",
    "label": "Buat nilai QR dokumen",
    "group": "Layanan lainnya",
    "method": "GET",
    "endpoint": "Dokumen/generateQRValue?q={value}",
    "path": "Dokumen/generateQRValue",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "q",
        "label": "q",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd43858",
      "source": "analysis/recovered/http-callsite-audit/00d43858.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-getsertipikatht-d441a4",
    "label": "Sertipikat hak tanggungan saya",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "legacy/GetSertipikatHT",
    "path": "legacy/GetSertipikatHT",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "nikr",
        "label": "NIK akun",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "session",
        "recoveredType": "unknown; Map<String,dynamic> value",
        "sessionKey": "nik",
        "description": "Diambil dari akun yang sedang masuk; bukan NIK pengguna lain."
      }
    ],
    "evidence": {
      "callAddress": "0xd441a4",
      "source": "analysis/recovered/http-callsite-audit/00d441a4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-getsertipikathtdetail-d446dc",
    "label": "Detail hak tanggungan",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "legacy/GetSertipikatHTDetail",
    "path": "legacy/GetSertipikatHTDetail",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "haktanggunganId",
        "label": "haktanggunganId",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd446dc",
      "source": "analysis/recovered/http-callsite-audit/00d446dc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-sertifikattanahnew-d44dc0",
    "label": "Sertipikat tanah saya",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "Legacy/SertifikatTanahNew",
    "path": "Legacy/SertifikatTanahNew",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "session",
        "recoveredType": "unknown; Map<String,dynamic> value",
        "sessionKey": "nik",
        "description": "Diambil dari akun yang sedang masuk; bukan NIK pengguna lain."
      },
      {
        "path": "tipeuser",
        "label": "Tipe pengguna akun",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "session",
        "recoveredType": "unknown; Map<String,dynamic> value",
        "sessionKey": "tipeuser",
        "description": "Berasal dari roleUser pada respons profil akun; dibuktikan parser dan jalur pemanggil sertipikat.",
        "sessionEvidence": {
          "responseKey": "roleUser",
          "parser": "0x6b1e2c -> model+0x13 at0x6b1e7c",
          "caller": "0xd44b04 -> argumentx3 -> query0xd44d94"
        }
      }
    ],
    "evidence": {
      "callAddress": "0xd44dc0",
      "source": "analysis/recovered/http-callsite-audit/00d44dc0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-getsertipikatwakaf-d45354",
    "label": "Sertipikat wakaf saya",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "Legacy/GetSertipikatWakaf",
    "path": "Legacy/GetSertipikatWakaf",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "session",
        "recoveredType": "unknown; Map<String,dynamic> value",
        "sessionKey": "nik",
        "description": "Diambil dari akun yang sedang masuk; bukan NIK pengguna lain."
      }
    ],
    "evidence": {
      "callAddress": "0xd45354",
      "source": "analysis/recovered/http-callsite-audit/00d45354.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-detailberkas-d458c8",
    "label": "Detail berkas SIPENTA",
    "group": "Survei SIPENTA",
    "method": "GET",
    "endpoint": "detailberkas",
    "path": "detailberkas",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "b",
        "label": "b",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd458c8",
      "source": "analysis/recovered/http-callsite-audit/00d458c8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-surveydetail-d49a78",
    "label": "Detail survei",
    "group": "Survei SIPENTA",
    "method": "GET",
    "endpoint": "surveydetail?b={value}&j=5&i={value}",
    "path": "surveydetail",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "b",
        "label": "b",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "j",
        "label": "j",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "5"
      },
      {
        "path": "i",
        "label": "i",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd49a78",
      "source": "analysis/recovered/http-callsite-audit/00d49a78.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-surveydetail-d4db58",
    "label": "Detail survei",
    "group": "Survei SIPENTA",
    "method": "GET",
    "endpoint": "surveydetail?b={value}&j=4&i={value}",
    "path": "surveydetail",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "b",
        "label": "b",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "j",
        "label": "j",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "4"
      },
      {
        "path": "i",
        "label": "i",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd4db58",
      "source": "analysis/recovered/http-callsite-audit/00d4db58.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-surveyfoto-d51eb0",
    "label": "Foto survei",
    "group": "Survei SIPENTA",
    "method": "GET",
    "endpoint": "surveyfoto",
    "path": "surveyfoto",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "b",
        "label": "b",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      },
      {
        "path": "s",
        "label": "s",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      },
      {
        "path": "t",
        "label": "t",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd51eb0",
      "source": "analysis/recovered/http-callsite-audit/00d51eb0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-surveydetail-d523d8",
    "label": "Detail survei",
    "group": "Survei SIPENTA",
    "method": "GET",
    "endpoint": "surveydetail?b={value}&j=3&i={value}",
    "path": "surveydetail",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "b",
        "label": "b",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "j",
        "label": "j",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "3"
      },
      {
        "path": "i",
        "label": "i",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd523d8",
      "source": "analysis/recovered/http-callsite-audit/00d523d8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-surveydetail-d5f088",
    "label": "Detail survei",
    "group": "Survei SIPENTA",
    "method": "GET",
    "endpoint": "surveydetail?b={value}&j=2&i={value}",
    "path": "surveydetail",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "b",
        "label": "b",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "j",
        "label": "j",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "2"
      },
      {
        "path": "i",
        "label": "i",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd5f088",
      "source": "analysis/recovered/http-callsite-audit/00d5f088.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-surveydetail-d5f4ec",
    "label": "Detail survei",
    "group": "Survei SIPENTA",
    "method": "GET",
    "endpoint": "surveydetail?b={value}&j=1&i={value}",
    "path": "surveydetail",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "b",
        "label": "b",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "j",
        "label": "j",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "1"
      },
      {
        "path": "i",
        "label": "i",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd5f4ec",
      "source": "analysis/recovered/http-callsite-audit/00d5f4ec.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-common-provinsi-d61b10",
    "label": "Daftar provinsi",
    "group": "Layanan dan wilayah",
    "method": "GET",
    "endpoint": "common/provinsi",
    "path": "common/provinsi",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "application",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xd61b10",
      "source": "analysis/recovered/http-callsite-audit/00d61b10.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-surveydetail-d65248",
    "label": "Detail survei",
    "group": "Survei SIPENTA",
    "method": "GET",
    "endpoint": "surveydetail?b={value}&j=6&i={value}",
    "path": "surveydetail",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "b",
        "label": "b",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "j",
        "label": "j",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "6"
      },
      {
        "path": "i",
        "label": "i",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd65248",
      "source": "analysis/recovered/http-callsite-audit/00d65248.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-survey-d679e8",
    "label": "Daftar survei",
    "group": "Survei SIPENTA",
    "method": "GET",
    "endpoint": "survey?b={value}&j=0",
    "path": "survey",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "b",
        "label": "b",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "j",
        "label": "j",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": "0"
      }
    ],
    "evidence": {
      "callAddress": "0xd679e8",
      "source": "analysis/recovered/http-callsite-audit/00d679e8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-berkas-d70234",
    "label": "Daftar berkas SIPENTA (GET dengan body)",
    "group": "Survei SIPENTA",
    "method": "GET",
    "endpoint": "berkas",
    "path": "berkas",
    "serviceId": "sipenta",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "json",
    "recoveredTransport": "GET data map; distinct from Ikc/query",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "nik",
        "label": "NIK akun",
        "type": "string",
        "location": "body",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd70234",
      "source": "analysis/recovered/http-callsite-audit/00d70234.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-getpersilidbynibel-d74b90",
    "label": "Cari bidang dengan NIB elektronik",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "legacy/GetPersilIdByNibel?nibel={value}&kodehat=",
    "path": "legacy/GetPersilIdByNibel",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "nibel",
        "label": "nibel",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "kodehat",
        "label": "kodehat",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": ""
      }
    ],
    "evidence": {
      "callAddress": "0xd74b90",
      "source": "analysis/recovered/http-callsite-audit/00d74b90.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-getpersilid-d74e4c",
    "label": "Cari identitas bidang",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "legacy/GetPersilId?jenishak={value}&nomorhak={value}&kantorid={value}&wilayahid={value}",
    "path": "legacy/GetPersilId",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "jenishak",
        "label": "jenishak",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "nomorhak",
        "label": "nomorhak",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "kantorid",
        "label": "kantorid",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "wilayahid",
        "label": "wilayahid",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd74e4c",
      "source": "analysis/recovered/http-callsite-audit/00d74e4c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-wilayah-d752bc",
    "label": "Referensi wilayah kantor",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "legacy/Wilayah?kantorid={value}&nama=",
    "path": "legacy/Wilayah",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "kantorid",
        "label": "kantorid",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      },
      {
        "path": "nama",
        "label": "nama",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "constant",
        "recoveredType": "String in constructed URL; input type not inferred",
        "default": ""
      }
    ],
    "evidence": {
      "callAddress": "0xd752bc",
      "source": "analysis/recovered/http-callsite-audit/00d752bc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-api-antrian-d89cb4",
    "label": "Cari jadwal antrean",
    "group": "Antrean",
    "method": "GET",
    "endpoint": "api/antrian",
    "path": "api/antrian",
    "serviceId": "antrian",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "lokasi",
        "label": "lokasi",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      },
      {
        "path": "tanggal",
        "label": "tanggal",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd89cb4",
      "source": "analysis/recovered/http-callsite-audit/00d89cb4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-items-lokasi-d8a0dc",
    "label": "Lokasi layanan antrean",
    "group": "Antrean",
    "method": "GET",
    "endpoint": "items/lokasi",
    "path": "items/lokasi",
    "serviceId": "directus",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "filter[kantor]",
        "label": "filter[kantor]",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd8a0dc",
      "source": "analysis/recovered/http-callsite-audit/00d8a0dc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-dokumen-getspsdokumen-d94aac",
    "label": "Dokumen surat perintah setor",
    "group": "Layanan lainnya",
    "method": "GET",
    "endpoint": "Dokumen/GetSpsDokumen",
    "path": "Dokumen/GetSpsDokumen",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "dokumenid",
        "label": "dokumenid",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xd94aac",
      "source": "analysis/recovered/http-callsite-audit/00d94aac.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-api-geocode-d9d550",
    "label": "Cari lokasi di Bhumi",
    "group": "Peta dan geotag",
    "method": "GET",
    "endpoint": "${Wxb.OYi}api/geocode?keysearch={value}",
    "path": "api/geocode",
    "serviceId": "bhumi",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "runtime base plus known URL/query structure",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "keysearch",
        "label": "keysearch",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xd9d550",
      "source": "analysis/recovered/http-callsite-audit/00d9d550.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-account-checkverifstatusperorangan-da15dc",
    "label": "Status verifikasi akun saya",
    "group": "Akun dan verifikasi",
    "method": "GET",
    "endpoint": "account/CheckVerifStatusPerorangan",
    "path": "account/CheckVerifStatusPerorangan",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "no explicit caller query map, data or URL query",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [],
    "evidence": {
      "callAddress": "0xda15dc",
      "source": "analysis/recovered/http-callsite-audit/00da15dc.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-lokasibidang-getbypersilid-dad6f4",
    "label": "Lokasi bidang menurut ID",
    "group": "Peta dan geotag",
    "method": "GET",
    "endpoint": "LokasiBidang/GetByPersilId",
    "path": "LokasiBidang/GetByPersilId",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "persilId",
        "label": "persilId",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xdad6f4",
      "source": "analysis/recovered/http-callsite-audit/00dad6f4.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-api-geocode-db21c0",
    "label": "Cari lokasi di Bhumi",
    "group": "Peta dan geotag",
    "method": "GET",
    "endpoint": "${Wxb.OYi}api/geocode?keysearch={value}",
    "path": "api/geocode",
    "serviceId": "bhumi",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "runtime base plus known URL/query structure",
    "auth": "none",
    "authenticated": false,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Kontrak sesi atau transport layanan ini belum diaktifkan pada adapter web.",
    "fields": [
      {
        "path": "keysearch",
        "label": "keysearch",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xdb21c0",
      "source": "analysis/recovered/http-callsite-audit/00db21c0.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-getparcelboundarybyid-dbaeb8",
    "label": "Batas bidang tanah",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "legacy/GetParcelBoundaryById?persilid={value}",
    "path": "legacy/GetParcelBoundaryById",
    "serviceId": "main",
    "serviceMapping": "reviewed primary adapter",
    "encoding": "none",
    "recoveredTransport": "query encoded directly in constructed URL",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Bentuk request tersedia untuk uji langsung; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "persilid",
        "label": "persilid",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String in constructed URL; input type not inferred"
      }
    ],
    "evidence": {
      "callAddress": "0xdbaeb8",
      "source": "analysis/recovered/http-callsite-audit/00dbaeb8.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-legacy-pratinjaupengguna-dbbd6c",
    "label": "Pratinjau penerima pembagian",
    "group": "Sertipikat dan akta",
    "method": "GET",
    "endpoint": "legacy/PratinjauPengguna",
    "path": "legacy/PratinjauPengguna",
    "serviceId": "main",
    "serviceMapping": "static service family; execution disabled",
    "encoding": "none",
    "recoveredTransport": "query map Ikc encoded and appended to URI by shared request-options builder",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": false,
    "supported": false,
    "inspectOnly": true,
    "readiness": "inspect_only",
    "reason": "Tercatat dari audit APK; adapter eksekusi operasi ini belum diaktifkan.",
    "fields": [
      {
        "path": "username",
        "label": "username",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": false,
        "source": "input",
        "recoveredType": "unknown; Map<String,dynamic> value"
      }
    ],
    "evidence": {
      "callAddress": "0xdbbd6c",
      "source": "analysis/recovered/http-callsite-audit/00dbbd6c.asm.txt"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "get-dokumen-getdokumen-d3e240",
    "label": "Buka dokumen SPS",
    "group": "Berkas",
    "method": "GET",
    "endpoint": "dokumen/GetDokumen",
    "path": "dokumen/GetDokumen",
    "serviceId": "main",
    "serviceMapping": "audited separate document viewer on the fixed main origin",
    "encoding": "none",
    "recoveredTransport": "HttpClient GET; stored token; PDF bytes",
    "clientProfile": "sps-document-viewer",
    "auth": "session",
    "authenticated": true,
    "effect": "read",
    "mutates": false,
    "requiresConfirmation": false,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak unduhan SPS dipulihkan dari viewer APK; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "id",
        "label": "ID SPS",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String?",
        "description": "spsId dari baris metadata SPS yang dipilih."
      },
      {
        "path": "tipe",
        "label": "Alias dokumen SPS",
        "type": "string",
        "location": "query",
        "required": "unknown",
        "clientRequired": true,
        "source": "input",
        "recoveredType": "String?",
        "description": "alias dari baris metadata SPS, bukan label tipe yang ditampilkan."
      }
    ],
    "evidence": {
      "callAddress": "0xd3e240",
      "source": "analysis/recovered/sps-document-flow.json",
      "contractSource": "supplemental separate viewer"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "delete-collection-deletepersilcollectiongroup-path-argument-1-da9450",
    "label": "Hapus grup koleksi bidang",
    "group": "Koleksi",
    "method": "DELETE",
    "endpoint": "Collection/DeletePersilCollectionGroup/{path_argument_1}",
    "path": "Collection/DeletePersilCollectionGroup/{path_argument_1}",
    "serviceId": "main",
    "serviceMapping": "audited supplemental main-session group action",
    "encoding": "none",
    "recoveredTransport": "DELETE with interpolated ID; no caller body/query; ordinary stored-account main client",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak DELETE dan respons bertipe dipulihkan dari APK; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "path_argument_1",
        "label": "ID grup",
        "type": "string",
        "strictString": true,
        "location": "path",
        "required": "unknown",
        "clientRequired": true,
        "allowEmpty": true,
        "source": "input",
        "recoveredType": "String; nullable UI ID falls back to ''",
        "description": "ID asli tanpa trim; nilai null model diubah caller menjadi ''. Browser meng-encode sebagai satu segmen dan menolak dot-path; byte escaping transport native belum dibuktikan."
      }
    ],
    "evidence": {
      "callAddress": "0xda9450",
      "source": "analysis/recovered/collection-group-delete/flow.json",
      "nativeProofSha256": "995bf8791fef83c733f2d13379a24dcc3443ac8be5090c952a7154199e8a1443",
      "contractSource": "supplemental audited group DELETE"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "delete-collection-deletepersilcollectionfromgroup-path-argument-1-da7d60",
    "label": "Lepas koleksi dari grup",
    "group": "Koleksi",
    "method": "DELETE",
    "endpoint": "Collection/DeletePersilCollectionFromGroup/{path_argument_1}",
    "path": "Collection/DeletePersilCollectionFromGroup/{path_argument_1}",
    "serviceId": "main",
    "serviceMapping": "audited supplemental main-session group action",
    "encoding": "none",
    "recoveredTransport": "DELETE with interpolated ID; no caller body/query; ordinary stored-account main client",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak DELETE dan respons bertipe dipulihkan dari APK; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "path_argument_1",
        "label": "ID koleksi",
        "type": "string",
        "strictString": true,
        "location": "path",
        "required": "unknown",
        "clientRequired": true,
        "allowEmpty": true,
        "source": "input",
        "recoveredType": "String; nullable UI ID falls back to ''",
        "description": "ID asli tanpa trim; nilai null model diubah caller menjadi ''. Browser meng-encode sebagai satu segmen dan menolak dot-path; byte escaping transport native belum dibuktikan."
      }
    ],
    "evidence": {
      "callAddress": "0xda7d60",
      "source": "analysis/recovered/collection-group-move/flow.json",
      "nativeProofSha256": "43b59a45774524a298232e8dcb667284211bf8481886c54de48ea77ab825425f",
      "contractSource": "supplemental audited group DELETE"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "delete-collection-deletecollectionpersil-path-argument-1-da7530",
    "label": "Hapus koleksi bidang",
    "group": "Koleksi",
    "method": "DELETE",
    "endpoint": "Collection/DeleteCollectionPersil/{path_argument_1}",
    "path": "Collection/DeleteCollectionPersil/{path_argument_1}",
    "serviceId": "main",
    "serviceMapping": "audited supplemental main-session collection-item action",
    "encoding": "none",
    "recoveredTransport": "DELETE with interpolated cached collection row ID; no caller body/query/files",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak hapus koleksi dan respons bertipe dipulihkan dari APK; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "path_argument_1",
        "label": "ID koleksi",
        "type": "string",
        "strictString": true,
        "location": "path",
        "required": "unknown",
        "clientRequired": true,
        "allowEmpty": true,
        "source": "input",
        "recoveredType": "String from first matched cached collection row",
        "description": "ID baris koleksi persis, bukan contentId. String kosong dipertahankan. Browser meng-encode satu segmen dan menolak dot-path; final escaping native belum dibuktikan."
      }
    ],
    "evidence": {
      "callAddress": "0xda7530",
      "source": "analysis/recovered/collection-item-delete/flow.json",
      "nativeProofSha256": "a88478e6e4865f778b6821062623139f8fcbf516bba4467197f14a6cb734a97d",
      "contractSource": "supplemental audited collection-item DELETE"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "delete-collection-deletecollectionberkas-path-argument-1-d92888",
    "label": "Hapus koleksi berkas",
    "group": "Koleksi",
    "method": "DELETE",
    "endpoint": "Collection/DeleteCollectionBerkas/{path_argument_1}",
    "path": "Collection/DeleteCollectionBerkas/{path_argument_1}",
    "serviceId": "main",
    "serviceMapping": "audited supplemental main-session collection-item action",
    "encoding": "none",
    "recoveredTransport": "DELETE with interpolated cached collection row ID; no caller body/query/files",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak hapus koleksi dan respons bertipe dipulihkan dari APK; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "path_argument_1",
        "label": "ID koleksi",
        "type": "string",
        "strictString": true,
        "location": "path",
        "required": "unknown",
        "clientRequired": true,
        "allowEmpty": true,
        "source": "input",
        "recoveredType": "String from first matched cached collection row",
        "description": "ID baris koleksi persis, bukan contentId. String kosong dipertahankan. Browser meng-encode satu segmen dan menolak dot-path; final escaping native belum dibuktikan."
      }
    ],
    "evidence": {
      "callAddress": "0xd92888",
      "source": "analysis/recovered/collection-item-delete/flow.json",
      "nativeProofSha256": "a88478e6e4865f778b6821062623139f8fcbf516bba4467197f14a6cb734a97d",
      "contractSource": "supplemental audited collection-item DELETE"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  },
  {
    "id": "put-collection-editcollectionpersil-da839c",
    "label": "Edit caption koleksi",
    "group": "Koleksi",
    "method": "PUT",
    "endpoint": "Collection/EditCollectionPersil",
    "path": "Collection/EditCollectionPersil",
    "serviceId": "main",
    "serviceMapping": "audited supplemental main-session collection-item action",
    "encoding": "multipart",
    "recoveredTransport": "PUT with FormData fields id then caption; ordinary stored-account main client",
    "auth": "session",
    "authenticated": true,
    "effect": "write",
    "mutates": true,
    "requiresConfirmation": true,
    "enabled": true,
    "supported": true,
    "inspectOnly": false,
    "readiness": "ready_unverified",
    "reason": "Kontrak edit caption dan respons bertipe dipulihkan dari APK; penerimaan server belum diverifikasi.",
    "fields": [
      {
        "path": "id",
        "label": "ID koleksi",
        "type": "string",
        "strictString": true,
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "allowEmpty": true,
        "source": "input",
        "recoveredType": "String; caller row.id ?? ''",
        "description": "ID baris koleksi persis, bukan contentId atau ID bidang."
      },
      {
        "path": "caption",
        "label": "Caption",
        "type": "string",
        "strictString": true,
        "location": "body",
        "required": "unknown",
        "clientRequired": true,
        "allowEmpty": true,
        "source": "input",
        "recoveredType": "String",
        "description": "Caption mengganti title. UI native memangkas dan mengabaikan caption kosong; service tidak memangkas atau mengulangi gate kosong sehingga adapter mempertahankan String mentah."
      }
    ],
    "evidence": {
      "callAddress": "0xda839c",
      "source": "analysis/recovered/collection-item-edit/flow.json",
      "nativeProofSha256": "eabdaed76d862c8a5dd6a8feb1d927233e18a5755263c25614ff04fe3f86d4c8",
      "contractSource": "supplemental audited collection-item PUT"
    },
    "serverRequiredness": "unknown",
    "serverAcceptance": "untested"
  }
];
// Appended to generated operationData/serviceData by build-operations.py.
function freezeDeep(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}
export const SERVICES = freezeDeep(serviceData);
export const OPERATIONS = freezeDeep(operationData);
const byId = new Map(OPERATIONS.map(operation => [operation.id, operation]));
const collectionDeletePaths = Object.freeze({
  'delete-collection-deletepersilcollectiongroup-path-argument-1-da9450': 'Collection/DeletePersilCollectionGroup/',
  'delete-collection-deletepersilcollectionfromgroup-path-argument-1-da7d60': 'Collection/DeletePersilCollectionFromGroup/',
  'delete-collection-deletecollectionpersil-path-argument-1-da7530': 'Collection/DeleteCollectionPersil/',
  'delete-collection-deletecollectionberkas-path-argument-1-d92888': 'Collection/DeleteCollectionBerkas/',
});
export function getOperation(id) { return byId.get(id) ?? null; }
export function getPublicCatalog() {
  return OPERATIONS.map(({ evidence, recoveredTransport, serviceMapping, ...operation }) => structuredClone({
    ...operation,
    fields: operation.fields.map(({ sessionEvidence, ...field }) => field),
  }));
}
function fail(code, message, status = 400) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.statusCode = status;
  throw error;
}
function sessionValue(context, key) {
  const user = context.user ?? {};
  if (key === 'nik') return context.nik ?? user.nomorIndukKependudukan ?? user.nik ?? user.Nik;
  if (key === 'username') return context.username ?? user.username;
  if (key === 'tipeuser') return context.tipeuser ?? user.roleUser ?? user.tipeuser;
  return undefined;
}
function validateValue(field, value, operationId) {
  if (field.type === 'array') {
    // This is the only executable nested model. Do not turn the registry into
    // a generic JSON passthrough for unrecovered objects or other operations.
    if (operationId !== 'post-infolayanan-simulasitipe2-da3490' || field.path !== 'data' || field.arraySchema !== 'information-simulation-type2') fail('FIELD_SHAPE_UNSUPPORTED', 'Model bertingkat ini belum didukung oleh adapter.');
    if (!Array.isArray(value) || value.length < field.minItems || value.length > field.maxItems) fail('INVALID_FIELD', `${field.label} harus berisi ${field.minItems} sampai ${field.maxItems} baris.`);
    const fields = field.items.fields;
    const keys = new Set(fields.map(item => item.path));
    return Array.from({ length: value.length }, (_, index) => {
      if (!Object.hasOwn(value, index)) fail('INVALID_FIELD', `${field.label} tidak boleh memiliki baris kosong.`);
      const row = value[index];
      if (!row || typeof row !== 'object' || Array.isArray(row) || ![Object.prototype, null].includes(Object.getPrototypeOf(row))) fail('INVALID_FIELD', `${field.label} baris ${index + 1} harus berbentuk objek.`);
      if (Reflect.ownKeys(row).some(key => typeof key !== 'string' || !keys.has(key))) fail('UNKNOWN_FIELD', `${field.label} baris ${index + 1} mengandung field di luar kontrak.`);
      const prepared = Object.create(null);
      for (const child of fields) {
        if (!Object.hasOwn(row, child.path) || row[child.path] == null || row[child.path] === '' && !child.allowEmpty) fail('FIELD_REQUIRED', `${child.label} pada baris ${index + 1} diperlukan.`);
        prepared[child.path] = validateValue(child, row[child.path], operationId);
      }
      return prepared;
    });
  }
  if (field.strictString && typeof value !== 'string') fail('INVALID_FIELD', `${field.label} harus berupa teks.`);
  if (field.type === 'boolean') {
    if (value === true || value === false) return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    fail('INVALID_FIELD', `${field.label} harus bernilai benar atau salah.`);
  }
  if (field.type === 'number' || field.type === 'integer') {
    if (field.strictNumber && typeof value !== 'number') fail('INVALID_FIELD', `${field.label} harus berupa angka JSON.`);
    if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '') fail('INVALID_FIELD', `${field.label} harus berupa angka.`);
    const n = Number(value);
    if (!Number.isFinite(n) || (field.type === 'integer' && !Number.isInteger(n))) fail('INVALID_FIELD', `${field.label} bukan angka yang valid.`);
    if (field.minimum != null && n < field.minimum || field.maximum != null && n > field.maximum) fail('INVALID_FIELD', `${field.label} berada di luar rentang yang didukung.`);
    return n;
  }
  if (typeof value !== 'string' && typeof value !== 'number') fail('INVALID_FIELD', `${field.label} harus berupa teks.`);
  const text = String(value);
  if (text.length > 16000 || text.includes('\0')) fail('INVALID_FIELD', `${field.label} terlalu panjang atau mengandung karakter yang tidak didukung.`);
  if (field.format === 'decimal-coordinate') {
    if (!/^[+-]?\d+(?:\.\d+)?$/.test(text) || !Number.isFinite(Number(text))) fail('INVALID_COORDINATE', `${field.label} harus berupa angka desimal tanpa pemisah ribuan.`);
    const max = field.path === 'Lat' ? 90 : 180;
    if (Math.abs(Number(text)) > max) fail('INVALID_COORDINATE', `${field.label} berada di luar rentang koordinat.`);
  }
  return text;
}
/** Prepare only allowlisted values. No network access or credentials belong here.
 * Actual multipart file objects are separately validated/attached by the backend.
 */
export function prepareOperation(id, params = {}, context = {}) {
  const operation = getOperation(id);
  if (!operation) fail('UNKNOWN_OPERATION', 'Operasi tidak ditemukan.', 404);
  if (operation.readiness === 'dedicated_login') fail('DEDICATED_LOGIN_REQUIRED', operation.reason, 422);
  if (!operation.enabled) fail('OPERATION_INSPECT_ONLY', operation.reason, 422);
  if (operation.auth === 'session' && !context.authenticated) fail('LOGIN_REQUIRED', 'Masuk dengan akun Anda untuk menjalankan operasi ini.', 401);
  if (operation.auth === 'application' && !context.applicationConfigured) fail('APPLICATION_AUTH_UNAVAILABLE', 'Konfigurasi autentikasi layanan wilayah belum tersedia di server lokal.', 503);
  if (!params || typeof params !== 'object' || Array.isArray(params)) fail('INVALID_PARAMETERS', 'Parameter harus berbentuk objek.');
  const allowed = new Map(operation.fields.map(field => [field.path, field]));
  for (const key of Object.keys(params)) {
    if (!allowed.has(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) fail('UNKNOWN_FIELD', `Parameter ${key} tidak termasuk kontrak operasi.`);
    if (allowed.get(key).type === 'file') fail('FILE_TRANSPORT_REQUIRED', 'Kirim file melalui multipart, bukan nilai JSON.');
  }
  if (Object.hasOwn(collectionDeletePaths, operation.id)) {
    if (!Object.hasOwn(params, 'path_argument_1') || params.path_argument_1 == null) fail('FIELD_REQUIRED', 'ID untuk aksi koleksi harus disediakan secara eksplisit.');
    const suppliedId = validateValue(operation.fields[0], params.path_argument_1, operation.id);
    if (suppliedId === '.' || suppliedId === '..') fail('INVALID_FIELD', 'ID tidak boleh berupa segmen dot-path.');
    // A browser adapter guard: keep every supplied ID inside one path segment.
    // The APK interpolates the raw ID; final native transport escaping is unproved.
    const segment = encodeURIComponent(suppliedId.toWellFormed()).replace(/[!'()*]/g, character => '%' + character.charCodeAt(0).toString(16).toUpperCase());
    return { operation, service: SERVICES.main, serviceId: 'main', method: 'DELETE', path: collectionDeletePaths[operation.id] + segment, query: {}, body: {}, encoding: 'none', auth: 'session', clientProfile: 'main', effect: 'write', files: [], requiresConfirmation: true };
  }
  if (operation.clientProfile === 'queue-read') {
    const detail = operation.id === 'get-api-antrian-path-argument-1-d1e130';
    if (!detail && !['get-api-antrian-saya-d1eb1c','get-api-notifikasi-d22468'].includes(operation.id)) fail('QUEUE_READ_SCOPE', 'Operasi antrean tidak sesuai kontrak.', 409);
    const queueId = detail ? params.path_argument_1 : undefined;
    if (detail && (typeof queueId !== 'string' || !queueId.length || queueId.length > 1024)) fail('INVALID_FIELD', 'ID antrean terpilih harus berupa teks yang tersedia.');
    const path = detail ? 'api/antrian/' + encodeURIComponent(queueId.toWellFormed()).replace(/%3A/gi, ':') : operation.path;
    return { operation, service: SERVICES.directus, serviceId: 'directus', method: 'GET', path, queueId, query: {}, body: {}, encoding: 'none', auth: 'session', clientProfile: 'queue-read', effect: 'read', files: [], requiresConfirmation: false };
  }
  const body = Object.create(null);
  const query = Object.create(null);
  const files = operation.fields.filter(field => field.type === 'file').map(field => ({ name: field.path, required: field.clientRequired, accept: field.accept, maxBytes: field.maxBytes }));
  for (const field of operation.fields) {
    if (field.type === 'file') continue;
    let value;
    if (field.source === 'session') {
      const storedSignInNik = field.path === 'Nik' && ['post-collection-addcollectionberkas-d92664','post-collection-addcollectionpersil-daae30'].includes(operation.id);
      if (storedSignInNik) {
        // Native cached user gyb+f, not profile ayb.nomorIdentitas or a browser
        // identity alias. Empty but nonnull String passes the native guard.
        if (Object.hasOwn(params, field.path)) fail('SESSION_IDENTITY_MISMATCH', 'NIK simpan berasal dari sesi masuk dan tidak menerima input browser.', 403);
        value = context.user?.nomorIndukKependudukan;
        if (value === undefined || value === null) fail('SESSION_PROFILE_REQUIRED', 'NIK tidak ditemukan. Silakan login kembali.', 409);
      } else {
        value = sessionValue(context, field.sessionKey);
        if (value === undefined || value === null || String(value).trim() === '') fail('SESSION_PROFILE_REQUIRED', `Profil akun belum menyediakan ${field.label}. Muat ringkasan akun terlebih dahulu.`, 409);
        if (Object.hasOwn(params, field.path) && String(params[field.path]) !== String(value)) fail('SESSION_IDENTITY_MISMATCH', `${field.label} harus berasal dari akun yang sedang masuk.`, 403);
      }
    } else if (field.source === 'constant') {
      value = field.default;
      if (Object.hasOwn(params, field.path) && String(params[field.path]) !== String(value)) fail('FIXED_FIELD', `${field.label} ditetapkan oleh kontrak yang diaudit.`);
    } else value = Object.hasOwn(params, field.path) ? params[field.path] : field.default;
    if (value === undefined || value === null || value === '') {
      if (field.clientRequired && !(value === '' && field.allowEmpty === true)) fail('FIELD_REQUIRED', `${field.label} diperlukan oleh adapter pengujian. Kewajiban server belum diketahui.`);
      if (value === '') (field.location === 'query' ? query : body)[field.path] = '';
      else if (field.preserveNull && field.location === 'body') body[field.path] = null;
      continue;
    }
    const validated = validateValue(field, value, operation.id);
    if (field.location === 'path') fail('PATH_ADAPTER_MISSING', 'Adapter segmen path belum tersedia.', 422);
    (field.location === 'query' ? query : body)[field.path] = validated;
  }
  const service = SERVICES[operation.serviceId];
  if (!service) fail('SERVICE_NOT_MAPPED', 'Layanan operasi belum dipetakan.', 422);
  if (/^[a-z]+:|^\/\/|[?#{}]/i.test(operation.path)) fail('INVALID_REGISTERED_PATH', 'Path registry tidak valid.', 500);
  return { operation, service, serviceId: service.id, method: operation.method, path: operation.path, query, body, encoding: operation.encoding, auth: operation.auth, clientProfile: operation.clientProfile || 'main', effect: operation.effect, files, requiresConfirmation: operation.requiresConfirmation };
}
