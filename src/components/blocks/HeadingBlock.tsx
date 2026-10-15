import React from 'react';
import type { HeadingBlock as HeadingBlockType } from '../../types';
import InlineText from './InlineText';

const HeadingBlock: React.FC<{ block: HeadingBlockType }> = ({ block }) => {
  // The page header owns the document's h1; imported notebook headings remain
  // section headings without changing their existing anchor destinations.
  const Tag = `h${Math.max(2, block.level)}` as any;
  return (
    <Tag>
      <InlineText text={block.text} />
    </Tag>
  );
};

export default HeadingBlock;
