import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getPublicCatalog} from '../private/operations.mjs';
import {SWAPLOTTING_INITIAL_CAMERA,SWAPLOTTING_FIELDS,SWAPLOTTING_RIGHTS,SWAPLOTTING_BASIS,SWAPLOTTING_TAX,swaplottingReadOperation,swaplottingDisclaimer,swaplottingHasMessage,swaplottingOffices,swaplottingRegions,swaplottingOwnProfile,swaplottingValidate,swaplottingEmptyFields,swaplottingCamera,swaplottingDisclaimerUrl} from '../assets/swaplotting/model.js';

const copy=JSON.parse(readFileSync(new URL('../../analysis/recovered/swaplotting-followup/public-copy.json',import.meta.url)));
const full=()=>({fields:Object.fromEntries(Object.keys(swaplottingEmptyFields()).map(key=>[key,' '])),office:{},region:{},right:'8',basis:'Bukti Lainnya',tax:'Petok D',photos:['synthetic-local-path']});

test('public form copy and literal choice order match the independently frozen APK fixture',()=>{
 assert.deepEqual(SWAPLOTTING_FIELDS.registered.map(row=>row.label),copy.registered.fields);
 assert.deepEqual(['Letak Tanah',...SWAPLOTTING_FIELDS.unregistered.map(row=>row.label)],copy.unregistered.fields);
 assert.deepEqual(SWAPLOTTING_RIGHTS.map(row=>[row.code,row.label]),copy.registered.rights);
 assert.deepEqual(SWAPLOTTING_BASIS,copy.unregistered.basis_options);assert.deepEqual(SWAPLOTTING_TAX,copy.unregistered.tax_options);
 assert.deepEqual(SWAPLOTTING_INITIAL_CAMERA,{lat:-0.792918,lng:116.482347,zoom:4.4746});
});

test('all three reads match the actual public catalog rather than synthesized endpoint metadata',()=>{
 const catalog=getPublicCatalog();
 for(const [kind,path]of [['disclaimer','Map/GetDisclaimer'],['offices','legacy/Kantah'],['regions','legacy/Wilayah']]){
  const operation=swaplottingReadOperation(catalog,kind);assert.ok(operation,kind);assert.equal(operation.path,path);
  for(const [key,value]of Object.entries({id:'wrong',path:'other',method:'POST',encoding:'json',serviceId:'other',clientProfile:'guestbook-read',auth:'none',effect:'write',enabled:false}))assert.equal(swaplottingReadOperation([{...operation,[key]:value}],kind),null,`${kind}/${key}`);
  assert.equal(swaplottingReadOperation(catalog,kind,()=>false),null);
 }
 assert.equal(swaplottingReadOperation(catalog,'submit'),null);assert.equal(swaplottingReadOperation({},'offices'),null);
});

test('disclaimer is direct nullable text, with only one conditional JSON String decode',()=>{
 const input={message:' ',message2:'<raw>',message3:null,url:'https://example.test/',error:true,data:{message:'wrong'}};
 assert.deepEqual(swaplottingDisclaimer(input),{message:' ',message2:'<raw>',message3:null,url:'https://example.test/'});
 assert.deepEqual(swaplottingDisclaimer(JSON.stringify(input)),swaplottingDisclaimer(input));
 for(const input of [null,[],true,3,'bad',JSON.stringify(JSON.stringify({message:'x'})),{message:1},{message2:false},{message3:[]},{url:{}}])assert.throws(()=>swaplottingDisclaimer(input));
 for(const message of [undefined,null,''])assert.equal(swaplottingHasMessage(swaplottingDisclaimer({message})),false);
 for(const message of [' ','\u0085','0'])assert.equal(swaplottingHasMessage(swaplottingDisclaimer({message})),true);
});

test('full office typing precedes two-field projection and preserves IDs, ordering and duplicates',()=>{
 const input=[{KantorId:' raw office ',Nama:'B',TipeKantorId:3,Alamat:null},{KantorId:' raw office ',Nama:'A'}],before=structuredClone(input);
 assert.deepEqual(swaplottingOffices(input),[{KantorId:' raw office ',Nama:'B'},{KantorId:' raw office ',Nama:'A'}]);assert.deepEqual(input,before);
 for(const key of ['Alamat','Email','Fax','KantorId','Nama','Telp','Kota'])assert.throws(()=>swaplottingOffices([{KantorId:'ok'},{[key]:4}]));
 for(const TipeKantorId of ['3',true,1.5,Infinity])assert.throws(()=>swaplottingOffices([{TipeKantorId}]));
 assert.deepEqual(swaplottingOffices([{}]),[{KantorId:null,Nama:null}]);
 for(const invalid of [null,{},'[]',[null],Array(1)])assert.throws(()=>swaplottingOffices(invalid));
});

