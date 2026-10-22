// Actual compiled Dart/intl vendor and actual wrapper in a CSP-like isolated
// realm. No parser/display stub, browser, provider or Date.parse fallback.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const files=['webapp/assets/berkas-journey/time-vendor.js','webapp/assets/berkas-journey/time-formatter.js'];
const sources=files.map(file=>fs.readFileSync(new URL('../../../'+file,import.meta.url),'utf8'));
const logs=[];
const realm=vm.createContext({console:{log:(...values)=>logs.push(values.map(String).join(' ')),warn:(...values)=>logs.push(values.map(String).join(' ')),error:(...values)=>logs.push(values.map(String).join(' '))},setTimeout,clearTimeout,setImmediate,clearImmediate,queueMicrotask,URL},{name:'journey-time-actual-vendor',codeGeneration:{strings:false,wasm:false}});
realm.self=realm;
assert.equal(vm.runInContext('self===globalThis',realm),true);
assert.equal(vm.runInContext('typeof fetch+":"+typeof XMLHttpRequest+":"+typeof process',realm),'undefined:undefined:undefined');
const guards=[];
for(const [kind,source]of [['eval','eval("1+1")'],['Function','new Function("return 1")()'],['WebAssembly','new WebAssembly.Module(new Uint8Array([0,97,115,109,1,0,0,0]))']]){
 let failure;try{vm.runInContext(source,realm);}catch(error){failure=error;}assert.ok(failure,kind+' must be disabled');assert.match(failure.message,/code generation|codegen|disallowed/i);guards.push({kind,rejected:true,errorName:failure.name});
}
vm.runInContext(sources[0],realm,{filename:files[0],timeout:10000});
assert.ok(realm.__sentuhJourneyTimeFormatterReady&&typeof realm.__sentuhJourneyTimeFormatterReady.then==='function');
let timer;await Promise.race([realm.__sentuhJourneyTimeFormatterReady,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Journey formatter initialization timeout')),10000);})]).finally(()=>clearTimeout(timer));
assert.equal(typeof realm.__sentuhJourneyTimeFormatter,'function');
assert.equal((sources[1].match(/^import '\.\/time-vendor\.js';$/gm)??[]).length,1);
assert.equal((sources[1].match(/^export function journeyTimeDisplay\(/gm)??[]).length,1);
const executable=sources[1].replace(/^import '\.\/time-vendor\.js';$/m,'').replace(/^export function journeyTimeDisplay\(/m,'function journeyTimeDisplay(');
export const journeyTimeDisplay=await vm.runInContext('(async()=>{\n'+executable+'\nreturn journeyTimeDisplay;\n})()',realm,{filename:files[1]});
assert.equal(typeof journeyTimeDisplay,'function');
export const journeyTimeInputs=files.map((file,index)=>({file,sha256:createHash('sha256').update(sources[index]).digest('hex')}));
export const journeyTimeRealmEvidence={codeGeneration:{strings:false,wasm:false},guards,networkGlobalsAbsent:true,readinessResolved:true,logs};
