import {RATING_PPAT_COPY} from './model.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function ratingPPATView(model,{available=true,writeAvailable=false}={}){
 if(model.stage==='disposed')return '';
 let body='';
 if(model.pending)body=`<p role="status">${RATING_PPAT_COPY.loading}</p>`;
 else if(model.stage==='error')body=`<p class="notice notice-error" role="alert">${esc(model.error)}</p>`;
 else if(model.stage==='empty')body=`<p class="notice notice-info">${RATING_PPAT_COPY.empty}</p>`;
 else if(model.stage==='ready')body=model.groups.map((group,groupIndex)=>{
  const answers=group.jawabanRatingPPAT??[],selected=model.selection.get(group.pertanyaanRatingPPATId??'');
  // HTML names use source indices, never nullable/raw native IDs. Duplicate
  // native group IDs still share the Map value. Equal duplicate answer IDs
  // all carry checked in this template; HTML radio normalization selects the
  // last equal control within that indexed group. This is a browser adaptation.
  return `<fieldset class="panel rating-ppat-group"><legend>${groupIndex+1}. ${esc(group.indikator??'')}</legend><p>${esc(answers[0]?.pertanyaan??'')}</p>${answers.map((answer,answerIndex)=>`<label class="rating-ppat-answer" for="rating-ppat-answer-${groupIndex}-${answerIndex}"><input id="rating-ppat-answer-${groupIndex}-${answerIndex}" type="radio" name="rating-ppat-group-${groupIndex}" value="${answerIndex}" data-rating-ppat-group="${groupIndex}" data-rating-ppat-answer="${answerIndex}" ${selected!==undefined&&selected===(answer.pertanyaanRatingPPATId??'')?'checked':''}${model.writePending?' disabled':''}><span>${esc(answer.jawaban??'')}</span></label>`).join('')}</fieldset>`;
 }).join('');
 const canSubmit=model.writeCapable&&writeAvailable&&!model.pending&&!model.writePending&&!model.writeRequiresReload&&!model.resultDelivered&&['ready','empty'].includes(model.stage);
 const footer=model.writePending?`<p role="status" data-rating-ppat-write-pending>${RATING_PPAT_COPY.sending}</p>`:`<button type="button" class="button" data-action="rating-ppat-submit" ${canSubmit?'':'disabled'} aria-describedby="rating-ppat-write-boundary">Kirim Rating</button>`;
 return `<section data-rating-ppat><button type="button" class="back-link" data-action="rating-ppat-back" ${model.writePending?'disabled':''}>← Kembali ke Aktaku</button><div class="page-heading"><div><div class="eyebrow">AKTA</div><h1>${esc('Rating PPAT '+model.entry.namaPPAT)}</h1></div></div>${!available?'<p class="notice notice-warning">Pembacaan pertanyaan belum tersedia. Periksa koneksi atau masuk kembali.</p>':''}<div data-rating-ppat-questions aria-live="polite">${body}</div>${!model.pending&&['ready','empty','error'].includes(model.stage)?`<button type="button" class="text-button" data-action="rating-ppat-retry" ${available&&!model.writePending?'':'disabled'}>Muat ulang pertanyaan</button>`:''}<p class="form-hint" data-rating-ppat-count>Pilihan lokal: ${model.selectedCount} · Kelompok pertanyaan: ${model.groupCount}. ${model.incomplete?'Masih ada pertanyaan yang belum terisi.':''}</p>${model.writeError?`<p class="notice notice-error" role="alert" data-rating-ppat-write-error>${esc(model.writeError)}</p>`:''}${footer}<p class="privacy-note" id="rating-ppat-write-boundary">${writeAvailable||model.writePending?RATING_PPAT_COPY.writeBoundary:RATING_PPAT_COPY.boundary}</p></section>`;
}
