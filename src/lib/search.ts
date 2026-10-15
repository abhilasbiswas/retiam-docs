import type { SearchRecord } from '../types';

export type SearchFilter = 'all' | 'guide' | 'tutorial' | 'api' | 'example';
export function matchesSearchFilter(record: SearchRecord, filter: SearchFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'api') return record.type === 'api' || record.pageId.startsWith('api-');
  if (filter === 'example') return record.type === 'example' || record.pageId.startsWith('examples-');
  if (filter === 'tutorial') return (record.tutorial === true || record.category === 'tutorial') && record.type !== 'api' && record.type !== 'example';
  if (record.category && record.category !== 'guide') return false;
  return record.type !== 'api' && record.type !== 'example' && !record.pageId.startsWith('api-') && !record.pageId.startsWith('examples-');
}

/** Keep fuzzy ordering within each tier, with exact API names ahead of mentions. */
export function prioritizeSearch(records: SearchRecord[], query: string): SearchRecord[] {
  const term = query.trim().replace(/\(\)$/, '').toLowerCase();
  if (!term) return records;
  const tier = (record: SearchRecord) => {
    const name = record.heading.toLowerCase();
    if (name === term) return record.type === 'api' ? 0 : 1;
    if (record.type === 'api' && name.split('.').pop() === term) return 2;
    if (record.type === 'api' && name.startsWith(term)) return 3;
    return 4;
  };
  return [...records].sort((a, b) => tier(a) - tier(b));
}
