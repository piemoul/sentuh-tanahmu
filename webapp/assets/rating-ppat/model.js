// Native6.1.5 Rating PPAT read/UI follow-ups: nullable Strings, source order,
// one question description per group, and a local String→String selection Map.
export const RATING_PPAT_COPY=Object.freeze({loading:'Memuat pertanyaan Rating PPAT…',empty:'Belum ada pertanyaan Rating PPAT dari layanan.',error:'Pertanyaan Rating PPAT belum dapat dimuat.',boundary:'Pilihan ini hanya draf lokal. Kirim Rating belum diaktifkan; belum ada penilaian yang dikirim atau diverifikasi.',sending:'Mengirim Rating PPAT…',incomplete:'Jawab seluruh pertanyaan sebelum mengirim.',writeFallback:'Terjadi kesalahan saat Mengirimkan Rating PPAT',writeBoundary:'Kirim Rating akan mengirim jawaban yang dipilih ke layanan Rating PPAT.',sessionChanged:'Sesi atau halaman telah berubah. Muat ulang pertanyaan sebelum mengirim kembali.'});
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const fail=()=>{throw Object.assign(new TypeError('Format pertanyaan Rating PPAT belum dikenali.'),{code:'RATING_PPAT_MODEL'});};
function text(row,key){const value=row[key];if(value!=null&&typeof value!=='string')fail();return value??null;}
export function ratingPPATEntry(value){if(!object(value)||typeof value.aktaId!=='string'||typeof value.namaPPAT!=='string')throw new TypeError('RATING_PPAT_ENTRY');return {aktaId:value.aktaId,namaPPAT:value.namaPPAT};}
export function ratingPPATGroups(response){
 if(!object(response)||!Array.isArray(response.data))fail();
 return Array.from(response.data,row=>{
  if(!object(row))fail();text(row,'kategori');
  const answers=row.jawabanRatingPPAT;if(answers!=null&&!Array.isArray(answers))fail();
  return {pertanyaanRatingPPATId:text(row,'pertanyaanRatingPPATId'),indikator:text(row,'indikator'),jawabanRatingPPAT:answers==null?null:Array.from(answers,answer=>{
   if(!object(answer))fail();text(answer,'bobot');text(answer,'nilai');
   return {pertanyaanRatingPPATId:text(answer,'pertanyaanRatingPPATId'),pertanyaan:text(answer,'pertanyaan'),jawaban:text(answer,'jawaban')};
  })};
 });
}
export function ratingPPATChoice(groups,groupIndex,answerIndex){
 if(!Array.isArray(groups)||!Number.isInteger(groupIndex)||groupIndex<0||!Object.hasOwn(groups,groupIndex)||!Number.isInteger(answerIndex)||answerIndex<0)return null;
 const group=groups[groupIndex],answers=group?.jawabanRatingPPAT;if(!Array.isArray(answers)||!Object.hasOwn(answers,answerIndex)||group.pertanyaanRatingPPATId===null)return null;
 return {groupId:group.pertanyaanRatingPPATId,answerId:answers[answerIndex].pertanyaanRatingPPATId??''};
}
export function ratingPPATCount(groups,selection){return {selectedCount:selection.size,groupCount:groups.length,incomplete:selection.size<groups.length};}
export function ratingPPATWriteValues(entry,selection){
 const source=ratingPPATEntry(entry);if(!(selection instanceof Map)||[...selection].some(([key,value])=>typeof key!=='string'||typeof value!=='string'))throw new TypeError('RATING_PPAT_SELECTION');
 return {aktaId:source.aktaId,PertanyaanRatingPPATId:Array.from(selection.values())};
}
export function ratingPPATResult(value){if(!object(value)||typeof value.success!=='boolean'||typeof value.message!=='string')throw new TypeError('RATING_PPAT_RESULT');return {success:value.success,message:value.message};}
