// Bounded queue booking-read UI semantics from the frozen 6.1.5 ledgers.
// Date uses millisecond browser precision; no claim about native microseconds,
// lenient DateTime parsing, extreme years, locale or full picker UI parity.
const DAY=86400000;
const validDate=date=>date instanceof Date&&Number.isFinite(date.getTime());
const two=value=>String(value).padStart(2,'0');
export function queueDateText(date){if(!validDate(date))throw new RangeError('QUEUE_DATE');return `${String(date.getFullYear()).padStart(4,'0')}-${two(date.getMonth()+1)}-${two(date.getDate())}`;}
export function queueDateInput(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const [year,month,day]=value.split('-').map(Number);if(year<1)return null;
 const date=new Date(0);date.setFullYear(year,month-1,day);date.setHours(0,0,0,0);
 return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
}
export function queuePickerBounds(now=new Date()){
 if(!validDate(now))throw new RangeError('QUEUE_CLOCK');
 return {lower:new Date(now.getTime()-DAY),upper:null};
}
export function queueWithinBounds(date,{lower=null,upper=null}={}){
 return validDate(date)&&(lower===null||validDate(lower)&&date.getTime()>=lower.getTime())&&(upper===null||validDate(upper)&&date.getTime()<=upper.getTime());
}
export function queueCalendarDate(value){
 if(typeof value!=='string')return null;
 if(!value.includes('T'))return queueDateInput(value);
 // A narrow ISO guard avoids silently normalizing an impossible civil day.
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(value)||!queueDateInput(value.slice(0,10)))return null;
 const date=new Date(value);return validDate(date)?date:null;
}
export function queueIsHoliday(date,rows=[]){
 if(!validDate(date)||!Array.isArray(rows))return false;
 return rows.some(row=>{if(row?.tipeLiburId!=='1'&&row?.tipeLiburId!=='2')return false;const candidate=queueCalendarDate(row.tanggal);return candidate!==null&&candidate.getFullYear()===date.getFullYear()&&candidate.getMonth()===date.getMonth()&&candidate.getDate()===date.getDate();});
}
export function queueDateSelectable(date,bounds,rows=[]){return queueWithinBounds(date,bounds)&&!queueIsHoliday(date,rows);}
export function queuePickerInitial(initial,bounds,rows=[]){
 if(!validDate(initial))throw new RangeError('QUEUE_DATE');
 const clamp=date=>{if(bounds?.lower&&date<bounds.lower)return new Date(bounds.lower);if(bounds?.upper&&date>bounds.upper)return new Date(bounds.upper);return new Date(date);};
 const original=clamp(initial);if(!queueIsHoliday(original,rows))return original;
 const last=original.getTime()+365*DAY;
 for(let time=original.getTime()+DAY;time<=last;time+=DAY){const candidate=new Date(time);if(queueDateSelectable(candidate,bounds,rows))return candidate;}
 return clamp(original);
}
export function queueOfficeOrder(rows,profileOfficeId){
 if(!Array.isArray(rows))throw new TypeError('QUEUE_OFFICE_LIST');const result=[...rows];
 if(profileOfficeId!==null&&profileOfficeId!==undefined){const index=result.findIndex(row=>row.kantor_id===profileOfficeId);if(index>=0)result.unshift(...result.splice(index,1));}
 return result;
}
export function queueOfficePreferred(row,profileOfficeId){return (row.kantor_id??null)===(profileOfficeId??null);}
export function queueOwnApplicant(profile){
 if(!profile||typeof profile!=='object'||![2,3].includes(profile.userLevel))return null;
 if(typeof profile.isIkd!=='boolean')throw new TypeError('QUEUE_PROFILE_IKD');if(profile.isIkd)return null;
 if(['nama','nomorIdentitas'].some(key=>profile[key]!=null&&typeof profile[key]!=='string'))throw new TypeError('QUEUE_PROFILE_STRING');
 return {id:0,nama:profile.nama??'',nik:profile.nomorIdentitas??''};
}
