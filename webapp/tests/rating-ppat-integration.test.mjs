import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const functions=['isAktaItem','aktaRows','aktaCard','ratingPpatOperation','ratingPpatCurrent','ratingPpatPage','openAktaRating','clearPrivate','navigate','runFlow'];
function setup(){
 const operation={id:'get-ratingppat-getratingquestions-d1d6bc',endpoint:'RatingPPAT/GetRatingQuestions',auth:'session',method:'GET',effect:'read',serviceId:'main',clientProfile:'main',encoding:'none',enabled:true};
 const item={aktaId:' raw-akta ',namaPPAT:' raw-name ',readyToRatingPPAT:true,sertipikatAkta:[{}]},response={status:200,data:{error:false,message:[item]}},reader={response,loading:false},map=new Map([['akta:default',reader]]),captures=[],calls=[];let disposal=0,renders=0;
 const main={contains:button=>button.owned!==false},modal={close(){},innerHTML:''},button={isConnected:true,closest:()=>({dataset:{aktaIndex:'0'}})};
 const context={console,structuredClone,Map,Set,Object,Number,Promise,route:'akta',state:{authenticated:true,loading:false,operations:[operation],connection:{configured:true},results:new Map(),points:[],activity:[]},flowResults:map,logoutPending:false,sessionEpoch:4,detailSequence:9,flowQuery:' raw parent query ',flowPageIndex:3,ready:op=>op.enabled,currentFlow:()=>({key:'akta:default'}),$:selector=>selector==='#main'?main:modal,document:{body:{classList:{remove(){}}}},location:{hash:'#/services'},window:{scrollTo(){}},render:()=>renders++,toast:()=>{},flowPage:()=>'<parent>',certificateText:value=>String(value??'-'),aktaCertificate:()=>'<certificate>',createRatingPPATHost:options=>{captures.push(options);return{html:()=>'<child>',dispose:()=>disposal++,controller:{}};},api:async(path,request)=>{calls.push({path,request});return{result:{status:200,data:{data:[]}}};},resetScanHost(){},resetPersilMaps(){},resetSearchFileNavigation(){},resetPartnerNavigation(){},resetCollectionNavigation(){},resetNewsNavigation(){},routes:{services:'Layanan'},flowTab:'',search:'',group:'',filter:''};
 vm.createContext(context);vm.runInContext(functions.map(name=>{const line=source.split(/\r?\n/).find(line=>line.startsWith('function '+name+'(')||line.startsWith('async function '+name+'('));assert.ok(line,name);return line;}).join('\n'),context);
 return{c:context,item,reader,response,operation,map,button,captures,calls,get disposal(){return disposal;},get renders(){return renders;}};
}
test('native Aktaku eligibility adds a local entry only with certificates and ready null-default true',()=>{
 const h=setup();for(const flag of [true,null,undefined])assert.match(h.c.aktaCard({...h.item,readyToRatingPPAT:flag},12),/data-action="akta-rating" data-index="12"/);for(const patch of [{readyToRatingPPAT:false},{sertipikatAkta:[]},{sertipikatAkta:null}])assert.doesNotMatch(h.c.aktaCard({...h.item,...patch},1),/data-action="akta-rating"/);
});
test('entry retains original source row and raw ID/name; questionnaire GET has no entry parameters',async()=>{
 const h=setup();assert.equal(h.c.openAktaRating(0,h.button),true);const owner=h.map.get('akta:rating');assert.equal(owner.item,h.item);assert.deepEqual({...owner.entry},{aktaId:' raw-akta ',namaPPAT:' raw-name '});assert.equal(h.c.ratingPpatPage(),'<child>');await h.captures[0].read();assert.deepEqual(JSON.parse(JSON.stringify(h.calls)),[{path:'/api/execute',request:{method:'POST',body:{operationId:h.operation.id,values:{}}}}]);assert.equal(h.c.flowQuery,' raw parent query ');assert.equal(h.c.flowPageIndex,3);
});
test('null entry fields become empty strings, never invented labels or lookup IDs',()=>{
 const h=setup();h.item.aktaId=null;h.item.namaPPAT=null;assert.equal(h.c.openAktaRating(0,h.button),true);assert.deepEqual({...h.map.get('akta:rating').entry},{aktaId:'',namaPPAT:''});
});
test('detached/mismatched source controls and unavailable/auth/eligibility gates cannot open child',()=>{
 for(const mutate of [h=>h.button.isConnected=false,h=>h.button.owned=false,h=>h.button.closest=()=>({dataset:{aktaIndex:'1'}}),h=>h.reader.loading=true,h=>h.item.readyToRatingPPAT=false,h=>h.item.sertipikatAkta=[],h=>h.c.state.authenticated=false,h=>h.c.state.loading=true,h=>h.c.state.connection.configured=false,h=>h.operation.enabled=false,h=>h.c.logoutPending=true,h=>h.operation.method='POST',h=>h.operation.auth='optionalSession']){const h=setup();mutate(h);assert.equal(h.c.openAktaRating(0,h.button),false);assert.equal(h.captures.length,0);}
 const h=setup();for(const index of [-1,NaN,0.5,1])assert.equal(h.c.openAktaRating(index,h.button),false);
});
test('back disposes questionnaire and restores parent query/page without refetch',()=>{
 const h=setup();h.c.openAktaRating(0,h.button);h.captures[0].onBack();assert.equal(h.disposal,1);assert.equal(h.map.has('akta:rating'),false);assert.equal(h.c.flowQuery,' raw parent query ');assert.equal(h.c.flowPageIndex,3);assert.equal(h.calls.length,0);
});
test('parent replacement and session/route retirement invalidate pending callbacks without expiring a new owner',()=>{
 for(const mutate of [h=>h.c.route='services',h=>h.c.sessionEpoch++,h=>h.c.detailSequence++,h=>h.map.set('akta:default',{...h.reader}),h=>h.reader.response={...h.response},h=>h.reader.loading=true,h=>h.response.data.message=[{...h.item}]]){const h=setup();h.c.openAktaRating(0,h.button);const opts=h.captures[0],epoch=h.c.sessionEpoch;mutate(h);const after=h.c.sessionEpoch;assert.equal(opts.isCurrent(),false);opts.onSessionError({code:'SESSION_EXPIRED',message:'stale'});assert.equal(h.c.sessionEpoch,after);assert.equal(h.c.state.authenticated,true);assert.ok(after>=epoch);}
});
test('clearPrivate/navigate/reload dispose active child and remove private frame references',async()=>{
 for(const action of ['clearPrivate','navigate','runFlow']){const h=setup();h.c.openAktaRating(0,h.button);const owner=h.map.get('akta:rating');if(action==='runFlow')h.c.currentFlow=()=>null;await h.c[action]();assert.equal(h.disposal,1,action);assert.equal(h.map.has('akta:rating'),false);assert.equal(owner.entry,null);assert.equal(owner.item,null);assert.equal(owner.host,null);}
});
