import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDoc } from '../context/DocContext';
import { getAdjacentPages } from '../data/docPages';
import TableOfContents from './TableOfContents';
import DocSection from './DocSection';
import InlineText from './blocks/InlineText';

interface ContentAreaProps {
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
}

const ContentArea: React.FC<ContentAreaProps> = ({ isLoading, error, onRetry }) => {
  const { currentPage } = useDoc();
  const location = useLocation();
  const scrollRef = useRef<HTMLElement>(null);

  // Honor API/search cross-links after the destination sections have mounted.
  useEffect(() => {
    if (isLoading || error) return;
    const frame = requestAnimationFrame(() => {
      const root = scrollRef.current;
      if (!root) return;
      let id = location.hash.slice(1);
      try { id = decodeURIComponent(id); } catch { /* Treat malformed escapes as a literal ID. */ }
      const target = id ? document.getElementById(id) : null;
      const behavior = location.state?.scrollBehavior === 'smooth' ? 'smooth' : 'instant';
      if (target && root.contains(target)) target.scrollIntoView({ block: 'start', behavior });
      else root.scrollTo({ top: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
    // A repeated click on the same hash should also return to that section.
  }, [currentPage.id, currentPage.sections, location.hash, location.key, location.state, isLoading, error]);

  const { previous: prevPage, next: nextPage } = getAdjacentPages(currentPage.id);

  return (
    <>
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="content"
        id="main-scroll"
        aria-labelledby="doc-page-title"
        ref={scrollRef as React.RefObject<HTMLElement>}
      >
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <span id="breadcrumb-group">{currentPage.group}</span>
          <span className="separator">/</span>
          <span className="current" id="breadcrumb-item">
            {currentPage.title}
          </span>
        </div>

        <header className="doc-page-header">
          <h1 id="doc-page-title">{currentPage.title}</h1>
          {currentPage.summary && <p className="doc-page-summary"><InlineText text={currentPage.summary} /></p>}
          {currentPage.prerequisites?.length ? <p className="doc-page-prerequisites"><strong>Before you start: </strong><InlineText text={currentPage.prerequisites.join(' · ')} /></p> : null}
          {currentPage.outcome && <p className="doc-page-outcome"><strong>Result: </strong><InlineText text={currentPage.outcome} /></p>}
          {currentPage.difficulty && <p className="tutorial-meta">{currentPage.difficulty} · About {currentPage.estimatedMinutes} minutes</p>}
        </header>

        {/* Doc sections — rendered from JSON blocks, no dangerouslySetInnerHTML */}
        <div className="doc-content-area" id="doc-content-area" aria-busy={isLoading}>
          {isLoading && <p role="status">Loading documentation…</p>}
          {error && <div role="alert">
            <p>{error}</p>
            <button className="content-retry" onClick={onRetry}>Try again</button>
          </div>}
          {!isLoading && !error && currentPage.sections.map((section) => (
            <DocSection key={section.id} section={section} />
          ))}
        </div>

        {/* Next/Prev Navigation */}
        <div className="doc-pagination">
          {prevPage ? (
            <Link to={`/${prevPage.id}`} className="pagination-link prev">
              <span className="material-symbols-outlined">chevron_left</span>
              <div className="pagination-text">
                <span className="pagination-label">Previous</span>
                <span className="pagination-title">{prevPage.title}</span>
              </div>
            </Link>
          ) : <div />}
          
          {nextPage ? (
            <Link to={`/${nextPage.id}`} className="pagination-link next">
              <div className="pagination-text">
                <span className="pagination-label">Next</span>
                <span className="pagination-title">{nextPage.title}</span>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          ) : <div />}
        </div>

        <div className="content-spacer" />
      </motion.main>

      {/* Right TOC */}
      {!isLoading && !error && <TableOfContents scrollContainer={scrollRef as React.RefObject<HTMLElement>} />}
    </>
  );
};

export default ContentArea;
