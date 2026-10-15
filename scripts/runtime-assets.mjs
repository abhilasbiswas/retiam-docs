import fs from 'node:fs';
import path from 'node:path';

/** Media blocks are assets too, even when no runnable scene references them. */
export function collectAuthoredMediaAssets(contentDirectory) {
  const assets = new Set();
  function visitBlocks(blocks = []) {
    for (const block of blocks) {
      if ((block.type === 'image' || block.type === 'video') && typeof block.url === 'string' && block.url.startsWith('/') && !block.url.startsWith('//')) assets.add(block.url);
      if (block.type === 'details') visitBlocks(block.blocks);
      if (block.type === 'tabs') for (const tab of block.tabs || []) visitBlocks(tab.blocks);
    }
  }
  function visitDirectory(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visitDirectory(file);
      else if (entry.name.endsWith('.json')) {
        const page = JSON.parse(fs.readFileSync(file, 'utf8'));
        for (const section of page.sections || []) visitBlocks(section.blocks);
      }
    }
  }
  visitDirectory(contentDirectory);
  return [...assets].sort();
}

// Preserve URL layout and dependencies rather than copying development assets.
export function copyRuntimeAssets({ root, assetDirectory, publicDirectory, assets }) {
  const copied = new Set(), missing = new Set();
  function copy(url, optional = false) {
    const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
    const relative = pathname.replace(/^\//, '');
    const sourceRoot = assetDirectory || (pathname.startsWith('/src/assets/fonts/') ? root : path.join(root, 'public'));
    const source = path.resolve(sourceRoot, relative);
    if (!source.startsWith(`${sourceRoot}${path.sep}`)) throw new Error(`Asset escapes its root: ${url}`);
    if (copied.has(relative)) return;
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
      if (!optional) missing.add(url);
      return;
    }
    copied.add(relative);
    const destination = path.join(publicDirectory, relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
    const sibling = name => path.posix.join(path.posix.dirname(pathname), name);
    if (/\.obj$/i.test(source)) {
      const code = fs.readFileSync(source, 'utf8');
      const libraries = [...code.matchAll(/^\s*mtllib\s+(.+)$/gm)].map(match => match[1].trim());
      if (!libraries.length) copy(pathname.replace(/\.obj$/i, '.mtl'), true);
      for (const library of libraries) copy(sibling(library));
    } else if (/\.mtl$/i.test(source)) {
      for (const match of fs.readFileSync(source, 'utf8').matchAll(/^\s*(?:map_\w+|bump|disp|decal|norm)\s+(.+)$/gm)) {
        // OBJLoader uses the last token after optional map settings.
        copy(sibling(match[1].trim().split(/\s+/).at(-1)));
      }
    } else if (/\.json$/i.test(source) && pathname.startsWith('/src/assets/fonts/')) {
      // FontLoader.msdf derives the atlas URL from the descriptor basename.
      copy(pathname.replace(/\.json$/i, '.png'));
    }
  }
  for (const asset of assets) copy(asset);
  return { copied: [...copied].sort(), missing: [...missing].sort() };
}
