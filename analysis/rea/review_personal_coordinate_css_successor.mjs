// Read-only successor: reuse completed integration results only after proving
// that every input except the single scoped CSS append remains byte-identical.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex'),pin=file=>({file,sha256:sha(file)});
const suffix=process.argv.find(arg=>arg.startsWith('--suffix='))?.slice(9)??'css-final';assert.match(suffix,/^[a-z0-9-]+$/);
const browserFile=process.argv.find(arg=>arg.startsWith('--browser='))?.slice(10);
const target=`analysis/webapp/personal-coordinate-integration-review-${suffix}.json`;
assert.equal(fs.existsSync(target),false,'Preserve all prior receipts');
const predecessorFile='analysis/webapp/personal-coordinate-integration-review-initial.json',predecessor=JSON.parse(fs.readFileSync(predecessorFile));
assert.equal(predecessor.status,'PASS');assert.equal(predecessor.passed,11);assert.equal(predecessor.failed,0);assert.equal(predecessor.focusedTests.pass,56);assert.equal(predecessor.focusedTests.fail,0);
assert.equal(predecessor.inputs.length,26);
const inputs=predecessor.inputs.map(row=>pin(row.file)),changed=inputs.filter(row=>row.sha256!==predecessor.inputs.find(old=>old.file===row.file).sha256);
assert.deepEqual(changed.map(row=>row.file),['webapp/styles.css']);
const rule='\n[data-swaplotting-coordinate] [hidden]{display:none!important}\n',css=fs.readFileSync('webapp/styles.css');
assert.ok(css.subarray(-Buffer.byteLength(rule)).equals(Buffer.from(rule)));
const reconstructedSha=createHash('sha256').update(css.subarray(0,-Buffer.byteLength(rule))).digest('hex');
assert.equal(reconstructedSha,predecessor.inputs.find(row=>row.file==='webapp/styles.css').sha256);
assert.equal(sha('webapp/styles.css'),'fe9cb4f32b95fd6e51bbe049bc38659485e4520d4e807c6fee27520811f4779c');
const initialFile='analysis/webapp/personal-coordinate-browser-initial.json',initial=JSON.parse(fs.readFileSync(initialFile));
assert.equal(initial.passed,1);assert.equal(initial.failed,1);assert.equal(initial.process.exitCode,0);assert.equal(initial.process.listening,false);
for(const row of [initial.screenshot,initial.transport])assert.equal(sha(row.file),row.sha256);
let browser=null;
if(browserFile){
 const value=JSON.parse(fs.readFileSync(browserFile));assert.ok(value.passed>0);assert.equal(value.failed,0);
 // Bind the browser's current source list; do not infer HTTP/provider/device
 // behavior from receipt filenames or merely successful fixture rendering.
 const source=value.inputs??value.source;assert.ok(Array.isArray(source));for(const row of source)assert.equal(sha(row.file),row.sha256,row.file);
 const style=source.find(row=>row.file==='webapp/styles.css');assert.ok(style);assert.equal(style.sha256,sha('webapp/styles.css'));
 browser={receipt:pin(browserFile),passed:value.passed,failed:value.failed,scope:value.scope??null,sourceBindingsVerified:source.length};
}
assert.ok(inputs.every(row=>sha(row.file)===row.sha256));
const report={schemaVersion:1,checkedAt:new Date().toISOString(),status:'PASS',reviewScope:'Source-preservation and narrowly scoped CSS correction; no tests or browser were rerun by this reviewer.',predecessor:pin(predecessorFile),inputs,sourceStable:true,delta:{changedFiles:changed.length,unchangedFiles:inputs.length-changed.length,changed,exactAppendedRule:rule,reconstructedPredecessorCssSha256:reconstructedSha},retainedResults:{independentProbes:{passed:11,failed:0,rerun:false,scope:'Historical PASS against identical JS/core/host/view/map/tests/fixtures; prior CSS hash differs.'},focusedTests:{passed:56,failed:0,rerun:false,tap:predecessor.focusedTests.tap},independentTap:predecessor.tap},browserVisibilityDefect:{initialReceipt:pin(initialFile),initialScreenshot:pin(initial.screenshot.file),initialTransport:pin(initial.transport.file),actualBrowserFinding:'Retry-map button had hidden attribute but remained visibly displayed because the author .button display rule overrode browser hidden styling.',priorFakeDomLimit:'The prior11 synthetic integration probes and56 Node regressions did not exercise CSS rendering or actual hidden visibility. Their PASS did not cover this browser defect.',correction:'A scoped important display:none rule makes [hidden] descendants in the coordinate panel visually hidden.',finalBrowser:browser,pending:browser===null},effects:{runtimeEditsByReviewer:0,testReruns:0,browserRequestsByReviewer:0,networkRequests:0,productionRequests:0},limits:['This is an independent review of host/view/app/integration and the root CSS delta. The reviewer authored coordinate-entry/model/controller, so no independent core implementation certification is claimed.','No actual camera/GPS, post-login provider acceptance, submission or complete native parity is established.'],writer:pin('analysis/rea/review_personal_coordinate_css_successor.mjs'),goalComplete:false};
fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:report.status,receipt:pin(target),delta:report.delta.changedFiles,browserPending:report.browserVisibilityDefect.pending}));
