import React from 'react';
import type { ContentSection } from '../types';
import BlockRenderer from './blocks/BlockRenderer';

interface DocSectionProps {
  section: ContentSection;
}

const DocSection: React.FC<DocSectionProps> = ({ section }) => (
  <div className="doc-section" id={section.id}>
    {section.blocks.map((block, i) => (
      <BlockRenderer key={i} block={block} />
    ))}
  </div>
);

export default DocSection;
