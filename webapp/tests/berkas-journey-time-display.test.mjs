import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {journeyTimeDisplay,journeyTimeRealmEvidence} from './support/journey-time-formatter.mjs';
import {journeyTimeCases} from './support/journey-time-cases.mjs';
for(const row of journeyTimeCases)test('actual HH:mm vendor: '+row.id,()=>assert.equal(journeyTimeDisplay(row.input),row.expectedDisplay));
test('wrong types are not coerced into date text',()=>{
 let calls=0;const poison={toString(){calls++;throw Error('No coercion');},valueOf(){calls++;throw Error('No coercion');}};
 for(const value of [undefined,true,false,0,-0,42,NaN,Infinity,{},[],()=>1,Symbol('x'),new String('2026-10-21'),new Date(0),2n,Object.create(null),poison])assert.equal(journeyTimeDisplay(value),'-');assert.equal(calls,0);
});
test('actual formatter initializes with string/wasm code generation disabled and no network globals',()=>{
 assert.deepEqual(journeyTimeRealmEvidence.codeGeneration,{strings:false,wasm:false});assert.equal(journeyTimeRealmEvidence.guards.length,3);assert.ok(journeyTimeRealmEvidence.guards.every(row=>row.rejected));assert.equal(journeyTimeRealmEvidence.networkGlobalsAbsent,true);assert.equal(journeyTimeRealmEvidence.readinessResolved,true);assert.deepEqual(journeyTimeRealmEvidence.logs,[]);
});
test('the new library differs only by names and HH:mm output; existing patterns/order stay exact',()=>{
 const read=file=>fs.readFileSync(new URL('../../environment/certificate-date-oracle/'+file,import.meta.url),'utf8');
 const rename=value=>value.replaceAll('CertificateDate','JourneyTime').replaceAll('certificateDate','journeyTime').replaceAll('native_certificate_date.dart','native_journey_time.dart');
 assert.equal(read('lib/native_journey_time.dart'),rename(read('lib/native_certificate_date.dart')).replace("'dd MMMM yyyy'","'HH:mm'"));assert.equal(read('web/journey_time_main.dart'),rename(read('web/main.dart')));assert.equal(read('bin/journey_time_oracle.dart'),rename(read('bin/oracle.dart')));
});