test('desa picks WilayahId and validates all Cyb fields without Kode substitution',()=>{
 const input=[{Kode:'wrong',WilayahId:' original region ',Nama:'X',TipeWilayah:'5'}];
 assert.deepEqual(swaplottingRegions(input),[{code:' original region ',name:'X'}]);
 assert.deepEqual(swaplottingRegions([{Kode:'not-a-selection-id'}]),[{code:null,name:null}]);
 for(const key of ['Kode','WilayahId','Nama','TipeWilayah'])assert.throws(()=>swaplottingRegions([{[key]:1}]));
 for(const invalid of [null,{},[null],Array(1)])assert.throws(()=>swaplottingRegions(invalid));
});

test('own candidate is exclusively the level2/3 non-IKD account-summary contact projection',()=>{
 for(const userLevel of [2,3])assert.deepEqual(swaplottingOwnProfile({userLevel,isIkd:false,nama:' Raw ',nomorHp:' 00 ',email:' A&B ',nomorIdentitas:'not-displayed',tanggalLahir:'not-parsed'}),{name:' Raw ',phone:' 00 ',email:' A&B '});
 assert.deepEqual(swaplottingOwnProfile({userLevel:2,isIkd:false,nama:null,email:null}),{name:'',phone:'',email:''});
 for(const userLevel of [0,1,4,'2',null,undefined,2.1,true])assert.equal(swaplottingOwnProfile({userLevel,isIkd:false,nama:'A'}),null);
 for(const isIkd of [true,null,undefined,0,'false'])assert.equal(swaplottingOwnProfile({userLevel:2,isIkd,nama:'A'}),null);
 for(const key of ['nama','nomorHp','email'])assert.equal(swaplottingOwnProfile({userLevel:2,isIkd:false,[key]:7}),null);
 assert.equal(swaplottingOwnProfile({name:'signin',phone:'signin',email:'signin',nik:'signin'}),null);
 assert.deepEqual(Object.keys(swaplottingOwnProfile({userLevel:2,isIkd:false})),['name','phone','email']);
});

test('registered nine and unregistered fourteen predicates are raw nonempty/non-null only',()=>{
 const empty={fields:swaplottingEmptyFields()};
 assert.equal(swaplottingValidate('registered',empty).missing.length,9);assert.equal(swaplottingValidate('unregistered',empty).missing.length,14);
 for(const kind of ['registered','unregistered']){
  const draft=full();assert.equal(swaplottingValidate(kind,draft).ok,true);
  for(const key of Object.keys(swaplottingValidate(kind,empty).flags)){
   const broken=full();if(key in broken.fields)broken.fields[key]='';else broken[key]=key==='photos'?[]:null;
   const verdict=swaplottingValidate(kind,broken);assert.deepEqual(verdict.missing,[key]);assert.equal(verdict.flags[key],true);assert.equal(typeof verdict.errors[key],'string');
  }
 }
 const raw=full();raw.fields.email='not email';raw.fields.phone='A';raw.point=null;raw.right='2';assert.equal(swaplottingValidate('registered',raw).ok,true);raw.region=null;assert.equal(swaplottingValidate('registered',raw).ok,false);
 assert.throws(()=>swaplottingValidate('registered',{...full(),photos:{length:1}}));assert.throws(()=>swaplottingValidate('registered',{...full(),fields:{...full().fields,name:3}}));assert.throws(()=>swaplottingValidate('other',full()));
});

test('camera retains fractional zoom; browser URL policy never turns arbitrary text into navigation',()=>{
 assert.deepEqual(swaplottingCamera(SWAPLOTTING_INITIAL_CAMERA,{zoomRequired:true}),SWAPLOTTING_INITIAL_CAMERA);
 for(const raw of [{lat:91,lng:0},{lat:0,lng:181},{lat:0,lng:0,zoom:Infinity},{lat:0,lng:0,zoom:22},{lat:'0',lng:0}])assert.throws(()=>swaplottingCamera(raw));
 for(const raw of ['javascript:alert(1)','data:text/html,x','//evil.test/','https://user:secret@example.test/','https://example.test/\n'])assert.equal(swaplottingDisclaimerUrl(raw),null);
 assert.equal(swaplottingDisclaimerUrl('https://example.test/path?q=1&x=2'),'https://example.test/path?q=1&x=2');
});
