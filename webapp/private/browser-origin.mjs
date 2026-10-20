// Public origin is explicit operator configuration, never inferred from proxy
// headers. Cloudflare must preserve (or explicitly set) this HTTP Host value.
export function publicOrigin(value = '') {
  if (!value) return '';
  let url;
  try { url = new URL(value); } catch { throw new Error('PUBLIC_ORIGIN must be a valid HTTPS origin'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('PUBLIC_ORIGIN must contain only an HTTPS origin');
  return url.origin;
}

// Resolve only exact, explicitly allowed HTTP Host values. Proxy headers do not
// establish an origin; the public HTTPS scheme comes from operator configuration.
export function browserRequestOrigin(host, port, configuredOrigin = '') {
  if (configuredOrigin && host === new URL(configuredOrigin).host) return configuredOrigin;
  if (Number.isInteger(port) && port >= 1 && port <= 65535 && [`localhost:${port}`, `127.0.0.1:${port}`].includes(host)) return `http://${host}`;
  return '';
}
