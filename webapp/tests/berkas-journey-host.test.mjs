import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {harness} from './support/account-verification-ui-harness.mjs';
import {journeySnapshotFromBerkas} from '../assets/berkas-journey/model.js';
import {createBerkasJourneyHost} from '../assets/berkas-journey/host.js';

// Reuse the frozen test DOM adapter, not a new host-shaped fake. Add only the
// standard removeAttribute API missing from that older fixture.
const source=fs.readFileSync(new URL('../../analysis/rea/review_swaplotting_frontend_validation.mjs',import.meta.url),'utf8');
const dom=vm.runInNewContext('('+source.slice(source.indexOf('function dom(document){'),source.indexOf('function setup('))+')');
const sameNodes=(actual,expected)=>{assert.equal(actual.length,expected.length);for(let index=0;index<expected.length;index++)assert.equal(actual[index],expected[index]);};
function setup({main=false}={}){
  const {document}=harness();dom(document);const prototype=Object.getPrototypeOf(document.body);if(!prototype.removeAttribute)prototype.removeAttribute=function(name){this.attributes.delete(name);};
  const root=document.body.appendChild(document.createElement(main?'main':'dialog'));if(main)root.setAttribute('id','main');root.setAttribute('aria-labelledby','parent-title');root.innerHTML='<header><h2 id="parent-title">Parent</h2></header><div><input id="raw-query" value=" unchanged query "><button id="opener" type="button">Open history</button><section id="secondary">Loading</section></div>';
  if(!main)root.showModal();root.scrollTop=71;const opener=root.querySelector('#opener'),input=root.querySelector('#raw-query'),secondary=root.querySelector('#secondary'),original=Array.from(root.childNodes),context={primary:'synthetic identity'};opener.focus();
  let current=true,throws=false;const contexts=[],formatCalls=[];
  const host=createBerkasJourneyHost({root,context,snapshot:journeySnapshotFromBerkas({nomor:123,statusBerkas:1,perjalananBerkas:[{namaGrup:'PRIVATE STAGE',tanggalFlow:' raw date ',isCurrent:true}]}),isCurrent:value=>{contexts.push(value);if(throws)throw Error('Retired source');return current;},formatDate:value=>{formatCalls.push(['date',value]);return '21 Oktober 2026';},formatTime:value=>{formatCalls.push(['time',value]);return '07:08';}});
  const child=()=>root.querySelector('[data-berkas-journey-child]'),parent=()=>root.querySelector('[data-berkas-journey-parent]');
  return{document,root,opener,input,secondary,original,context,contexts,formatCalls,host,child,parent,retire:()=>current=false,throwCurrent:()=>throws=true,clickBack(){const target=child()?.querySelector('[data-berkas-journey-back]');assert.ok(target);const event={target,preventDefault(){this.prevented=true;}};for(const fn of [...child().listeners.get('click')??[]])fn(event);return event;}};
}

test('construction is inert; open retains actual connected parent nodes hidden/inert and moves focus without a read',()=>{
  const h=setup(),before=h.root.innerHTML;assert.equal(h.host.active,false);assert.equal(h.root.innerHTML,before);assert.deepEqual(h.formatCalls,[]);
  assert.equal(h.host.open(),true);assert.equal(h.host.active,true);assert.equal(h.host.current,true);assert.equal(h.input.isConnected,true);assert.equal(h.secondary.isConnected,true);assert.equal(h.parent().getAttribute('hidden'),'');assert.equal(h.parent().getAttribute('inert'),'');assert.equal(h.parent().getAttribute('aria-hidden'),'true');sameNodes(h.parent().childNodes,h.original);
  assert.equal(h.root.scrollTop,0);assert.equal(h.document.activeElement.tagName,'H2');assert.equal(h.document.activeElement.isConnected,true);assert.equal(h.root.getAttribute('aria-labelledby'),h.document.activeElement.id);assert.ok(h.contexts.every(value=>value===h.context));assert.deepEqual(h.formatCalls,[['date',' raw date '],['time',' raw date ']]);h.host.dispose();
});

test('back restores identical parent/query nodes, late secondary content, listeners, scroll and opener focus',()=>{
  const h=setup();let inputs=0;h.input.addEventListener('input',()=>inputs++);h.input.value=' locally edited query ';h.input.selectionStart=3;h.host.open(h.opener);h.secondary.innerHTML='<p>Existing read completed while hidden</p>';
  const child=h.child();assert.equal(h.clickBack().prevented,true);assert.equal(h.host.active,false);sameNodes(h.root.childNodes,h.original);assert.equal(h.root.querySelector('#raw-query'),h.input);assert.equal(h.input.value,' locally edited query ');assert.equal(h.input.selectionStart,3);assert.match(h.root.textContent,/Existing read completed while hidden/);assert.equal(h.root.scrollTop,71);assert.equal(h.document.activeElement,h.opener);assert.equal(h.root.getAttribute('aria-labelledby'),'parent-title');
  for(const fn of h.input.listeners.get('input'))fn({target:h.input});assert.equal(inputs,1);assert.equal(child.children.length,0);assert.equal((child.listeners.get('click')??[]).length,0);h.host.dispose();sameNodes(h.root.childNodes,h.original);
});

test('repeated open is idempotent and a detached older back handler cannot restore or overwrite a later child',()=>{
  const h=setup();h.host.open();const first=h.child(),target=first.querySelector('[data-berkas-journey-back]'),listeners=[...first.listeners.get('click')];assert.equal(h.host.open(),true);assert.equal(h.child(),first);assert.equal(h.formatCalls.length,2);h.host.back();assert.equal(h.host.open(),true);const second=h.child();assert.notEqual(second,first);
  for(const fn of listeners)fn({target,preventDefault(){assert.fail('Detached handler');}});assert.equal(h.child(),second);assert.equal(h.host.active,true);h.host.dispose();
});

