import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {
  parseQueueListItem, parseQueueDetailItem, parseQueueLocation,
  parseQueueOffice, parseQueueApplicant, parseQueueListEnvelope,
  parseQueueDetailEnvelope, parseQueueListJson, parseQueueDetailJson,
} from '../private/queue-models.mjs';

const invalid = call => assert.throws(call, error => error.code === 'INVALID_QUEUE_RESPONSE');
const unsupported = call => assert.throws(call, error => error.code === 'UNSUPPORTED_QUEUE_NUMBER');
const rawRequired = call => assert.throws(call, error => error.code === 'QUEUE_RAW_JSON_REQUIRED');
const rawDetail = data => parseQueueDetailJson(`{"error":false,"data":${data}}`).data;
const rawCodes = values => rawDetail(`{"booking":[${values.map(value => `{"kode":${value}}`).join(',')}]}`).booking;
const listFields = ['id','nomor','tanggal_antrian','waktu_booking','status','lokasi','loket','pemohon','estimasi_message'];
const detailFields = ['id','nomor','nama','kode','tanggal_antrian'];

test('native missing/null/true error short-circuits data validation for both envelopes', () => {
  for (const [parse, empty] of [[parseQueueListEnvelope, []], [parseQueueDetailEnvelope, null]]) {
    for (const error of [undefined, null, true]) {
      let read = false;
      const body = {error, get data() {read = true; throw new Error('never read');}};
      assert.deepEqual(parse(body), {error:true, data:empty});
      assert.equal(read, false);
    }
    for (const error of [0,1,'false','true',[],{}]) invalid(() => parse({error,data:null}));
    for (const body of [{error:false},{error:false,data:null}]) assert.deepEqual(parse(body),{error:true,data:empty});
  }
});

test('successful empty list differs from failure and empty detail constructs native defaults', () => {
  assert.deepEqual(parseQueueListEnvelope({error:false,data:[]}),{error:false,data:[]});
  assert.deepEqual(parseQueueDetailEnvelope({error:false,data:{}}), {error:false,data:{
    id:'',nomor:'',nama:'',kode:'',tanggal_antrian:'',jumlah_berkas:0,booking:[],
    lokasi:{id:'',nama:'',alamat:''},kantor:{id:'',nama:''},
    pemohon:{nik:'',nama:'',tempat_lahir:'',tanggal_lahir:''},
  }});
});

test('envelopes use exact error/data keys with no message, status, nested envelope, or case aliases', () => {
  assert.deepEqual(parseQueueListEnvelope({Error:false,Data:[],message:'ok',status:200}),{error:true,data:[]});
  assert.deepEqual(parseQueueListEnvelope({error:false,Data:[],message:[]}),{error:true,data:[]});
  assert.deepEqual(parseQueueListEnvelope({error:false,data:[],message:{not:'validated'}}),{error:false,data:[]});
  invalid(() => parseQueueListEnvelope({error:false,data:{data:[]}}));
  invalid(() => parseQueueListEnvelope('{"error":false,"data":[]}'));
  invalid(() => parseQueueDetailEnvelope({error:false,data:[]}));
});

test('every list String field keeps raw text and defaults only for null or absence', () => {
  for (const key of listFields) {
    assert.equal(parseQueueListItem({[key]:'  00 <tag> É \u0000  '})[key], '  00 <tag> É \u0000  ');
    assert.equal(parseQueueListItem({[key]:null})[key], '');
    for (const bad of [0,false,[],{},new String('s')]) invalid(() => parseQueueListItem({[key]:bad}));
  }
  assert.deepEqual(parseQueueListItem({KodeBooking:['alias'],TanggalAntrian:'alias'}), {...Object.fromEntries(listFields.map(key=>[key,''])),kode_booking:[]});
});

test('list kode_booking requires String members and never reuses detail scalar conversion', () => {
  assert.deepEqual(parseQueueListItem({kode_booking:['001','','  A  ','001']}).kode_booking,['001','','  A  ','001']);
  assert.deepEqual(parseQueueListItem({kode_booking:null}).kode_booking,[]);
  for (const bad of [0,'abc',{},new Set(['a'])]) invalid(() => parseQueueListItem({kode_booking:bad}));
  for (const bad of [null,1,false,{},[]]) invalid(() => parseQueueListItem({kode_booking:[bad]}));
  invalid(() => parseQueueListJson('{"error":false,"data":[{"kode_booking":[7]}]}'));
});

test('list preserves all rows and duplicate IDs, returns detached models, and does not mutate input', () => {
  const data = Array.from({length:257},(_,index)=>({id:index%2?'same':'',nomor:`N${index}`,kode_booking:[`K${index}`],unknown:{hidden:true}}));
  const before = JSON.stringify(data), out = parseQueueListEnvelope({error:false,data}).data;
  assert.equal(out.length,257);
  assert.deepEqual(out.map(item=>item.nomor),data.map(item=>item.nomor));
  assert.ok(out.every((item,index)=>item!==data[index] && !Object.hasOwn(item,'unknown')));
  out[0].kode_booking.push('local');
  assert.equal(JSON.stringify(data),before);
});

