import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DOC_PAGE_GROUPS } from '../data/docPages';
import { useDoc } from '../context/DocContext';
import { readExpandedGroups } from '../lib/navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentPage } = useDoc();
  const drawer = useRef<HTMLElement>(null);
  const activeGroup = DOC_PAGE_GROUPS.find(group => group.pages.some(page => page.id === currentPage.id));
  const storageKey = 'retiam_docs_expanded_groups_v1';
  const [expanded, setExpanded] = useState(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(storageKey); } catch { /* Use the session defaults. */ }
    return readExpandedGroups(saved, DOC_PAGE_GROUPS.map(group => ({ ...group, pages: group.pages.map(page => page.id) })), activeGroup?.title || '');
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(expanded)); } catch { /* Navigation still works without storage. */ }
  }, [expanded]);

  useEffect(() => {
    if (!activeGroup) return;
    setExpanded(previous => previous.includes(activeGroup.title) ? previous : [...previous, activeGroup.title]);
    const frame = requestAnimationFrame(() => {
      const root = drawer.current;
      const active = root?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!root || !active) return;
      const bounds = root.getBoundingClientRect(), item = active.getBoundingClientRect();
      if (item.top < bounds.top + 12) root.scrollTop += item.top - bounds.top - 12;
      else if (item.bottom > bounds.bottom - 12) root.scrollTop += item.bottom - bounds.bottom + 12;
    });
    return () => cancelAnimationFrame(frame);
  }, [currentPage.id, activeGroup, isOpen]);

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <nav ref={drawer} className={`drawer ${isOpen ? 'open' : ''}`} id="sidebar-nav" aria-label="Documentation navigation">
        {DOC_PAGE_GROUPS.map(({ title: groupName, kind, pages }, index) => (
          <React.Fragment key={groupName}>
          {(index === 0 || DOC_PAGE_GROUPS[index - 1].kind !== kind) && <p className="nav-area-label">{{guide:'Guides',tutorial:'Tutorials',reference:'Reference'}[kind]}</p>}
          <div className="nav-group" key={groupName}>
            <h3><button type="button" className="nav-group-toggle" aria-expanded={expanded.includes(groupName)} aria-controls={`nav-group-${index}`} onClick={() => {
              setExpanded(previous => previous.includes(groupName) ? previous.filter(title => title !== groupName) : [...previous, groupName]);
            }}><span>{groupName}</span><span className="nav-group-chevron" aria-hidden="true">{expanded.includes(groupName) ? '−' : '+'}</span></button></h3>
            <div id={`nav-group-${index}`} hidden={!expanded.includes(groupName)}>
            {pages.map((page) => (
              <Link
                key={page.id}
                to={`/${page.id}`}
                className={`nav-item ${currentPage.id === page.id ? 'active' : ''}`}
                id={`nav-${page.id}`}
                aria-current={currentPage.id === page.id ? 'page' : undefined}
                onClick={() => {
                  // close on mobile when selecting an item
                  if (window.innerWidth <= 1000) onClose();
                }}
              >
                <span className="nav-item-label">{page.title}</span>
              </Link>
            ))}
            </div>
          </div>
          </React.Fragment>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