test('retired or throwing context rejects initial opening and stale active back scrubs private layers without restoration',()=>{
  for(const throwing of [false,true]){const h=setup(),before=h.root.innerHTML;throwing?h.throwCurrent():h.retire();assert.equal(h.host.open(),false);assert.equal(h.root.innerHTML,before);assert.deepEqual(h.formatCalls,[]);h.host.dispose();}
  const h=setup();h.host.open();h.retire();assert.equal(h.host.active,false);assert.equal(h.host.back(),false);assert.equal(h.root.children.length,0);assert.equal(h.input.isConnected,false);assert.equal(h.host.open(),false);assert.equal(h.host.current,false);
});

test('root replacement or detached dialog never restores old nodes and cannot delete another owner view',()=>{
  const replaced=setup();replaced.host.open();replaced.root.innerHTML='<p id="new-owner">New owner content</p>';const current=replaced.root.querySelector('#new-owner');assert.equal(replaced.host.back(),false);assert.equal(replaced.root.querySelector('#new-owner'),current);assert.equal(replaced.input.isConnected,false);assert.equal(replaced.root.textContent,'New owner content');
  const detached=setup();detached.host.open();detached.root.remove();assert.equal(detached.host.back(),false);assert.equal(detached.root.children.length,0);assert.equal(detached.input.isConnected,false);assert.equal(detached.host.active,false);
});

test('changed owned wrapper is treated as stale and detached opener is never focused on an otherwise valid return',()=>{
  const changed=setup();changed.host.open();changed.child().remove();assert.equal(changed.host.back(),false);assert.equal(changed.root.children.length,0);
  const h=setup();h.host.open(h.opener);h.opener.remove();h.document.activeElement=null;assert.equal(h.host.back(),true);assert.equal(h.document.activeElement,null);assert.equal(h.input.isConnected,true);h.host.dispose();
});

test('dispose and enclosing dialog close scrub private child/parent, abort handlers and reject all future work',()=>{
  for(const close of [false,true]){const h=setup();h.host.open();const parent=h.parent(),child=h.child(),target=child.querySelector('[data-berkas-journey-back]'),listeners=[...child.listeners.get('click')];if(close)h.root.close();else h.host.dispose();assert.equal(parent.children.length,0);assert.equal(child.children.length,0);assert.equal(h.root.children.length,0);assert.equal(h.host.current,false);assert.equal(h.host.active,false);assert.equal(h.host.open(),false);assert.equal(h.host.back(),false);h.host.dispose();for(const fn of listeners)fn({target,preventDefault(){assert.fail('Disposed back');}});assert.equal((h.root.listeners.get('close')??[]).length,0);}
});

test('main child starts at page top and valid Back restores actual window X/Y plus identical parent/query/focus',()=>{
  const h=setup({main:true}),writes=[],view={scrollX:31,scrollY:450,scrollTo(x,y){writes.push([x,y]);this.scrollX=x;this.scrollY=y;}};h.document.defaultView=view;h.root.removeAttribute('aria-labelledby');h.input.value=' retained main query ';
  assert.equal(h.host.open(h.opener),true);assert.deepEqual(writes,[[0,0]]);assert.equal(view.scrollY,0);assert.equal(h.input.isConnected,true);sameNodes(h.parent().childNodes,h.original);assert.equal(h.document.activeElement.tagName,'H2');
  // Model a user's position in the shorter child after the parent's former
  // height has been lost. Return must use the pre-mount document coordinates.
  view.scrollX=2;view.scrollY=90;assert.equal(h.host.back(),true);assert.deepEqual(writes,[[0,0],[31,450]]);assert.equal(view.scrollX,31);assert.equal(view.scrollY,450);sameNodes(h.root.childNodes,h.original);assert.equal(h.root.querySelector('#raw-query'),h.input);assert.equal(h.input.value,' retained main query ');assert.equal(h.document.activeElement,h.opener);assert.equal(h.root.getAttribute('aria-labelledby'),null);
  assert.equal(h.host.back(),false);h.host.dispose();assert.deepEqual(writes,[[0,0],[31,450]]);
});

test('stale, detached, replaced or disposed main ownership never restores any old window position',()=>{
  for(const kind of ['retired','detached','replaced','disposed']){const h=setup({main:true}),writes=[],view={scrollX:7,scrollY:880,scrollTo(x,y){writes.push([x,y]);this.scrollX=x;this.scrollY=y;}};h.document.defaultView=view;h.host.open();assert.deepEqual(writes,[[0,0]]);view.scrollY=40;
    if(kind==='retired')h.retire();else if(kind==='detached')h.root.remove();else if(kind==='replaced')h.root.innerHTML='<p>New main owner</p>';else h.host.dispose();
    assert.equal(h.host.back(),false);h.host.dispose();assert.deepEqual(writes,[[0,0]],kind);assert.equal(view.scrollY,40);assert.equal(h.host.active,false);
  }
  const unopened=setup({main:true});unopened.document.defaultView={get scrollX(){assert.fail('Stale initial read');},get scrollY(){assert.fail('Stale initial read');},scrollTo(){assert.fail('Stale initial scroll');}};unopened.retire();assert.equal(unopened.host.open(),false);unopened.host.dispose();
});

test('dialog-only host leaves window scrolling entirely untouched',()=>{
  const h=setup();h.document.defaultView={get scrollX(){assert.fail('Dialog must not read page X');},get scrollY(){assert.fail('Dialog must not read page Y');},scrollTo(){assert.fail('Dialog must not move page');}};
  assert.equal(h.host.open(),true);assert.equal(h.host.back(),true);assert.equal(h.root.scrollTop,71);h.host.dispose();
});
