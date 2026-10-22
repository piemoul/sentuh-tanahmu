import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {DARING_FIELDS,DARING_WIRE_KEYS,daringValues,daringSnapshot,daringEditError,daringFinalValidation,daringDateBounds,daringDateFromInput,daringDateForInput} from '../assets/profile/daring-model.js';

// Native form ledger ea736769...29c7b8; callbacks retain raw model strings.
const valid={Nama:'Nama SINTETIS',Nik:'0000000000000000',Tempatlahir:'Kota SINTETIS',TglLahir:'20/10/2009',NoHp:'000000000000'};
test('portable native proof binds exact public labels and edit/aggregate copy without APK dependency',()=>{
 const bytes=fs.readFileSync(new URL('./fixtures/daring-input-native-proof.json',import.meta.url)),proof=JSON.parse(bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),'cd2efe879c73d3a433aac60f03d0e915acf42809797e42108a085ce3c09c9832');assert.equal(proof.nativeEvidence.sha256,'453a59d94bf5fcee88e5590b2a3702b20506b918e08c71397959da4c7caf60e1');assert.deepEqual(DARING_FIELDS.map(f=>f.label),proof.fields.map(f=>f.label));
 const edit=proof.errors.edit;assert.equal(daringEditError('Nama',' '),edit.name_leading_space);assert.equal(daringEditError('Nama',''),edit.name_empty);assert.equal(daringEditError('Nik',''),edit.nik_empty);assert.equal(daringEditError('Nik','0'),edit.nik_short);assert.equal(daringEditError('Tempatlahir',''),edit.place_empty);assert.equal(daringEditError('Tempatlahir','1'),edit.place_pattern);assert.equal(daringEditError('NoHp',''),edit.phone_empty);
 const final=daringFinalValidation({}).errors,expected=proof.errors.aggregate;assert.deepEqual(final,{Nama:expected.name_empty,Nik:expected.nik_empty,Tempatlahir:expected.place_empty,TglLahir:expected.date_empty,NoHp:expected.phone_empty});assert.equal(proof.aggregate.overwritesOriginalStrings,false);assert.equal(proof.formatterConfiguration.nik_phone.format_method_semantics_proven,false);
});
test('native aggregate trims NEXT LINE U+0085 at boundaries without changing captured model',()=>{
 for(const key of ['Nama','Nik','Tempatlahir','NoHp'])assert.equal(daringFinalValidation({...valid,[key]:'\u0085'}).valid,false);
 assert.equal(daringFinalValidation({...valid,Nik:'\u0085'+'0'.repeat(15)+'\u0085'}).valid,false);
 const source={...valid,Nik:'\u0085'+'0'.repeat(16)+'\u0085'};assert.equal(daringFinalValidation(source).valid,true);assert.equal(daringSnapshot(source).Nik,source.Nik);
});
test('native five-field order and independent wire keys exclude email/profile aliases',()=>{
 assert.deepEqual(DARING_FIELDS.map(f=>f.label),['Nama Lengkap','NIK Sesuai KTP','Tempat Lahir','Tanggal Lahir','No. HP (terhubung dengan WhatsApp)']);
 assert.deepEqual(DARING_WIRE_KEYS,['Nik','Nama','Tempatlahir','TglLahir','NoHp']);
 assert.deepEqual(Object.keys(daringSnapshot({...valid,email:'discard',nik:'wrong',phone:'wrong'})),DARING_WIRE_KEYS);
});
test('nullable model fields default empty while wrong nonnull scalar/container types fail',()=>{
 assert.deepEqual(daringValues({}),Object.fromEntries(DARING_WIRE_KEYS.map(k=>[k,''])));
 for(const key of DARING_WIRE_KEYS){assert.equal(daringValues({[key]:null})[key],'');for(const value of [1,false,[],{},new String('boxed')])assert.throws(()=>daringValues({[key]:value}),TypeError);}
});
test('captured wire snapshot preserves raw strings and cannot follow later model edits',()=>{
 const source={...valid,Nama:'  Nama SINTETIS  ',Nik:' 0000000000000000 ',NoHp:' 000 '},snapshot=daringSnapshot(source);source.Nama='changed';
 assert.equal(snapshot.Nama,'  Nama SINTETIS  ');assert.equal(snapshot.Nik,' 0000000000000000 ');assert.equal(snapshot.NoHp,' 000 ');assert.ok(Object.isFrozen(snapshot));assert.throws(()=>{snapshot.NoHp='changed';},TypeError);
});
test('edit leading literal ASCII space precedes raw empty name check',()=>{
 assert.equal(daringEditError('Nama',' '),'Nama tidak boleh diawali spasi');assert.equal(daringEditError('Nama',''),'Nama tidak boleh kosong');assert.equal(daringEditError('Nama','\t'),null);
});
test('NIK callback checks original length rather than a discarded non-digit replacement',()=>{
 assert.equal(daringEditError('Nik',''),'NIK tidak boleh kosong');assert.equal(daringEditError('Nik','0'.repeat(15)),'NIK harus 16 digit');
 for(const text of ['0'.repeat(16),'A'.repeat(16),'0'.repeat(17)])assert.equal(daringEditError('Nik',text),null);
});
test('birthplace edit regex and phone raw-empty error remain distinct from final aggregation',()=>{
 assert.equal(daringEditError('Tempatlahir',''),'Tempat Lahir tidak boleh kosong');assert.equal(daringEditError('Tempatlahir',' Kota'),'Tempat Lahir hanya boleh mengandung huruf dan spasi.');assert.equal(daringEditError('Tempatlahir','Kota\tBaru'),null);
 assert.equal(daringEditError('NoHp',''),'Nomor Telepon tidak boleh kosong');assert.equal(daringEditError('NoHp',' '),null);
 const final=daringFinalValidation({...valid,Tempatlahir:' ',NoHp:' '});assert.equal(final.errors.Tempatlahir,'Tempat lahir tidak boleh kosong');assert.equal(final.errors.NoHp,'Nomor HP tidak boleh kosong');
});
test('final check trims only for checks and does not rerun every edit validator',()=>{
 const source={...valid,Nama:' Nama SINTETIS',Tempatlahir:' Kota',Nik:' 0000000000000000 ',NoHp:' 000 '},before={...source};assert.equal(daringFinalValidation(source).valid,true);assert.deepEqual(source,before);
 assert.notEqual(daringEditError('Nama',source.Nama),null);assert.notEqual(daringEditError('Tempatlahir',source.Tempatlahir),null);
});
test('final check catches trimmed empty inputs, NIK below16 and date absence without coercion',()=>{
 const result=daringFinalValidation({Nama:'\t ',Nik:' 000 ',Tempatlahir:' ',NoHp:'\t',TglLahir:''});assert.equal(result.valid,false);assert.equal(Object.values(result.errors).filter(Boolean).length,5);assert.equal(result.errors.TglLahir,'Tanggal lahir tidak boleh kosong');
 assert.equal(daringFinalValidation({...valid,TglLahir:' '}).valid,true,'Native aggregate checks existing nonempty date string; calendar guarding belongs to the widget adapter.');
});
test('browser calendar conversion respects actual dates and1900-to-local-today bounds without an age18 cap',()=>{
 const today=new Date(2026,9,20,12);assert.deepEqual(daringDateBounds(today),{min:'1900-01-01',max:'2026-10-20'});
 for(const [input,wire]of [['1900-01-01','01/01/1900'],['2000-02-29','29/02/2000'],['2009-10-20','20/10/2009'],['2026-10-20','20/10/2026']]){assert.equal(daringDateFromInput(input,today),wire);assert.equal(daringDateForInput(wire),input);}
 for(const input of ['1899-12-31','2026-10-21','1900-02-29','2024-02-30','2026-2-01','garbage'])assert.throws(()=>daringDateFromInput(input,today),RangeError);
});
test('date adapter preserves clearing and rejects malformed or impossible stored presentation dates',()=>{
 assert.equal(daringDateFromInput(''),'');assert.equal(daringDateForInput(null),'');for(const value of ['31/02/2026','1/01/2000','garbage',42])assert.equal(daringDateForInput(value),'');
 assert.throws(()=>daringDateBounds(new Date(NaN)),TypeError);
});
