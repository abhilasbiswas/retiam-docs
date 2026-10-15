import React from 'react';
import type { CalloutBlock as CalloutBlockType } from '../../types';
import InlineText from './InlineText';

const ICONS: Record<string, string> = {
  info: 'info',
  warning: 'warning',
  danger: 'error',
  success: 'check_circle',
  tip: 'lightbulb',
};

const CalloutBlock: React.FC<{ block: CalloutBlockType }> = ({ block }) => {
  const iconName = ICONS[block.variant] || 'info';

  return (
    <div className={`callout callout-${block.variant}`}>
      <span className="material-symbols-outlined">{iconName}</span>
      <div>
        {block.title && <div className="callout-title">{block.title}</div>}
        <p>
          <InlineText text={block.content} />
        </p>
      </div>
    </div>
  );
};

export default CalloutBlock;