test('detail String fields and all nested models are strict and do not accept aliases', () => {
  for (const key of detailFields) {
    assert.equal(parseQueueDetailItem({[key]:'  exact  '})[key],'  exact  ');
    assert.equal(parseQueueDetailItem({[key]:null})[key],'');
    for (const bad of [0,true,{},[]]) invalid(() => parseQueueDetailItem({[key]:bad}));
  }
  for (const [parse, keys] of [[parseQueueLocation,['id','nama','alamat']], [parseQueueOffice,['id','nama']], [parseQueueApplicant,['nik','nama','tempat_lahir','tanggal_lahir']]]) {
    for (const key of keys) {
      assert.equal(parse({[key]:' raw '})[key],' raw ');
      assert.equal(parse({[key]:null})[key],'');
      invalid(() => parse({[key]:123}));
    }
    assert.ok(Object.values(parse({Nama:'alias',TanggalLahir:'alias'})).every(value=>value===''));
  }
});

test('nested absent/null objects default but malformed records are rejected', () => {
  for (const key of ['lokasi','kantor','pemohon']) {
    assert.deepEqual(parseQueueDetailItem({[key]:null})[key],parseQueueDetailItem({})[key]);
    for (const value of [false,7,'x',[]]) invalid(() => parseQueueDetailItem({[key]:value}));
    invalid(() => rawDetail(`{"${key}":7}`));
  }
  invalid(() => parseQueueDetailJson('{"error":false,"data":7}'));
  invalid(() => parseQueueListJson('{"error":false,"data":[7]}'));
});

test('applicant token is type validated, omitted from public data, and absent from errors', () => {
  const secret = 'fixture-only-never-public-token';
  const out = parseQueueDetailEnvelope({error:false,data:{pemohon:{nik:'synthetic',token:secret},token:secret,extra:{token:secret}}});
  assert.equal(out.data.pemohon.nik,'synthetic');
  assert.equal(Object.hasOwn(out.data.pemohon,'token'),false);
  assert.equal(JSON.stringify(out).includes(secret),false);
  for (const token of [0,false,{},[]]) invalid(() => parseQueueApplicant({token}));
  assert.deepEqual(parseQueueApplicant({token:null}),parseQueueApplicant({}));
  assert.throws(()=>parseQueueApplicant({token:{secret}}),error=>!JSON.stringify(error).includes(secret) && !error.message.includes(secret));
});

test('booking scalar strings booleans and missing/null values follow exact native branches', () => {
  const input = {booking:[{kode:'  007  '},{kode:true},{kode:false},{kode:null},{},{kode:''},{kode:'  007  '}]};
  const before = JSON.stringify(input);
  assert.deepEqual(parseQueueDetailItem(input).booking,['  007  ','true','false','','','','  007  ']);
  assert.equal(JSON.stringify(input),before);
  assert.deepEqual(parseQueueDetailItem({booking:null}).booking,[]);
  for (const value of [null,7,'text',[],false]) invalid(() => parseQueueDetailItem({booking:[value]}));
  for (const value of ['text',{},false]) invalid(() => parseQueueDetailItem({booking:value}));
});

test('booking conversion never invokes custom object toString or getters', () => {
  let invoked = false;
  const values = [{toString(){invoked=true;return 'code';}}, [], new Date(0), new Number(7), 7n, Symbol('fixture')];
  for (const value of values) invalid(() => parseQueueDetailItem({booking:[{kode:value}]}));
  invalid(() => parseQueueDetailItem({booking:[{get kode(){invoked=true;return 'code';}}]}));
  assert.equal(invoked,false);
});

test('decoded booking numbers require raw JSON instead of guessing int versus double', () => {
  for (const value of [0,-0,7,7.5,NaN,Infinity,9007199254740992]) rawRequired(() => parseQueueDetailItem({booking:[{kode:value}]}));
  assert.deepEqual(rawCodes(['7','7.0','7e0','-0','0.0','-0.0']),['7','7.0','7.0','0','0.0','-0.0']);
});

test('booking signed64 integers remain exact across Smi, Mint, and JS precision boundaries', () => {
  const values = ['0','-1','1073741823','1073741824','-1073741824','-1073741825','9007199254740991','9007199254740992','9007199254740993','9223372036854775807','-9223372036854775808'];
  assert.deepEqual(rawCodes(values),values);
  for (const value of ['9223372036854775808','-9223372036854775809','999999999999999999999999999999999']) unsupported(() => rawCodes([value]));
});

