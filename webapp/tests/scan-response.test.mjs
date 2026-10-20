import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeScanClassification, scanProfileName} from '../private/scan-response.mjs';

const classifyRejected = body => assert.throws(() => decodeScanClassification(body), {
  status:502, code:'SCAN_CLASSIFICATION_UNRECOGNIZED',
});
const profileResponse = profile => ({status:200,data:{error:false,data:profile}});
const profileRejected = body => assert.throws(() => scanProfileName(body), {
  status:502, code:'SCAN_PROFILE_UNRECOGNIZED',
});

test('Scan classification accepts direct maps and one JSON String, preserving routing values', () => {
  for (const message of ['GetParcelBoundaryById','AktivasiBerkasGeotag','Other','error']) {
    const source={error:false,message,data:' raw: A +% / \u{1f4c4} '};
    const before=structuredClone(source);
    for (const input of [source,JSON.stringify(source)])
      assert.deepEqual(decodeScanClassification(input),{message,data:source.data});
    assert.deepEqual(source,before);
  }
});

test('Scan classifier error true retains the same tuple as false; HTTP handling is external', () => {
  for (const error of [false,true,null])
    assert.deepEqual(decodeScanClassification({error,message:'GetParcelBoundaryById',data:'id'}),{message:'GetParcelBoundaryById',data:'id'});
  assert.deepEqual(decodeScanClassification({data:'id'}),{message:'Unknown Error',data:'id'});
  assert.deepEqual(decodeScanClassification({error:null,message:null,data:''}),{message:'Unknown Error',data:''});
  assert.deepEqual(decodeScanClassification({error:true,message:'',data:'1009'}),{message:'',data:'1009'});
});

test('Scan classifier preserves empty, whitespace and markup strings without coercing or executing them', () => {
  for (const value of ['', '  ', '<img src=x onerror=alert(1)>', 'constructor', '__proto__'])
    assert.deepEqual(decodeScanClassification({message:value,data:value}),{message:value,data:value});
});

test('Scan classification rejects malformed, nested and doubly encoded bodies without another decode', () => {
  for (const body of [null,undefined,true,1,[],new Date(),new Map(),new String('{}'),'', '{', 'null','[]',
    JSON.stringify(JSON.stringify({data:'id'})), {data:{data:'id'}}, {message:{data:'id'}},
    {status:200,data:{message:'GetParcelBoundaryById',data:'id'}}]) classifyRejected(body);
});

test('Scan nullable error/message and required String data reject wrong types on both error branches', () => {
  for (const error of [undefined,0,1,'false','true',[],{}]) classifyRejected({error,data:'id'});
  for (const message of [undefined,0,true,[],{}]) classifyRejected({message,data:'id'});
  for (const error of [false,true]) {
    for (const data of [null,undefined,0,true,[],{},new String('id')]) classifyRejected({error,data});
    classifyRejected({error});
  }
});

test('Scan classification ignores unknown properties and refuses accessors or inherited schema', () => {
  let reads=0;
  const body=Object.assign(Object.create(null),{data:'id'});
  Object.defineProperty(body,'unknown',{get(){reads++;throw new Error('must not read');}});
  assert.deepEqual(decodeScanClassification(body),{message:'Unknown Error',data:'id'});
  classifyRejected(Object.create({data:'id'}));
  for (const key of ['error','message','data']) {
    const value={data:'id'};
    Object.defineProperty(value,key,{get(){reads++;return 'id';}});
    classifyRejected(value);
  }
  assert.equal(reads,0);
  assert.deepEqual(decodeScanClassification('{"__proto__":{"data":"bad"},"data":"good"}'),{message:'Unknown Error',data:'good'});
});

test('Scan errors never expose input data or parser diagnostics', () => {
  const marker='SINTETIS-PRIVATE-SCAN-MARKER';
  for (const body of [`{"data":"${marker}"`,{data:{marker},message:marker}])
    assert.throws(() => decodeScanClassification(body), error => {
      assert.equal(error.code,'SCAN_CLASSIFICATION_UNRECOGNIZED');
      assert.equal(`${error.message}\n${JSON.stringify(error)}`.includes(marker),false);
      assert.equal(Object.hasOwn(error,'details'),false);
      return true;
    });
});

