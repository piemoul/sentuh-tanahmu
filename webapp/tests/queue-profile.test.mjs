import test from 'node:test';
import assert from 'node:assert/strict';
import {parseQueueProfileResponse} from '../private/queue-profile.mjs';
import {queueReadIdentityQuery} from '../private/queue-identity.mjs';

const stringFields = ['userId','username','email','roleName','roleUser','nama',
  'nomorIdentitas','tempatLahir','tanggalLahir','nomorHp','namaKantor',
  'alamatKantor','kantorId','linkedEmailIkd'];
const integerFields = ['userLevel','statusVerifikasi'];
const booleanFields = ['isIkd','readyToReview'];
const profile = extra => ({
  ...Object.fromEntries(stringFields.map(key => [key, `SINTETIS-${key}`])),
  userLevel:2, statusVerifikasi:1, isIkd:false, readyToReview:true, ...extra,
});
const response = (data = profile(), extra = {}) => ({status:200,data:{error:false,message:null,data},...extra});
const rejected = value => assert.throws(() => parseQueueProfileResponse(value), {
  status:502,code:'QUEUE_PROFILE_UNRECOGNIZED',
});

test('queue profile validates full native ayb shape and returns only its read projection', () => {
  const source = response(profile({nomorIdentitas:'  ID-SINTETIS +%  ',token:'EXTRA-NOT-RETAINED'}));
  const before = structuredClone(source);
  const result = parseQueueProfileResponse(source);
  assert.deepEqual(result,{userLevel:2,isIkd:false,nomorIdentitas:'  ID-SINTETIS +%  '});
  assert.deepEqual(source,before);
  assert.notEqual(parseQueueProfileResponse(source),result);
});

test('queue profile accepts shared successful 2xx status without inventing HTTP200-only behavior', () => {
  for (const status of [200,201,204,206,299])
    assert.equal(parseQueueProfileResponse(response(profile(),{status})).userLevel,2);
  for (const status of [null,undefined,0,199,300,301,400,401,403,500,200.5,NaN,Infinity,'200',true])
    rejected(response(profile(),{status}));
  const missing=response();delete missing.status;rejected(missing);
  rejected({status:204,data:null});
});

test('queue profile consumes decoded objects only and never performs a second JSON decode', () => {
  for (const value of [null,undefined,[],true,'{}',JSON.stringify(response()),new Date()]) rejected(value);
  for (const data of [null,undefined,[],0,'',JSON.stringify(response().data)]) rejected({status:200,data});
  for (const data of [null,undefined,[],1,true,JSON.stringify(profile())]) {
    const value=response();value.data.data=data;rejected(value);
  }
  const missing=response();delete missing.data.data;rejected(missing);
});

test('queue profile requires the main ApiClient successful error flag even with plausible identity data', () => {
  for (const error of [true,null,undefined,0,1,'false','true',[],{}]) {
    const value=response();value.data.error=error;rejected(value);
  }
  const missing=response();delete missing.data.error;rejected(missing);
});

test('queue profile preserves nullable envelope message semantics without exposing it', () => {
  for (const message of [null,'','Pesan sintetis','<script>not rendered</script>']) {
    const value=response();value.data.message=message;
    assert.equal(Object.hasOwn(parseQueueProfileResponse(value),'message'),false);
  }
  const missing=response();delete missing.data.message;assert.equal(parseQueueProfileResponse(missing).userLevel,2);
  for (const message of [undefined,1,true,[],{}]) {
    const value=response();value.data.message=message;rejected(value);
  }
});

test('all fourteen native nullable Strings are validated even when absent from the output', () => {
  for (const key of stringFields) {
    for (const value of [null,'','  raw /+% <text>  ']) parseQueueProfileResponse(response(profile({[key]:value})));
    const missing=profile();delete missing[key];parseQueueProfileResponse(response(missing));
    for (const value of [undefined,0,1,true,false,[],{},1n,new String('boxed')])
      rejected(response(profile({[key]:value})));
  }
  // Date formatting belongs to native identity construction, not ayb parsing.
  assert.equal(parseQueueProfileResponse(response(profile({tanggalLahir:'not a date'}))).userLevel,2);
});

