// Shared test-only DOM/VM harness; production helpers and delegated handlers are
// extracted verbatim from app.js. It issues no real transport or browser request.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {OPERATIONS} from '../../private/operations.mjs';
import * as daringModel from '../../assets/profile/daring-model.js';
const source=fs.readFileSync(new URL('../../app.js',import.meta.url),'utf8'),lines=source.split(/\r?\n/);
const actual=name=>{const line=lines.find(line=>new RegExp(`^(?:async )?function ${name}\\(`).test(line));assert.ok(line,`Missing actual ${name}`);return line;};
const functions=[...lines.filter(line=>/^(?:async )?function (?:nativeVerification\w+|verification\w+|dismissVerification\w+|showVerification\w+)\(/.test(line)),...['currentFlow','runFlow','clearPrivate','navigate','session'].map(actual)].join('\n');
const clickHandler=lines.find(line=>line.startsWith("document.addEventListener('click',async e=>{"));
const cancelHandler=lines.find(line=>line.startsWith("$('#modal').addEventListener('cancel',"));
const closeHandler=lines.find(line=>line.startsWith("$('#modal').addEventListener('close',"));
const inputHandler=lines.find(line=>line.startsWith("document.addEventListener('input',e=>{"));
const submitHandler=lines.find(line=>line.startsWith("document.addEventListener('submit',async event=>{"));
assert.ok(clickHandler&&cancelHandler&&closeHandler,'Actual delegated/dialog handlers');
const OP='get-account-checkverifstatusperorangan-da15dc',KEY='verification:default';
const plain=value=>JSON.parse(JSON.stringify(value));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=value=>value.replace(/&(?:amp|quot|lt|gt|#39);/g,s=>({'&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&#39;':"'"}[s]));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return{promise,resolve,reject};};
const response=(...args)=>({status:200,data:{message:args.length?args[0]:'1',error:args.length>1?args[1]:false,data:args.length>2?args[2]:null}});
const expiry=()=>Object.assign(new Error('SYNTHETIC expired session'),{code:'SESSION_EXPIRED'});

class Element{
 constructor(document,tag='div',text=null){Object.assign(this,{document,tagName:tag.toUpperCase(),text,attributes:new Map(),children:[],parentNode:null,listeners:new Map(),open:false,shows:0,closes:0});this.dataset=new Proxy({}, {get:(_,key)=>this.getAttribute('data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase()))??undefined});}
 get isConnected(){return this===this.document.body||!!this.parentNode?.isConnected;}
 get disabled(){return this.attributes.has('disabled');}set disabled(value){value?this.setAttribute('disabled',''):this.attributes.delete('disabled');}
 get textContent(){return this.text===null?this.children.map(child=>child.textContent).join(''):decode(this.text);}
 set textContent(value){for(const child of this.children)child.parentNode=null;this.children=[];this.appendChild(new Element(this.document,'#text',String(value)));}
 get id(){return this.getAttribute('id')??'';}
 get value(){return this._value??this.getAttribute('value')??'';}set value(value){this._value=String(value);}
 get elements(){return {namedItem:name=>this.querySelector(`[name="${name}"]`)};}
 setAttribute(key,value){this.attributes.set(key,String(value));}getAttribute(key){return this.attributes.get(key)??null;}
 appendChild(child){if(child.parentNode)child.parentNode.children.splice(child.parentNode.children.indexOf(child),1);this.children.push(child);child.parentNode=this;return child;}
 contains(child){return this===child||this.children.some(node=>node.contains(child));}
 matches(selector){if(this.text!==null)return false;const tag=selector.match(/^[a-zA-Z][\w-]*/)?.[0];if(tag&&this.tagName!==tag.toUpperCase())return false;for(const match of selector.matchAll(/#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g)){if(match[1]&&this.getAttribute('id')!==match[1])return false;if(match[2]&&!(this.getAttribute('class')??'').split(/\s+/).includes(match[2]))return false;if(match[3]&&(!this.attributes.has(match[3])||match[4]!==undefined&&this.getAttribute(match[3])!==match[4]))return false;}return true;}
 closest(selector){for(let node=this;node;node=node.parentNode)if(node.matches(selector))return node;return null;}
 querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
 addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
 showModal(){this.open=true;this.shows++;}
 close(){const wasOpen=this.open;this.open=false;if(wasOpen){this.closes++;for(const fn of this.listeners.get('close')??[])fn({target:this});}}
 focus(){this.document.activeElement=this;}
 get outerHTML(){return this.text===null?`<${this.tagName.toLowerCase()}${[...this.attributes].map(([key,value])=>` ${key}="${esc(value)}"`).join('')}>${this.innerHTML}</${this.tagName.toLowerCase()}>`:this.text;}
 get innerHTML(){return this.children.map(child=>child.outerHTML).join('');}
 set innerHTML(html){for(const child of this.children)child.parentNode=null;this.children=[];const stack=[this],voids=new Set(['INPUT','BR','IMG','HR']);for(const token of String(html).match(/<[^>]*>|[^<]+/g)??[]){if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}if(token.startsWith('<')){const tag=token.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const child=new Element(this.document,tag);for(const match of token.slice(tag.length+1,-1).matchAll(/([\w-]+)(?:="([^"]*)")?/g))child.setAttribute(match[1],decode(match[2]??''));stack.at(-1).appendChild(child);if(!voids.has(child.tagName)&&!token.endsWith('/>'))stack.push(child);}else stack.at(-1).appendChild(new Element(this.document,'#text',token));}}
}
export function harness({user={username:'SYNTHETIC login user',userLevel:1}}={}){
 const document={activeElement:null,listeners:new Map(),addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);},querySelector(selector){return this.body.querySelector(selector);},createElement(tag){return new Element(this,tag);}};
 document.body=new Element(document,'body');document.body.classList={remove(){}};
 const modal=document.body.appendChild(document.createElement('dialog'));modal.setAttribute('id','modal');
 const calls=[],records=[],toasts=[],state={authenticated:true,user,loading:false,operations:[{...OPERATIONS.find(op=>op.id===OP)}],results:new Map(),connection:{configured:true},points:[],activity:[]};
 const c=vm.createContext({state,document,flowResults:new Map(),sessionEpoch:3,detailSequence:7,route:'verification',flowTab:'',flowDetail:null,htDetailData:null,flowQuery:'',flowPageIndex:0,partnerFrame:null,searchFileState:null,comparison:null,comparisonSelection:{},pending:null,selected:null,search:'',group:'Semua',filter:'Semua',busy:false,authPending:false,logoutPending:false,collectionGroupCreate:null,collectionGroupMove:null,collectionGroupDelete:null,collectionGroupRemove:null,collectionItemDelete:null,collectionItemEdit:null,flowDefinitions:{verification:{title:'Status Verifikasi',endpoint:'account/CheckVerifStatusPerorangan'}},routes:{verification:'Status Verifikasi',dashboard:'Beranda',account:'Profil'},location:{hash:'#/verification'},window:{scrollTo(){}},URLSearchParams,Map,Object,String,Number,Array,JSON,esc,icon:()=>'',badge:text=>`<span>${esc(text)}</span>`,notice:(text,kind)=>`<p class="notice ${kind??''}">${text}</p>`,$:selector=>document.querySelector(selector),ready:op=>op.enabled===true,write:op=>op.effect==='write',login:()=>false,resetScanHost(){},resetPersilMaps(){},resetSearchFileNavigation(){},resetPartnerNavigation(){},resetCollectionNavigation(){},resetNewsNavigation(){},persilMapCancel:()=>false,persilMapDialogClosed(){},record:(...args)=>records.push(args),toast:text=>toasts.push(text),renderCount:0,render:()=>c.renderCount++,api:(path,options)=>{const wait=deferred();calls.push({path,options,...wait});return wait.promise;}});
 Object.assign(c,daringModel);vm.runInContext(functions+'\n'+clickHandler+'\n'+cancelHandler+'\n'+closeHandler+'\n'+inputHandler+'\n'+submitHandler,c);
 const reader=(value=response())=>{const owner={loading:false,response:value};c.flowResults.set(KEY,owner);return owner;};
 return{c,state,document,modal,calls,records,toasts,reader,open(value=response()){const owner=reader(value);c.showVerificationStatusDialog(owner,KEY,c.sessionEpoch,c.detailSequence);return owner;},button(action){return modal.querySelector(`[data-action="${action}"]`);},async click(button){assert.ok(button,'Existing button');for(const fn of document.listeners.get('click')??[])await fn({target:button,preventDefault(){}});},escape(){const event={target:modal,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};for(const fn of modal.listeners.get('cancel')??[])fn(event);if(!event.defaultPrevented)modal.close();return event;},navigate(route='account'){c.location.hash=`#/${route}`;c.navigate();},async resolve(work,value=response(),index=calls.length-1){calls[index].resolve({result:value});await work;},async reject(work,error,index=calls.length-1){calls[index].reject(error);await work;}};
}

export {response,plain,expiry,OP,KEY};
