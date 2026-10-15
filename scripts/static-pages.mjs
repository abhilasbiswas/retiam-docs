import fs from 'node:fs';
import path from 'node:path';

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

/** Physical entries let static hosts serve every known BrowserRouter route with HTTP 200. */
export function staticPageEntries(html, pages, base = '/') {
  return pages.map(page => {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.id) || ['assets', 'runtime', 'res', 'fonts', 'src', 'vendor'].includes(page.id)) {
      throw new Error(`Unsafe static documentation route: ${page.id}`);
    }
    const title = escapeHtml(`${page.title} | Retiam Documentation`);
    const description = escapeHtml(page.summary || `${page.title} — Retiam documentation.`);
    const source = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/, `<meta name="description" content="${description}" />`);
    if (!source.includes(`${base}assets/`)) throw new Error('Built documentation HTML must use the configured base path.');
    return [`${page.id}/index.html`, source];
  });
}

export function writeStaticPages(outputDirectory, pages, base = '/') {
  const html = fs.readFileSync(path.join(outputDirectory, 'index.html'), 'utf8');
  for (const [file, source] of staticPageEntries(html, pages, base)) {
    const destination = path.join(outputDirectory, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, source);
  }
  fs.writeFileSync(path.join(outputDirectory, '.nojekyll'), '');
  fs.writeFileSync(path.join(outputDirectory, '404.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | Retiam Documentation</title></head><body><main><h1>Page not found</h1><p>This documentation page may have moved.</p><a href="${escapeHtml(base)}">Open Retiam documentation</a></main></body></html>`);
}
