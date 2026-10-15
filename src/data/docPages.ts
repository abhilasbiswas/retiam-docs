import rawCatalog from './generated/page-catalog.json';
import type { ContentPage, DocsConfig, DocPageMetadata, SearchRecord, NavigationGroup } from '../types';
import { adjacentPages } from '../lib/navigation';
import { expandSearchRecords } from '../lib/data-payload.mjs';

interface PageCatalog {
  config: DocsConfig;
  groups: NavigationGroup[];
  pages: DocPageMetadata[];
}

const catalog = rawCatalog as PageCatalog;
export const DOC_PAGES_LIST = catalog.pages;
export const DOC_PAGE_METADATA: Record<string, DocPageMetadata> = Object.fromEntries(
  catalog.pages.map(page => [page.id, page]),
);
export const DOC_PAGE_GROUPS = catalog.groups.map(group => ({
  title: group.title,
  kind: group.kind || 'guide',
  pages: group.pages.map(id => DOC_PAGE_METADATA[id]),
}));
export const TUTORIAL_PAGES = catalog.pages.filter(page => page.difficulty && page.outcome);
export const getAdjacentPages = (id: string) => adjacentPages(id, catalog.pages, catalog.groups);
export const pageCategory = (id: string) => catalog.groups.find(group => group.pages.includes(id))?.kind || 'guide';
export const DOCS_CONFIG = catalog.config;
export const CDN_URL = DOCS_CONFIG.cdnUrl;

// URL imports emit JSON assets rather than bundling the handbook into JavaScript.
const pageUrls = import.meta.glob<string>('./generated/pages/*.json', {
  eager: true, query: '?url&no-inline', import: 'default',
});
const searchUrl = new URL('./generated/search-index.json', import.meta.url).href;
const pages = new Map<string, Promise<ContentPage>>();
let search: Promise<SearchRecord[]> | undefined;

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Documentation request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

export function loadDocPage(id: string): Promise<ContentPage> {
  if (!Object.hasOwn(DOC_PAGE_METADATA, id)) return Promise.reject(new Error(`Unknown documentation page: ${id}`));
  const cached = pages.get(id);
  if (cached) return cached;
  const url = pageUrls[`./generated/pages/${id}.json`];
  if (!url) return Promise.reject(new Error(`Missing documentation page: ${id}`));
  const request = readJson<ContentPage>(url).then(page => {
    if (page.id !== id || !Array.isArray(page.sections)) throw new Error('Invalid documentation page response.');
    return page;
  }).catch(error => {
    pages.delete(id);
    throw error;
  });
  pages.set(id, request);
  return request;
}

export function loadSearchIndex(): Promise<SearchRecord[]> {
  if (!search) search = readJson<unknown>(searchUrl).then(expandSearchRecords).catch(error => {
    search = undefined;
    throw error;
  });
  return search;
}
