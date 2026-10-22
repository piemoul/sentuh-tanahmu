import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {OPERATIONS} from '../private/operations.mjs';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),lines=source.split(/\r?\n/);
const declarations=['partnerFlowContext','partnerItem','partnerChildTarget','partnerPage'].map(name=>{const line=lines.find(line=>line.startsWith(`function ${name}(`));assert.ok(line,name);return line;}).join('\n');
const clone=value=>JSON.parse(JSON.stringify(value));
function fixture(){
  const pending=[],calls=[];
  const def={title:'Mitra Kerja',subtitle:'',tabs:[{id:'kantorppat',label:'PPAT',endpoint:'Mitra/GetKantorPPAT'},{id:'wilayah',label:'Surveyor',endpoint:'Mitra/GetWilayahSurveyor'},{id:'penilai',label:'Penilai',endpoint:'Mitra/GetPenilaiList'},{id:'ppat',label:'PPAT',parent:true,endpoint:'Mitra/GetPPATList?kantorId={value}'},{id:'surveyor',label:'Surveyor',parent:true,endpoint:'Mitra/GetSurveyorList?wilayahId={value}'}]};
  const c=vm.createContext({state:{operations:OPERATIONS.filter(op=>op.endpoint.startsWith('Mitra/')).map(op=>({...op})),authenticated:false,loading:false,connection:{configured:true}},route:'partners',flowTab:'',partnerFrame:null,flowResults:new Map(),sessionEpoch:1,ready:op=>op.enabled===true,write:op=>op.effect==='write',needsAuth:op=>op.auth==='session',head:()=>'',icon:()=>'',esc:String,notice:String,empty:String,unavailablePage:()=>'',partnerListView:()=>'<list>',queueMicrotask:fn=>pending.push(fn)});
  vm.runInContext(declarations,c);c.currentFlow=()=>c.partnerFlowContext(def);c.runFlow=async()=>{const context=c.currentFlow();calls.push({frame:context.partnerFrame,values:clone(context.partnerFrame.values)});c.flowResults.set(context.key,{loading:true});};
  return {c,pending,calls,flush(){while(pending.length)pending.shift()();}};
}
test('native selected null/missing IDs become empty Strings; empty and whitespace IDs stay exact',()=>{
  const {c}=fixture();
  for(const [mode,key]of [['kantorppat','kantorId'],['wilayah','wilayahId']]){
    for(const value of [undefined,null,'','   ',' A + & / ']){const target=c.partnerChildTarget(mode,{[key]:value,nama:'Native'});assert.equal(target.values[key],value??'');}
    for(const value of [0,false,[],{}])assert.equal(c.partnerChildTarget(mode,{[key]:value}),null);
    assert.equal(c.partnerChildTarget(mode,{id:'unproven alias'}).values[key],'');
  }
});
test('initial public Mitra page schedules one default office read, without waiting for user button',async()=>{
  const h=fixture();const html=h.c.partnerPage();h.c.partnerPage();assert.equal(h.pending.length,1);assert.equal(h.calls.length,0);assert.match(html,/partner-tab/);assert.equal(h.c.partnerFrame.tabId,'kantorppat');h.flush();assert.equal(h.calls.length,1);h.c.partnerPage();assert.equal(h.pending.length,0);assert.deepEqual(h.calls[0].values,{});
});
test('queued auto read is retired by route, frame or session changes and cannot load a replacement',()=>{
  for(const retire of [h=>h.c.route='account',h=>h.c.partnerFrame=null,h=>h.c.sessionEpoch++,h=>h.c.state.connection.configured=false]){const h=fixture();h.c.partnerPage();retire(h);h.flush();assert.equal(h.calls.length,0);}
});
test('existing response or pending read prevents duplicate auto fetch; failure waits for explicit retry',()=>{
  for(const existing of [{loading:true},{response:{status:200,data:{data:[]}}},{loading:false,error:'Manual read failed'}]){const h=fixture(),context=h.c.currentFlow();h.c.flowResults.set(context.key,existing);h.c.partnerPage();h.flush();assert.equal(h.calls.length,0);}
  const h=fixture();h.c.partnerPage();h.flush();h.c.flowResults.set(h.c.currentFlow().key,{loading:false,error:'Synthetic upstream error'});h.c.partnerPage();h.flush();assert.equal(h.calls.length,1);
});
test('manual in-flight/read result that wins before the microtask prevents a second request',()=>{
  for(const existing of [{loading:true},{response:{status:200,data:{data:[]}}},{loading:false,error:'Manual read failed'}]){const h=fixture();h.c.partnerPage();h.c.flowResults.set(h.c.currentFlow().key,existing);h.flush();assert.equal(h.calls.length,0);}
});
test('loading/configuration/operation/auth gates still block auto reads and do not mark frame attempted',()=>{
  for(const block of [h=>h.c.state.loading=true,h=>h.c.state.connection.configured=false,h=>h.c.state.operations.find(op=>op.endpoint==='Mitra/GetKantorPPAT').enabled=false,h=>h.c.state.operations.find(op=>op.endpoint==='Mitra/GetKantorPPAT').effect='write',h=>h.c.state.operations.find(op=>op.endpoint==='Mitra/GetKantorPPAT').auth='session']){const h=fixture();block(h);h.c.partnerPage();h.flush();assert.equal(h.calls.length,0);assert.equal(h.c.partnerFrame.autoRequested,undefined);}
  const h=fixture();h.c.state.loading=true;h.c.partnerPage();h.c.state.loading=false;h.c.partnerPage();h.flush();assert.equal(h.calls.length,1);
});
