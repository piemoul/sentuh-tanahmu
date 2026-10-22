// Offline independent review receipt. Existing native evidence is read only.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {profileWebsiteDestination} from '../../webapp/assets/profile/site-destinations.js';
const target='analysis/webapp/profile-site-independent-review.json';
assert.equal(fs.existsSync(target),false,'Preserve prior review receipts');
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const pin=file=>({file,sha256:hash(file)});
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const inputs=read('environment/profile-site-review/inputs-before.json');
const changedInputs=inputs.filter(row=>hash(row.file)!==row.sha256).map(row=>row.file);
assert.deepEqual(changedInputs,[]);
const baseFile='analysis/recovered/profile-base-followup/flow.json',destinationsFile='analysis/recovered/profile-destinations-followup/flow.json';
assert.equal(hash(baseFile),'2b2e3d29edcf53291e676f2f10dcaf34c5105c91a8a90a125bf53b390801f03f');
assert.equal(hash(destinationsFile),'a96bd73805664e097f3611567f322f521664009e743c144578ce311db4cd82da');
const base=read(baseFile),destinations=read(destinationsFile),nativeOutput='analysis/webapp/profile-site-independent-native-verifier.txt';
const native=read(nativeOutput);assert.equal(native.status,'PASS');assert.equal(native.ledger_sha256,hash(baseFile));assert.equal(native.inherited_elf_instructions,180);assert.equal(native.metadata_rerun_byte_equal,true);assert.equal(native.shared_build_inputs_unchanged,23);
const app=fs.readFileSync('webapp/app.js','utf8'),lines=app.split(/\r?\n/);
const fn=name=>{const line=lines.find(line=>line.startsWith('function '+name+'('));assert.ok(line,name);return line;};
const website=fn('profileWebsitePage'),section=fn('profileSection'),privacy=fn('profilePrivacyPage');
const entries=[];
for(const key of ['benefits','faq','privacy']){
 const model=profileWebsiteDestination(key),nativeModel=base.contract['profile_'+key],suffix=destinations.contract[key].suffix;
 assert.equal(model.url,nativeModel.url);assert.equal(model.url,base.contract.base+suffix);assert.equal(model.nativeTitle,nativeModel.native_title);assert.equal(model.nativeTitle,destinations.contract[key].title);assert.equal(Object.isFrozen(model),true);
 entries.push({kind:key,url:model.url,nativeTitle:model.nativeTitle,route:key==='privacy'?'profileSection→profilePrivacyPage':'profileSection→profileWebsitePage',nativeBaseSlot:'0x2fd8',nativeSuffix:suffix});
}
assert.ok(section.includes("if(route==='benefits')return profileWebsitePage('benefits')"));assert.ok(section.includes("if(route==='faq')return profileWebsitePage('faq')"));assert.ok(section.includes("if(route==='privacy')return profilePrivacyPage()"));
assert.ok(privacy.includes('href="'+profileWebsiteDestination('privacy').url+'"'));
for(const fragment of ['target="_blank"','rel="noopener noreferrer"','referrerpolicy="no-referrer"']){assert.ok(website.includes(fragment));assert.ok(privacy.includes(fragment));}
assert.ok(website.includes('href="${esc(page.url)}"'));assert.ok(website.includes('if(!page)return unavailablePage()'));
assert.doesNotMatch(website,/api\(|fetch\(|state\.user|state\.connection|Authorization|accessToken/);
for(const key of ['__proto__','constructor','unknown','https://untrusted.invalid/'])assert.equal(profileWebsiteDestination(key),null);
const menu=lines.find(line=>line.startsWith('const profileMenus=')),external=lines.find(line=>line.startsWith('const externalPages='));
for(const key of ['benefits','faq','privacy']){assert.ok(menu.includes("route:'"+key+"'"));assert.equal(new RegExp('(?:^|[,\\{])'+key+':').test(external),false);}
const tapFile='analysis/webapp/profile-site-independent-node-tests.tap',tap=fs.readFileSync(tapFile,'utf8');
for(const [name,count]of [['tests',7],['pass',7],['fail',0],['skipped',0],['cancelled',0]])assert.match(tap,new RegExp('^# '+name+' '+count+'$','m'));
const result={checkedAt:new Date().toISOString(),status:'PASS',scope:'Independent review of fixed public profile destinations, routing and safe external links against frozen native base/suffix evidence',materialFindings:0,findings:[],inputs:[...inputs,pin('analysis/rea/review_profile_site_independent.mjs')],inputsChangedDuringReview:changedInputs,reviewedFunctions:['profileWebsitePage','profileSection','profilePrivacyPage'].map(name=>({name,line:lines.findIndex(line=>line.startsWith('function '+name+'('))+1,sourceSha256:createHash('sha256').update(fn(name)).digest('hex')})),contracts:entries,positiveChecks:['Native static slot0x2fd8/index1531 binds exact public base; all three suffixes/titles agree with predecessor ledger.','Fixed frozen destination module cannot take its target from account data, connection origin, route query, arbitrary URL or prototype property.','Profile menu entries reach dedicated section branches; FAQ/benefits are not shadowed by externalPages and no longer use generic Help/local marketing content.','Public links use explicit target=_blank, noopener noreferrer and no-referrer, with escaped fixed URLs and no account payload.','Existing privacy URL agrees with the proven base and suffix; its existing browser heading remains a descriptive privacy label.'],nativeVerification:{command:'tools/runtime/blutter-python/Scripts/python.exe -X utf8 analysis/rea/verify_profile_base_followup.py',status:'PASS',inheritedElfInstructions:180,metadataRerunByteEqual:true,dependencies:18,sharedBuildInputsUnchanged:23,output:pin(nativeOutput)},focusedTests:{command:'tools/runtime/node.exe --openssl-legacy-provider --test --test-reporter=tap webapp/tests/profile-site-destinations.test.mjs',tests:7,pass:7,fail:0,output:pin(tapFile)},preservation:{runtimeEdited:false,priorEvidenceEdited:false,allCapturedSourceAndEvidenceHashesUnchanged:true,productionRequests:0,accountAccess:false,backendOrContainerActions:false},limits:['Public destination/content availability was not tested over the network.','Explicit browser links adapt Android WebView navigation; complete Android lifecycle or pixel parity is not claimed.','These focused DOM/VM checks are not all-menu or authenticated production end-to-end acceptance.']};
fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,materialFindings:0,tests:7,receipt:pin(target),app:pin('webapp/app.js'),module:pin('webapp/assets/profile/site-destinations.js')}));
