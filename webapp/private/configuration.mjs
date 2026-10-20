import { readFile } from 'node:fs/promises';
import { createHash, createDecipheriv, X509Certificate } from 'node:crypto';
import { createSecureContext, rootCertificates } from 'node:tls';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCalendarOfficeIdDecoder } from './calendar-reference.mjs';

export const APP_VERSION = '6.1.5';
export const MAIN_ORIGIN = 'https://sentuh.atrbpn.go.id/';
const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LIB_HASH = 'bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683';
const POOL_HASH = '871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04';
const CA_FINGERPRINT = 'f677e842dc59c9676fc3510c3849252fe6533861963c5dfc38c7083c4952b208';
const PFX_HASH = '71823d575ec106d0a155217e771cb0913158872987db0f866a13003a46988b1d';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

// This stays outside the public file allowlist. The recovered value is never written,
// logged, returned in state/catalog, or used as a user session token.
export async function loadConfiguration(root = workspace) {
  try {
    const [library, poolBytes] = await Promise.all([
      readFile(path.join(root, 'analysis/unpacked/apk/config.arm64_v8a/lib/arm64-v8a/libapp.so')),
      readFile(path.join(root, 'analysis/recovered/blutter-unique/pp.txt')),
    ]);
    if (digest(library) !== LIB_HASH || digest(poolBytes) !== POOL_HASH) throw new Error('ARTIFACT_MISMATCH');
    const lines = poolBytes.toString('utf8').split('\n');
    const table = (offset, length) => {
      const line = lines.find(line => line.startsWith(`[pp+${offset}] List<int>(${length}) [`));
      if (!line) throw new Error('CONFIGURATION_MISSING');
      const match = line.match(/List<int>\(\d+\) \[([^\]]+)\]/);
      const values = match?.[1].split(',').map(value => Number(value.trim()));
      if (values?.length !== length || values.some(value => !Number.isInteger(value) || value < 0 || value > 0xffffffff)) throw new Error('CONFIGURATION_INVALID');
      return values;
    };
    const xor = (leftOffset, rightOffset, length) => {
      const left = table(leftOffset, length); const right = table(rightOffset, length);
      try {
        const units = left.map((value, index) => (value ^ right[index]) >>> 0);
        try {
          if (units.some(value => value < 33 || value > 126)) throw new Error('CONFIGURATION_INVALID');
          return Buffer.from(units);
        } finally { units.fill(0); }
      } finally { left.fill(0); right.fill(0); }
    };
    const appBytes = xor('0xcb90', '0xcb98', 32);
    const applicationAuthorization = `AtrBpn ${appBytes.toString('ascii')}`;
    appBytes.fill(0);

    // The public trust anchor and production client identity are bundled by this
    // exact APK. Never fetch a new trust anchor from the network or accept an
    // arbitrary certificate callback. The decrypted client material is neither
    // persisted nor exposed by public state, and only OpenSSL's context survives.
    const caStart = 0x72f1f;
    const caEnd = library.indexOf('-----END CERTIFICATE-----', caStart);
    if (caEnd < caStart || caEnd - caStart > 4096) throw new Error('TLS_CONFIGURATION_INVALID');
    const ca = library.subarray(caStart, caEnd + '-----END CERTIFICATE-----'.length);
    const certificate = new X509Certificate(ca);
    if (digest(certificate.raw) !== CA_FINGERPRINT) throw new Error('TLS_CONFIGURATION_INVALID');
    const buffers = [];
    const keep = bytes => { buffers.push(bytes); return bytes; };
    let secureContext;
    try {
      const encrypted = keep(Buffer.from(keep(xor('0x10a88', '0x10a90', 1984)).toString('ascii'), 'base64'));
      const key = keep(xor('0x109d8', '0x109e0', 16));
      const iv = keep(xor('0x109f8', '0x10a00', 16));
      const password = keep(xor('0x10a48', '0x10a50', 11));
      const decipher = createDecipheriv('aes-128-cbc', key, iv);
      const plain = keep(Buffer.concat([keep(decipher.update(encrypted)), keep(decipher.final())]));
      const pfx = keep(Buffer.from(plain.toString('utf8'), 'base64'));
      if (digest(pfx) !== PFX_HASH) throw new Error('TLS_CONFIGURATION_INVALID');
      // Native 6c5cb8 calls SecurityContext_TrustBuiltinRoots before d0b680
      // imports the APK anchor. Keep the runtime trust roots as well as that
      // anchor; supplying only ca replaces Node's default roots entirely.
      secureContext = createSecureContext({ ca: [...rootCertificates, ca], pfx, passphrase: password.toString('utf8'), minVersion: 'TLSv1.2' });
    } finally { for (const bytes of buffers) bytes.fill(0); }
    let queueBearer;
    const queueAuthorization = () => {
      // TRb.Xhj initializer: 6bb9f4 -> 6bbac8, mapper 6bbb74. Derive only
      // when a bounded own-account queue GET is actually prepared server-side.
      if (queueBearer === undefined) {
        const bytes = xor('0xc6e8', '0xc6f0', 32);
        try { queueBearer = `Bearer ${bytes.toString('ascii')}`; }
        finally { bytes.fill(0); }
      }
      return queueBearer;
    };
    let bhumiKey;
    const bhumiAuthKey = () => {
      // Wxb.xYi 929378 forwards to _Xxb.xYi 9293c0. Its mapper 92946c
      // XORs the two 36-entry pools before String helper 42cfb0.
      // This value belongs only to the fixed server-side Bhumi WMS client.
      if (bhumiKey === undefined) {
        const bytes = xor('0x3cf48', '0x3cf50', 36);
        try { bhumiKey = bytes.toString('ascii'); }
        finally { bytes.fill(0); }
      }
      return bhumiKey;
    };
    let calendarReferenceDecoder;
    const calendarOfficeId = ciphertext => {
      if (!calendarReferenceDecoder) {
        const buffers = [];
        try {
          const literal = offset => {
            const prefix = `[pp+${offset}] String: `;
            const line = lines.find(value => value.startsWith(prefix));
            const value = line && JSON.parse(line.slice(prefix.length));
            if (typeof value !== 'string' || !/^[\x00-\x7f]{16}$/.test(value)) throw new Error();
            const bytes = Buffer.from(value, 'utf8');
            buffers.push(bytes);
            return bytes;
          };
          calendarReferenceDecoder = createCalendarOfficeIdDecoder(literal('0x20bf8'), literal('0x20c00'));
        } catch {
          throw Object.assign(new Error('Konfigurasi referensi kantor tidak tersedia.'), {
            code: 'CALENDAR_REFERENCE_CONFIGURATION_INVALID',
          });
        } finally { for (const bytes of buffers) bytes.fill(0); }
      }
      return calendarReferenceDecoder(ciphertext);
    };
    return Object.freeze({ configured: true, origin: MAIN_ORIGIN,
      reason: 'Konfigurasi dan TLS dari artefak terverifikasi tersedia; penerimaan akun oleh server belum diuji.',
      applicationAuthorization: () => applicationAuthorization,
      queueAuthorization,
      bhumiAuthKey,
      queueTlsOptions: origin => origin === 'https://aplikasi.atrbpn.go.id' ? { secureContext } : undefined,
      calendarOfficeId,
      tlsOptions: origin => origin === new URL(MAIN_ORIGIN).origin ? { secureContext } : undefined });
  } catch (error) {
    return Object.freeze({ configured: false, origin: MAIN_ORIGIN,
      reason: error.code === 'ERR_CRYPTO_UNSUPPORTED_OPERATION'
        ? 'Format sertifikat klien APK memerlukan opsi runtime khusus. Jalankan melalui launcher Docker/native yang disediakan.'
        : 'Artefak atau konfigurasi TLS tidak tersedia, tidak valid, atau hash tidak sesuai.', applicationAuthorization: () => null });
  }
}
