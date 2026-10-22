import test from 'node:test';
import assert from 'node:assert/strict';
import {createSwaplotting} from '../assets/swaplotting/controller.js';
import {swaplottingView,swaplottingFeedback,swaplottingValidation,swaplottingPointText} from '../assets/swaplotting/view.js';
async function draft(kind='registered'){const c=createSwaplotting({profile:{userLevel:2,isIkd:false,nama:'<script>alert(1)</script>',nomorHp:'&phone',email:'"email"',nomorIdentitas:'DO-NOT-RENDER-NIK',tanggalLahir:'DO-NOT-RENDER-DATE'},read:async action=>action==='disclaimer'?{}:[{KantorId:'private-office-id',Nama:'<Office>'}]});await c.loadDisclaimer();await c.openForm(kind);return c;}

test('map wrappers are stable across idle/loading/disclaimer/accept and preserve delegated selectors',async()=>{
 const c=createSwaplotting({read:async()=>({message:'terms'})});
 for(const mutate of [()=>{},()=>c.loadDisclaimer(),()=>c.acceptDisclaimer()]){await mutate();const html=swaplottingView(c.snapshot());for(const selector of ['data-swaplotting-disclaimer','data-swaplotting-availability','data-swaplotting-feedback','data-swaplotting-map-status','data-swaplotting-map-canvas'])assert.match(html,new RegExp(selector));}
 assert.equal(typeof swaplottingPointText(c.snapshot()),'string');
});

test('disclaimer copy is escaped and links use a deliberate safe user action without implicit acceptance',async()=>{
 const c=createSwaplotting({read:async()=>({message:'<img src=x onerror=alert(1)>',message2:'& raw',url:'https://example.test/?a=1&b=2'})});await c.loadDisclaimer();let html=swaplottingView(c.snapshot());assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img src=x/);assert.match(html,/a=1&amp;b=2/);assert.match(html,/rel="noopener noreferrer"/);assert.match(html,/data-action="swaplotting-accept"/);assert.match(html,/data-action="swaplotting-open-form"[^>]*disabled/);
 const model=c.snapshot();model.disclaimer.url='javascript:alert(1)';html=swaplottingView(model);assert.doesNotMatch(html,/<a /);assert.equal(c.snapshot().disclaimerAcknowledged,false);
});

test('both local forms show escaped own contacts, stable input/error markers and no identity/date substitution',async()=>{
 for(const kind of ['registered','unregistered']){const c=await draft(kind);c.validate();const html=swaplottingView(c.snapshot());assert.match(html,/Profil akun sendiri/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>|DO-NOT-RENDER|private-office-id/);assert.match(html,/&lt;Office&gt;/);assert.match(html,/data-swaplotting-owner/);for(const id of ['name','phone','email','office','region','photos','review'])assert.match(html,new RegExp(`id="swaplotting-error-${id}"`));assert.match(html,/id="swaplotting-form" novalidate/);assert.match(html,/data-swaplotting-field="review"/);assert.match(html,/<button[^>]+disabled[^>]*>Kirim<\/button>/);assert.match(html,/<button[^>]+data-action="swaplotting-photo-add"[^>]*>Tambah Foto<\/button>/);assert.doesNotMatch(html,/<button[^>]+disabled[^>]*>Tambah Foto<\/button>/);assert.doesNotMatch(html,/type="file"|maxlength=|capture=|geolocation|type="email"/);assert.match(html,/belum dikirim atau diverifikasi/);if(kind==='unregistered')assert.match(html,/<h3>Letak Tanah<\/h3>/);}
});

test('raw draft strings survive HTML serialization without becoming executable markup or constraints',async()=>{
 const c=await draft();c.setField('number',' " <&\u0085 ');c.setField('review','</textarea><img src=x>');const html=swaplottingView(c.snapshot());assert.match(html,/value=" &quot; &lt;&amp;\u0085 "/);assert.match(html,/&lt;\/textarea&gt;&lt;img src=x&gt;/);assert.doesNotMatch(html,/<img src=x>/);assert.equal(c.snapshot().fields.number,' " <&\u0085 ');
});

test('unresolved owner never offers invented editable contacts and local validation remains an unsent result',async()=>{
 const c=await draft();c.setProfile(null);c.validate();const snapshot=c.snapshot(),html=swaplottingView(snapshot);assert.match(html,/Data pengguna belum tersedia/);assert.doesNotMatch(html,/data-swaplotting-field="(?:name|phone|email)"/);assert.match(swaplottingValidation(snapshot),/Lengkapi isian/);assert.doesNotMatch(swaplottingValidation(snapshot),/berhasil dikirim|Success/);assert.equal(snapshot.validation.flags.photos,true);
});

test('read retry feedback escapes errors and only declares the corresponding explicit retry action',()=>{
 const errors={disclaimer:'<bad>',offices:'',regions:'&region'},pending={disclaimer:false,offices:false,regions:true};const html=swaplottingFeedback({errors,pending});assert.match(html,/&lt;bad&gt;/);assert.match(html,/&amp;region/);assert.match(html,/data-action="swaplotting-retry-disclaimer"/);assert.match(html,/data-action="swaplotting-regions" disabled/);assert.doesNotMatch(html,/data-action="swaplotting-offices"|<bad>/);
});
