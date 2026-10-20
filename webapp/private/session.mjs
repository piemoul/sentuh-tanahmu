import { randomBytes, timingSafeEqual } from 'node:crypto';

const random = () => randomBytes(32).toString('base64url');
export const COOKIE = 'sentuh_local_session';
export function clearAuthentication(session, expectedTokens = session?.tokens) {
  if (!session || session.tokens !== expectedTokens) return false;
  session.tokens = null; session.user = null; session.downloads?.clear();
  session.authenticationController?.abort();
  return true;
}
export class SessionStore {
  constructor({ now = Date.now, idleMs = 30 * 60_000, maxMs = 8 * 60 * 60_000 } = {}) {
    this.sessions = new Map(); this.now = now; this.idleMs = idleMs; this.maxMs = maxMs;
  }
  get(id) {
    const session = this.sessions.get(id);
    if (!session) return null;
    if (this.now() - session.seen > this.idleMs || this.now() - session.created > this.maxMs) { this.delete(id); return null; }
    session.seen = this.now(); return session;
  }
  create() {
    for (const id of this.sessions.keys()) this.getWithoutTouch(id);
    if (this.sessions.size >= 500) this.delete(this.sessions.keys().next().value);
    const authenticationController = new AbortController();
    const session = { id: random(), active: true, csrfToken: random(), created: this.now(), seen: this.now(), user: null, tokens: null, downloads: new Map(), loginAttempts: [], authenticationController, authenticationSignal: authenticationController.signal };
    this.sessions.set(session.id, session); return session;
  }
  getWithoutTouch(id) {
    const session = this.sessions.get(id);
    if (session && (this.now() - session.seen > this.idleMs || this.now() - session.created > this.maxMs)) this.delete(id);
  }
  rotate(previous) { this.delete(previous?.id); return this.create(); }
  delete(id) { const session = this.sessions.get(id); if (session) { session.active = false; clearAuthentication(session); } this.sessions.delete(id); }
}
export function readSessionId(cookie = '') {
  return cookie.split(';').map(value => value.trim()).find(value => value.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
}
export function csrfMatches(given, expected) {
  if (typeof given !== 'string') return false;
  const supplied = Buffer.from(given); const correct = Buffer.from(expected);
  if (supplied.length !== correct.length) return false;
  return timingSafeEqual(supplied, correct);
}
export function cookieFor(id, secure = false) { return `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure ? '; Secure' : ''}`; }
