// Pinned native flow: analysis/recovered/collection-save-persil/flow.json
// NIK is checked/injected by the private adapter; it is never exposed here.
const specifications = Object.freeze({
  save: { id: 'post-collection-addcollectionpersil-daae30', endpoint: 'Collection/AddCollectionPersil', method: 'POST', effect: 'write' },
  groups: { id: 'get-collection-getpersilcollectiongroup-d31fbc', endpoint: 'collection/GetPersilCollectionGroup', method: 'GET', effect: 'read' },
  assign: { id: 'post-collection-addpersilcollectiontogroup-da897c', endpoint: 'Collection/AddPersilCollectionToGroup', method: 'POST', effect: 'write' },
  createGroup: { id: 'post-collection-addpersilcollectiongroup-da8f20', endpoint: 'Collection/AddPersilCollectionGroup', method: 'POST', effect: 'write' },
});
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const firstFeature = context => Array.isArray(context?.featureCollection?.features) ? context.featureCollection.features[0] : null;
const nullableType = (value, key, type) => !Object.hasOwn(value, key) || value[key] === null || typeof value[key] === type;
const authCodes = new Set(['AUTH_REQUIRED', 'LOGIN_REQUIRED', 'SESSION_EXPIRED']);
const warning = '\n\nCatatan: 1 grup gagal ditambahkan, namun bidang sudah tersimpan di koleksi.';

export function trimCollectionSavePersil(value) {
  return typeof value === 'string' ? value.replace(/^[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$/g, '') : '';
}

export function collectionSavePersilEligible(account, context) {
  const status = account?.profile?.statusVerifikasi;
  return account?.authenticated === true && account.tokenPresent === true && Number.isInteger(status) && status !== -1 && context?.collectionId == null;
}

export function collectionSavePersilEntry(account, context, available = true) {
  if (!collectionSavePersilEligible(account, context)) return '';
  return `<button type="button" class="button" data-action="collection-save-persil" ${!available || account.configured !== true || account.loading === true ? 'disabled' : ''}>Simpan ke Koleksi</button>`;
}

function featureFields(feature) {
  const properties = object(feature?.properties) ? feature.properties : {};
  return {
    tipeHak: properties.tipehak ?? properties.TIPEHAK ?? properties.TipeHak ?? 'Belum Terdaftar',
    luas: properties.LUAS == null ? null : String(properties.LUAS),
    nib: properties.NIB == null ? null : String(properties.NIB),
  };
}

function mutationBody(response) {
  const body = response?.data;
  return response?.status === 200 && object(body) && nullableType(body, 'error', 'boolean') && nullableType(body, 'message', 'string') && nullableType(body, 'data', 'string') ? body : null;
}

function groupRows(response) {
  const body = response?.data;
  if (response?.status !== 200 || !object(body) || !nullableType(body, 'error', 'boolean') || !nullableType(body, 'message', 'string') || body.data != null && !Array.isArray(body.data)) return [];
  if (body.data == null) return [];
  if (!body.data.every(row => object(row) && ['collectionGroupId', 'collectionGroupName', 'createdAt'].every(key => nullableType(row, key, 'string')))) return [];
  return body.data.map(row => Object.fromEntries(['collectionGroupId', 'collectionGroupName', 'createdAt'].map(key => [key, row[key] ?? null])));
}

const choices = rows => rows.flatMap((row, index) => typeof row.collectionGroupId === 'string' && row.collectionGroupId.length ? [{ ...row, index }] : []);

// Render strings only. The host owns its dialog, delegated input/click/submit
// listeners and focus. Inputs intentionally remain editable during requests.
export function renderCollectionSavePersil(state) {
  if (!state) return '';
  if (state.groupCreate) {
    const group = state.groupCreate;
    return `<div class="modal-body collection-save-persil-group"><h2 id="modal-title">Buat Grup Baru</h2><p>Beri nama grup agar bidang-bidangmu lebih mudah dikelola.</p><form id="collection-save-persil-group-form" aria-busy="${group.busy}" novalidate><label class="parameter-field" for="collection-save-persil-group-name"><span>Nama Grup</span><input id="collection-save-persil-group-name" name="GroupName" type="text" value="${escapeHtml(group.name)}" placeholder="Contoh: Tanah Warisan, Investasi..." autocomplete="off"></label><div class="modal-actions"><button type="button" class="button secondary" data-action="collection-save-persil-group-cancel" ${group.busy ? 'disabled' : ''}>Batal</button><button type="submit" class="button" ${group.busy ? 'disabled' : ''}>${group.busy ? 'Menyimpan...' : 'Buat Grup'}</button></div></form></div>`;
  }
  const feature = state.feature;
  const groupList = state.groupsLoading
    ? '<div role="status" aria-label="Memuat grup"><span class="collection-caption-spinner" aria-hidden="true"></span></div>'
    : state.groups.length === 0
      ? '<p>Belum ada grup. Buat grup terlebih dahulu.</p>'
      : `<div class="collection-move-choices" aria-label="Grup Bidang">${choices(state.groups).map(row => `<button type="button" class="collection-move-choice${state.selectedGroupId === row.collectionGroupId ? ' selected' : ''}" data-action="collection-save-persil-group-choice" data-index="${row.index}" aria-pressed="${state.selectedGroupId === row.collectionGroupId}"><span>${escapeHtml(row.collectionGroupName ?? '-')}</span></button>`).join('')}</div>`;
  // A hidden accessible heading is a browser-dialog adaptation; the native
  // ordinary sheet has no separate visible title or explicit Batal button.
  return `<div class="modal-body collection-save-persil-body"><h2 id="modal-title" class="sr-only">Simpan ke Koleksi</h2>${feature ? `<dl class="service-facts">${[['Tipe Hak', feature.tipeHak], ['Luas', feature.luas], ['NIB', feature.nib]].map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value ?? '-')}</dd></div>`).join('')}</dl>` : ''}<form id="collection-save-persil-form" aria-busy="${state.busy}" novalidate><label class="parameter-field" for="collection-save-persil-caption"><span>Caption</span><input id="collection-save-persil-caption" name="caption" type="text" value="${escapeHtml(state.caption)}" placeholder="Tulis sesuatu biar mudah dicari di koleksi" autocomplete="off"></label><div class="section-heading"><h3>Pilih Grup</h3><button type="button" class="text-button" data-action="collection-save-persil-group-open">Buat Grup</button></div>${groupList}<div class="modal-actions"><button type="submit" class="button" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Menyimpan...' : 'Simpan ke Koleksi'}</button></div></form></div>`;
}