test('double booking codes retain signed zero, decimal .0, scientific thresholds and round-trip digits', () => {
  assert.deepEqual(rawCodes(['7.00','-7.0','1e-6','1e-7','1e20','1e21','-1e21','1.00000000000000025e15','5e-324','1.7976931348623157e308','-1e-9999']),
    ['7.0','-7.0','0.000001','1e-7','100000000000000000000.0','1e+21','-1e+21','1000000000000000.2','5e-324','1.7976931348623157e+308','-0.0']);
  for (const value of ['1e400','-1e400']) unsupported(() => rawCodes([value]));
});

test('all 1079 frozen C++ reference vectors match queue raw-double conversion', () => {
  const bytes = readFileSync(new URL('../../analysis/recovered/queue-model-followup/double-vectors.json',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'4604f01b7909cc6a52fa2b2e021752cadf2b46b6e090e2f6eac465152c4dd370');
  const {rows} = JSON.parse(bytes);
  assert.equal(rows.length,1079);
  for (const row of rows) assert.equal(rawCodes([row.source])[0],row.expected,row.bits);
});

test('jumlah_berkas accepts typed safe integers, preserves signs, and rejects arbitrary coercion', () => {
  for (const value of [undefined,null]) assert.equal(parseQueueDetailItem({jumlah_berkas:value}).jumlah_berkas,0);
  for (const value of [-4,0,7,Number.MAX_SAFE_INTEGER]) assert.equal(parseQueueDetailItem({jumlah_berkas:value}).jumlah_berkas,value);
  assert.equal(Object.is(parseQueueDetailItem({jumlah_berkas:-0}).jumlah_berkas,-0),false);
  for (const value of ['7',false,{},[],7n]) invalid(() => parseQueueDetailItem({jumlah_berkas:value}));
  for (const value of [7.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]) unsupported(() => parseQueueDetailItem({jumlah_berkas:value}));
});

test('raw native int counts are lossless JSON-safe number or wide decimal text; raw doubles fail', () => {
  for (const [source, expected] of [['-0',0],['-7',-7],['9007199254740991',9007199254740991],['9007199254740992','9007199254740992'],['9007199254740993','9007199254740993'],['9223372036854775807','9223372036854775807'],['-9223372036854775808','-9223372036854775808']]) {
    const model=rawDetail(`{"jumlah_berkas":${source}}`);
    assert.equal(model.jumlah_berkas,expected);
    assert.doesNotThrow(()=>JSON.stringify(model));
  }
  for (const source of ['7.0','7e0','-0.0']) invalid(()=>rawDetail(`{"jumlah_berkas":${source}}`));
  for (const source of ['9223372036854775808','-9223372036854775809']) unsupported(()=>rawDetail(`{"jumlah_berkas":${source}}`));
});

test('raw parser preserves envelope short-circuit even when unused numbers exceed model bounds', () => {
  assert.deepEqual(parseQueueDetailJson('{"error":true,"data":{"booking":[{"kode":1e9999}]}}'),{error:true,data:null});
  assert.deepEqual(parseQueueListJson('{"error":false,"data":[],"unused":1e9999}'),{error:false,data:[]});
  assert.deepEqual(rawDetail('{"unused":9223372036854775808}'),parseQueueDetailItem({}));
});

test('raw JSON failures and wrong body shapes produce sanitized errors', () => {
  for (const parse of [parseQueueListJson,parseQueueDetailJson]) {
    for (const text of ['',null,{},'{"sensitive-fixture":"do-not-echo",','[]','7','null','true','"text"']) invalid(()=>parse(text));
    assert.throws(()=>parse('{"sensitive-fixture":"do-not-echo",'),error=>!error.message.includes('do-not-echo') && !JSON.stringify(error).includes('sensitive-fixture'));
  }
});

test('plain JSON record boundary rejects prototypes, sparse arrays and schema accessors', () => {
  for (const value of [new Date(0),new Map(),Object.create({id:'inherited'}),[],null]) invalid(()=>parseQueueListItem(value));
  assert.equal(parseQueueListItem(Object.assign(Object.create(null),{id:'own'})).id,'own');
  invalid(()=>parseQueueListEnvelope({error:false,data:new Array(2)}));
  invalid(()=>parseQueueListItem({kode_booking:new Array(1)}));
  let invoked=false;
  invalid(()=>parseQueueListItem({get id(){invoked=true;return 'bad';}}));
  invalid(()=>parseQueueListEnvelope({get error(){invoked=true;return false;},data:[]}));
  assert.equal(invoked,false);
});

test('raw unknown prototype keys never pollute or survive public normalization', () => {
  const out = parseQueueDetailJson('{"error":false,"data":{"__proto__":{"polluted":true},"constructor":{"token":"fixture-only"},"pemohon":{"__proto__":{"token":"fixture-only"}}}}');
  assert.equal({}.polluted,undefined);
  assert.equal(Object.hasOwn(out.data,'__proto__'),false);
  assert.equal(Object.hasOwn(out.data,'constructor'),false);
  assert.equal(JSON.stringify(out).includes('fixture-only'),false);
});
