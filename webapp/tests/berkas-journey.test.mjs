import test from 'node:test';
import assert from 'node:assert/strict';
import {createJourneySnapshot,journeySnapshotFromBerkas,isJourneySnapshot} from '../assets/berkas-journey/model.js';
import {berkasJourneyView} from '../assets/berkas-journey/view.js';
const row=(name,date=null,current=false,id=' retained ID ')=>({taskNodeGroupId:id,tanggalFlow:date,namaGrup:name,isCurrent:current});
const snapshot=(rows,statusText='1',numberText='123')=>createJourneySnapshot({numberText,statusText,rows});
const format={formatDate:()=> '21 Oktober 2026',formatTime:()=> '07:08'};
const fail={code:'BERKAS_JOURNEY_MODEL'};

test('snapshot copies only four typed BBb fields without changing source, order, nulls or duplicate rows',()=>{
  const duplicate=Object.freeze(row(' same ',null,null,'')),rows=Object.freeze([duplicate,Object.freeze({}),duplicate]);
  const result=snapshot(rows);assert.deepEqual(result.rows.map(value=>value.record),[
    {taskNodeGroupId:'',tanggalFlow:null,namaGrup:' same ',isCurrent:null},
    {taskNodeGroupId:null,tanggalFlow:null,namaGrup:null,isCurrent:null},
    {taskNodeGroupId:'',tanggalFlow:null,namaGrup:' same ',isCurrent:null},
  ]);assert.deepEqual(result.rows.map(value=>value.sourceIndex),[0,1,2]);assert.equal(rows[0],rows[2]);assert.notEqual(result.rows[0].record,duplicate);assert.notEqual(result.rows[0].record,result.rows[2].record);
  assert.equal(isJourneySnapshot(result),true);assert.equal(isJourneySnapshot(structuredClone(result)),false);
  for(const value of [result,result.rows,...result.rows,...result.rows.map(value=>value.record)])assert.equal(Object.isFrozen(value),true);
  assert.throws(()=>{result.rows[0].record.namaGrup='changed';},TypeError);
});

test('only exact zero status prepends blank false task and shifts ordinals without inventing namaProfile',()=>{
  const result=snapshot([row('Actual',null,false,'first')],'0');
  assert.deepEqual(result.rows[0],{record:{taskNodeGroupId:'',tanggalFlow:null,namaGrup:null,isCurrent:false},sourceIndex:null,ordinal:1,state:'current',isLast:false});
  assert.deepEqual(result.rows[1],{record:row('Actual',null,false,'first'),sourceIndex:0,ordinal:2,state:'future',isLast:true});
  for(const status of ['00','0 ',' 0','null','1',''])assert.equal(snapshot([row('Actual')],status).rows.length,1);
  assert.deepEqual(snapshot([],'0').rows.map(value=>[value.record.namaGrup,value.state,value.isLast]),[[null,'current',true]]);
  assert.equal(snapshot([]).activeIndex,-1);assert.deepEqual(snapshot([]).rows,[]);
});

test('last exactly true wins over every date; fallback last raw nonempty date wins without parsing or trimming',()=>{
  const result=snapshot([row('A','later-looking',true),row('B','bad'),row('C',null,true),row('D','2026-12-31')]);
  assert.equal(result.activeIndex,2);assert.deepEqual(result.rows.map(value=>value.state),['past','past','current','future']);
  for(const date of ['   ','not-a-date','\u0085']){const fallback=snapshot([row('A','2026-01-01'),row('B',date),row('C','')]);assert.equal(fallback.activeIndex,1);assert.deepEqual(fallback.rows.map(value=>value.state),['past','current','future']);}
  const first=snapshot([row('A',null),row('B',''),row('C',null,null)]);assert.equal(first.activeIndex,0);assert.deepEqual(first.rows.map(value=>value.state),['current','future','future']);
  assert.equal(snapshot([row('A','date'),row('B','date')],'0').activeIndex,2);
});

test('main caller uses nullable integer String conversion and native journey alias fallback without touching unrelated IDs',()=>{
  const result=journeySnapshotFromBerkas({nomor:123,statusBerkas:0,tahun:2099,namaProfile:'DO NOT INSERT',berkasId:'WRONG TITLE',perjalananBerkas:null,PerjalananBerkas:[row('A')]});
  assert.equal(result.numberText,'123');assert.equal(result.statusText,'0');assert.equal(result.rows.length,2);assert.equal(result.rows[0].record.namaGrup,null);
  assert.equal(journeySnapshotFromBerkas({nomor:null,statusBerkas:null,perjalananBerkas:[]}).numberText,'null');assert.equal(journeySnapshotFromBerkas({perjalananBerkas:[]}).statusText,'null');
  assert.equal(journeySnapshotFromBerkas({nomor:-0,statusBerkas:-0,perjalananBerkas:[],PerjalananBerkas:[row('not selected')]}).rows.length,1);
  for(const value of [undefined,'123',1.5,Infinity,Number.MAX_SAFE_INTEGER+1,1n])assert.throws(()=>journeySnapshotFromBerkas({nomor:value,statusBerkas:1,perjalananBerkas:[]}),fail);
  for(const value of [undefined,'0',true,{},[]])assert.throws(()=>journeySnapshotFromBerkas({nomor:1,statusBerkas:value,perjalananBerkas:[]}),fail);
  for(const value of [null,undefined,{},'[]'])assert.throws(()=>journeySnapshotFromBerkas({nomor:1,statusBerkas:1,perjalananBerkas:value}),fail);
});

