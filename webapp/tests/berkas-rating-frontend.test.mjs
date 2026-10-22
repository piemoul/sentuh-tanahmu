import test from 'node:test';
import assert from 'node:assert/strict';
import {BERKAS_RATING_COPY,berkasRatingEntry,berkasRatingPrompt,berkasRatingTrim,berkasRatingValid,berkasRatingValues,berkasRatingResult} from '../assets/berkas-rating/model.js';
import {createBerkasRating} from '../assets/berkas-rating/controller.js';
import {berkasRatingView} from '../assets/berkas-rating/view.js';
const entry={numberYear:' 12/2026 ',officeName:'<Office>'};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function setup({write=async()=>({error:false,message:'received'}),onResult=()=>{},changed=()=>{}}={}){
 const writes=[],results=[],sessions=[],changes=[];let current=true,available=true;
 const c=createBerkasRating({entry,write:value=>{writes.push(structuredClone(value));return write(value);},writeAvailable:()=>available,isCurrent:()=>current,changed:value=>{changes.push(value);changed(value);},onResult:value=>{results.push(value);onResult(value);},onSessionError:error=>sessions.push(error)});
 return {c,writes,results,sessions,changes,retire:()=>current=false,setAvailable:value=>available=value};
}
const ready=h=>{h.c.choose(3);h.c.comment(' \u0085raw\n text \u0085');return h;};
const ordinary=(error,message)=>({error,message,exceptional:false,accepted:error===false,delivery:'received'});

