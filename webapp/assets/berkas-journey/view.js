import {isJourneySnapshot} from './model.js';
const esc=value=>value.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const safeFormat=(formatter,value)=>{try{const result=formatter(value);return typeof result==='string'?result:'-';}catch{return '-';}};
export function berkasJourneyView(snapshot,{formatDate,formatTime,titleId='berkas-journey-title'}={}){
  if(!isJourneySnapshot(snapshot)||typeof formatDate!=='function'||typeof formatTime!=='function'||typeof titleId!=='string'||!/^\w[\w:-]*$/.test(titleId))throw new TypeError('BERKAS_JOURNEY_VIEW');
  const content=snapshot.rows.length?`<ol class="berkas-journey-timeline">${snapshot.rows.map(row=>{
    const {record,state,ordinal,isLast}=row,date=record.tanggalFlow;
    const dateLine=date!==null&&date!==''?`<p class="berkas-journey-date">${esc(safeFormat(formatDate,date))}, ${esc(safeFormat(formatTime,date))}</p>`:'';
    // The three native branches and future ordinal are bound; these Unicode
    // marker glyphs are an explicit accessible browser presentation adaptation.
    const marker=state==='past'?'✓':state==='current'?'●':String(ordinal);
    const status=state==='past'?'Tahap sebelumnya':state==='current'?'Tahap aktif':`Tahap berikutnya ${ordinal}`;
    return `<li class="berkas-journey-row berkas-journey-row--${state}${isLast?' berkas-journey-row--last':''}" data-berkas-journey-state="${state}"${state==='current'?' aria-current="step"':''}><span class="berkas-journey-rail"><span class="berkas-journey-marker" aria-hidden="true">${marker}</span>${isLast?'':'<span class="berkas-journey-connector" aria-hidden="true"></span>'}</span><div class="berkas-journey-copy"><span class="berkas-journey-state">${status}</span><h3>${esc(record.namaGrup??'-')}</h3>${dateLine}</div></li>`;
  }).join('')}</ol>`:'<p class="berkas-journey-empty" role="status">Belum ada aktivitas</p>';
  return `<section class="berkas-journey-screen" data-berkas-journey aria-labelledby="${esc(titleId)}"><header class="berkas-journey-heading"><button type="button" class="button secondary small" data-berkas-journey-back>Kembali ke detail berkas</button><h2 id="${esc(titleId)}" tabindex="-1">Perjalanan Berkas · ${esc(snapshot.numberText)}</h2></header>${content}</section>`;
}
