import test from 'node:test';
import assert from 'node:assert/strict';
import {queueManagedIdentity, queueReadIdentityKeys, queueReadIdentityQuery} from '../private/queue-identity.mjs';

// Synthetic labels are intentionally not government identifiers.
const identity = (nik, extra = {}) => ({id:1,nama:'Nama Uji',noHp:'Telepon Uji',nik,
  tempatLahir:'Tempat Uji',tglLahir:'2026-01-02',fromUserData:true,...extra});
const profile = extra => ({userLevel:2,isIkd:false,nomorIdentitas:'PROFILE-UJI',...extra});

test('queue read identity is taken from verified summary fields, never a sign-in alias',()=>{
  for (const userLevel of [2,3]) {
    assert.equal(queueReadIdentityQuery(profile({userLevel,nomorIndukKependudukan:'LOGIN-NOT-SOURCE'})), 'PROFILE-UJI');
    assert.equal(queueReadIdentityQuery(profile({userLevel,nomorIdentitas:null,nomorIndukKependudukan:'LOGIN-NOT-SOURCE'})),null);
    assert.equal(queueReadIdentityQuery(profile({userLevel,nomorIdentitas:undefined,nomorIndukKependudukan:'LOGIN-NOT-SOURCE'})),null);
  }
});

test('only native profile levels 2 and 3 add a profile identity',()=>{
  const saved=[identity('SAVED-UJI')];
  for (const userLevel of [undefined,null,-1,0,1,4,'2','3']) {
    assert.deepEqual(queueReadIdentityKeys(profile({userLevel}),saved),['SAVED-UJI']);
    assert.equal(queueReadIdentityQuery(profile({userLevel})),null);
  }
  assert.equal(queueReadIdentityQuery(null,saved),'SAVED-UJI');
  assert.equal(queueReadIdentityQuery(undefined),null);
});

test('IKD true skips automatic profile insertion and unknown eligible IKD state fails',()=>{
  assert.deepEqual(queueReadIdentityKeys(profile({isIkd:true}),[identity('SAVED-UJI')]),['SAVED-UJI']);
  assert.equal(queueReadIdentityQuery(profile({isIkd:true})),null);
  for (const isIkd of [null,undefined,0,1,'false','true',[],{}])
    assert.throws(()=>queueReadIdentityQuery(profile({isIkd})),{code:'QUEUE_IDENTITY_UNRECOGNIZED'});
});

test('native read join and duplicate keys keep raw values without a second encode or trimming',()=>{
  const saved=[identity('B +%!*~é'),identity('PROFILE-UJI'),identity('C'),identity('B +%!*~é')];
  const before=structuredClone(saved);
  assert.deepEqual(queueReadIdentityKeys(profile({}),saved),['PROFILE-UJI','B +%!*~é','C']);
  assert.equal(queueReadIdentityQuery(profile({}),saved),'PROFILE-UJI,B +%!*~é,C');
  assert.equal(queueReadIdentityQuery(profile({nomorIdentitas:'  RAW UJI  '})),'  RAW UJI  ');
  assert.deepEqual(saved,before);
  assert.deepEqual(queueReadIdentityKeys(null,[identity('DUP-UJI'),identity('DUP-UJI')]),['DUP-UJI','DUP-UJI']);
  assert.deepEqual(queueReadIdentityKeys(profile({isIkd:true}),[identity('DUP-UJI'),identity('DUP-UJI')]),['DUP-UJI']);
});

test('both empty guards remain distinct from nonempty comma-joined strings',()=>{
  assert.equal(queueReadIdentityQuery(null,[]),null);
  assert.equal(queueReadIdentityQuery(profile({nomorIdentitas:''})),null);
  assert.equal(queueReadIdentityQuery(null,[identity('')]),null);
  assert.equal(queueReadIdentityQuery(profile({nomorIdentitas:''}),[identity('SECOND-UJI')]),',SECOND-UJI');
  assert.deepEqual(queueReadIdentityKeys(profile({nomorIdentitas:''})),['']);
  assert.equal(queueReadIdentityQuery(null,[identity(''),identity('')]),',');
});

test('managed identity storage records require the native types with a safe integer web bound',()=>{
  const valid=identity('SAVED-UJI');
  assert.equal(queueManagedIdentity(valid),valid);
  for(const value of [null,undefined,[],1,'row',Object.create({nik:'inherited'})])
    assert.throws(()=>queueManagedIdentity(value),{code:'QUEUE_IDENTITY_UNRECOGNIZED'});
  for(const key of Object.keys(valid)) {
    const missing={...valid};delete missing[key];
    assert.throws(()=>queueManagedIdentity(missing),{code:'QUEUE_IDENTITY_UNRECOGNIZED'});
    assert.throws(()=>queueManagedIdentity({...valid,[key]:null}),{code:'QUEUE_IDENTITY_UNRECOGNIZED'});
  }
  for(const id of ['1',1.5,Infinity,NaN,Number.MAX_SAFE_INTEGER+1])
    assert.throws(()=>queueManagedIdentity({...valid,id}),{code:'QUEUE_IDENTITY_UNRECOGNIZED'});
  assert.throws(()=>queueReadIdentityKeys(profile({}),[valid,,valid]),{code:'QUEUE_IDENTITY_UNRECOGNIZED'});
  assert.throws(()=>queueReadIdentityKeys(profile({}),{}),{code:'QUEUE_IDENTITY_UNRECOGNIZED'});
});

test('profile identifier cannot silently coerce a non-String summary value',()=>{
  for(const value of [0,1,true,false,[],{}])
    assert.throws(()=>queueReadIdentityQuery(profile({nomorIdentitas:value})),{code:'QUEUE_IDENTITY_UNRECOGNIZED'});
  for(const value of [[],1,'profile',Object.create({userLevel:2})])
    assert.throws(()=>queueReadIdentityQuery(value),{code:'QUEUE_IDENTITY_UNRECOGNIZED'});
});
