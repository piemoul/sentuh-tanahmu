// Initialize the shipped formatter in an isolated JavaScript realm. Tests use
// the actual compiled Dart/intl parser and actual production wrapper body.
// No timestamp parser, display stub, transport, or formatter fallback is used.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const files=['webapp/assets/certificate-date/vendor.js','webapp/assets/certificate-date/formatter.js'];
const sources=files.map(file=>fs.readFileSync(new URL('../../../'+file,import.meta.url),'utf8'));
const realm=vm.createContext({console,setTimeout,clearTimeout,setImmediate,queueMicrotask,URL});
realm.self=realm;
vm.runInContext(sources[0],realm,{filename:files[0]});
assert.ok(realm.__sentuhCertificateDateFormatterReady,'actual vendor publishes its initialization promise');
await realm.__sentuhCertificateDateFormatterReady;

const wrapper=sources[1];
assert.equal((wrapper.match(/^import '\.\/vendor\.js';$/gm)||[]).length,1,'one actual vendor dependency');
assert.equal((wrapper.match(/^export function certificateDateDisplay\(/gm)||[]).length,1,'one actual wrapper export');
const executable=wrapper.replace(/^import '\.\/vendor\.js';$/m,'').replace(/^export function certificateDateDisplay\(/m,'function certificateDateDisplay(');
const initialized=await vm.runInContext('(async()=>{\n'+executable+'\nreturn certificateDateDisplay;\n})()',realm,{filename:files[1]});
assert.equal(typeof initialized,'function','actual production wrapper initializes before export');

export const certificateDateDisplay=initialized;
export const certificateDateInputs=files.map((file,index)=>({file,sha256:createHash('sha256').update(sources[index]).digest('hex')}));
