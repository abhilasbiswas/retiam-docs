import React, { useState } from 'react';
import type { ContentBlock } from '../../types';
import ParagraphBlock from './ParagraphBlock';
import CalloutBlock from './CalloutBlock';
import TableBlock from './TableBlock';
import HeadingBlock from './HeadingBlock';
import ListBlock from './ListBlock';
import ImageBlock from './ImageBlock';
import VideoBlock from './VideoBlock';
import MathBlock from './MathBlock';
import CodeBlock from './CodeBlock';
import DiagramBlock from './DiagramBlock';
import PlaygroundBlock from './PlaygroundBlock';
import TabsBlock from './TabsBlock';
import LinkBlock from './LinkBlock';
import TreeBlock from './TreeBlock';
import ExampleBlock from './ExampleBlock';
import ApiReferenceBlock from './ApiReferenceBlock';
import ClassHierarchyBlock from './ClassHierarchyBlock';
import TutorialIndexBlock from './TutorialIndexBlock';

interface BlockRendererProps {
  block: ContentBlock;
}

function Details({ block }: { block: Extract<ContentBlock, { type: 'details' }> }) {
  const [open, setOpen] = useState(false);
  return <details className="doc-details" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{block.title}</summary>
    {open && block.blocks.map((child, index) => <BlockRenderer key={index} block={child} />)}
  </details>;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block }) => {
  switch (block.type) {
    case 'tutorial-index':
      return <TutorialIndexBlock />;
    case 'class-hierarchy':
      return <ClassHierarchyBlock block={block} />;
    case 'details':
      return <Details block={block} />;
    case 'example':
      return <ExampleBlock block={block} />;
    case 'api-reference':
      return <ApiReferenceBlock block={block} />;
    case 'paragraph':
      return <ParagraphBlock block={block} />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'table':
      return <TableBlock block={block} />;
    case 'heading':
      return <HeadingBlock block={block} />;
    case 'list':
      return <ListBlock block={block} />;
    case 'image':
      return <ImageBlock block={block} />;
    case 'video':
      return <VideoBlock block={block} />;
    case 'math':
      return <MathBlock block={block} />;
    case 'code':
      return block.language.trim().toLowerCase() === 'mermaid'
        ? <DiagramBlock block={block} />
        : <CodeBlock block={block} />;
    case 'playground':
      return <PlaygroundBlock block={block} />;
    case 'tabs':
      return <TabsBlock block={block} />;
    case 'link':
      return <LinkBlock block={block} />;
    case 'tree':
      return <TreeBlock block={block} />;
    default: {
      const _never: never = block;
      console.warn('Unknown block type:', _never);
      return null;
    }
  }
};

export default BlockRenderer;
