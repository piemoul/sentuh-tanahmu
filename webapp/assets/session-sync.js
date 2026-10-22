// Synchronizes local session state only. This module never logs in, replays a
// POST, stores credentials, or broadcasts account/session data.
export const SESSION_SYNC_CHANNEL = 'sentuh-session-sync-v1';
const MESSAGE_TYPE = 'sentuh-session-change';
const NONCE = /^s_[A-Za-z0-9_-]{16,80}$/;

function nonce() {
  try {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return 's_' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  } catch {
    // This is an event deduplication value, never a secret or authenticator.
    return 's_' + (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).padEnd(16, '0');
  }
}

function defaultChannel(name) {
  return typeof globalThis.BroadcastChannel === 'function' ? new globalThis.BroadcastChannel(name) : null;
}

/**
 * check() queues one local read and returns its current attempt's boolean result.
 * When hidden/paused it resolves false while retaining one deferred check.
 * An event during a read revokes its response and queues one follow-up; reads
 * never overlap. invalidate() discards old work before local auth/bootstrap.
 * flush() resumes deferred work without creating a new event. notify() only
 * broadcasts an opaque change notice; it does not fetch anything locally.
 *
 * getGeneration() must return a stable primitive or identity for the current
 * auth/load generation. applyState receives isCurrent for work before it changes
 * that generation; subsequent hydration must use the caller's new owner guard.
 */
export function createSessionSync({
  readState,
  applyState,
  canCheck = () => true,
  getGeneration = () => 0,
  eventTarget = globalThis.window ?? null,
  document: visibilityTarget = globalThis.document ?? null,
  channelFactory = defaultChannel,
  onError = () => {},
} = {}) {
  if (typeof readState !== 'function' || typeof applyState !== 'function') throw new TypeError('Session sync needs local readState and applyState callbacks.');
  let disposed = false, serial = 0, queued = false, reason = 'manual', pending = null, scheduled = null, channel = null;
  const cleanup = [], seen = new Set();
  const remember = value => { seen.add(value); if (seen.size > 32) seen.delete(seen.values().next().value); };
  const visible = () => visibilityTarget?.hidden !== true && visibilityTarget?.visibilityState !== 'hidden';
  const allowed = () => {
    if (disposed || !visible()) return false;
    try { return canCheck() === true; } catch { return false; }
  };
  const generation = () => getGeneration();
  const current = attempt => {
    if (disposed || pending !== attempt || serial !== attempt.serial || attempt.controller.signal.aborted || !allowed()) return false;
    try { return Object.is(generation(), attempt.generation); } catch { return false; }
  };
  const deferIfPaused = attempt => {
    if (disposed || serial !== attempt.serial || attempt.controller.signal.aborted) return;
    try { if (Object.is(generation(), attempt.generation) && !allowed()) queued = true; } catch { /* Caller state is unavailable. */ }
  };

  function schedule() {
    if (!queued || !allowed()) return Promise.resolve(false);
    if (pending) return pending.promise;
    if (scheduled) return scheduled.promise;
    let resolve;
    const task = { promise: new Promise(done => { resolve = done; }), resolve: value => resolve(value) };
    scheduled = task;
    queueMicrotask(() => {
      if (scheduled !== task) return;
      scheduled = null;
      if (!queued || !allowed()) { task.resolve(false); return; }
      let capturedGeneration;
      try { capturedGeneration = generation(); } catch { task.resolve(false); return; }
      queued = false;
      const attempt = { serial, generation: capturedGeneration, controller: new AbortController(), promise: task.promise, reason };
      pending = attempt;
      void (async () => {
        let applied = false;
        try {
          if (!current(attempt)) { deferIfPaused(attempt); return; }
          const data = await readState({ signal: attempt.controller.signal });
          if (!current(attempt)) { deferIfPaused(attempt); return; }
          await applyState(data, { reason: attempt.reason, generation: attempt.generation, isCurrent: () => current(attempt) });
          applied = true;
        } catch (error) {
          deferIfPaused(attempt);
          if (current(attempt) && error?.name !== 'AbortError') {
            try { await onError(error, { reason: attempt.reason }); } catch { /* Diagnostics must not alter ownership or retry a request. */ }
          }
        } finally {
          if (pending === attempt) pending = null;
          task.resolve(applied);
          if (queued) void schedule();
        }
      })();
    });
    return task.promise;
  }

  function check(nextReason = 'manual') {
    if (disposed) return Promise.resolve(false);
    serial++;
    queued = true;
    reason = typeof nextReason === 'string' ? nextReason.slice(0, 40) : 'manual';
    pending?.controller.abort();
    return schedule();
  }

  function invalidate() {
    if (disposed) return;
    serial++;
    queued = false;
    if (scheduled) { const retired = scheduled; scheduled = null; retired.resolve(false); }
    pending?.controller.abort();
  }

  function flush() {
    if (disposed) return Promise.resolve(false);
    if (pending) return pending.promise;
    return schedule();
  }

  function listen(target, type, listener) {
    if (typeof target?.addEventListener !== 'function' || typeof target?.removeEventListener !== 'function') return false;
    try {
      target.addEventListener(type, listener);
      cleanup.push(() => target.removeEventListener(type, listener));
      return true;
    } catch { return false; }
  }

  const received = event => {
    const data = event?.data;
    if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).sort().join(',') !== 'nonce,type,version' || data.type !== MESSAGE_TYPE || data.version !== 1 || typeof data.nonce !== 'string' || !NONCE.test(data.nonce) || seen.has(data.nonce)) return;
    remember(data.nonce);
    void check('broadcast');
  };
  try {
    channel = typeof channelFactory === 'function' ? channelFactory(SESSION_SYNC_CHANNEL) : null;
    if (channel && !listen(channel, 'message', received) && 'onmessage' in channel) {
      const previous = channel.onmessage;
      channel.onmessage = received;
      cleanup.push(() => { if (channel.onmessage === received) channel.onmessage = previous; });
    }
  } catch { channel = null; }

  listen(eventTarget, 'focus', () => { void check('focus'); });
  listen(eventTarget, 'pageshow', () => { void check('pageshow'); });
  listen(visibilityTarget, 'visibilitychange', () => { void check('visibility'); });

  function notify() {
    if (disposed || typeof channel?.postMessage !== 'function') return false;
    const value = nonce();
    remember(value);
    try { channel.postMessage({ type: MESSAGE_TYPE, version: 1, nonce: value }); return true; } catch { return false; }
  }

  function dispose() {
    if (disposed) return;
    invalidate();
    disposed = true;
    for (const stop of cleanup.splice(0)) { try { stop(); } catch { /* Optional event surfaces may already be closed. */ } }
    try { channel?.close?.(); } catch { /* Broadcast support is optional. */ }
    channel = null;
    seen.clear();
  }

  return Object.freeze({ check, invalidate, flush, notify, dispose });
}
