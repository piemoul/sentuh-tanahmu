import test from 'node:test';
import assert from 'node:assert/strict';
import {ratingPPATEntry,ratingPPATGroups,ratingPPATChoice} from '../assets/rating-ppat/model.js';
import {createRatingPPAT} from '../assets/rating-ppat/controller.js';
import {ratingPPATView} from '../assets/rating-ppat/view.js';
const entry={aktaId:' RAW AKTA ',namaPPAT:' Nama <PPAT> & '};
const answer=(id,label='Jawaban',question='Pertanyaan')=>({pertanyaanRatingPPATId:id,pertanyaan:question,jawaban:label});
const group=(id,answers=[answer('a')],indikator='Indikator')=>({pertanyaanRatingPPATId:id,indikator,jawabanRatingPPAT:answers});
const response=(groups=[group('g')])=>({data:groups});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function setup({read=async()=>response(),entry:source=entry}={}){const calls=[],changes=[],sessions=[];let current=true;const c=createRatingPPAT({entry:source,read:(...args)=>{calls.push(args);return read(...args);},isCurrent:()=>current,changed:value=>changes.push(value),onSessionError:error=>sessions.push(error)});return {c,calls,changes,sessions,retire:()=>current=false};}

test('explicit entry requires source Strings and preserves empty or whitespace without aliases',()=>{
 assert.deepEqual(ratingPPATEntry(entry),entry);assert.deepEqual(ratingPPATEntry({aktaId:'',namaPPAT:'   ',user:'ignored'}),{aktaId:'',namaPPAT:'   '});
 for(const value of [null,[],{},entry.aktaId,{aktaId:1,namaPPAT:'x'},{aktaId:'a',namaPPAT:null},{id:'a',name:'x'}])assert.throws(()=>ratingPPATEntry(value));
});
test('project normalized data only, preserving order, duplicates and null versus empty answer lists',()=>{
 const source={error:true,message:'ignored',data:[group(' same ',[answer(' answer ')]),group(' same ',[]),group(null,null),{}]},before=structuredClone(source),rows=ratingPPATGroups(source);
 assert.deepEqual(rows,[group(' same ',[answer(' answer ')]),group(' same ',[]),group(null,null),{pertanyaanRatingPPATId:null,indikator:null,jawabanRatingPPAT:null}]);assert.deepEqual(source,before);rows[0].jawabanRatingPPAT[0].jawaban='copy';assert.equal(source.data[0].jawabanRatingPPAT[0].jawaban,'Jawaban');
 for(const value of [null,[],{data:null},{message:[]},JSON.stringify(source),{data:[null]},{data:[[]]},{data:Array(1)}])assert.throws(()=>ratingPPATGroups(value));
});
test('all retained and optionally present discarded native String fields reject coercion and sparse lists',()=>{
 for(const key of ['pertanyaanRatingPPATId','indikator','kategori'])for(const value of [0,false,[],{}])assert.throws(()=>ratingPPATGroups(response([{...group('g'),[key]:value}])));
 for(const key of ['pertanyaanRatingPPATId','pertanyaan','jawaban','bobot','nilai'])for(const value of [0,false,[],{}])assert.throws(()=>ratingPPATGroups(response([group('g',[{...answer('a'),[key]:value}])])));
 for(const answers of ['x',{},[null],[[]],Array(1)])assert.throws(()=>ratingPPATGroups(response([group('g',answers)])));
 assert.deepEqual(ratingPPATGroups(response([group('',[{pertanyaanRatingPPATId:null,pertanyaan:null,jawaban:null,bobot:null,nilai:null}])])),[group('',[{pertanyaanRatingPPATId:null,pertanyaan:null,jawaban:null}])]);
});
test('choice resolves exact original row indices; null group ignored, null answer becomes empty String',()=>{
 const rows=ratingPPATGroups(response([group(null,[answer('a')]),group('',[answer(null)]),group('   ',[answer(' raw ')])]));
 assert.equal(ratingPPATChoice(rows,0,0),null);assert.deepEqual(ratingPPATChoice(rows,1,0),{groupId:'',answerId:''});assert.deepEqual(ratingPPATChoice(rows,2,0),{groupId:'   ',answerId:' raw '});
 for(const pair of [[-1,0],[0,-1],['1',0],[1,'0'],[1,1],[3,0],[1.2,0],[NaN,0]])assert.equal(ratingPPATChoice(rows,...pair),null);
});
test('questionnaire autoload once sends no selected Akta or other arguments',async()=>{
 const h=setup();assert.equal(await h.c.start(),true);assert.equal(await h.c.start(),false);assert.deepEqual(h.calls,[[]]);assert.equal(h.c.snapshot().stage,'ready');assert.equal(h.c.snapshot().pending,false);assert.deepEqual(h.c.snapshot().entry,entry);assert.equal(h.c.submit,undefined);
});
test('pending reads cannot duplicate start or retry and never accept premature choices',async()=>{
 const wait=deferred(),h=setup({read:()=>wait.promise}),work=h.c.start();assert.equal(h.c.snapshot().stage,'loading');assert.equal(h.c.snapshot().pending,true);assert.equal(await h.c.start(),false);assert.equal(await h.c.retry(),false);assert.equal(h.c.choose(0,0),false);assert.equal(h.calls.length,1);wait.resolve(response());assert.equal(await work,true);
});
test('selection preserves raw keys and native duplicate/null behavior with count, not a made-up completeness test',async()=>{
 const h=setup({read:async()=>response([group('same',[answer(' x '),answer(null)]),group('same',[answer('other')]),group(null,[answer('ignored')]),group('',[answer(null)]),group(' ',[answer('')])])});await h.c.start();
 assert.equal(h.c.choose(0,0),true);assert.equal(h.c.choose(1,0),true);assert.equal(h.c.choose(2,0),false);assert.equal(h.c.choose(3,0),true);assert.equal(h.c.choose(4,0),true);const s=h.c.snapshot();assert.deepEqual([...s.selection],[['same','other'],['',''],[' ','']]);assert.equal(s.selectedCount,3);assert.equal(s.groupCount,5);assert.equal(s.incomplete,true);assert.equal(h.calls.length,1);
});
test('Map value insertion order follows choice order and overwrites do not reorder keys',async()=>{
 const h=setup({read:async()=>response([group('g0',[answer('a0'),answer('b0')]),group('g1',[answer('a1')])])});await h.c.start();h.c.choose(1,0);h.c.choose(0,0);h.c.choose(1,0);h.c.choose(0,1);assert.deepEqual([...h.c.snapshot().selection],[['g1','a1'],['g0','b0']]);assert.equal(h.c.snapshot().incomplete,false);
});
test('snapshots and callback copies cannot inject another answer, question, entry or native count',async()=>{
 const source={...entry},h=setup({entry:source});source.aktaId='changed outside';await h.c.start();const s=h.c.snapshot();s.groups[0].jawabanRatingPPAT[0].pertanyaanRatingPPATId='fake';s.entry.aktaId='fake';s.selection.set('fake','fake');h.changes.at(-1).groups.length=0;assert.equal(h.c.choose(0,0),true);assert.equal(h.c.snapshot().entry.aktaId,entry.aktaId);assert.deepEqual([...h.c.snapshot().selection],[['g','a']]);
});
test('explicit retry clears selections immediately; error stays visible until an explicit retry',async()=>{
 let attempt=0;const wait=deferred(),h=setup({read:async()=>++attempt===1?response():wait.promise});await h.c.start();h.c.choose(0,0);const work=h.c.retry();assert.equal(h.c.snapshot().selection.size,0);assert.deepEqual(h.c.snapshot().groups,[]);wait.reject(new Error('<read failed>'));assert.equal(await work,false);assert.equal(h.c.snapshot().stage,'error');assert.equal(h.c.snapshot().error,'<read failed>');assert.equal(await h.c.start(),false);assert.equal(h.calls.length,2);
});
test('valid empty questionnaire has native count0<0 false yet no write or fake success',async()=>{
 const h=setup({read:async()=>response([])});await h.c.start();const s=h.c.snapshot();assert.equal(s.stage,'empty');assert.equal(s.incomplete,false);assert.equal(s.selectedCount,0);const html=ratingPPATView(s);assert.match(html,/Belum ada pertanyaan/);assert.match(html,/disabled[^>]*>Kirim Rating/);assert.match(html,/belum ada penilaian yang dikirim/);assert.doesNotMatch(html,/berhasil dikirim|type="submit"/);
});
test('current401 reports session once while stale success or401 cannot mutate another owner',async()=>{
 const error=Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'});const live=setup({read:async()=>{throw error;}});await live.c.start();assert.deepEqual(live.sessions,[error]);assert.equal(live.c.snapshot().stage,'error');
 for(const auth of [false,true]){const wait=deferred(),h=setup({read:()=>wait.promise}),work=h.c.start(),before=h.c.snapshot(),emits=h.changes.length;h.retire();if(auth)wait.reject(error);else wait.resolve(response());assert.equal(await work,false);assert.deepEqual(h.c.snapshot(),before);assert.equal(h.changes.length,emits);assert.deepEqual(h.sessions,[]);h.c.dispose();}
});
test('dispose clears private entry names and answers; old responses or callbacks cannot restore them',async()=>{
 const wait=deferred(),h=setup({read:()=>wait.promise}),work=h.c.start();h.c.dispose();h.c.dispose();wait.resolve(response());assert.equal(await work,false);const s=h.c.snapshot();assert.deepEqual(s.entry,{aktaId:'',namaPPAT:''});assert.deepEqual(s.groups,[]);assert.equal(s.selection.size,0);assert.equal(s.pending,false);assert.equal(s.error,'');assert.equal(s.stage,'disposed');assert.equal(h.c.choose(0,0),false);assert.equal(await h.c.start(),false);assert.equal(await h.c.retry(),false);assert.equal(ratingPPATView(s),'');
});
test('radio presentation has one source group heading, only first description, all answer labels and escaping',async()=>{
 const h=setup({read:async()=>response([group('raw"group',[answer('one','<first>','<first question>'),answer('two','second','SHOULD NOT BE DESCRIPTION')],'<indicator>'),group(null,null,null),group('',[],null)])});await h.c.start();h.c.choose(0,1);const html=ratingPPATView(h.c.snapshot());assert.match(html,/Rating PPAT  Nama &lt;PPAT&gt; &amp; /);assert.match(html,/1\. &lt;indicator&gt;/);assert.match(html,/2\. <\/legend>/);assert.match(html,/3\. <\/legend>/);assert.match(html,/&lt;first question&gt;/);assert.match(html,/&lt;first&gt;/);assert.match(html,/second/);assert.doesNotMatch(html,/SHOULD NOT BE DESCRIPTION|raw&quot;group|<first>|type="number"|textarea|<form/);assert.equal((html.match(/type="radio"/g)??[]).length,2);assert.match(html,/name="rating-ppat-group-0"/);assert.match(html,/data-rating-ppat-answer="1" checked/);assert.match(html,/disabled[^>]*>Kirim Rating/);
});
test('null/duplicate IDs use native shared Map while each source group keeps its own HTML radio name',async()=>{
 const h=setup({read:async()=>response([group('same',[answer('v'),answer('v')]),group('same',[answer('v')]),group(null,[answer(null)]),group('',[answer(null)])])});await h.c.start();h.c.choose(0,0);h.c.choose(3,0);const html=ratingPPATView(h.c.snapshot());assert.equal((html.match(/ checked/g)??[]).length,5);for(let i=0;i<4;i++)assert.match(html,new RegExp('name="rating-ppat-group-'+i+'"'));assert.equal(h.c.snapshot().selectedCount,2);assert.equal(h.c.snapshot().groupCount,4);assert.equal(h.c.snapshot().incomplete,true);
});
