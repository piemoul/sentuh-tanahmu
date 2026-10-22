import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwaplottingPhotoStore} from '../assets/swaplotting/photo-store.js';
import {createSwaplottingPhotoRemoval} from '../assets/swaplotting/photo-removal.js';
const record=url=>({url,blob:new Blob(['synthetic frame'],{type:'image/jpeg'})});
test('Photo store owns only local raster Blob URLs and releases removed paths exactly once',()=>{
 const revoked=[],store=createSwaplottingPhotoStore({revoke:url=>revoked.push(url)});
 for(const invalid of [record('https://example.invalid/image.jpg'),record('blob:bad space'),{url:'blob:a',blob:new Blob(['<svg/>'],{type:'image/svg+xml'})},{url:'blob:empty',blob:new Blob([],{type:'image/jpeg'})}])assert.equal(store.add(invalid),false);
 assert.equal(store.add(record('blob:a')),true);assert.equal(store.add(record('blob:a')),false);assert.equal(store.add(record('blob:b')),true);
 store.sync(['blob:b','blob:b']);assert.deepEqual(revoked,['blob:a']);assert.equal(store.has('blob:a'),false);assert.equal(store.size(),1);
 store.sync(['blob:b']);store.dispose();store.dispose();assert.deepEqual(revoked,['blob:a','blob:b']);assert.equal(store.size(),0);assert.equal(store.add(record('blob:c')),false);
});
test('A throwing URL releaser cannot retain other owned photos',()=>{
 const released=[],store=createSwaplottingPhotoStore({revoke:url=>{released.push(url);throw Error('synthetic cleanup failure');}});store.add(record('blob:a'));store.add(record('blob:b'));store.sync(null);assert.deepEqual(released,['blob:a','blob:b']);assert.equal(store.size(),0);
});
function fixture(){
 const lifecycle={},dialogs=[],removed=[],closed=[];let valid=true;
 const document={hidden:false,body:{append(dialog){dialog.isConnected=true;}},defaultView:{addEventListener:(name,fn)=>lifecycle[name]=fn,removeEventListener:name=>delete lifecycle[name]},addEventListener:(name,fn)=>lifecycle[name]=fn,removeEventListener:name=>delete lifecycle[name],createElement(tag){assert.equal(tag,'dialog');const handlers={},buttons=['cancel','remove'].map(action=>({dataset:{photoRemoval:action},focus(){this.focused=true;},closest(){return this;}}));const dialog={open:false,isConnected:false,setAttribute(){},querySelector:()=>buttons[0],contains:button=>buttons.includes(button),showModal(){this.open=true;},close(){this.open=false;handlers.close?.({});},remove(){this.isConnected=false;},addEventListener(name,fn,{signal}){handlers[name]=fn;signal.addEventListener('abort',()=>delete handlers[name],{once:true});},fire(name,action){handlers[name]?.({target:buttons[action==='remove'?1:0],preventDefault(){}});}};dialogs.push(dialog);return dialog;}};
 const removal=createSwaplottingPhotoRemoval({document,isCurrent:context=>valid&&context.generation===1,onRemove:context=>{removed.push(context.path);return true;},onClose:context=>closed.push(context.path)});
 return {document,removal,dialogs,removed,closed,lifecycle,retire:()=>valid=false};
}
test('Photo removal requires its explicit current confirmation and cancellation leaves the draft intact',()=>{
 const f=fixture();assert.equal(f.removal.open({path:'blob:a',generation:1}),true);f.dialogs[0].fire('click','cancel');assert.deepEqual(f.removed,[]);assert.deepEqual(f.closed,['blob:a']);assert.equal(f.removal.open({path:'blob:b',generation:1}),true);f.dialogs[1].fire('click','remove');assert.deepEqual(f.removed,['blob:b']);assert.deepEqual(f.closed,['blob:a','blob:b']);f.removal.close();assert.equal(f.closed.length,2);f.removal.dispose();
});
test('Stale confirmation cannot remove a photo; page visibility and disposal retire all dialog callbacks',()=>{
 const f=fixture();f.removal.open({path:'blob:a',generation:1});f.retire();f.dialogs[0].fire('click','remove');assert.deepEqual(f.removed,[]);assert.deepEqual(f.closed,['blob:a']);assert.equal(f.removal.open({path:'blob:b',generation:1}),false);f.removal.dispose();assert.deepEqual(f.lifecycle,{});
 const g=fixture();g.removal.open({path:'blob:c',generation:1});g.document.hidden=true;g.lifecycle.visibilitychange();g.dialogs[0].fire('click','remove');assert.deepEqual(g.removed,[]);assert.deepEqual(g.closed,['blob:c']);g.removal.dispose();
});
