// Built from the pinned Dart/intl reference; see analysis/CERTIFICATE-DATE-FLOW.md.
// This formatter is for the three analog certificate display fields only.
import './vendor.js';

await globalThis.__sentuhCertificateDateFormatterReady;
if (typeof globalThis.__sentuhCertificateDateFormatter !== 'function') {
  throw new Error('Certificate date formatter did not initialize');
}

export function certificateDateDisplay(value) {
  return globalThis.__sentuhCertificateDateFormatter(value);
}
