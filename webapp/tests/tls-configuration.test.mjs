import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfiguration } from '../private/configuration.mjs';

test('verified APK TLS context stays private and is restricted to the exact production origin', async () => {
  const config = await loadConfiguration();
  assert.equal(config.configured, true, 'Run tests with --openssl-legacy-provider and the verified local APK artifacts');
  const options = config.tlsOptions('https://sentuh.atrbpn.go.id');
  assert.ok(options.secureContext);
  assert.equal(typeof config.queueAuthorization, 'function');
  assert.equal(typeof config.bhumiAuthKey, 'function');
  assert.equal(config.bhumiAuthKey().length, 36);
  assert.equal(config.bhumiAuthKey(), config.bhumiAuthKey());
  assert.equal(config.tlsOptions('https://bhumi.atrbpn.go.id'), undefined);
  assert.equal(config.queueTlsOptions('https://aplikasi.atrbpn.go.id').secureContext, options.secureContext);
  for (const origin of ['https://sentuh.atrbpn.go.id', 'https://aplikasi.atrbpn.go.id:444', 'http://aplikasi.atrbpn.go.id', 'https://aplikasi.atrbpn.go.id.evil.invalid']) assert.equal(config.queueTlsOptions(origin), undefined);
  assert.equal(config.tlsOptions('https://aplikasi.atrbpn.go.id'), undefined);
  assert.deepEqual(Object.keys(options), ['secureContext']);
  for (const origin of ['https://sentuh-dev.atrbpn.go.id', 'https://antre.atrbpn.go.id', 'http://sentuh.atrbpn.go.id', 'https://sentuh.atrbpn.go.id:8443', 'https://sentuh.atrbpn.go.id.evil.invalid']) {
    assert.equal(config.tlsOptions(origin), undefined);
  }
  options.rejectUnauthorized = false;
  assert.equal(config.tlsOptions('https://sentuh.atrbpn.go.id').rejectUnauthorized, undefined);
  assert.deepEqual(Object.keys(JSON.parse(JSON.stringify(config))).sort(), ['configured', 'origin', 'reason']);
});

test('missing artifacts provide neither application authorization nor client TLS identity', async () => {
  const config = await loadConfiguration('/missing-artifact-fixture');
  assert.equal(config.configured, false);
  assert.equal(config.applicationAuthorization(), null);
  assert.equal(config.tlsOptions, undefined);
});