test('invalid row fields reject complete snapshot, sparse arrays/getters cannot become tasks and unknown fields stay unread',()=>{
  for(const key of ['taskNodeGroupId','tanggalFlow','namaGrup'])for(const value of [undefined,1,true,{},[]])assert.throws(()=>snapshot([row('ok'),{[key]:value},row('not dropped')]),fail);
  for(const value of [undefined,0,1,'true',{},[]])assert.throws(()=>snapshot([{isCurrent:value}]),fail);
  for(const value of [null,[],true,1,'row'])assert.throws(()=>snapshot([value]),fail);assert.throws(()=>snapshot(new Array(1)),fail);
  let reads=0;for(const value of [{get rows(){reads++;return [];}},{numberText:'1',statusText:'1',rows:[{get namaGrup(){reads++;return 'never';}}]}])assert.throws(()=>createJourneySnapshot(value),fail);
  assert.throws(()=>journeySnapshotFromBerkas({get nomor(){reads++;return 1;},perjalananBerkas:[]}),fail);
  const value=row('kept');Object.defineProperty(value,'unknown',{get(){reads++;throw Error('never');}});assert.equal(snapshot([value]).rows[0].record.namaGrup,'kept');assert.equal(reads,0);
});

test('view binds separate native marker states/future ordinals, final connector and full escaped title/stage text',()=>{
  const result=snapshot([row('<img onerror=bad()>'),row(''),row(null,null,true),row('Future')],'1','<number>&');
  const html=berkasJourneyView(result,format);
  assert.match(html,/Perjalanan Berkas · &lt;number&gt;&amp;/);assert.match(html,/&lt;img onerror=bad\(\)&gt;/);assert.doesNotMatch(html,/<img|data-action=|href=|berkasId|DO NOT INSERT/);
  assert.equal((html.match(/berkas-journey-marker"/g)??[]).length,4);assert.equal((html.match(/berkas-journey-connector"/g)??[]).length,3);
  assert.equal((html.match(/aria-current="step"/g)??[]).length,1);assert.match(html,/>✓<\/span>/);assert.match(html,/>●<\/span>/);assert.match(html,/>4<\/span>/);
  assert.match(html,/<h3><\/h3>/);assert.match(html,/<h3>-<\/h3>/);assert.match(html,/data-berkas-journey-state="future"/);
});

test('date line hides only null/empty, forwards same untouched String to both injected helpers and escapes their outputs',()=>{
  const calls=[],raw=' \u0085 invalid raw ',html=berkasJourneyView(snapshot([row('A',null),row('B',''),row('C',raw),row('D','raw future')]),{
    formatDate:value=>{calls.push(['date',value]);return '<date>';},formatTime:value=>{calls.push(['time',value]);return '07:08 & raw';},
  });assert.deepEqual(calls,[['date',raw],['time',raw],['date','raw future'],['time','raw future']]);assert.equal((html.match(/class="berkas-journey-date"/g)??[]).length,2);assert.match(html,/&lt;date&gt;, 07:08 &amp; raw/);
  const broken=berkasJourneyView(snapshot([row('Bad','not date')]),{formatDate:()=>{throw Error('bad');},formatTime:()=>'-'});assert.match(broken,/>-, -<\/p>/);
});

test('empty view differs from zero placeholder and all125 records remain reachable without truncation or new actions',()=>{
  assert.match(berkasJourneyView(snapshot([]),format),/Belum ada aktivitas/);const zero=berkasJourneyView(snapshot([],'0'),format);assert.doesNotMatch(zero,/Belum ada aktivitas|berkas-journey-date|berkas-journey-connector/);assert.match(zero,/aria-current="step"/);
  const html=berkasJourneyView(snapshot(Array.from({length:125},(_,index)=>row('Unique stage '+index))),format);assert.equal((html.match(/<li /g)??[]).length,125);assert.match(html,/Unique stage 124/);assert.match(html,/>125<\/span>/);
  assert.throws(()=>berkasJourneyView({rows:[]},format),TypeError);assert.throws(()=>berkasJourneyView(snapshot([]),{...format,titleId:'bad" id'}),TypeError);assert.throws(()=>berkasJourneyView(snapshot([]),{formatDate:()=>''}),TypeError);
});
