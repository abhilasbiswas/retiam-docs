import React from 'react';
import type { ParagraphBlock as ParagraphBlockType } from '../../types';
import InlineText from './InlineText';

const ParagraphBlock: React.FC<{ block: ParagraphBlockType }> = ({ block }) => (
  <p>
    <InlineText text={block.text} />
  </p>
);

export default ParagraphBlock;
