import test from 'node:test';
import assert from 'node:assert/strict';
import {getPublicCatalog} from '../private/operations.mjs';
import {HOME_MEDIA_OPERATIONS,parseHomeBannerResponse,parseHomeYoutubeResponse,homeBannerImageUrl,homeExternalUrl,homeYoutubeThumbnailUrl,homeYoutubeEmbedUrl} from '../assets/home-media/model.js';
const banner=data=>({status:200,data:{error:false,data}});
const youtube=data=>({status:200,data:{data}});
const bannerRow={bannerId:' B ',sequenceId:2,bannerUrl:'unused raw bannerUrl',externalUrl:' raw link ',path:'/raw path'};
const youtubeRow={channelTitle:' channel ',channelId:' id ',videoId:'raw-id',title:' <b>raw</b> ',thumbnailUrl:' raw image ',publishedTime:'not a date'};

test('home reads identify exactly the existing enabled optional-session main GETs',()=>{
 assert.deepEqual(HOME_MEDIA_OPERATIONS,{banner:'get-banner-d22854',youtube:'get-youtube-getyoutubelist-d2d384'});assert.ok(Object.isFrozen(HOME_MEDIA_OPERATIONS));
 for(const [kind,path]of [['banner','banner'],['youtube','Youtube/GetYoutubeList']]){
  const op=getPublicCatalog().find(op=>op.id===HOME_MEDIA_OPERATIONS[kind]);assert.ok(op);assert.equal(op.path,path);assert.equal(op.enabled,true);assert.equal(op.method,'GET');assert.equal(op.effect,'read');assert.equal(op.auth,'optionalSession');assert.equal(op.serviceId,'main');assert.deepEqual(op.fields,[]);
 }
});
test('banner uses raw Map only with no local status gate or String JSON decode',()=>{
 for(const status of [200,201,403,500,null,undefined,'200'])assert.deepEqual(parseHomeBannerResponse({status,data:{error:false,data:[]}}),{ok:true,rows:[]});
 for(const data of [JSON.stringify({error:false,data:[]}),null,[],true,new Map(),new Date()])assert.equal(parseHomeBannerResponse({status:200,data}).ok,false);
 for(const reply of [null,[],false,'raw'])assert.equal(parseHomeBannerResponse(reply).ok,false);
});
test('banner nullable fields preserve null, raw strings, array ordering and duplicates',()=>{
 const input=banner([bannerRow,{...bannerRow,sequenceId:1},bannerRow,{}]),before=structuredClone(input);
 const result=parseHomeBannerResponse(input);assert.equal(result.ok,true);assert.deepEqual(result.rows.slice(0,3),[bannerRow,{...bannerRow,sequenceId:1},bannerRow]);
 assert.deepEqual(result.rows[3],{bannerId:null,sequenceId:null,bannerUrl:null,externalUrl:null,path:null});assert.deepEqual(input,before);
 result.rows[0].path='mutated';assert.equal(input.data.data[0].path,'/raw path');
 for(const data of [undefined,null])assert.deepEqual(parseHomeBannerResponse({data:{error:false,data}}),{ok:true,rows:[]});
});
test('banner validates all fields and metadata before service error or nonnull error gate',()=>{
 for(const error of [true,null,undefined]){
  for(const key of ['totalRecords','resultsCount','pageSize','pageNumber'])assert.equal(parseHomeBannerResponse({data:{error,[key]:'1',data:[]}}).code,'HOME_MEDIA_RESPONSE_INVALID');
  assert.equal(parseHomeBannerResponse({data:{error,data:[{path:17}]}}).code,'HOME_MEDIA_RESPONSE_INVALID');
 }
 assert.deepEqual(parseHomeBannerResponse({data:{error:true,data:[bannerRow]}}),{ok:true,rows:[]});
 for(const error of [undefined,null,0,1,'false',[],{}])assert.equal(parseHomeBannerResponse({data:{error,data:[]}}).code,'HOME_MEDIA_RESPONSE_INVALID');
 assert.equal(parseHomeBannerResponse({data:{error:false,message:7,data:[]}}).ok,false);
});
test('banner types all five model fields and requires JSON-array items including empty arrays',()=>{
 for(const key of ['bannerId','bannerUrl','externalUrl','path'])for(const bad of [0,true,[],{}])assert.equal(parseHomeBannerResponse(banner([{...bannerRow,[key]:bad}])).ok,false,`${key}/${typeof bad}`);
 for(const bad of [{},'[]',true,2,[null],[[]],[true],Array(1)])assert.equal(parseHomeBannerResponse(banner(bad)).ok,false);
 assert.deepEqual(parseHomeBannerResponse(banner([])),{ok:true,rows:[]});
});
test('native int fields reject unsafe browser integers instead of accepting rounded signed64 data',()=>{
 for(const value of [0,-1,Number.MAX_SAFE_INTEGER,Number.MIN_SAFE_INTEGER,null]){
  const response={data:{error:false,totalRecords:value,resultsCount:value,pageSize:value,pageNumber:value,data:[{sequenceId:value}]}};
  assert.equal(parseHomeBannerResponse(response).ok,true);assert.equal(parseHomeBannerResponse(response).rows[0].sequenceId,value);
 }
 for(const value of [Number.MAX_SAFE_INTEGER+1,Number.MIN_SAFE_INTEGER-1,1e30,1.5,Infinity,NaN,'1',false]){
  assert.equal(parseHomeBannerResponse(banner([{sequenceId:value}])).ok,false);
  for(const key of ['totalRecords','resultsCount','pageSize','pageNumber'])assert.equal(parseHomeBannerResponse({data:{error:false,[key]:value}}).ok,false);
 }
});
test('YouTube requires HTTP200, decodes at most once, and reads data while ignoring body.error',()=>{
 const body={data:[youtubeRow],error:true,message:{not:'a news envelope'}};
 for(const data of [body,JSON.stringify(body)])assert.deepEqual(parseHomeYoutubeResponse({status:200,data}),{ok:true,rows:[youtubeRow]});
 for(const status of [undefined,null,201,403,500,'200'])assert.equal(parseHomeYoutubeResponse({status,data:body}).code,'HOME_MEDIA_HTTP_STATUS');
 for(const data of ['bad',JSON.stringify(JSON.stringify(body)),null,[],true,{message:[youtubeRow]}])assert.equal(parseHomeYoutubeResponse({status:200,data}).ok,false);
});
test('YouTube preserves all six nullable strings, raw publication text, order and duplicates',()=>{
 const input=youtube([youtubeRow,{...youtubeRow,title:' first? '},youtubeRow,{}]),before=structuredClone(input);
 const result=parseHomeYoutubeResponse(input);assert.equal(result.ok,true);assert.deepEqual(result.rows.slice(0,3),input.data.data.slice(0,3));
 assert.deepEqual(result.rows[3],Object.fromEntries(Object.keys(youtubeRow).map(key=>[key,null])));assert.deepEqual(input,before);
 result.rows[0].title='mutated';assert.equal(input.data.data[0].title,youtubeRow.title);
 for(const key of Object.keys(youtubeRow))for(const bad of [1,false,[],{}])assert.equal(parseHomeYoutubeResponse(youtube([{...youtubeRow,[key]:bad}])).ok,false,key);
});
test('YouTube permits real empty List but rejects missing/null/nonList/sparse/malformed items',()=>{
 assert.deepEqual(parseHomeYoutubeResponse(youtube([])),{ok:true,rows:[]});
 for(const value of [null,undefined,{},'[]',true,[null],[[]],Array(1)])assert.equal(parseHomeYoutubeResponse(youtube(value)).ok,false);
 for(const reply of [null,[],true])assert.equal(parseHomeYoutubeResponse(reply).ok,false);
});
test('banner image literally joins fixed shipped base with slash-normalized path',()=>{
 assert.equal(homeBannerImageUrl('/images/a.png'),'https://sentuh.atrbpn.go.id/images/a.png');assert.equal(homeBannerImageUrl('///images/a.png'),'https://sentuh.atrbpn.go.id/images/a.png');
 assert.equal(homeBannerImageUrl(''),'https://sentuh.atrbpn.go.id/');
 for(const path of ['https://evil.invalid/x','//evil.invalid/x','../x','user:pass@evil.invalid/x'])assert.equal(new URL(homeBannerImageUrl(path)).origin,'https://sentuh.atrbpn.go.id');
 assert.equal(homeBannerImageUrl('https://evil.invalid/x'),'https://sentuh.atrbpn.go.id/https://evil.invalid/x');
 for(const path of [null,undefined,0,'\\evil.invalid/x','a\nb','a%0ab','a\u0085b'])assert.equal(homeBannerImageUrl(path),null);
});
test('external links use credential/control-free absolute HTTPS without altering parsed rows',()=>{
 assert.equal(homeExternalUrl('HTTPS://EXAMPLE.INVALID/path?q=1&x=2#part'),'https://example.invalid/path?q=1&x=2#part');
 assert.equal(homeExternalUrl('https://example.invalid/%E2%80%A6'),'https://example.invalid/%E2%80%A6');
 for(const value of [null,'','http://example.invalid','//example.invalid','javascript:alert(1)','data:text/html,x','https://user:pass@example.invalid/','https://user@example.invalid/',' https://example.invalid','https://example.invalid/ ','https://example.invalid/\n','https://example.invalid/%0d','https://example.invalid/\\x'])assert.equal(homeExternalUrl(value),null,String(value));
 assert.equal(parseHomeBannerResponse(banner([{externalUrl:'javascript:raw'}])).rows[0].externalUrl,'javascript:raw');
});
test('thumbnail browser guard allows only the four approved HTTPS origins',()=>{
 for(const host of ['www.atrbpn.go.id','sentuh.atrbpn.go.id','i.ytimg.com','img.youtube.com'])assert.equal(homeYoutubeThumbnailUrl(`https://${host}/a.jpg`),`https://${host}/a.jpg`);
 for(const value of ['https://atrbpn.go.id/a','https://evil.invalid/a','https://i.ytimg.com.evil.invalid/a','https://i.ytimg.com:444/a','http://i.ytimg.com/a','https://user@i.ytimg.com/a','https://i.ytimg.com/%00'])assert.equal(homeYoutubeThumbnailUrl(value),null,value);
});
test('player URL has one fixed origin, bounded encoded token and explicit no-autoplay controls',()=>{
 for(const id of ['A','abc_DEF-0123','x'.repeat(128)]){
  const url=new URL(homeYoutubeEmbedUrl(id));assert.equal(url.origin,'https://www.youtube-nocookie.com');assert.equal(url.pathname,`/embed/${encodeURIComponent(id)}`);assert.equal(url.searchParams.get('autoplay'),'0');assert.equal(url.searchParams.get('controls'),'1');assert.equal(url.searchParams.has('enablejsapi'),false);
 }
 for(const id of [null,undefined,1,'','x'.repeat(129),' A','A ','a/b','../x','https://evil.invalid','a?autoplay=1','a%2fb','x\n','é'])assert.equal(homeYoutubeEmbedUrl(id),null,String(id));
 assert.equal(parseHomeYoutubeResponse(youtube([{videoId:'bad/raw'}])).rows[0].videoId,'bad/raw');
});
