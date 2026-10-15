import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface AppBarProps {
  onSearchOpen: () => void;
  onMenuToggle: () => void;
}

const AppBar: React.FC<AppBarProps> = ({ onSearchOpen, onMenuToggle }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-bar">
      <div className="brand">
        <button className="icon-btn mobile-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="logo">
          <span className="material-symbols-outlined">polyline</span>
        </div>
        <span className="brand-name">Retiam Docs</span>
      </div>

      <div className="header-actions">
        <Link to="/tutorials" className="tutorials-shortcut" aria-label="Browse tutorials"><span className="material-symbols-outlined" aria-hidden="true">school</span><span>Tutorials</span></Link>
        <button
          className="search-shortcut"
          onClick={onSearchOpen}
          aria-label="Search documentation"
          id="search-trigger"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            search
          </span>
          <span className="search-label">Search</span>
          <kbd>Ctrl K</kbd>
        </button>

        <button
          className="icon-btn"
          title="Toggle Theme"
          onClick={toggleTheme}
          id="theme-toggle-btn"
          aria-label="Toggle theme"
        >
          <span className="material-symbols-outlined" id="theme-icon">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        <a
          href="https://github.com/abhilasbiswas/Retiam"
          className="icon-btn"
          title="GitHub"
          aria-label="View on GitHub"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="material-symbols-outlined">open_in_new</span>
        </a>
      </div>
    </header>
  );
};

export default AppBar;
