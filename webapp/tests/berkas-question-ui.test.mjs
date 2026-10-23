import test from 'node:test';import assert from 'node:assert/strict';
import {questionRows,questionGroups,hasQuestionText}from'../assets/berkas-question/model.js';
import {createBerkasQuestion}from'../assets/berkas-question/controller.js';
import {berkasQuestionView,questionConversationView}from'../assets/berkas-question/view.js';
const message=patch=>({berkasId:'B-1',nik:'PRIVATE-SYNTHETIC-NIK',content:'Raw\ntext',isTanya:'1',tanggal:'Day A',waktu:'09:00',namaKantor:'Office A',...patch});
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
test('question bubbles use exact String1 and adjacent raw date groups without sorting',()=>{
 const rows=questionRows([message(),message({isTanya:'0'}),message({tanggal:'Day B',isTanya:'true'}),message({tanggal:'Day A',isTanya:'false'})]);
 const groups=questionGroups(rows);assert.deepEqual(groups.map(g=>g.date),['Day A','Day B','Day A']);assert.deepEqual(groups.flatMap(g=>g.messages.map(m=>m.question)),[true,false,false,false]);
});
test('question view escapes raw content/date/office/time, preserves newlines and never renders NIK',()=>{
 const state={rows:[message({content:'<img src=x onerror=alert(1)>\n & "raw"',tanggal:'<day>',waktu:'<time>'}),message({isTanya:'0',namaKantor:'<office>'})],readBusy:false};
 const html=questionConversationView(state);assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;\n &amp; &quot;raw&quot;'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('PRIVATE-SYNTHETIC-NIK'));assert.ok(html.includes('&lt;office&gt;'));assert.ok(html.includes('&lt;day&gt;'));assert.ok(html.includes('&lt;time&gt;'));
});
test('question editor uses native copy with no invented attachment,CAPTCHA or max length',()=>{
 const html=berkasQuestionView({numberYear:'42/2026'});assert.ok(html.includes('Tanya Berkas'));assert.ok(html.includes('42/2026'));assert.ok(html.includes('Ketik pesan...'));assert.ok(!/maxlength|type="file"|captcha/i.test(html));assert.ok(questionConversationView({rows:[],readBusy:false}).includes('Kamu belum memulai percakapan'));
});
test('question frontend requires seven String fields and trims only compose validation copy',()=>{
 assert.throws(()=>questionRows([message({isTanya:true})]));assert.throws(()=>questionRows([message({nik:null})]));assert.equal(hasQuestionText(' \u0085\n\uFEFF'),false);assert.equal(hasQuestionText(' raw\n '),true);
});
test('question send clears editor immediately, keeps next draft editable and holds busy until refresh result',async()=>{
 const held=deferred(),sent=[];let state;
 const c=createBerkasQuestion({read:async()=>[],write:content=>{sent.push(content);return held.promise;},changed:value=>state=value});
 c.draft(' \n untrimmed ~!* ');const pending=c.send();assert.deepEqual(sent,[' \n untrimmed ~!* ']);assert.equal(state.draft,'');assert.equal(state.sendBusy,true);assert.equal(await c.send(),false);
 c.draft('next unsent');held.resolve({data:{success:true},delivery:'received',refresh:{success:true,result:{data:[message()]}}});assert.equal(await pending,true);assert.equal(c.snapshot().sendBusy,false);assert.equal(c.snapshot().draft,'next unsent');assert.equal(c.snapshot().rows.length,1);assert.equal(sent.length,1);
});
test('question whitespace send is a native no-op and does not clear editor or add a dialog',async()=>{
 let calls=0;const c=createBerkasQuestion({read:async()=>[],write:async()=>{calls++;}});c.draft(' \u0085\n');assert.equal(await c.send(),false);assert.equal(c.snapshot().draft,' \u0085\n');assert.equal(c.snapshot().sendNotice,'');assert.equal(calls,0);
});
test('question read failures publish empty history with explicit browser error distinct from successful empty',async()=>{
 const good=createBerkasQuestion({read:async()=>[],write:async()=>{}});assert.equal(await good.load(),true);assert.equal(good.snapshot().readError,'');
 const failed=createBerkasQuestion({read:async()=>{throw Error('synthetic');},write:async()=>{}});assert.equal(await failed.load(),false);assert.deepEqual(failed.snapshot().rows,[]);assert.ok(failed.snapshot().readError);assert.equal(failed.snapshot().readBusy,false);
});
test('question known false gives no success dialog, unknown reply warns and never replays POST',async()=>{
 let sends=0;const c=createBerkasQuestion({read:async()=>[],write:async()=>{sends++;return {data:{success:false},delivery:sends===1?'received':'unknown',refresh:null};}});
 c.draft('first');assert.equal(await c.send(),false);assert.equal(c.snapshot().sendNotice,'');assert.equal(c.snapshot().draft,'');
 c.draft('second');assert.equal(await c.send(),false);assert.match(c.snapshot().sendNotice,/belum terkonfirmasi/);assert.equal(sends,2);await Promise.resolve();assert.equal(sends,2);
});
test('question accepted refresh failure is distinguished from message failure and does not resend',async()=>{
 let sends=0;const c=createBerkasQuestion({read:async()=>[message()],write:async()=>{sends++;return {data:{success:true},delivery:'received',refresh:{success:false}};}});await c.load();c.draft('new');assert.equal(await c.send(),true);assert.deepEqual(c.snapshot().rows,[]);assert.match(c.snapshot().readError,/Pesan diterima/);assert.equal(sends,1);
});
test('question delayed initial history cannot overwrite the newer awaited send refresh',async()=>{
 const initial=deferred();const c=createBerkasQuestion({read:()=>initial.promise,write:async()=>({data:{success:true},delivery:'received',refresh:{success:true,result:{data:[message({content:'newer'})]}}})});const load=c.load();c.draft('new');await c.send();initial.resolve([message({content:'old'})]);await load;assert.equal(c.snapshot().rows[0].content,'newer');assert.equal(c.snapshot().readBusy,false);
});
test('question stale navigation/disposal drops delayed private read and POST completion',async()=>{
 const held=deferred();let current=true,emissions=0;const c=createBerkasQuestion({read:()=>held.promise,write:async()=>{},isCurrent:()=>current,changed:()=>emissions++});const read=c.load();const before=emissions;current=false;held.resolve([message()]);assert.equal(await read,false);assert.equal(emissions,before);c.dispose();assert.deepEqual(c.snapshot().rows,[]);
 const post=deferred();const writer=createBerkasQuestion({read:async()=>[],write:()=>post.promise});writer.draft('secret synthetic');const pending=writer.send();writer.dispose();post.resolve({data:{success:true},refresh:{success:true,result:{data:[message()]}}});assert.equal(await pending,false);assert.equal(writer.snapshot().draft,'');assert.deepEqual(writer.snapshot().rows,[]);
});
test('question session error clears capability and not-sent feedback never restores original native-cleared text',async()=>{
 let auth=0;const c=createBerkasQuestion({read:async()=>[],write:async()=>{throw Object.assign(Error('expired'),{code:'SESSION_EXPIRED'});},onSessionError:()=>auth++});c.draft('old text');await c.send();assert.equal(auth,1);assert.equal(c.snapshot().locked,true);assert.equal(c.snapshot().draft,'');
 const local=createBerkasQuestion({read:async()=>[],write:async()=>{throw Object.assign(Error('not sent'),{delivery:'not_sent'});}});local.draft('not restored');await local.send();assert.equal(local.snapshot().draft,'');assert.match(local.snapshot().sendNotice,/belum dikirim/);
});
