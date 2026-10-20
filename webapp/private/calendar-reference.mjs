import { createDecipheriv } from 'node:crypto';

const invalidReference = () => Object.assign(new Error('Referensi kantor tidak valid.'), {
  code: 'INVALID_CALENDAR_OFFICE_REFERENCE',
});

// Native 760034: Base64 ciphertext -> AES/CBC/PKCS7 -> UTF-8 with replacement.
// This module is private. The returned function exposes neither cipher material
// nor the original cryptographic error, which can contain implementation details.
export function createCalendarOfficeIdDecoder(keyBytes, ivBytes) {
  if (!Buffer.isBuffer(keyBytes) || !Buffer.isBuffer(ivBytes)
    || keyBytes.length !== 16 || ivBytes.length !== 16) {
    throw Object.assign(new Error('Konfigurasi referensi kantor tidak tersedia.'), {
      code: 'CALENDAR_REFERENCE_CONFIGURATION_INVALID',
    });
  }
  const key = Buffer.from(keyBytes);
  const iv = Buffer.from(ivBytes);
  return ciphertext => {
    let encrypted;
    let plain;
    let first;
    let last;
    try {
      // Local bounds and canonical Base64 validation are stricter than a general
      // Node decoder, which would silently discard malformed characters.
      if (typeof ciphertext !== 'string' || !ciphertext.length || ciphertext.length > 16000
        || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(ciphertext)) {
        throw invalidReference();
      }
      encrypted = Buffer.from(ciphertext, 'base64');
      if (!encrypted.length || encrypted.length % 16 || encrypted.toString('base64') !== ciphertext) {
        throw invalidReference();
      }
      const cipher = createDecipheriv('aes-128-cbc', key, iv);
      first = cipher.update(encrypted);
      last = cipher.final();
      plain = Buffer.concat([first, last]);
      return plain.toString('utf8');
    } catch {
      throw invalidReference();
    } finally {
      encrypted?.fill(0);
      first?.fill(0);
      last?.fill(0);
      plain?.fill(0);
    }
  };
}
