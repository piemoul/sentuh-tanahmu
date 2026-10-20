// Explicit, manual connection check. Never signs in or reads browser sessions.
// Usage: node --openssl-legacy-provider scripts/probe-upstream.mjs [--baseline]
import { loadConfiguration } from '../webapp/private/configuration.mjs';
import { ApiClient, fetchTransport } from '../webapp/private/api-client.mjs';

const baseline = process.argv.includes('--baseline');
const configuration = await loadConfiguration();
const records = [];
const client = new ApiClient(configuration, {
  ...(baseline ? { transport: fetchTransport } : {}),
  log: entry => records.push(entry),
});
let result;
try {
  const response = await client.request({ path: 'auth/signin', method: 'HEAD', auth: 'none', encoding: 'none' });
  result = { httpReceived: true, upstreamStatus: response.status };
} catch (error) {
  result = { httpReceived: Number.isInteger(error.details?.upstreamStatus), code: error.code,
    ...(Number.isInteger(error.details?.upstreamStatus) ? { upstreamStatus: error.details.upstreamStatus } : {}) };
  // HEAD may be rejected by an otherwise reachable endpoint. That is not a
  // failed account login and says nothing about credential acceptance.
  if (!result.httpReceived) process.exitCode = 1;
}
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), mode: baseline ? 'default-system-trust' : 'application-transport',
  method: 'HEAD', accountCredentialsSent: false, applicationAuthorizationSent: false, ...result, records }, null, 2));
