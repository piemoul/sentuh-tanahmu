import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {parseQueueCallsEnvelope,parseQueueCallsJson} from '../private/queue-calls-models.mjs';

const row = (date='2026-10-19T10:11:12.123456Z',extra={}) => ({
  id:'fixture-id',tipe:'fixture-type',pesan:'Pesan',pengirim:'Kantor',penerima:'Pemohon',tanggal_dikirim:date,...extra,
});
const parse = (date,extra) => parseQueueCallsEnvelope({data:[row(date,extra)]}).data[0];
const epoch = date => parse(date).epochMicroseconds;
const rejected = operation => assert.throws(operation,{status:502,code:'QUEUE_CALLS_RESPONSE_UNRECOGNIZED'});
const canonicalMicros = date => (BigInt(Date.parse(date))*1000n).toString();

test('calls use required body.data only and ignore error/message even when flags look unsuccessful', () => {
  for (const error of [undefined,null,true,false,'true',{},42])
    assert.deepEqual(parseQueueCallsEnvelope({error,message:{arbitrary:true},data:[]}),{data:[]});
  let read=0;const body={data:[]};
  for (const key of ['error','message']) Object.defineProperty(body,key,{get(){read++;throw new Error('not consulted');}});
  assert.deepEqual(parseQueueCallsEnvelope(body),{data:[]});assert.equal(read,0);
  for (const body of [{},{message:[]},{Data:[]},{data:null},{data:{}},{data:'[]'},[],null,true,'{"data":[]}'])
    rejected(()=>parseQueueCallsEnvelope(body));
});

test('all six model fields are required Strings even when id/tipe are discarded', () => {
  for (const key of ['id','tipe','pesan','pengirim','penerima','tanggal_dikirim']) {
    const absent=row();delete absent[key];rejected(()=>parseQueueCallsEnvelope({data:[absent]}));
    for (const value of [null,undefined,0,false,[],{},new String('boxed')])
      rejected(()=>parseQueueCallsEnvelope({data:[row(undefined,{[key]:value})]}));
  }
  const value=parse(undefined,{id:'',tipe:'',pesan:'',pengirim:' ',penerima:'<script>inert</script>'});
  assert.equal(value.pesan,'');assert.equal(value.pengirim,' ');assert.equal(value.penerima,'<script>inert</script>');
});

test('calls preserve raw text, order and duplicates while removing identity/type/private extras', () => {
  const first=row('2026-10-19T10:11:12Z',{pesan:'  A +%  ',token:'SINTETIS-TOKEN'}),second=row('2025-01-01',{id:'other'});
  const body={data:[first,second,first]},before=structuredClone(body),result=parseQueueCallsEnvelope(body);
  assert.equal(result.data.length,3);assert.deepEqual(result.data[0],result.data[2]);
  assert.notEqual(result.data[0],result.data[2]);assert.equal(result.data[0].pesan,'  A +%  ');
  assert.equal(result.data[1].tanggal_dikirim,'2025-01-01');
  for (const value of result.data) for (const key of ['id','tipe','token']) assert.equal(Object.hasOwn(value,key),false);
  assert.equal(JSON.stringify(result).includes('SINTETIS-TOKEN'),false);assert.deepEqual(body,before);
});

test('raw JSON is decoded once; direct/nested arrays or String wrappers are not envelopes', () => {
  const body={error:true,data:[row()]};assert.deepEqual(parseQueueCallsJson(JSON.stringify(body)),parseQueueCallsEnvelope(body));
  for (const value of [undefined,null,body,'','{','null','[]','{"data":{"data":[]}}',JSON.stringify(JSON.stringify(body))])
    rejected(()=>parseQueueCallsJson(value));
});

test('model guards reject sparse arrays, non-record rows, inherited fields and known accessors', () => {
  rejected(()=>parseQueueCallsEnvelope({data:new Array(1)}));
  for (const value of [null,[],1,'x',Object.create(row()),new Date()]) rejected(()=>parseQueueCallsEnvelope({data:[value]}));
  let reads=0;
  for (const key of ['id','tipe','pesan','pengirim','penerima','tanggal_dikirim']) {
    const value=row();Object.defineProperty(value,key,{get(){reads++;return 'x';}});
    rejected(()=>parseQueueCallsEnvelope({data:[value]}));
  }
  const value=Object.assign(Object.create(null),row());
  Object.defineProperty(value,'unknown',{get(){reads++;throw new Error('not consulted');}});
  assert.equal(parseQueueCallsEnvelope({data:[value]}).data.length,1);assert.equal(reads,0);
});

test('target DateTime syntax accepts compact dates, partial times and offset variants', () => {
  const base=canonicalMicros('2012-02-27T14:00:00Z');
  for (const date of ['20120227T14Z','2012-0227 140000z','201202-27T14+00','+20120227T14+0000','2012-02-27T14 +00:00'])
    assert.equal(epoch(date),base,date);
  assert.equal(epoch('2002-02-27T14:00:00-0500'),canonicalMicros('2002-02-27T19:00:00Z'));
  assert.equal(epoch('2012-02-27T19:30+0530'),base);
  assert.equal(epoch('2012-02-27T04-10'),base);
});

test('invalid syntax is rejected instead of falling back to host Date.parse', () => {
  for (const date of ['', ' 2020-01-01','2020-01-01 ','2020-01-01Z','2020-1-01','2020-01-1',
    '2020-01-01t00:00:00Z','2020/01/01','01/02/2020','2020-01-01T1Z','2020-01-01T01:02.5Z',
    '2020-01-01T01:02:03.Z','2020-01-01T01:02:03+1','2020-01-01T01:02:03+010203',
    '2020-01-01T00:00:00 UTC','2020-01-01\t00:00:00Z','1234567-01-01T00Z'])
    rejected(()=>parse(date));
});

