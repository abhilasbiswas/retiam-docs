import React from 'react';
import type { ImageBlock as ImageBlockType } from '../../types';
import InlineText from './InlineText';
import { documentationAssetUrl } from '../../lib/asset-url';

const ImageBlock: React.FC<{ block: ImageBlockType }> = ({ block }) => (
  <figure 
    className={`doc-image align-${block.align || 'center'}`}
    style={{ textAlign: block.align || 'center' }}
  >
    <img 
      src={documentationAssetUrl(block.url)}
      loading="lazy"
      decoding="async"
      alt={block.alt} 
      style={{ 
        width: block.width || '100%', 
        height: block.height || 'auto',
        maxWidth: '100%',
        objectFit: 'contain'
      }} 
    />
    {block.caption && (
      <figcaption>
        <InlineText text={block.caption} />
      </figcaption>
    )}
  </figure>
);

export default ImageBlock;
