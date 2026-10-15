// Resolve from this module instead of location: both nested pages and edited
// modules imported from blob: URLs must use the documentation deployment root.
export function resolveDocsAsset(value, runtimeModuleUrl) {
  if (!/^\/(?:res|fonts|vendor|assets|src\/assets\/fonts)\//.test(value)) return value;
  return new URL(value.slice(1), new URL('../', runtimeModuleUrl)).href;
}

export const docsAssetUrl = value => resolveDocsAsset(value, import.meta.url);
