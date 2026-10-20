import test from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createCalendarOfficeIdDecoder } from '../private/calendar-reference.mjs';
import { loadConfiguration } from '../private/configuration.mjs';

const fixtureKey = () => Buffer.from('0123456789abcdef');
const fixtureIv = () => Buffer.from('fedcba9876543210');
const encrypt = (value, key = fixtureKey(), iv = fixtureIv()) => {
  const cipher = createCipheriv('aes-128-cbc', key, iv);
  return Buffer.concat([cipher.update(value), cipher.final()]).toString('base64');
};
const invalid = error => error.code === 'INVALID_CALENDAR_OFFICE_REFERENCE'
  && error.message === 'Referensi kantor tidak valid.' && error.cause === undefined;

test('calendar reference decodes the fixed synthetic CBC/PKCS7 vector', () => {
  const decode = createCalendarOfficeIdDecoder(fixtureKey(), fixtureIv());
  assert.equal(decode('c4hPmLHroK9hD1X37BhsVZwPZDFO/OGac0IrYMkFRTc='), 'office-fixture-123');
});

test('decoder owns its private key and IV copies', () => {
  const key = fixtureKey(); const iv = fixtureIv();
  const decode = createCalendarOfficeIdDecoder(key, iv);
  key.fill(0); iv.fill(0);
  assert.equal(decode('c4hPmLHroK9hD1X37BhsVZwPZDFO/OGac0IrYMkFRTc='), 'office-fixture-123');
  assert.deepEqual(Object.keys(decode), []);
});

test('decoded UTF-8 preserves text, empty plaintext and replacement characters', () => {
  const decode = createCalendarOfficeIdDecoder(fixtureKey(), fixtureIv());
  for (const value of ['', 'kantor-uji-\u00e9', 'baris\nberikut']) assert.equal(decode(encrypt(value)), value);
  assert.equal(decode(encrypt(Buffer.from([0x66, 0x80, 0x67]))), 'f\ufffdg');
});

test('malformed or oversized references fail without coercion or echoed input', () => {
  const decode = createCalendarOfficeIdDecoder(fixtureKey(), fixtureIv());
  for (const value of [null, undefined, 123, {}, [], '', 'plain-id', 'abcd', '!!!!', 'YQ==',
    'c4hPmLHroK9hD1X37BhsVZwPZDFO/OGac0IrYMkFRTc=\n', 'A'.repeat(16004)]) {
    assert.throws(() => decode(value), invalid);
  }
});

test('invalid padding becomes a generic reference error', () => {
  const decode = createCalendarOfficeIdDecoder(fixtureKey(), fixtureIv());
  // One truncated encrypted block ends with ordinary plaintext, not valid padding.
  const truncated = Buffer.from('c4hPmLHroK9hD1X37BhsVZwPZDFO/OGac0IrYMkFRTc=', 'base64').subarray(0, 16).toString('base64');
  assert.throws(() => decode(truncated), invalid);
});

test('factory requires exactly two 16-byte buffers', () => {
  for (const [key, iv] of [[null, fixtureIv()], [fixtureKey(), null], ['0123456789abcdef', fixtureIv()],
    [Buffer.alloc(15), fixtureIv()], [fixtureKey(), Buffer.alloc(17)]]) {
    assert.throws(() => createCalendarOfficeIdDecoder(key, iv), error =>
      error.code === 'CALENDAR_REFERENCE_CONFIGURATION_INVALID'
      && error.message === 'Konfigurasi referensi kantor tidak tersedia.');
  }
});

test('verified artifact configuration binds the native calendar literals privately', async () => {
  const config = await loadConfiguration();
  assert.equal(config.configured, true);
  assert.equal(typeof config.calendarOfficeId, 'function');
  const pool = await readFile(new URL('../../analysis/recovered/blutter-unique/pp.txt', import.meta.url), 'utf8');
  const literal = offset => {
    const prefix = `[pp+${offset}] String: `;
    return Buffer.from(JSON.parse(pool.split('\n').find(line => line.startsWith(prefix)).slice(prefix.length)), 'utf8');
  };
  const key = literal('0x20bf8'); const iv = literal('0x20c00');
  try {
    const synthetic = encrypt('fixture-office-not-a-server-id', key, iv);
    assert.equal(config.calendarOfficeId(synthetic), 'fixture-office-not-a-server-id');
    assert.throws(() => config.calendarOfficeId('malformed-reference'), invalid);
    assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(config))).sort(), ['configured', 'origin', 'reason']);
    assert.equal(config.tlsOptions('https://example.invalid'), undefined);
  } finally { key.fill(0); iv.fill(0); }
});

test('unavailable artifact configuration does not expose a reference decoder', async () => {
  const config = await loadConfiguration('/missing-artifact-fixture');
  assert.equal(config.configured, false);
  assert.equal(config.calendarOfficeId, undefined);
});
