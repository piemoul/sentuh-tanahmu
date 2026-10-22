import test from 'node:test';
import assert from 'node:assert/strict';
import {homeMediaShell,homeMediaSection} from '../assets/home-media/view.js';
const state=()=>({banner:{rows:[],loading:false,error:'',attempted:false,generation:1},youtube:{rows:[],loading:false,error:'',attempted:false,generation:2}});

test('home sections keep independent initial/loading/empty/error states and reload actions',()=>{
 const model=state();model.banner.loading=true;model.youtube.attempted=true;
 const html=homeMediaShell(model);assert.match(html,/data-home-media-section="banner"[^>]+aria-busy="true"/);assert.match(html,/Memuat informasi/);assert.match(html,/Belum ada video/);assert.match(html,/Ikuti Kanal video Kami/);
 model.banner.loading=false;model.banner.error='<service failed>';const error=homeMediaSection('banner',model);assert.match(error,/Coba lagi/);assert.match(error,/&lt;service failed&gt;/);assert.doesNotMatch(error,/<service failed>/);assert.equal(homeMediaSection('unknown',model),'');
});
test('banner image uses native fixed base plus path, preserves result order and never bannerUrl',()=>{
 const model=state();model.banner.rows=[{path:'/uploads/first.jpg',bannerUrl:'https://never-use.invalid/a.jpg',externalUrl:'https://www.atrbpn.go.id/a',sequenceId:99},{path:'///uploads/second.jpg',externalUrl:'https://www.atrbpn.go.id/b',sequenceId:1}];
 const html=homeMediaSection('banner',model);assert.match(html,/src="https:\/\/sentuh\.atrbpn\.go\.id\/uploads\/first\.jpg"/);assert.match(html,/src="https:\/\/sentuh\.atrbpn\.go\.id\/uploads\/second\.jpg"/);assert.doesNotMatch(html,/never-use/);assert.ok(html.indexOf('first.jpg')<html.indexOf('second.jpg'));assert.match(html,/target="_blank" rel="noopener noreferrer"/);assert.doesNotMatch(html,/<iframe/);
});
test('unsafe or absent banner/image targets stay disabled without navigable fallback',()=>{
 const model=state();model.banner.rows=[{path:'good.jpg',externalUrl:'javascript:alert(1)'},{path:null,externalUrl:'https://www.atrbpn.go.id/'},{path:'x\\evil',externalUrl:'https://user:pass@external.invalid/'}];
 const html=homeMediaSection('banner',model);assert.equal((html.match(/class="home-banner-card" disabled/g)??[]).length,3);assert.doesNotMatch(html,/<a\b|javascript:|user:pass|src="[^"]*evil/);assert.match(html,/Gambar informasi belum tersedia/);
});
test('video cards escape nullable text and bind only index plus generation, not provider/embed URLs',()=>{
 const model=state();model.youtube.rows=[{videoId:'safe-id',title:'<img src=x onerror=evil()> & "judul"',thumbnailUrl:'https://i.ytimg.com/vi/safe-id/default.jpg'},{videoId:null,title:null,thumbnailUrl:null}];
 const html=homeMediaSection('youtube',model);assert.match(html,/&lt;img src=x onerror=evil\(\)&gt; &amp; &quot;judul&quot;/);assert.doesNotMatch(html,/<img src=x|iframe|youtube-nocookie|data-[^ ]*url/);assert.match(html,/data-home-media-index="0" data-home-media-generation="2"/);assert.match(html,/data-home-media-index="1"[^>]*disabled/);
});
test('thumbnail policy blocks unapproved sources and cannot create image requests from title',()=>{
 const model=state();model.youtube.rows=[{videoId:'one',title:'<script>private</script>',thumbnailUrl:'https://attacker.invalid/tracker'},{videoId:'two',title:'Two',thumbnailUrl:'https://img.youtube.com/vi/two/default.jpg'}];
 const html=homeMediaSection('youtube',model);assert.doesNotMatch(html,/attacker\.invalid|<script/);assert.match(html,/https:\/\/img\.youtube\.com\/vi\/two\/default.jpg/);assert.match(html,/aria-hidden="true"/);
});
test('player failure is separate from successful metadata and never removes the video result list',()=>{
 const model=state();model.youtube.rows=[{videoId:'safe',title:'Title'}];
 const html=homeMediaSection('youtube',model,{playerError:'<player failed>'});assert.match(html,/data-home-media-action="play"/);assert.match(html,/&lt;player failed&gt;/);assert.match(html,/Muat ulang/);assert.doesNotMatch(html,/Belum ada video/);
});
test('zero-row waiting/error/empty states show four decorative native-style skeleton entries without fake actions or busy claims',()=>{
 for(const patch of [{loading:true},{attempted:true,error:'Coba lagi'},{attempted:true}]){
  const model=state();Object.assign(model.youtube,patch);const html=homeMediaShell(model),section=homeMediaSection('youtube',model);
  assert.equal((section.match(/class="home-youtube-card home-youtube-placeholder"/g)??[]).length,4);assert.match(section,/home-youtube-skeleton[^>]*aria-hidden="true"/);assert.doesNotMatch(section,/data-home-media-action="play"|data-home-media-index|<iframe|<img/);assert.equal(section.includes('is-loading'),patch.loading===true);assert.match(html,new RegExp('data-home-media-section="youtube"[^>]+aria-busy="'+String(patch.loading===true)+'"'));
  assert.match(section,patch.loading?/Memuat kanal video/:patch.error?/Coba lagi/:/Belum ada video/);
 }
});
