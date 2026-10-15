import { pathToFileURL } from 'node:url';
import { readDocsConfig, isLoopbackUrl } from './docs-config.mjs';

export async function checkModuleCdn(url, origin, fetcher = fetch) {
  const response = await fetcher(url, {
    headers: origin ? { Origin: origin } : {},
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Engine CDN returned HTTP ${response.status}: ${url}. Ensure the configured engine module is available.`);
  const type = response.headers.get('content-type') || '';
  if (!/(?:javascript|ecmascript)/i.test(type)) throw new Error(`Engine CDN must serve JavaScript, received ${type || 'no Content-Type'}: ${url}`);
  const allowOrigin = response.headers.get('access-control-allow-origin');
  const sameOrigin = origin && new URL(response.url || url).origin === origin;
  if (!sameOrigin && allowOrigin !== '*' && (!origin || allowOrigin !== origin)) throw new Error(`Engine CDN must allow cross-origin module requests from ${origin || 'the documentation origin'}: ${url}`);
  if (!(await response.text()).trim()) throw new Error(`Engine CDN returned an empty module: ${url}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = readDocsConfig({ ...process.env, RETIAM_DOCS_DEPLOY: '1' });
  const origin = process.env.RETIAM_DOCS_SITE_URL ? new URL(process.env.RETIAM_DOCS_SITE_URL).origin : undefined;
  if (process.env.GITHUB_ACTIONS === 'true' && isLoopbackUrl(config.cdnUrl)) {
    console.log('Local engine CDN configured: skipping the network probe on GitHub Actions. Run npm run check:cdn on the machine hosting the CDN.');
  } else {
    await checkModuleCdn(config.cdnUrl, origin);
    console.log('Verified engine module availability, JavaScript MIME type, and CORS.');
  }
}
