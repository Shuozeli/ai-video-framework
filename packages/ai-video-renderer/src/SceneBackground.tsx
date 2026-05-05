import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import type { Background, Pipeline } from '@ai-video/dsl';

export const SceneBackground: React.FC<{
  bg: Background | undefined;
  pipeline: Pipeline;
}> = ({ bg, pipeline }) => {
  if (!bg) {
    return <AbsoluteFill style={{ backgroundColor: '#0a0e27' }} />;
  }
  if (bg.kind === 'solid') {
    return <AbsoluteFill style={{ backgroundColor: bg.color }} />;
  }
  if (bg.kind === 'gradient') {
    const a = bg.color;
    const b = bg.color2 ?? bg.color;
    return (
      <AbsoluteFill
        style={{ background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)` }}
      />
    );
  }
  if (bg.kind === 'image' && bg.imageRef) {
    const path = pipeline.materials.images[bg.imageRef];
    if (!path) return <AbsoluteFill style={{ backgroundColor: bg.color }} />;
    return (
      <AbsoluteFill>
        <Img
          src={path.startsWith('/') || path.startsWith('http') ? path : staticFile(path)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: bg.blur ? `blur(${bg.blur}px)` : undefined,
          }}
        />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{ backgroundColor: bg.color }} />;
};
