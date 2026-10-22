// Additive pinned Dart/intl HH:mm reference; native evidence: BERKAS-JOURNEY-UI-FOLLOWUP.md.
import './time-vendor.js';
await globalThis.__sentuhJourneyTimeFormatterReady;
if(typeof globalThis.__sentuhJourneyTimeFormatter!=='function')throw new Error('Journey time formatter did not initialize');
export function journeyTimeDisplay(value){return globalThis.__sentuhJourneyTimeFormatter(value);}
