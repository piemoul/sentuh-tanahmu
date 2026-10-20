// Native activity list/Qyb: activity-delete/flow.json SHA 6b9fe33d…a6c80.
// The service accepts data ?? message, ignores envelope.error, and decodes an
// already-transformed String once. Unknown envelope/model fields are discarded.
// createdAt is deliberately raw String-or-null: native parsing/runtime fallback
// is not reproduced by inventing a browser timestamp or guessing date syntax.
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function invalid() {
  const error = new Error('Respons aktivitas belum sesuai kontrak layanan.');
  error.code = 'ACTIVITY_RESPONSE_UNRECOGNIZED';
  throw error;
}
function nullableString(value, key) {
  const field = Object.hasOwn(value, key) ? value[key] : null;
  if (field !== null && typeof field !== 'string') invalid();
  return field;
}
export function decodeUserActivityEnvelope(value) {
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { invalid(); }
  }
  if (!record(value)) invalid();
  const rows = value.data ?? value.message;
  if (!Array.isArray(rows)) invalid();
  return { data: Array.from(rows, row => {
    if (!record(row)) invalid();
    return {
      userActivityId: nullableString(row, 'userActivityId') ?? '',
      activityType: nullableString(row, 'activityType') ?? '',
      platform: nullableString(row, 'platform') ?? '',
      createdAt: nullableString(row, 'createdAt'),
      contentId: nullableString(row, 'contentId'),
      title: nullableString(row, 'title') ?? '',
      subTitle: nullableString(row, 'subTitle') ?? '',
      status: nullableString(row, 'status') ?? '',
    };
  }) };
}
