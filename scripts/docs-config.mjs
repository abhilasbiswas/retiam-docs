import fs from 'node:fs';

const configurationFile = new URL('../content/config.json', import.meta.url);

function urlHost(url) {
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  const mapped = host.match(/^\[::ffff:([\da-f]+):([\da-f]+)\]$/i);
  return mapped ? [parseInt(mapped[1], 16) >> 8, parseInt(mapped[1], 16) & 255, parseInt(mapped[2], 16) >> 8, parseInt(mapped[2], 16) & 255].join('.') : host;
}

/** Loopback CDNs are reachable by the reader's browser, not the Pages runner. */
export function isLoopbackUrl(value) {
  let url;
  try { url = new URL(value); } catch { return false; }
  if (!['http:', 'https:'].includes(url.protocol)) return false;
  const host = urlHost(url);
  return host === 'localhost' || host.endsWith('.localhost') || /^127\./.test(host) || host === '[::1]';
}

function moduleUrl(value, label, deployment, allowLoopback = false) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be an absolute HTTP(S) URL string.`);
  let url;
  try { url = new URL(value); } catch { throw new Error(`${label} must be an absolute HTTP(S) URL.`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) {
    throw new Error(`${label} must be an HTTP(S) URL without credentials or a fragment.`);
  }
  const host = urlHost(url);
  const local = host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') ||
    /^(?:127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host) ||
    /^\[(?:::1|::|f[cd][\da-f:]*|fe80:[\da-f:]*)\]$/i.test(host);
  if (deployment && (url.protocol !== 'https:' || local) && !(allowLoopback && isLoopbackUrl(url))) {
    throw new Error(`${label} must use a public HTTPS URL${allowLoopback ? ' or a loopback URL for local testing' : ''} for deployment.`);
  }
  return url.href;
}

/** Resolve the same public configuration for generated content and embedded scenes. */
export function resolveDocsConfig(configuration, env = process.env) {
  const deployment = ['1', 'true'].includes(env.RETIAM_DOCS_DEPLOY || '');
  if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) throw new Error('Documentation configuration must be an object.');
  const configuredServices = configuration.services === undefined ? {} : configuration.services;
  if (!configuredServices || typeof configuredServices !== 'object' || Array.isArray(configuredServices)) throw new Error('Documentation services must be an object.');
  const services = { ...configuredServices };
  for (const [key, variable] of [['msedgeEndpoint', 'RETIAM_DOCS_MSEDGE_ENDPOINT'], ['modelBaseUrl', 'RETIAM_DOCS_MODEL_BASE_URL']]) {
    const value = env[variable] || services[key];
    if (value !== undefined) services[key] = moduleUrl(value, `services.${key}`, deployment).replace(/\/$/, '');
  }
  return {
    ...configuration,
    cdnUrl: moduleUrl(configuration.cdnUrl, 'cdnUrl', deployment, true),
    ...(Object.keys(services).length ? { services } : {}),
  };
}

export function readDocsConfig(env = process.env) {
  return resolveDocsConfig(JSON.parse(fs.readFileSync(configurationFile, 'utf8')), env);
}

export function normalizeBasePath(value = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.includes('//') || /[?#\\\s]/.test(value)) {
    throw new Error('RETIAM_DOCS_BASE_PATH must be an absolute URL path, such as /Retiam/.');
  }
  if (value.split('/').some(part => part === '.' || part === '..' || /%2e|%2f|%5c/i.test(part))) {
    throw new Error('RETIAM_DOCS_BASE_PATH cannot contain relative path segments.');
  }
  return value === '/' ? '/' : `${value.replace(/\/+$/, '')}/`;
}
