import React from 'react';
import type { TreeBlock as TreeBlockType, TreeNode } from '../../types';
import SymbolText from './SymbolText';
import InlineText from './InlineText';

interface TreeBlockProps {
  block: TreeBlockType;
}

const TreeNodeView: React.FC<{ node: TreeNode; variant: string }> = ({ node, variant }) => {
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <li className="tree-node">
      <div className="tree-node-label">
        {variant === 'folder' && (
          <span className="tree-node-icon material-symbols-outlined" aria-hidden="true">
            {hasChildren ? 'folder' : 'draft'}
          </span>
        )}
        <span className="tree-node-text"><SymbolText text={node.label} code />{node.description && <span className="tree-node-description"><InlineText text={node.description} /></span>}</span>
      </div>
      {hasChildren && (
        <ul className="tree-children">
          {node.children!.map((child, index) => (
            <TreeNodeView key={index} node={child} variant={variant} />
          ))}
        </ul>
      )}
    </li>
  );
};

const TreeBlock: React.FC<TreeBlockProps> = ({ block }) => {
  const variant = block.variant || 'horizontal';
  return (
    <div className={`tree-block-container variant-${variant}`} role="region" aria-label={variant === 'folder' ? 'File tree' : 'Hierarchy diagram'} tabIndex={0}>
      <ul className="tree-root">
        {block.nodes.map((node, index) => (
          <TreeNodeView key={index} node={node} variant={variant} />
        ))}
      </ul>
    </div>
  );
};

export default TreeBlock;
