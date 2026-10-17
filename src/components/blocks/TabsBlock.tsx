import React, { useId, useState } from 'react';
import type { TabsBlock as TabsBlockType } from '../../types';
import BlockRenderer from './BlockRenderer';

const TabsBlock: React.FC<{ block: TabsBlockType }> = ({ block }) => {
  const [activeTab, setActiveTab] = useState(0);
  const id=useId();
  const selected=Math.min(activeTab,block.tabs.length-1);
  if(!block.tabs.length)return null;

  return (
    <div className="doc-tabs">
      <div className="doc-tabs-header">
        {block.tabs.length>6?<label className="scene-picker" htmlFor={id}>{block.tabs.every(tab=>tab.blocks[0]?.type==='example')?'Example':'Topic'}
          <select id={id} value={selected} onChange={event=>setActiveTab(Number(event.target.value))}>
            {block.tabs.map((tab,idx)=><option key={tab.label} value={idx}>{tab.label}</option>)}
          </select>
        </label>:block.tabs.map((tab, idx) => (
          <button
            key={idx}
            className={`doc-tab-btn ${idx === selected ? 'active' : ''}`}
            aria-pressed={idx===selected}
            onClick={() => setActiveTab(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="doc-tabs-content">
        {block.tabs[selected].blocks.map((childBlock, idx) => (
          <BlockRenderer key={`${selected}-${idx}`} block={childBlock} />
        ))}
      </div>
    </div>
  );
};

export default TabsBlock;
