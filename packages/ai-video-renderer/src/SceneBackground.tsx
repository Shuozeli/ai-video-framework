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
    const p = pipeline.materials.images[bg.imageRef];
    if (!p) return <AbsoluteFill style={{ backgroundColor: bg.color }} />;
    const src =
      p.startsWith('http://') || p.startsWith('https://') || p.startsWith('file://')
        ? p
        : staticFile(p);
    return (
      <AbsoluteFill>
        <Img
          src={src}
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
