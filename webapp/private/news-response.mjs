// Native list models zCb/ACb: analysis/recovered/news-flow/flow.json.
// Both helpers read message (not data) and ignore the envelope error field.
export function decodeNewsEnvelope(value) {
  const invalid = () => {
    const error = new Error('Respons berita atau pengumuman belum sesuai kontrak layanan.');
    error.code = 'NEWS_RESPONSE_UNRECOGNIZED';
    throw error;
  };
  if (typeof value === 'string') {
    try { value = JSON.parse(value); } catch { invalid(); }
  }
  const record = item => item !== null && typeof item === 'object' && !Array.isArray(item) && [Object.prototype, null].includes(Object.getPrototypeOf(item));
  if (!record(value) || !Object.hasOwn(value, 'message') || !Array.isArray(value.message)) invalid();
  const fields = ['id', 'title', 'category', 'banner', 'url'];
  return { message: Array.from(value.message, item => {
    if (!record(item)) invalid();
    return Object.fromEntries(fields.map(key => {
      const field = Object.hasOwn(item, key) ? item[key] : null;
      if (field !== null && typeof field !== 'string') invalid();
      return [key, field];
    }));
  }) };
}
