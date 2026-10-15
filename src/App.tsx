import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { ThemeContext } from './context/ThemeContext';
import { DocContext } from './context/DocContext';
import { DOC_PAGE_METADATA, DOC_PAGES_LIST, loadDocPage } from './data/docPages';
import AppBar from './components/AppBar';
import Sidebar from './components/Sidebar';
import ContentArea from './components/ContentArea';
import SearchModal from './components/SearchModal';
import type { Theme, DocPage } from './types';

const FIRST_PAGE_ID = DOC_PAGES_LIST[0].id;

const DocsLayout: React.FC = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const metadata = Object.hasOwn(DOC_PAGE_METADATA, pageId || '') ? DOC_PAGE_METADATA[pageId || ''] : undefined;
  const isValidPage = Boolean(metadata);
  const [loaded, setLoaded] = useState<{ id: string; page?: DocPage; error?: string }>({ id: '' });
  const [attempt, setAttempt] = useState(0);
  const currentPage: DocPage = loaded.id === metadata?.id && loaded.page
    ? loaded.page : { ...(metadata || DOC_PAGES_LIST[0]), sections: [] };
  const error = loaded.id === metadata?.id ? loaded.error : undefined;
  const isLoading = Boolean(metadata && !error && !(loaded.id === metadata.id && loaded.page));

  useEffect(() => {
    if (!metadata) return;
    let active = true;
    loadDocPage(metadata.id).then(page => {
      if (active) setLoaded({ id: metadata.id, page });
    }).catch(() => {
      if (active) setLoaded({ id: metadata.id, error: 'Unable to load this page. Check your connection and try again.' });
    });
    return () => { active = false; };
  }, [metadata, attempt]);

  const setCurrentPageId = useCallback((id: string) => {
    navigate(`/${id}`);
  }, [navigate]);

  // Update document title for SEO
  useEffect(() => {
    if (isValidPage) {
      document.title = `${currentPage.title} | Retiam Documentation`;
    }
  }, [currentPage.title, isValidPage]);

  // Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // If URL pageId is invalid, redirect to the first page
  if (!metadata) {
    return <Navigate to={`/${FIRST_PAGE_ID}`} replace />;
  }

  return (
    <DocContext.Provider value={{ currentPage, setCurrentPageId }}>
      {/* Top App Bar */}
      <AppBar 
        onSearchOpen={() => setSearchOpen(true)} 
        onMenuToggle={() => setMobileMenuOpen((o) => !o)}
      />

      {/* Main Layout */}
      <div className="layout">
        <Sidebar 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
        />
        <ContentArea isLoading={isLoading} error={error} onRetry={() => {
          setLoaded({ id: metadata.id });
          setAttempt(value => value + 1);
        }} />
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(id, sectionId) => {
          navigate(`/${id}${sectionId ? `#${encodeURIComponent(sectionId)}` : ''}`);
          setSearchOpen(false);
          setMobileMenuOpen(false);
        }}
      />
    </DocContext.Provider>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Routes>
        <Route path="/:pageId" element={<DocsLayout />} />
        <Route path="*" element={<Navigate to={`/${FIRST_PAGE_ID}`} replace />} />
      </Routes>
    </ThemeContext.Provider>
  );
};

export default App;
