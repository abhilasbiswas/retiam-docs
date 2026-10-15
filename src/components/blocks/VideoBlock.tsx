import React from 'react';
import type { VideoBlock as VideoBlockType } from '../../types';
import InlineText from './InlineText';
import { documentationAssetUrl } from '../../lib/asset-url';

const VideoBlock: React.FC<{ block: VideoBlockType }> = ({ block }) => (
  <figure 
    className={`doc-video align-${block.align || 'center'}`}
    style={{ textAlign: block.align || 'center' }}
  >
    <video 
      src={documentationAssetUrl(block.url)}
      preload="metadata"
      controls={block.controls !== false}
      autoPlay={block.autoplay}
      loop={block.loop}
      muted={block.muted !== false} // Default to muted for better autoplay UX, but let them override
      playsInline 
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

export default VideoBlock;