test('overflow components normalize across months, leap days, clocks and large offsets', () => {
  for (const [input,expected] of [
    ['2020-01-42T00Z','2020-02-11T00:00:00Z'],
    ['2019-02-29T00Z','2019-03-01T00:00:00Z'],
    ['2000-02-29T00Z','2000-02-29T00:00:00Z'],
    ['1900-02-29T00Z','1900-03-01T00:00:00Z'],
    ['2020-00-00T00Z','2019-11-30T00:00:00Z'],
    ['2020-13-01T00Z','2021-01-01T00:00:00Z'],
    ['2020-01-01T24:60:60Z','2020-01-02T01:01:00Z'],
    ['2020-01-01T00:00:60Z','2020-01-01T00:01:00Z'],
    ['2020-01-01T00+99:99','2019-12-27T19:21:00Z'],
  ]) assert.equal(epoch(input),canonicalMicros(expected),input);
});

test('microseconds truncate after six digits and retain pre-epoch fractions exactly', () => {
  for (const [fraction,micros] of [['1','100000'],['01','10000'],['000001','1'],['123456789','123456'],['9999999','999999']]) {
    assert.equal(epoch(`1970-01-01T00:00:00.${fraction}Z`),micros);
    assert.equal(epoch(`1970-01-01T00:00:00,${fraction}Z`),micros);
  }
  assert.equal(epoch('1969-12-31T23:59:59.999999Z'),'-1');
  assert.equal(epoch('1969-12-31T23:59:59.000001Z'),'-999999');
  assert.equal(epoch('1970-01-01T01:00:00.000001+01:00'),'1');
  assert.equal(BigInt(epoch('2500-01-01T00:00:00.000002Z'))-BigInt(epoch('2500-01-01T00:00:00.000001Z')),1n);
});

test('years zero, 99 and negative years have no JavaScript constructor century bias', () => {
  assert.equal(epoch('0000-01-01T00Z'),'-62167219200000000');
  assert.equal(epoch('0099-01-01T00Z'),canonicalMicros('0099-01-01T00:00:00Z'));
  assert.equal(epoch('-0004-12-24T00Z'),canonicalMicros('-000004-12-24T00:00:00Z'));
  assert.equal(parse('0099-01-01').localDateTime.year,99);
  assert.equal(parse('-0004-12-24').localDateTime.year,-4);
});

test('instant bounds retain the full SDK microsecond range without Number rounding', () => {
  const max='8640000000000000000';
  assert.equal(epoch('+275760-09-13T00:00:00Z'),max);
  assert.equal(epoch('-271821-04-20T00:00:00Z'),'-'+max);
  assert.equal(epoch('+275760-09-12T23:59:59.999999Z'),'8639999999999999999');
  assert.equal(epoch('-271821-04-20T00:00:00.000001Z'),'-8639999999999999999');
  assert.equal(epoch('+275760-09-13T01:00:00+01:00'),max);
  for (const date of ['+275760-09-13T00:00:00.000001Z','-271821-04-19T23:59:59.999999Z',
    '+999999-01-01T00Z','-999999-01-01T00Z']) rejected(()=>parse(date));
});

test('naive dates remain normalized civil components with no invented UTC epoch', () => {
  const result=parse('2020-01-42 24:60:60.123456789');
  assert.equal(result.timeKind,'local');assert.equal(result.epochMicroseconds,null);
  assert.deepEqual(result.localDateTime,{year:2020,month:2,day:12,hour:1,minute:1,second:0,microsecond:123456});
  assert.deepEqual(parse('1969-12-31 23:59:59.999999').localDateTime,
    {year:1969,month:12,day:31,hour:23,minute:59,second:59,microsecond:999999});
  assert.deepEqual(parse('19700101').localDateTime,{year:1970,month:1,day:1,hour:0,minute:0,second:0,microsecond:0});
  assert.equal(Object.hasOwn(parse('2020-01-01T00Z'),'localDateTime'),false);
  // Browser-zone rescue near the range edge is deliberately outside this model.
  rejected(()=>parse('+275760-09-13 01:00:00'));
});

test('naive output is unchanged across backend timezone settings, including a DST gap', () => {
  const moduleUrl=new URL('../private/queue-calls-models.mjs',import.meta.url).href;
  const body={data:[row('2026-03-08 02:30:00.000001'),row('2026-11-01 01:30:00.999999')]};
  const script=`import {parseQueueCallsEnvelope} from ${JSON.stringify(moduleUrl)};process.stdout.write(JSON.stringify(parseQueueCallsEnvelope(${JSON.stringify(body)})));`;
  const expected=JSON.stringify(parseQueueCallsEnvelope(body));
  for (const TZ of ['UTC','Asia/Jakarta','America/Los_Angeles']) {
    const result=spawnSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8',env:{...process.env,TZ}});
    assert.equal(result.status,0,result.stderr);assert.equal(result.stdout,expected,TZ);
  }
});

test('one invalid row rejects the whole list and errors never contain payload or date text', () => {
  const marker='SINTETIS-PRIVATE-CALL-MARKER';
  for (const bad of [row(marker),row(undefined,{id:{marker}})])
    assert.throws(()=>parseQueueCallsEnvelope({data:[row(),bad]}),error=>{
      assert.equal(error.code,'QUEUE_CALLS_RESPONSE_UNRECOGNIZED');
      assert.equal(error.status,502);
      assert.equal(`${error.message}\n${JSON.stringify(error)}`.includes(marker),false);
      assert.equal(Object.hasOwn(error,'details'),false);return true;
    });
});
