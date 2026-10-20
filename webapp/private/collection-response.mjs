// Native xEb/vEb/yEb models: the already-decoded body must be a Map.
// Evidence: analysis/COLLECTION-CARD-FOLLOWUP.md, COLLECTION-GROUPS-FOLLOWUP.md,
// COLLECTION-GROUP-CREATE.md, COLLECTION-GROUP-MOVE.md and COLLECTION-GROUP-DELETE.md.
// Item DELETE/PUT share yEb: recovered/collection-item-{delete,edit}/flow.json.
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const invalid = () => {
  const error = new Error('Respons koleksi belum sesuai kontrak layanan.');
  error.code = 'COLLECTION_RESPONSE_UNRECOGNIZED';
  throw error;
};
function nullable(value, key, type) {
  const field = Object.hasOwn(value, key) ? value[key] : null;
  if (field !== null && typeof field !== type) invalid();
  return field;
}
function decode(value, fields) {
  if (!record(value)) invalid();
  const error = nullable(value, 'error', 'boolean');
  const message = nullable(value, 'message', 'string');
  const data = Object.hasOwn(value, 'data') ? value.data : null;
  if (data !== null && !Array.isArray(data)) invalid();
  return { error, message, data: data === null ? null : Array.from(data, item => {
    if (!record(item)) invalid();
    return Object.fromEntries(fields.map(key => [key, nullable(item, key, 'string')]));
  }) };
}
export function decodeUserCollectionEnvelope(value) {
  return decode(value, ['id', 'type', 'contentId', 'createdAt', 'email', 'title', 'subTitle', 'groupId']);
}
export function decodePersilCollectionGroupEnvelope(value) {
  return decode(value, ['collectionGroupId', 'collectionGroupName', 'createdAt']);
}
export function decodeCollectionMutationEnvelope(value) {
  if (!record(value)) invalid();
  return { error: nullable(value, 'error', 'boolean'), message: nullable(value, 'message', 'string'), data: nullable(value, 'data', 'string') };
}
export const decodeCreatePersilCollectionGroupEnvelope = decodeCollectionMutationEnvelope;
