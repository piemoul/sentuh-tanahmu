import {parseQueueProfileResponse} from './queue-profile.mjs';

// Reuse all 18 ayb field validations; retain only the server-side own-applicant
// projection needed by the quota/review flow. The existing read projection and
// identity joins remain unchanged. No browser profile/sign-in NIK fallback.
export function parseQueueBookingProfileResponse(result){
 const identity=parseQueueProfileResponse(result),source=Object.getOwnPropertyDescriptor(Object.getOwnPropertyDescriptor(result,'data').value,'data').value;
 const profile={...identity};
 for(const key of ['nama','nomorHp','tempatLahir','tanggalLahir']){const descriptor=Object.getOwnPropertyDescriptor(source,key);profile[key]=descriptor?.value??null;}
 return profile;
}
export function queueBookingOwnApplicant(profile){
 if(!profile||![2,3].includes(profile.userLevel))throw Object.assign(new Error('Akun ini belum menyediakan identitas pemohon antrean sendiri.'),{status:409,code:'QUEUE_BOOKING_IDENTITY_UNAVAILABLE'});
 if(typeof profile.isIkd!=='boolean')throw Object.assign(new Error('Status identitas antrean belum sesuai kontrak.'),{status:409,code:'QUEUE_BOOKING_IDENTITY_UNAVAILABLE'});
 if(profile.isIkd)throw Object.assign(new Error('Pemilihan identitas IKD belum tersedia untuk pemeriksaan antrean web.'),{status:409,code:'QUEUE_BOOKING_MANAGED_IDENTITY_UNAVAILABLE'});
 return {nik:profile.nomorIdentitas??'',nama:profile.nama??'',noHp:profile.nomorHp??'',tempatLahir:profile.tempatLahir??'',tanggalLahir:profile.tanggalLahir??''};
}
