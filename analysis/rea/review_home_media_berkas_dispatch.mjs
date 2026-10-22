// Consolidates an independent, offline review. Does not execute other writers or verifiers.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const self = path.relative(root, fileURLToPath(import.meta.url)).replaceAll('\\', '/');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const pin = file => ({ file, sha256: sha(file) });
const inputs = [];
function verify(row) {
  const file = row.file ?? row.path;
  assert.equal(sha(file), row.sha256, file);
  return file;
}
const expected = {
  'analysis/recovered/home-media-followup/flow-final.json': '7af36973a49b99ec985a92deee583d04c1edf858a82d2cadef160aab468db4f7',
  'analysis/recovered/home-media-followup/verify-final.py': 'a4f27ccc38aa4142237ff07edf713d554e58aa502f5641d00770e2a9389928e3',
  'analysis/recovered/home-media-followup/verification-final.json': 'd074f27138038cdec06672fcdd7e578c1a2a7959b6a4d13483ceb89170809ef1',
  'analysis/HOME-MEDIA-FOLLOWUP-FINAL.md': '86e2cf23715361e95293aef2b8fe0c293aea5f02c71a1b1b4702d4aa59504414',
  'analysis/recovered/home-media-followup/retained-initial/manifest.json': '4cdc6e0397de11cfcd5cde7718668ef3e53b061117c95615a9f892ed9b7a9d38',
  'analysis/recovered/berkas-map-dispatch-followup/flow.json': '98bedcda2aa3a26eff2ea8e935bfde8243c618edb26c751b4475e7254034b05a',
  'analysis/rea/verify_berkas_map_dispatch_followup.py': '8b5d43e2406f717a3afeb7aa586b47b4b257a72b5cd15b006bd58bea423c1c31',
  'analysis/recovered/berkas-map-dispatch-followup/verification.json': 'c7c2bb68d790316322fab6669072eff7eab179631c9082aaeff466b6be2d8820',
  'analysis/BERKAS-MAP-DISPATCH-FOLLOWUP.md': '0544ce5f97f2052bf112b9dc723ccb636f2b931cc7b42c08e3338f2630aa8bd9',
};
for (const [file, sha256] of Object.entries(expected)) {
  verify({ file, sha256 }); inputs.push({ file, sha256 });
}
const home = json(inputs[0].file);
const homeReceipt = json('analysis/recovered/home-media-followup/verification-final.json');
const dispatch = json('analysis/recovered/berkas-map-dispatch-followup/flow.json');
const dispatchReceipt = json('analysis/recovered/berkas-map-dispatch-followup/verification.json');
const checks = [];
function check(name, assertion, evidence) {
  assertion(); checks.push({ name, passed: true, evidence });
}
const sourceRows = [...home.sources, ...home.inherited_sources, ...dispatch.sources];
const lines = new Map();
for (const row of sourceRows) {
  const file = verify(row);
  for (const line of read(file).split(/\r?\n/)) {
    const match = /^(0x[0-9a-f]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    const address = Number(match[1]);
    const previous = lines.get(address);
    if (previous) assert.equal(previous.split(';')[0].trim(), line.split(';')[0].trim());
    else lines.set(address, line);
  }
}
const at = (address, text) => assert.ok(lines.get(address)?.includes(text), `${address.toString(16)}: ${text}`);
const range = (start, end) => [...lines].filter(([a]) => a >= start && a < end).sort((a,b) => a[0]-b[0]);
const textRange = (start, end) => range(start,end).map(([,line]) => line).join('\n');
check('Shared original ELF and pool identity', () => {
  assert.equal(home.artifact.sha256, 'bbc7f3bde07502916f00915afe55028a391efd57a5d47e5b30bd820aabd4a683');
  assert.equal(home.pool.sha256, '871487859dabdd17e109645a1e788098c6f168a44d4dce9626136ed558502e04');
  assert.equal(dispatch.artifact_sha256, home.artifact.sha256);
  assert.equal(dispatch.pool_sha256, home.pool.sha256);
  verify(home.artifact); verify(home.pool);
}, ['ELF bbc7f3…a683', 'pool 871487…2e04']);
check('Both receipts bind current frozen ledgers and bounded counts', () => {
  assert.equal(homeReceipt.status, 'passed');
  assert.equal(homeReceipt.ledger.sha256, expected[inputs[0].file]);
  assert.equal(homeReceipt.counts.unique_instructions, 5135);
  assert.equal(homeReceipt.counts.semantic_checks, 30);
  assert.equal(dispatchReceipt.success, true);
  assert.equal(dispatchReceipt.ledger_sha256, expected['analysis/recovered/berkas-map-dispatch-followup/flow.json']);
  assert.equal(dispatchReceipt.unique_elf_instructions, 5264);
}, ['Home 24 new / 12 inherited ranges', 'Berkas 7 new / 6 inherited ranges']);
check('Protected old evidence and all 80 runtime files remain unchanged', () => {
  const old = json(verify(home.protected_inputs));
  const other = json(verify(dispatch.protected_inputs));
  assert.equal(old.length, 1085); assert.equal(other.length, 1168);
  for (const row of [...old, ...other, ...home.runtime_pins]) verify(row);
  const normalize = rows => rows.map(row => [row.file ?? row.path,row.sha256]).sort((a,b) => a[0].localeCompare(b[0]));
  assert.equal(home.runtime_pins.length, 80);
  assert.deepEqual(normalize(home.runtime_pins), normalize(other.filter(row => row.group === 'runtime')));
  assert.deepEqual(dispatchReceipt.changed_protected_inputs, []);
  inputs.push(pin(home.protected_inputs.file), pin(dispatch.protected_inputs.path));
}, ['1085 home protected inputs', '1168 Berkas protected inputs', 'matching 80 current runtime pins']);
check('Every claimed concrete dispatch entry matches the pinned table', () => {
  verify(home.dispatch); verify(dispatch.dispatch);
  const [header,...rows] = read(home.dispatch.file).trim().split(/\r?\n/).map(line => line.split('\t'));
  const table = new Map(rows.map(row => [Number(row[header.indexOf('index')]),row[header.indexOf('address')]]));
  assert.equal(home.dispatch.entries.length, 10); assert.equal(dispatch.dispatch.entries.length, 12);
  for (const entry of [...home.dispatch.entries,...dispatch.dispatch.entries]) {
    assert.equal(entry.index, 4096 + entry.cid + entry.selector);
    assert.equal(table.get(entry.index), entry.address ?? entry.target);
  }
}, ['10 home entries', '12 Berkas entries', 'origin 4096 + CID + selector']);
check('Home composition and state init positively reach both controllers', () => {
  at(0x756270, '#0xd22740'); at(0x891368, '#0xd8ce2c');
  at(0x8c0ae8, 'Ikuti Kanal video Kami'); at(0x8c0b54, '#0xd9ad10'); at(0x75ba14, '#0xd2d164');
}, ['756270 / 891368', '8c0ae8 / 8c0b54 / 75ba14']);
check('Banner request and typed envelope are distinct from YouTube', () => {
  at(0xd22848, '"banner"'); at(0xd22854, '#0x7017a4'); at(0xd22884, 'Map<String, dynamic>');
  at(0xd228b4, '#0x744e44'); at(0xd228cc, '#0xd22a10'); at(0xd22914, '#0x427e84');
  assert.equal((textRange(0x744e44,0x74511c).match(/Type: int\?/g)||[]).length,4);
  assert.ok(!textRange(0xd22804,0xd22a14).includes('#0xb22dd0'));
}, ['banner has no local String decoder / HTTP200 predicate', 'metadata parsed before caller error test']);
check('Banner path image and externalUrl tap are separate fields', () => {
  at(0x814514, '[x0, #0x17]'); at(0x8144a0, 'TRb.AYi');
  at(0x8144b0, '"/+$"'); at(0x8144d4, '#0xcb1d1c'); at(0x81452c, '"^/+"'); at(0x814550, '#0xcb1d1c');
  at(0x814a80, '[x1, #0x13]'); at(0x814b58, '[x1, #0x13]'); at(0x814b70, '#0xd7627c');
}, ['path +17 uses RegExp-construction results', 'externalUrl +13 goes through instrumentation and URI launcher']);
check('Both model declarations agree with typed nullable casts', () => {
  assert.deepEqual(home.contract.banner.model.fields,{bannerId:'String? +7',sequenceId:'int? +b',bannerUrl:'String? +f',externalUrl:'String? +13',path:'String? +17'});
  assert.equal((textRange(0x746e20,0x7470ec).match(/Type: String\?/g)||[]).length,4);
  assert.equal((textRange(0x746e20,0x7470ec).match(/Type: int\?/g)||[]).length,1);
  assert.equal((textRange(0x75bb24,0x75bdbc).match(/Type: String\?/g)||[]).length,6);
  assert.deepEqual(Object.keys(home.contract.youtube.model.fields),['channelTitle','channelId','videoId','title','thumbnailUrl','publishedTime']);
}, ['hyb: four String? and one int?', 'CCb: six String?, publishedTime stays raw String']);
check('YouTube uses HTTP200, optional one-time String decode, and data List', () => {
  at(0xd2d378, 'Youtube/GetYoutubeList'); at(0xd2d384, '#0x7017a4'); at(0xd2d39c, '#0x190');
  at(0xd2d3d8, '#0xb22dd0'); at(0xd2d3e8, '"data"'); at(0xd2d4a4, 'Type: List');
  assert.ok(!/String: "(?:error|message)"/.test(textRange(0xd2d320,0xd2d594)));
}, ['d2d320..d2d594', 'not the news.message envelope']);
check('Video tap carries videoId/title to the native player boundary', () => {
  at(0x8e3c70, '#0xd1cf2c'); at(0x8e3ce8, '[x0, #0xf]'); at(0x8e3d00, '[x0, #0x13]');
  at(0xa3940c, '#0xde7c0c'); at(0xa39420, '#0xa394d0'); at(0xa39424, '#0xde7c00'); at(0xa394fc, '[x2, #0x2b]');
  assert.ok(!textRange(0x8e3c28,0x8e3cc8).includes('#0xcb473c'));
  const names = read('analysis/recovered/blutter-unique/ida_script/addNames.py');
  assert.ok(names.includes('idaapi.set_name(0xde7c0c, "AllocatetZbStub_de7c0c")'));
  assert.ok(names.includes('idaapi.set_name(0xde7c00, "AllocatepZbStub_de7c00")'));
}, ['unawaited shared auth call is not a proven account gate', 'tZb controller / pZb player; full SDK remains open']);
check('Review correction separates catch flag from unknown secondary', () => {
  at(0xd2d35c, '[x29, #-0x88]'); at(0xd2d56c, '#0x20'); at(0xd2d570, '[x0, #0xb]');
  at(0xd2d574, '[x29, #-0x78]'); at(0xd2d578, '[x0, #0xf]');
  assert.ok(home.contract.youtube.envelope.success.includes('UNKNOWN'));
  assert.ok(home.open_gaps.some(value => /EH|exception.handler/i.test(value)));
}, ['d2d56c..d2d578', 'no unproved fp78 ↔ fp88 alias']);
check('Failure controller result is independently a fresh empty list', () => {
  at(0xd2d230, '#0xd2d264'); at(0xd2d28c, '#0'); at(0xd2d290, '#0x427e84'); at(0xd2d29c, '#0x506078');
  assert.ok(!textRange(0xd2d264,0xd2d2a0).includes('[x0, #0xf]'));
}, ['d2d264..d2d29c ignores tuple secondary on failure']);
check('Pre-review files and exclusive retained copies are byte-identical', () => {
  const retained = json('analysis/recovered/home-media-followup/retained-initial/manifest.json');
  assert.equal(retained.files.length,5);
  for (const row of retained.files) {
    verify({ file:row.original,sha256:row.sha256 }); verify({ file:row.copy,sha256:row.sha256 });
  }
  for (const row of Object.values(home.predecessor)) verify(row);
}, ['old flow, verifier, receipt, document and build retained', 'final successor only is canonical for consolidation']);
check('Berkas BLR inventory is exactly the parent/body inventory', () => {
  const observed = range(0x899b84,0x89d1dc).filter(([,line]) => /:\s+blr\s/.test(line)).map(([address]) => address);
  assert.deepEqual(observed, dispatch.indirect_calls.map(row => Number(row.address)));
  assert.equal(observed.length,11);
  assert.equal(dispatch.indirect_calls.filter(row => row.selector===0xab4d).length,5);
  assert.equal(dispatch.indirect_calls.filter(row => row.selector===0).length,3);
  assert.equal(dispatch.indirect_calls.filter(row => [0xf985,0xdf50].includes(row.selector)).length,3);
}, ['five scalar conversions, three equality calls, three SPS empty/length calls']);
check('Berkas classification preserves its negative and variant limits', () => {
  assert.equal(dispatchReceipt.direct_inline_map_binding_resolved,false);
  assert.equal(dispatchReceipt.complete_transitive_screen_absence_proved,false);
  assert.ok(dispatch.remaining_gaps.some(value => /does not prove.*absent/.test(value)));
  assert.ok(dispatch.remaining_gaps.some(value => /plain collection\/activity/.test(value)));
  assert.ok(dispatch.remaining_gaps.some(value => /bootstrap/.test(value)));
}, ['no selected-Berkas geometry mapping obtained', 'not an all-screen absence proof']);
check('Audit scope adds no runtime, catalog, provider or account actions', () => {
  assert.ok(Object.values(home.new_actions).every(value => value===0));
  assert.equal(dispatch.production_requests,0); assert.equal(dispatch.application_changed,false);
  assert.equal(dispatch.credential_values_exported,false); assert.equal(dispatch.old_ledgers_rewritten,false);
  assert.equal(sha('webapp/private/operations.mjs'),'88f908bca92b9710f72379051624604e371f2d73a6d637523e6c1fb1a4580286');
}, ['176 operations / 84 enabled / 92 disabled remain byte-identical', 'review itself is offline']);

const report = {
  schemaVersion:1,status:'passed',scope:'Independent read-only source/proof review of two bounded native audits, not APK execution or end-to-end acceptance.',
  reviewerAuthorship:'Reviewer did not author these two audits. Reviewer authored earlier Swaplotting/native/runtime evidence and the separate preview-label review; those are reused frozen dependencies only.',
  writer:pin(self),inputs,reviewChecks:checks.length,checks,
  nativeEvidence:{home:homeReceipt.counts,berkas:{newWindows:7,newInstructions:381,inheritedWindows:6,inheritedUniqueInstructions:4883,uniqueInstructions:5264,indirectCalls:11,dispatchEntries:12,semanticChecks:72}},
  observedNewVerifierExecutions:[
    {command:'tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_berkas_map_dispatch_followup.py --verify-only',exitCode:0,receipt:pin('analysis/recovered/berkas-map-dispatch-followup/verification.json'),receiptRewritten:false},
    {command:'tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/recovered/home-media-followup/verify.py --verify-only',exitCode:0,receipt:pin('analysis/recovered/home-media-followup/verification.json'),receiptRewritten:false,retainedPreReview:true},
    {command:'tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/recovered/home-media-followup/verify-final.py --verify-only',exitCode:0,receipt:pin('analysis/recovered/home-media-followup/verification-final.json'),receiptRewritten:false},
  ],
  executionNote:'These executions were observed during this review before this consolidation writer. This writer does not execute verifiers, disassembly builders, Docker, browsers or network calls.',
  resolvedFindings:[{id:'home-youtube-catch-secondary',problem:'The pre-review contract grouped catch with the ordinary empty-list fallback without a closed EH slot mapping.',resolution:'Final successor proves failure flag true, labels catch secondary unknown, and separately proves that the controller discards it and allocates a fresh empty list.',evidence:['d2d35c: initial fp-0x88','d2d574: catch fp-0x78','d2d264..d2d29c: controller fresh []'],originalFilesPreserved:true}],
  materialFindings:[],runtimeFilesUnchanged:80,catalogUnchanged:true,
  conclusions:[
    'Banner and YouTube widget/request/typed-model/tap chains are positively bound for the inspected public-home variant; their envelopes are distinct.',
    'Image path composition, externalUrl launch and videoId/title player entry are proved only to the stated shared SDK boundaries.',
    'All eleven inspected Berkas indirect calls classify scalar/String/SPS operations. The user-observed direct map source remains unresolved; absence across all screens is not proved.',
  ],
  limitations:[...home.open_gaps,...dispatch.remaining_gaps,'No live response, account-role routing, APK UI, browser media behavior, provider acceptance or full 1:1 functionality was tested by this review.'],
  reviewActions:{runtimeEdits:0,authorOutputEdits:0,oldVerifierExecutions:0,networkRequests:0,apkExecutions:0,accountReads:0,credentialsExported:0,submissions:0},
};
assert.equal(checks.length,16);
const destination='analysis/webapp/home-media-berkas-dispatch-review.json';
fs.writeFileSync(path.join(root,destination),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:report.status,reviewChecks:checks.length,receipt:pin(destination),resolvedFindings:report.resolvedFindings.length,materialFindings:0,runtimeFilesUnchanged:80}));