test('entry projects only native prompt display strings and never a raw selected ID',()=>{
 const source={...entry,berkasId:'DO NOT EXPOSE',contextId:'NOT DISPLAYED'},value=berkasRatingEntry(source);assert.deepEqual(value,entry);source.numberYear='changed';assert.deepEqual(value,entry);
 assert.equal(berkasRatingPrompt(value),'Berikan rating kamu untuk Berkas no.  12/2026  Kantor Pertanahan <Office>');
 for(const value of [null,[],{}, {...entry,numberYear:null},{...entry,officeName:123}])assert.throws(()=>berkasRatingEntry(value));
 assert.throws(()=>createBerkasRating({entry}));
});
test('native trim includes NEL and BOM while retaining interior whitespace and exact case',()=>{
 assert.equal(berkasRatingTrim('\u0085\ufeff \n\tRaw \u0085text\n\u00a0'),'Raw \u0085text');assert.equal(berkasRatingTrim('\u0085\u202f\u3000'),'');assert.equal(berkasRatingTrim(' a\r\nb '),'a\r\nb');assert.equal(berkasRatingTrim(null),null);
 assert.deepEqual(berkasRatingValues(4,' \u0085raw\n text\u0085 '),{rating:4,userComment:'raw\n text'});
});
test('only the five native integer tap values and nonempty native-trimmed comment are valid',()=>{
 for(let rating=1;rating<=5;rating++)assert.equal(berkasRatingValid(rating,'text'),true);
 for(const rating of [0,6,-1,2.5,NaN,Infinity,'2',null]){assert.equal(berkasRatingValid(rating,'text'),false);assert.throws(()=>berkasRatingValues(rating,'text'));}
 for(const comment of [null,undefined,1,'',' \u0085\ufeff\t\n']){assert.equal(berkasRatingValid(2,comment),false);assert.throws(()=>berkasRatingValues(2,comment));}
});
test('normal result decoding requires bool and String; empty and whitespace messages remain unchanged',()=>{
 for(const result of [{error:false,message:''},{error:true,message:'  '},{error:false,message:'<literal>'}])assert.deepEqual(berkasRatingResult({...result,extra:'ignored'}),result);
 assert.deepEqual(berkasRatingResult({error:false,message:'normal',exceptional:false}),{error:false,message:'normal'});
 for(const result of [null,[],[false,'text'],{}, {error:'false',message:'text'},{error:0,message:'text'},{error:false,message:null},{error:true,message:{}},{error:false,message:'not normal',exceptional:true}])assert.throws(()=>berkasRatingResult(result));
});
test('composer defaults are rating zero, null comment and nonbusy with disabled send',async()=>{
 const h=setup(),s=h.c.snapshot();assert.equal(s.rating,0);assert.equal(s.comment,null);assert.equal(s.pending,false);assert.equal(s.canSubmit,false);assert.equal(s.canCancel,true);assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,0);assert.equal(h.c.snapshot().error,BERKAS_RATING_COPY.invalid);
 h.c.choose(3);for(const comment of ['', '\u0085 \t']){h.c.comment(comment);assert.equal(h.c.snapshot().canSubmit,false);assert.equal(await h.c.submit(),false);}assert.equal(h.writes.length,0);
});
test('one explicit click sends only rating and the native-trimmed comment, retaining the raw draft',async()=>{
 const h=ready(setup());assert.equal(await h.c.submit(),true);assert.deepEqual(h.writes,[{rating:3,userComment:'raw\n text'}]);assert.equal(h.c.snapshot().comment,' \u0085raw\n text \u0085');assert.deepEqual(h.results,[ordinary(false,'received')]);assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,1);
});
test('module invents no maximum comment length or half-star input',async()=>{
 const h=setup(),text='unicode \ud83c\uddee\ud83c\udde9\n'.repeat(4000);assert.equal(h.c.choose(2.5),false);h.c.choose(5);h.c.comment(text);await h.c.submit();assert.equal(h.writes[0].userComment,text.trim());assert.equal(h.writes[0].rating,5);
});
test('write availability is dynamic and cannot dispatch a disabled send',async()=>{
 const h=ready(setup());h.setAvailable(false);assert.equal(h.c.snapshot().canSubmit,false);assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,0);h.setAvailable(true);assert.equal(h.c.snapshot().canSubmit,true);assert.equal(await h.c.submit(),true);
});
test('pending lock is synchronous and rejects duplicate send, cancellation, rating and comment changes',async()=>{
 const wait=deferred(),h=ready(setup({write:()=>wait.promise})),work=h.c.submit(),before=h.c.snapshot();assert.equal(before.pending,true);assert.equal(before.canCancel,false);assert.equal(before.canSubmit,false);assert.equal(await h.c.submit(),false);assert.equal(h.c.cancel(),false);assert.equal(h.c.choose(1),false);assert.equal(h.c.comment('replacement'),false);assert.deepEqual(h.c.snapshot(),before);assert.equal(h.writes.length,1);
 wait.resolve({error:true,message:''});assert.equal(await work,true);assert.deepEqual(h.results,[ordinary(true,'')]);assert.equal(h.c.snapshot().pending,false);assert.equal(h.c.snapshot().locked,true);
});
test('verified not_sent rejection preserves draft and allows only a new explicit send',async()=>{
 let calls=0;const h=ready(setup({write:async()=>{if(++calls===1)throw Object.assign(new Error('<local rejection>'),{code:'CSRF_REJECTED',delivery:'not_sent'});return {error:false,message:'next'};}}));
 assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,1);assert.equal(h.c.snapshot().error,'<local rejection>');assert.equal(h.c.snapshot().canSubmit,true);assert.deepEqual(h.results,[]);await new Promise(resolve=>setImmediate(resolve));assert.equal(h.writes.length,1);
 assert.equal(await h.c.submit(),true);assert.deepEqual(h.results,[ordinary(false,'next')]);assert.equal(h.writes.length,2);
});
test('unknown transport delivery preserves native exceptional false flag without an acceptance claim or replay',async()=>{
 const h=ready(setup({write:async()=>{throw Object.assign(new Error('timeout'),{code:'UPSTREAM_TIMEOUT',delivery:'unknown'});}}));assert.equal(await h.c.submit(),true);
 assert.deepEqual(h.results,[{error:false,message:BERKAS_RATING_COPY.fallback,exceptional:true,accepted:false,delivery:'unknown'}]);assert.equal(h.c.snapshot().locked,true);assert.equal(h.c.snapshot().canSubmit,false);assert.equal(await h.c.submit(),false);assert.equal(h.c.choose(4),false);assert.equal(h.c.comment('retry'),false);assert.equal(h.writes.length,1);
});
test('malformed or synchronous writer failures use one exceptional outcome rather than truthy success',async()=>{
 for(const write of [()=>{throw new Error('synchronous');},async()=>({error:'false',message:'bad'}),async()=>({error:false,message:null}),async()=>null]){const h=ready(setup({write}));assert.equal(await h.c.submit(),true);assert.equal(h.results.length,1);assert.equal(h.results[0].exceptional,true);assert.equal(h.results[0].accepted,false);assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,1);}
});
test('both ordinary bool flags and native service catch text are delivered literally once',async()=>{
 for(const result of [{error:false,message:''},{error:true,message:'   '},{error:true,message:BERKAS_RATING_COPY.fallback},{error:false,message:'<img src=x onerror=bad()>'}]){const h=ready(setup({write:async()=>result}));await h.c.submit();assert.deepEqual(h.results,[ordinary(result.error,result.message)]);assert.equal(h.c.snapshot().result.exceptional,false);assert.equal(await h.c.submit(),false);}
});
test('three actual auth codes notify only the parent session handler while a plain HTTP_401 stays exceptional',async()=>{
 for(const code of ['AUTH_REQUIRED','LOGIN_REQUIRED','SESSION_EXPIRED','HTTP_401']){const error=Object.assign(new Error('failure'),{code}),h=ready(setup({write:async()=>{throw error;}}));await h.c.submit();if(code==='HTTP_401'){assert.equal(h.results[0].exceptional,true);assert.deepEqual(h.sessions,[]);}else{assert.deepEqual(h.sessions,[error]);assert.deepEqual(h.results,[]);assert.equal(h.c.snapshot().locked,true);}assert.equal(h.writes.length,1);}
});
test('SESSION_CHANGED locks the retired context without clearing another login or retrying',async()=>{
 const h=ready(setup({write:async()=>{throw Object.assign(new Error('<source changed>'),{code:'SESSION_CHANGED',delivery:'not_sent'});}}));assert.equal(await h.c.submit(),false);assert.equal(h.c.snapshot().locked,true);assert.equal(h.c.snapshot().error,'<source changed>');assert.equal(h.c.snapshot().canCancel,true);assert.equal(await h.c.submit(),false);assert.equal(h.c.comment('changed'),false);assert.deepEqual(h.sessions,[]);assert.deepEqual(h.results,[]);assert.equal(h.writes.length,1);
});
test('a throwing parent auth callback cannot convert rejection into acceptance or another write',async()=>{
 const writes=[],error=Object.assign(new Error('expired'),{code:'SESSION_EXPIRED'}),c=createBerkasRating({entry,write:async values=>{writes.push(values);throw error;},onSessionError:()=>{throw new Error('parent paint');},onResult:()=>assert.fail('No result after auth rejection')});c.choose(2);c.comment('text');assert.equal(await c.submit(),false);assert.equal(c.snapshot().locked,true);assert.equal(c.snapshot().pending,false);assert.equal(await c.submit(),false);assert.equal(writes.length,1);
});
test('retired source ignores late success, malformed result, ordinary error and auth failure',async()=>{
 for(const outcome of [{error:false,message:'old'},{error:true,message:'old'},null,Object.assign(new Error('old401'),{code:'SESSION_EXPIRED'})]){const wait=deferred(),h=ready(setup({write:()=>wait.promise})),work=h.c.submit(),before=h.c.snapshot(),count=h.changes.length;h.retire();if(outcome instanceof Error)wait.reject(outcome);else wait.resolve(outcome);assert.equal(await work,false);assert.deepEqual(h.c.snapshot(),{...before,canSubmit:false,canCancel:false});assert.equal(h.changes.length,count);assert.deepEqual(h.results,[]);assert.deepEqual(h.sessions,[]);h.c.dispose();}
});
test('disposal clears private display/draft/result and cannot be undone by a late write',async()=>{
 const wait=deferred(),h=ready(setup({write:()=>wait.promise})),work=h.c.submit();h.c.dispose();h.c.dispose();wait.resolve({error:false,message:'late'});assert.equal(await work,false);const s=h.c.snapshot();assert.deepEqual(s.entry,{numberYear:'',officeName:''});assert.equal(s.comment,null);assert.equal(s.rating,0);assert.equal(s.result,null);assert.equal(s.pending,false);assert.equal(s.stage,'disposed');assert.deepEqual(h.results,[]);assert.equal(await h.c.submit(),false);
});
test('snapshot mutation cannot change the submitted draft, entry or committed outcome',async()=>{
 const h=ready(setup()),s=h.c.snapshot();s.entry.officeName='forged';s.rating=5;s.comment='forged';await h.c.submit();assert.deepEqual(h.writes,[{rating:3,userComment:'raw\n text'}]);h.results[0].accepted=false;const result=h.c.snapshot();result.result.message='forged';assert.equal(h.c.snapshot().result.message,'received');assert.deepEqual(h.c.snapshot().entry,entry);
});
test('result is committed before parent disposal and a throwing callback cannot cause another send',async()=>{
 for(const dispose of [false,true]){let h;h=ready(setup({onResult:()=>{assert.equal(h.c.snapshot().stage,'result');assert.equal(h.c.snapshot().pending,false);if(dispose)h.c.dispose();throw new Error('parent paint');}}));assert.equal(await h.c.submit(),true);assert.equal(h.results.length,1);assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,1);}
});
test('navigation during pending paint prevents write dispatch before the injected writer is entered',async()=>{
 let h;h=setup({changed:model=>{if(model.pending)h.retire();}});ready(h);assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,0);assert.deepEqual(h.results,[]);h.c.dispose();
});
test('cancel is local and permanently retires this composer without a write',async()=>{
 const h=ready(setup());assert.equal(h.c.cancel(),true);assert.equal(h.c.snapshot().stage,'cancelled');assert.equal(h.c.cancel(),false);assert.equal(h.c.choose(1),false);assert.equal(await h.c.submit(),false);assert.equal(h.writes.length,0);assert.deepEqual(h.results,[]);
});
test('native prompt, five tap stars and comments are escaped without additional upload/location inputs',()=>{
 const h=setup();h.c.comment('</textarea><script>never()</script>');const html=berkasRatingView(h.c.snapshot());assert.equal((html.match(/data-berkas-rating-value="[1-5]"/g)||[]).length,5);assert.match(html,/Berikan rating kamu untuk Berkas no\./);assert.match(html,/&lt;Office&gt;/);assert.match(html,/&lt;\/textarea&gt;&lt;script&gt;/);assert.doesNotMatch(html,/<script>|<Office>|maxlength|type="file"|latitude|longitude|GPS|Berkasid|contextId/);assert.match(html,/>Batal<\/button>/);assert.match(html,/>Kirim<\/button>/);assert.equal((html.match(/<dialog/g)||[]).length,0);
});
test('pending view disables all five stars, textarea, Batal and Kirim and displays only native pending copy',async()=>{
 const wait=deferred(),h=ready(setup({write:()=>wait.promise})),work=h.c.submit(),html=berkasRatingView(h.c.snapshot());assert.equal((html.match(/ disabled/g)||[]).length,8);assert.match(html,/data-berkas-rating-pending>Mengirim Rating Berkas…/);assert.doesNotMatch(html,/data-berkas-rating-pending hidden/);wait.resolve({error:true,message:'x'});await work;
});
