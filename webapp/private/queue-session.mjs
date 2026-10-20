import { ApiError } from './api-client.mjs';
import { APP_VERSION } from './configuration.mjs';
import { queueReadIdentityQuery, queueReadIdentityKeys } from './queue-identity.mjs';
import { parseQueueProfileResponse } from './queue-profile.mjs';

const sameProfile = (a, b) => a && b && ['userLevel', 'isIkd', 'nomorIdentitas'].every(key => a[key] === b[key]);
function activityQueueIds(result) {
  const ids = new Set();
  if (result.status !== 200) return ids;
  let body = result.data;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return ids; } }
  const rows = body?.data ?? body?.message;
  if (!Array.isArray(rows)) return ids;
  const strings = ['userActivityId', 'activityType', 'platform', 'createdAt', 'contentId', 'title', 'subTitle', 'status'];
  if (!rows.every(row => row && typeof row === 'object' && !Array.isArray(row) && strings.every(key => row[key] == null || typeof row[key] === 'string'))) return ids;
  for (const row of rows) {
    const type = (row.activityType ?? '').toLowerCase();
    if (!type.includes('bidang') && !type.includes('berkas') && type.includes('antrian') && typeof row.contentId === 'string' && row.contentId.length && row.contentId.length <= 1024) ids.add(row.contentId);
  }
  return ids;
}

// Server-owned identity and ID authorization. No caller-supplied profile, NIK,
// managed-identity array or queue bearer enters this component's read interface.
export class QueueSessionReader {
  constructor(clientPromise, queueClientPromise) {
    this.clientPromise = clientPromise;
    this.queueClientPromise = queueClientPromise;
    this.states = new WeakMap();
    this.closeController = new AbortController();
  }
  state(session) {
    let state = this.states.get(session);
    if (!state) {
      state = { profile: null, listIds: new Set(), activityIds: new Set(), listSequence: 0, summarySequence: 0, controller: new AbortController() };
      state.signal = AbortSignal.any([state.controller.signal, this.closeController.signal, session.authenticationSignal].filter(signal => signal instanceof AbortSignal));
      this.states.set(session, state);
    }
    return state;
  }
  discard(session) {
    const state = session && this.states.get(session);
    if (state) { state.controller.abort(); this.states.delete(session); }
  }
  close() { this.closeController.abort(); }
  observe(prepared, result, session) {
    if (!session?.tokens || !session.active) return;
    if (prepared.operation.endpoint === 'account/account_summary') {
      const state = this.state(session);
      state.summarySequence++;
      let profile;
      try { profile = parseQueueProfileResponse(result); } catch { profile = null; }
      if (!sameProfile(state.profile, profile)) { state.profile = profile; state.listIds.clear(); state.listSequence++; }
    } else if (prepared.operation.endpoint === 'activity/GetUserActivity') this.state(session).activityIds = activityQueueIds(result);
  }
  async read(prepared, session, assertCurrentSession) {
    const current = () => {
      assertCurrentSession();
      if (!session.tokens || session.active === false) throw new ApiError(401, 'SESSION_EXPIRED', 'Sesi sudah ditutup. Silakan masuk kembali.');
    };
    current();
    const state = this.state(session);
    const client = await this.clientPromise;
    await client.ensureFresh(session); current();
    let result;
    const calls = prepared.operation.id === 'get-api-notifikasi-d22468';
    if (calls || prepared.operation.id === 'get-api-antrian-saya-d1eb1c') {
      if (!state.profile) {
        const summarySequence = ++state.summarySequence;
        const summary = await client.request({ path: 'account/account_summary', method: 'POST', encoding: 'form', auth: 'session', session, body: { appVersion: APP_VERSION }, query: {} });
        current();
        if (summarySequence === state.summarySequence) {
          try { state.profile = parseQueueProfileResponse(summary); }
          catch { throw new ApiError(502, 'QUEUE_PROFILE_UNRECOGNIZED', 'Ringkasan akun belum sesuai kontrak identitas antrean.'); }
        } else if (!state.profile) throw new ApiError(409, 'SESSION_CHANGED', 'Profil berubah saat identitas antrean dimuat. Muat ulang daftar.');
      }
      const profile = state.profile;
      let query;
      try { query = calls ? [...new Set(queueReadIdentityKeys(profile, []))].join(',') || null : queueReadIdentityQuery(profile, []); }
      catch { throw new ApiError(409, 'QUEUE_IDENTITY_UNRECOGNIZED', 'Identitas antrean belum tersedia pada ringkasan akun.'); }
      const sequence = calls ? state.listSequence : ++state.listSequence;
      if (!calls) state.listIds.clear();
      if (query === null) return { status: 200, contentType: 'application/json', data: calls ? { data: [] } : { error: false, data: [] }, skipped: true };
      result = await (await this.queueClientPromise)[calls ? 'calls' : 'list'](query, { signal: state.signal });
      current();
      if (state.profile !== profile) throw new ApiError(409, 'SESSION_CHANGED', 'Profil berubah saat daftar antrean dimuat. Muat ulang daftar.');
      if (!calls && sequence === state.listSequence) state.listIds = new Set(result.data.map(row => row.id).filter(id => id.length && id.length <= 1024));
    } else {
      const id = prepared.queueId;
      if (!state.listIds.has(id) && !state.activityIds.has(id)) throw new ApiError(403, 'QUEUE_ID_NOT_OWNED', 'Pilih antrean dari daftar atau aktivitas akun ini terlebih dahulu.');
      result = await (await this.queueClientPromise).detail(id, { signal: state.signal });
      current();
      if (!state.listIds.has(id) && !state.activityIds.has(id)) throw new ApiError(403, 'QUEUE_ID_NOT_OWNED', 'Profil atau daftar berubah saat detail antrean dimuat. Pilih antrean kembali.');
    }
    return { ...result, data: calls ? { data: result.data } : { error: false, data: result.data } };
  }
}
