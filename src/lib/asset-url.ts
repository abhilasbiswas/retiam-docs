/** Root-relative authored media belongs to the deployed docs directory. */
export function documentationAssetUrl(url: string): string {
  return url.startsWith('/') && !url.startsWith('//')
    ? `${import.meta.env.BASE_URL}${url.slice(1)}`
    : url;
}
