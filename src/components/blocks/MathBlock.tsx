import React from 'react';
import katex from 'katex';
import type { MathBlock as MathBlockType } from '../../types';

const MathBlock: React.FC<{ block: MathBlockType }> = ({ block }) => {
  const html = katex.renderToString(block.tex, {
    displayMode: true,
    throwOnError: false,
  });

  return (
    <div className="doc-math-block" dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default MathBlock;