test('Scan name follows nama then email then dash, preserving empty/whitespace and ignoring login aliases', () => {
  const cases=[
    [{nama:'Nama',email:'Email'},'Nama'],
    [{nama:'',email:'Email'},''],
    [{nama:'  ',email:'Email'},'  '],
    [{nama:null,email:' Email '},' Email '],
    [{email:''},''],
    [{nama:null,email:null},'-'],
    [{username:'NOT-A-NAME',nomorIndukKependudukan:'NOT-A-NAME'},'-'],
    [{},'-'],
  ];
  for (const [profile,expected] of cases) {
    const response=profileResponse(profile),before=structuredClone(response);
    assert.equal(scanProfileName(response),expected);
    assert.deepEqual(response,before);
  }
});

test('Scan name requires a decoded current-summary envelope and no second JSON decode or login fallback', () => {
  for (const value of [null,undefined,{},[],JSON.stringify(profileResponse({nama:'Name'})),
    {nama:'Name'}, {status:200,data:JSON.stringify({error:false,data:{nama:'Name'}})},
    {status:200,data:{error:false,data:'{"nama":"Name"}'}},
    {status:200,data:{error:false,data:null}},
    {status:200,data:{error:true,data:{nama:'Name'}}},
    {status:200,data:{data:{nama:'Name'}}},
    {status:401,data:{error:false,data:{nama:'Name'}}}]) profileRejected(value);
  for (const status of [200,201,299])
    assert.equal(scanProfileName({...profileResponse({nama:'Name'}),status}),'Name');
});

test('Scan name validates the whole ayb projection before using even an available name', () => {
  const strings=['userId','username','email','roleName','roleUser','nama','nomorIdentitas',
    'tempatLahir','tanggalLahir','nomorHp','namaKantor','alamatKantor','kantorId','linkedEmailIkd'];
  for (const key of strings) profileRejected(profileResponse({nama:'Name',[key]:42}));
  for (const key of ['userLevel','statusVerifikasi'])
    for (const value of ['2',1.5,Number.MAX_SAFE_INTEGER+1]) profileRejected(profileResponse({nama:'Name',[key]:value}));
  for (const key of ['isIkd','readyToReview']) profileRejected(profileResponse({nama:'Name',[key]:'false'}));
  // Name selection does not impose queue enrollment/eligibility gates.
  assert.equal(scanProfileName(profileResponse({nama:'Name',userLevel:1,isIkd:true})),'Name');
  for (const profile of [{nama:undefined,email:'Email'},{nama:null,email:undefined}]) profileRejected(profileResponse(profile));
});

test('Scan name refuses known accessors without executing them and ignores unknown private extras', () => {
  let reads=0;
  for (const key of ['nama','email']) {
    const profile={nama:'Name'};
    Object.defineProperty(profile,key,{get(){reads++;return 'getter';}});
    profileRejected(profileResponse(profile));
  }
  const profile=Object.assign(Object.create(null),{nama:'Name',token:'SINTETIS-PRIVATE-EXTRA'});
  Object.defineProperty(profile,'unknown',{get(){reads++;throw new Error('must not read');}});
  assert.equal(scanProfileName(profileResponse(profile)),'Name');
  assert.equal(reads,0);
  profileRejected(profileResponse(Object.create({nama:'inherited'})));
});

test('Scan profile errors use their own sanitized code and never expose upstream fields', () => {
  const marker='SINTETIS-PRIVATE-PROFILE-MARKER';
  assert.throws(() => scanProfileName(profileResponse({nama:marker,email:{marker}})), error => {
    assert.equal(error.code,'SCAN_PROFILE_UNRECOGNIZED');
    assert.equal(error.status,502);
    assert.equal(`${error.message}\n${JSON.stringify(error)}`.includes(marker),false);
    assert.equal(Object.hasOwn(error,'details'),false);
    return true;
  });
});