export function createCollectionSavePersil({ api, getOperations, getAccount, isCurrent, onChange = () => {}, onSaved, onClose = () => {}, notify = () => {}, onAuthError = () => {}, record = () => {} }) {
  for (const callback of [api, getOperations, getAccount, isCurrent]) if (typeof callback !== 'function') throw new TypeError('Host koleksi bidang belum lengkap.');
  let owner = null;
  const current = item => owner === item && isCurrent(item.context) && getAccount()?.authenticated === true;
  const operation = key => {
    const spec = specifications[key];
    return getOperations().find(item => item.id === spec.id && item.endpoint === spec.endpoint && item.method === spec.method && item.effect === spec.effect && item.auth === 'session' && item.serviceId === 'main' && item.enabled === true);
  };
  const connected = () => getAccount()?.configured === true && getAccount()?.loading !== true;
  function snapshot() {
    if (!owner) return null;
    const feature = firstFeature(owner.context);
    return { busy: owner.busy, caption: owner.caption, groupsLoading: owner.groupsLoading, groups: owner.groups.map(row => ({ ...row })), selectedGroupId: owner.selectedGroupId, groupCreate: owner.groupCreate ? { name: owner.groupCreate.name, busy: owner.groupCreate.busy } : null, feature: object(feature) ? featureFields(feature) : null, origin: owner.context.origin ?? null };
  }
  const changed = item => { if (current(item)) onChange(snapshot()); };
  const send = (op, values) => api('/api/execute', { method: 'POST', body: { operationId: op.id, values, ...(op.effect === 'write' ? { confirm: true } : {}) } });
  function authenticationError(error, item) {
    if (!authCodes.has(error?.code) || !current(item)) return false;
    owner = null;
    onAuthError(error);
    return true;
  }
  function requestError(error, fallback) {
    // Local API messages are already sanitized. Unclassified JS exceptions do
    // not expose native exception text or credentials in the browser.
    return typeof error?.code === 'string' && typeof error.message === 'string' ? error.message : fallback;
  }
  async function loadGroups(item) {
    const op = operation('groups');
    if (!current(item) || !connected() || !op) return;
    const request = {};
    item.groupsRequest = request;
    item.groupsLoading = true;
    changed(item);
    try {
      const reply = await send(op, {});
      if (!current(item) || item.groupsRequest !== request) return;
      item.groups = groupRows(reply.result);
    } catch (error) {
      if (!current(item) || item.groupsRequest !== request || authenticationError(error, item)) return;
      item.groups = [];
    } finally {
      if (current(item) && item.groupsRequest === request) { item.groupsLoading = false; item.groupsRequest = null; changed(item); }
    }
  }
  function open(context) {
    if (!collectionSavePersilEligible(getAccount(), context) || !isCurrent(context) || !connected() || !operation('save')) return false;
    owner = { context, caption: '', busy: false, groupsLoading: false, groups: [], selectedGroupId: null, groupCreate: null, groupsRequest: null };
    changed(owner);
    void loadGroups(owner);
    return true;
  }
  function close() {
    const item = owner;
    if (!item) return false;
    const visible = current(item);
    owner = null;
    if (visible) onClose('dismissed', item.context);
    return true;
  }
  function setCaption(value) { if (!owner || !current(owner) || typeof value !== 'string') return false; owner.caption = value; return true; }
  function selectGroup(index) {
    if (!owner || !current(owner) || !Number.isInteger(index) || !Object.hasOwn(owner.groups, index)) return false;
    const id = owner.groups[index].collectionGroupId;
    if (typeof id !== 'string' || id.length === 0) return false;
    owner.selectedGroupId = owner.selectedGroupId === id ? null : id;
    changed(owner);
    return true;
  }
  function openGroupCreate() {
    if (!owner || !current(owner) || owner.groupCreate || !connected() || !operation('createGroup')) return false;
    owner.groupCreate = { name: '', busy: false };
    changed(owner);
    return true;
  }
  function setGroupName(value) { if (!owner || !current(owner) || !owner.groupCreate || typeof value !== 'string') return false; owner.groupCreate.name = value; return true; }
  function cancelGroupCreate() {
    if (!owner || !current(owner) || !owner.groupCreate || owner.groupCreate.busy) return false;
    owner.groupCreate = null;
    changed(owner);
    return true;
  }
  async function submitGroupCreate() {
    const item = owner, group = item?.groupCreate, op = operation('createGroup');
    if (!item || !current(item) || !group || group.busy || !connected() || !op) return false;
    const name = trimCollectionSavePersil(group.name);
    if (!name) { notify('Nama grup tidak boleh kosong', 'error'); return false; }
    group.busy = true;
    changed(item);
    try {
      const reply = await send(op, { GroupName: name });
      if (!current(item) || item.groupCreate !== group) return false;
      const body = mutationBody(reply.result);
      if (!body) { notify('Gagal membuat grup', 'error'); return false; }
      // Nested creation accepts parsed HTTP200 regardless of body.error.
      record('Buat Grup', 'success', 'HTTP 200 · Respons diterima');
      item.groupCreate = null;
      changed(item); // close nested view before starting its own unawaited GET
      void loadGroups(item);
      return true;
    } catch (error) {
      if (!current(item) || item.groupCreate !== group || authenticationError(error, item)) return false;
      notify(requestError(error, 'Terjadi kesalahan'), 'error');
      return false;
    } finally {
      if (current(item) && item.groupCreate === group) { group.busy = false; changed(item); }
    }
  }
  async function submit() {
    const item = owner, op = operation('save');
    if (!item || !current(item) || item.busy || item.groupCreate || !connected() || !op) return false;
    const feature = firstFeature(item.context);
    if (!object(feature)) { notify('Data bidang tidak tersedia', 'error'); return false; }
    const id = item.context.persilId;
    if (typeof id !== 'string' || id.length === 0) { notify('ID Persil tidak tersedia', 'error'); return false; }
    const caption = trimCollectionSavePersil(item.caption), title = caption || `Bidang Analog nomor ${featureFields(feature).nib ?? '1'}`;
    item.busy = true;
    changed(item);
    try {
      const reply = await send(op, { PersilId: id, Title: title });
      if (!current(item)) return false;
      const body = mutationBody(reply.result);
      if (!body || body.error !== false) { notify(body?.message ?? 'Gagal menyimpan ke koleksi', 'error'); return false; }
      const collectionId = body.data, groupId = item.selectedGroupId;
      let assignmentFailed = false;
      if (typeof collectionId === 'string' && collectionId.length > 0 && groupId !== null) {
        const assignment = operation('assign');
        if (!assignment) assignmentFailed = true;
        else try {
          const assigned = await send(assignment, { collectionGroupId: groupId, collectionId });
          if (!current(item)) return false;
          assignmentFailed = mutationBody(assigned.result)?.error !== false;
        } catch (error) {
          if (!current(item) || authenticationError(error, item)) return false;
          assignmentFailed = true;
        }
      }
      if (!current(item)) return false;
      const callback = item.context.onSaved ?? onSaved;
      const callbackResult = callback?.();
      if (callbackResult && typeof callbackResult.catch === 'function') void callbackResult.catch(() => {});
      if (!current(item)) return false;
      record('Simpan ke Koleksi', 'success', 'HTTP 200 · Respons diterima');
      owner = null; // invalidate all nested/read continuations before host close
      onClose('saved', item.context);
      notify((body.message ?? 'Berhasil disimpan ke koleksi') + (assignmentFailed ? warning : ''), 'success');
      return true;
    } catch (error) {
      if (!current(item) || authenticationError(error, item)) return false;
      record('Simpan ke Koleksi', 'error', `${error?.code ?? 'ERROR'} · Permintaan belum berhasil`);
      notify(requestError(error, 'Terjadi kesalahan. Coba lagi.'), 'error');
      return false;
    } finally {
      if (current(item)) { item.busy = false; changed(item); }
    }
  }
  return { open, close, reset() { owner = null; }, snapshot, render: () => renderCollectionSavePersil(snapshot()), available: () => !!operation('save'), setCaption, selectGroup, openGroupCreate, setGroupName, cancelGroupCreate, submitGroupCreate, submit };
}
