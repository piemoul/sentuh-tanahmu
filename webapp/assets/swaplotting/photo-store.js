// Own only in-memory camera Blob URLs accepted by this form host.
// There is no persistence, request, file import or upload capability.
export function createSwaplottingPhotoStore({revoke=url=>URL.revokeObjectURL(url)}={}){
 const entries=new Map();let alive=true;
 const valid=record=>alive&&typeof record?.url==='string'&&record.url.startsWith('blob:')&&!/[\s\u0000-\u001f\u007f]/.test(record.url)&&record.blob&&typeof record.blob.arrayBuffer==='function'&&Number.isSafeInteger(record.blob.size)&&record.blob.size>0&&['image/jpeg','image/png','image/webp'].includes(record.blob.type)&&!entries.has(record.url);
 const release=url=>{if(!entries.delete(url))return;try{revoke(url);}catch{}};
 return {
  canAdd:record=>!!valid(record),
  add(record){if(!valid(record))return false;entries.set(record.url,record.blob);return true;},
  has:url=>alive&&entries.has(url),
  get:url=>alive?entries.get(url)??null:null,
  size:()=>entries.size,
  sync(paths){const keep=new Set(Array.isArray(paths)?paths:[]);for(const url of entries.keys())if(!keep.has(url))release(url);},
  dispose(){if(!alive)return;alive=false;for(const url of entries.keys())release(url);},
 };
}
