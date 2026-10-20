// Reproducible current manual-form observation, never a native-parity assertion.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {OPERATIONS, prepareOperation} from '../../webapp/private/operations.mjs';

const source = fs.readFileSync(new URL('../../webapp/app.js', import.meta.url), 'utf8');
const lines = source.split(/\r?\n/);
const get = name => {
  const line = lines.find(line => new RegExp(`^(async )?function ${name}\\(`).test(line));
  assert.ok(line, `Missing actual function ${name}`);
  return line;
};
const op = OPERATIONS.find(op => op.endpoint === 'apis/GetDocument');
const profileOp = OPERATIONS.find(op => op.endpoint === 'account/account_summary');
const calls = [], q = ' raw: A +% ';
const cachedAccountSummary = {status: 200, data: {error: false, data: {nama: 'Synthetic current account name'}}};
const context = vm.createContext({
  currentFlow: () => ({op, tab: {}, key: 'scan:dokumen', def: {title: 'Scan'}}),
  ready: () => true, write: () => false, sessionEpoch: 0, flowPageIndex: 0,
  flowResults: new Map(), render() {}, record() {}, toast() {},
  state: {authenticated: true, operations: OPERATIONS, results: new Map([[profileOp.id, cachedAccountSummary]])},
  api: async (_path, options) => {
    calls.push(options.body);
    return {result: {status: 200, data: null, previewUrl: '/api/preview/synthetic', downloadUrl: '/api/download/synthetic'}};
  },
});
vm.runInContext(get('runFlow'), context);
await context.runFlow({elements: {namedItem: name => ({value: name === 'q' ? q : ''})}});
assert.equal(calls.length, 1, 'This historical probe expects the direct manual form; update its harness if orchestration changes.');
const prepared = prepareOperation(op.id, calls[0].values, {authenticated: true});
const viewContext = vm.createContext({nativeListResultView: () => null, dataItems: () => null, esc: value => String(value ?? ''), icon: () => '', json: JSON.stringify});
vm.runInContext(['redact', 'result', 'flowResultView'].map(get).join('\n'), viewContext);
const html = viewContext.flowResultView({op, def: {title: 'Scan'}}, {status: 200, data: null, previewUrl: '/api/preview/synthetic', downloadUrl: '/api/download/synthetic'});
const report = {
  checkedAt: new Date().toISOString(), source: 'webapp/app.js', sha256: createHash('sha256').update(source).digest('hex'),
  scope: 'Current manual Scan download form behavior; not native parity verification.',
  functions: ['runFlow', 'flowResultView', 'result', 'redact', 'prepareOperation'],
  syntheticInput: {q, name: '', cachedAccountSummary},
  observed: {
    requestCount: calls.length, requestOperations: calls.map(call => call.operationId),
    qPreserved: calls[0].values.q === q, nameFieldSubmitted: Object.hasOwn(calls[0].values, 'name'),
    preparedBody: prepared.body, profileReadRequested: calls.some(call => call.operationId === profileOp.id),
    previewRendered: html.includes('/api/preview/'), downloadRendered: html.includes('/api/download/'),
  },
  interpretation: 'The generic manual form retains exact q, permits caller-provided name/default empty, and displays download without preview. This observation does not prove what the native Scan name should be. Separate native audit found nama ?? email ?? "-" for center Scan, distinct from nama-only Activity/KKPR helpers. Native classification, camera, routing and server acceptance are outside this probe.',
  networkCalls: 0, productionRequests: 0, credentialsRead: false, appModified: false,
};
if (process.argv.includes('--write-report')) fs.writeFileSync(new URL('../webapp/scan-document-before-fix.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
