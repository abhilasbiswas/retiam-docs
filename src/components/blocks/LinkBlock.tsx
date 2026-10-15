import React from 'react';
import { Link } from 'react-router-dom';
import type { LinkBlock as LinkBlockType } from '../../types';

const LinkBlock: React.FC<{ block: LinkBlockType }> = ({ block }) => {
  const isExternal = block.url.startsWith('http');

  const IconMap: Record<string, string> = {
    github: 'code_blocks',
    link: 'link',
    article: 'article',
  };

  const iconName = block.icon ? IconMap[block.icon] || block.icon : 'arrow_forward';

  const Content = (
    <>
      <div className="reference-card-icon">
        <span className="material-symbols-outlined">{iconName}</span>
      </div>
      <div className="reference-card-body">
        <div className="reference-card-title">
          {block.title}
          {isExternal && <span className="material-symbols-outlined external-icon">open_in_new</span>}
        </div>
        {block.description && (
          <div className="reference-card-desc">{block.description}</div>
        )}
      </div>
    </>
  );

  if (isExternal) {
    return (
      <a 
        href={block.url} 
        className="doc-reference-card" 
        target="_blank" 
        rel="noopener noreferrer"
      >
        {Content}
      </a>
    );
  }

  // Internal Hash link vs Internal Page Link
  if (block.url.startsWith('#')) {
    return (
      <a href={block.url} className="doc-reference-card">
        {Content}
      </a>
    );
  }

  return (
    <Link to={block.url} className="doc-reference-card">
      {Content}
    </Link>
  );
};

export default LinkBlock;
