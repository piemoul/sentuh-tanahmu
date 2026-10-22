// Native jCb, swaplotting-map-followup/flow.json 07d83a8a….
// This is a direct four-field model. No error/data envelope or consent result.
function invalid(){throw Object.assign(new Error('Respons ketentuan peta belum sesuai format layanan.'),{code:'SWAPLOTTING_DISCLAIMER_RESPONSE_UNRECOGNIZED'});}
export function decodeSwaplottingDisclaimer(value){
 // d29f34 conditionally decodes one already-transformed String, then requires
 // a Map. Never recursively unwrap a JSON String or a guessed data envelope.
 if(typeof value==='string'){try{value=JSON.parse(value);}catch{invalid();}}
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))invalid();
 return Object.fromEntries(['message','message2','message3','url'].map(key=>{
  const descriptor=Object.getOwnPropertyDescriptor(value,key);
  if(descriptor&&!Object.hasOwn(descriptor,'value'))invalid();
  const item=descriptor?.value??null;if(item!==null&&typeof item!=='string')invalid();return [key,item];
 }));
}
