import React, { useState } from 'react';
import type { TabsBlock as TabsBlockType } from '../../types';
import BlockRenderer from './BlockRenderer';

const TabsBlock: React.FC<{ block: TabsBlockType }> = ({ block }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="doc-tabs">
      <div className="doc-tabs-header">
        {block.tabs.map((tab, idx) => (
          <button
            key={idx}
            className={`doc-tab-btn ${idx === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="doc-tabs-content">
        {block.tabs[activeTab].blocks.map((childBlock, idx) => (
          <BlockRenderer key={idx} block={childBlock} />
        ))}
      </div>
    </div>
  );
};

export default TabsBlock;
