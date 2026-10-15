import type { DocPageMetadata, NavigationGroup } from '../types';

export function adjacentPages(pageId: string, pages: DocPageMetadata[], groups: NavigationGroup[]) {
  const group = groups.find(item => item.pages.includes(pageId));
  const ids = group?.kind === 'reference' || group?.kind === 'tutorial'
    ? group.pages
    : groups.filter(item => !item.kind || item.kind === 'guide').flatMap(item => item.pages);
  const index = ids.indexOf(pageId);
  const lookup = new Map(pages.map(page => [page.id, page]));
  return {
    previous: index > 0 ? lookup.get(ids[index - 1]) : undefined,
    next: index >= 0 && index < ids.length - 1 ? lookup.get(ids[index + 1]) : undefined,
  };
}

export function filterTutorials(pages: DocPageMetadata[], query: string, difficulty: string, group: string) {
  const term = query.trim().toLowerCase();
  return pages.filter(page => (!difficulty || page.difficulty === difficulty) && (!group || page.group === group)
    && (!term || `${page.title} ${page.summary || ''} ${page.outcome || ''}`.toLowerCase().includes(term)));
}

export function readExpandedGroups(value: string | null, groups: NavigationGroup[], activeTitle: string) {
  let saved: string[] = ['Start here'];
  try {
    const parsed: unknown = value === null ? null : JSON.parse(value);
    if (Array.isArray(parsed)) saved = parsed.filter((item): item is string => typeof item === 'string');
  } catch { /* Fall back to the introductory group. */ }
  const known = new Set(groups.map(group => group.title));
  return [...new Set([...saved, activeTitle])].filter(title => known.has(title));
}