test('both native nullable integers use a documented safe-number subset of signed64', () => {
  for (const key of integerFields) {
    for (const value of [null,0,-1,2,3,Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER])
      parseQueueProfileResponse(response(profile({[key]:value})));
    const missing=profile();delete missing[key];parseQueueProfileResponse(response(missing));
    for (const value of [undefined,'2',true,1.5,NaN,Infinity,-Infinity,2n,Number.MAX_SAFE_INTEGER+1,Number.MIN_SAFE_INTEGER-1])
      rejected(response(profile({[key]:value})));
  }
});

test('both native nullable Booleans reject coercion independently of eligibility', () => {
  for (const key of booleanFields) {
    for (const value of [null,false,true]) parseQueueProfileResponse(response(profile({[key]:value})));
    const missing=profile();delete missing[key];parseQueueProfileResponse(response(missing));
    for (const value of [undefined,0,1,'false','true',[],{}])
      rejected(response(profile({userLevel:1,[key]:value})));
  }
});

test('missing nullable values become null and login aliases never supply a profile identity', () => {
  assert.deepEqual(parseQueueProfileResponse(response({})),{userLevel:null,isIkd:null,nomorIdentitas:null});
  const source=response({userLevel:3,isIkd:false,nomorIndukKependudukan:'LOGIN-ALIAS-NOT-SOURCE'});
  assert.deepEqual(parseQueueProfileResponse(source),{userLevel:3,isIkd:false,nomorIdentitas:null});
  assert.equal(queueReadIdentityQuery(parseQueueProfileResponse(source)),null);
});

test('own data-property validation ignores unknown keys and refuses inherited profiles or accessors', () => {
  const nullPrototype=Object.assign(Object.create(null),profile());
  assert.equal(parseQueueProfileResponse(response(nullPrototype)).userLevel,2);
  rejected(response(Object.create(profile())));
  rejected(Object.create(response()));
  let reads=0;
  for (const [target,key] of [['result','status'],['body','error'],['body','data'],['profile','nomorIdentitas'],['profile','nama']]) {
    const value=response();const object=target==='result'?value:target==='body'?value.data:value.data.data;
    Object.defineProperty(object,key,{get(){reads++;return key==='status'?200:'getter-value';}});
    rejected(value);
  }
  const value=response();
  Object.defineProperty(value.data.data,'unusedUnknown',{get(){reads++;throw new Error('must not read');}});
  assert.equal(parseQueueProfileResponse(value).userLevel,2);
  assert.equal(reads,0);
  const inheritedKey=Object.assign(Object.create(null),{userLevel:2,isIkd:false});
  assert.equal(parseQueueProfileResponse(response(inheritedKey)).nomorIdentitas,null);
});

test('queue profile errors contain no upstream identity or diagnostic values', () => {
  const marker='SINTETIS-SENSITIVE-MARKER';
  const value=response(profile({nomorIdentitas:marker,nama:{unexpected:marker}}));
  value.data.message=marker;
  assert.throws(() => parseQueueProfileResponse(value), error => {
    assert.equal(error.code,'QUEUE_PROFILE_UNRECOGNIZED');
    assert.equal(error.status,502);
    assert.equal(`${error.message}\n${JSON.stringify(error)}`.includes(marker),false);
    assert.equal(Object.hasOwn(error,'details'),false);
    return true;
  });
});

test('parsed profile composes with native read-only identity gates without enrolling identities', () => {
  const query = extra => queueReadIdentityQuery(parseQueueProfileResponse(response(profile(extra))));
  for (const userLevel of [2,3]) assert.equal(query({userLevel}),'SINTETIS-nomorIdentitas');
  for (const userLevel of [null,-1,0,1,4]) assert.equal(query({userLevel}),null);
  assert.equal(query({isIkd:true}),null);
  assert.equal(query({nomorIdentitas:''}),null);
  assert.equal(query({nomorIdentitas:null}),null);
  assert.throws(() => query({isIkd:null}),{code:'QUEUE_IDENTITY_UNRECOGNIZED'});
});
