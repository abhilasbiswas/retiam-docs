import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import Fuse from 'fuse.js';
import { DOC_PAGES_LIST, loadSearchIndex, pageCategory } from '../data/docPages';
import type { SearchRecord } from '../types';
import { matchesSearchFilter, prioritizeSearch } from '../lib/search';
import type { SearchFilter } from '../lib/search';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (pageId: string, sectionId?: string) => void;
}

const DEFAULT_RECORDS: SearchRecord[] = DOC_PAGES_LIST.map(page => ({
  pageId: page.id, sectionId: '', title: page.title, group: page.group,
  heading: page.title, snippet: page.group, type: 'page', category: pageCategory(page.id),
  tutorial: Boolean(page.difficulty),
}));

const ICON_MAP: Record<string, string> = {
  page: 'article',
  section: 'tag',
  api: 'code',
  example: 'play_circle',
};

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const [filter,setFilter] = useState<SearchFilter>('all');

  const [allRecords, setAllRecords] = useState<SearchRecord[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoadError('');
    loadSearchIndex().then(records => {
      if (active) setAllRecords(records);
    }).catch(() => {
      if (active) setLoadError('Unable to load search. Check your connection and try again.');
    });
    return () => { active = false; };
  }, [isOpen, attempt]);

  const fuse = useMemo(() => allRecords ? new Fuse(allRecords, {
    keys: [
      { name: 'heading', weight: 4 },
      { name: 'title', weight: 2 },
      { name: 'snippet', weight: 1.5 },
      { name: 'group', weight: 0.5 },
    ],
    threshold: 0.35,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }) : null, [allRecords]);

  const results: SearchRecord[] = useMemo(() => prioritizeSearch(query.trim()
    ? fuse?.search(query.trim().replace(/\(\)$/, '')).map(result => result.item) || []
    : filter==='all'?DEFAULT_RECORDS:(allRecords||DEFAULT_RECORDS).filter(record=>record.type==='page'||filter==='example'&&record.type==='example'),query).filter(record=>matchesSearchFilter(record,filter)), [query, fuse, filter, allRecords]);
  const [resultLimit,setResultLimit]=useState(100);
  const visibleResults=results.slice(0,resultLimit);

  useEffect(() => {
    setActiveIdx(0);
    setResultLimit(100);
  }, [query, allRecords, filter]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setFilter('all');
      setActiveIdx(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>('.search-result-item.active');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const handleSelect = useCallback((res: SearchRecord) => {
    onNavigate(res.pageId, res.sectionId || undefined);
  }, [onNavigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { onClose(); return; }
      if(e.key==='Enter'&&e.target instanceof HTMLElement&&e.target.closest('button'))return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, Math.min(i + 1, visibleResults.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[activeIdx]) {
        e.preventDefault();
        handleSelect(results[activeIdx]);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, results, visibleResults.length, activeIdx, handleSelect]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="search-overlay"
      onClick={handleBackdrop}
      id="search-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
    >
      <div className="search-modal">
        {/* Input */}
        <div className="search-input-wrapper">
          <span className="material-symbols-outlined">search</span>
          <input
            ref={inputRef}
            type="text"
            id="search-input"
            placeholder="Search docs — headings, APIs, topics..."
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-controls="search-results"
            aria-activedescendant={results[activeIdx] ? `sr-${activeIdx}` : undefined}
          />
          {query && (
            <button
              className="search-clear-btn"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        <div className="search-filters" aria-label="Search category">
          {([['all','All'],['guide','Guides'],['tutorial','Tutorials'],['api','API'],['example','Examples']] as const).map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}</button>)}
        </div>

        {/* Category label */}
        <div className="search-category-label">
          {query ? `${results.length} result${results.length !== 1 ? 's' : ''}` : filter==='example'?'Examples':filter==='api'?'API pages':filter==='tutorial'?'Tutorials':filter==='guide'?'Guides':'All pages'}
        </div>

        {/* Results */}
        <div className="search-results" id="search-results" role="listbox" ref={listRef}>
          {loadError && <div className="search-no-results" role="alert">
            <span>{loadError}</span>
            <button className="content-retry" onClick={() => setAttempt(value => value + 1)}>Try again</button>
          </div>}
          {query.trim() && !allRecords ? (
            !loadError && <div className="search-no-results" role="status">Loading search…</div>
          ) : results.length > 0 ? (
            visibleResults.map((res, i) => (
              <button
                key={`${res.pageId}-${res.sectionId}-${res.heading}-${i}`}
                id={`sr-${i}`}
                className={`search-result-item ${i === activeIdx ? 'active' : ''}`}
                onClick={() => handleSelect(res)}
                onMouseEnter={() => setActiveIdx(i)}
                role="option"
                aria-selected={i === activeIdx}
              >
                <span className="search-result-icon material-symbols-outlined">
                  {ICON_MAP[res.type]}
                </span>
                <div className="search-result-body">
                  <div className="search-result-title">{res.heading}</div>
                  {res.type !== 'page' && (
                    <div className="search-result-context">
                      {res.title} · {res.group}
                    </div>
                  )}
                  {res.snippet && res.type !== 'page' && (
                    <div className="search-result-desc">{res.snippet.slice(0, 100)}</div>
                  )}
                  {res.type === 'page' && (
                    <div className="search-result-desc">{res.group}</div>
                  )}
                </div>
                <span className="search-result-type-badge">{res.type}</span>
              </button>
            ))
          ) : (
            <div className="search-no-results">
              <span className="material-symbols-outlined">search_off</span>
              <span>No results for "<strong>{query}</strong>"</span>
            </div>
          )}
          {results.length>resultLimit&&<button className="content-retry" onClick={()=>setResultLimit(value=>value+100)}>Show more results</button>}
        </div>

        {/* Footer */}
        <div className="search-footer">
          <span><kbd>ESC</kbd> to close</span>
          <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
          <span><kbd>↵</kbd> to select</span>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
