import React from 'react';
import type { ListBlock as ListBlockType, ListItem } from '../../types';
import InlineText from './InlineText';

const ListItems: React.FC<{ items: (string | ListItem)[]; ordered?: boolean; start?: number }> = ({ items, ordered, start }) => {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className="doc-list" start={ordered ? start : undefined}>
      {items.map((item, i) => (
        <li key={i}>
          <InlineText text={typeof item === 'string' ? item : item.text} />
          {typeof item !== 'string' && !!item.children?.length &&
            <ListItems items={item.children} ordered={item.ordered} start={item.start} />}
        </li>
      ))}
    </Tag>
  );
};

const ListBlock: React.FC<{ block: ListBlockType }> = ({ block }) =>
  <ListItems items={block.items} ordered={block.ordered} start={block.start} />;

export default ListBlock;
