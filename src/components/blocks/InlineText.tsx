import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import SymbolText from './SymbolText';
import { resolveSymbol, useSymbolIndex } from '../../data/references';
import { useDoc } from '../../context/DocContext';
import { parseInline } from '../../lib/inline';
import type { InlineToken } from '../../lib/inline';

const InlineText: React.FC<{ text: string; links?: boolean }> = ({ text, links = true }) => {
  useSymbolIndex();
  const { currentPage } = useDoc();
  const tokens = useMemo(() => parseInline(text), [text]);
  const render = (items: InlineToken[], allowLinks: boolean): React.ReactNode => items.map((token, i) => {
    if (token.type === 'text') return <React.Fragment key={i}>{allowLinks ? <SymbolText text={token.text} /> : token.text}</React.Fragment>;
    if (token.type === 'code') return <code key={i} className="inline">{allowLinks ? <SymbolText text={token.text} code /> : token.text}</code>;
    if (token.type === 'strong') return <strong key={i}>{render(token.children, allowLinks)}</strong>;
    if (token.type === 'em') return <em key={i}>{render(token.children, allowLinks)}</em>;
    if (token.type === 'break') return <br key={i} />;
    if (token.type === 'math') return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(token.text, { throwOnError: false }) }} />;
    if (token.type === 'link') {
      const label = render(token.children, false);
      if (!allowLinks) return <React.Fragment key={i}>{label}</React.Fragment>;
      const source = /\.(ts|wgsl)(?:#.*)?$/.test(token.url) && !/^https?:/.test(token.url)
        ? resolveSymbol(token.url.split('#')[0], currentPage.id) : undefined;
      const url = source?.url || token.url;
      // Unknown relative source paths still open the repository rather than a dead docs route.
      const repositoryPath = url.replace(/^(?:\.\.\/)+|^\.\//, '');
      if (/^(?:src|libs|examples)\//.test(repositoryPath) && !url.startsWith('/')) {
        return <a key={i} href={`https://github.com/abhilasbiswas/Retiam/blob/main/${repositoryPath}`} target="_blank" rel="noopener noreferrer">{label}</a>;
      }
      if (/^(?:https?:|mailto:)/.test(url)) return <a key={i} href={url} target={url.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{label}</a>;
      if (/^[a-z][\w+.-]*:/i.test(url) || url.startsWith('//')) return <React.Fragment key={i}>{label}</React.Fragment>;
      if (url.startsWith('#')) return <a key={i} href={url} className="internal-link">{label}</a>;
      return <Link key={i} to={url} className="internal-link">{label}</Link>;
    }
    return null;
  });
  return <>{render(tokens, links)}</>;
};

export default InlineText;
