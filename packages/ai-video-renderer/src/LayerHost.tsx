import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import type { Layer, Animation } from '@ai-video/dsl';

function applyEnter(localFrame: number, anim: Animation | undefined): { opacity: number; tx: number; ty: number; scale: number } {
  if (!anim || anim.type === 'none' || anim.durationFrames === 0) {
    return { opacity: 1, tx: 0, ty: 0, scale: 1 };
  }
  const t = interpolate(localFrame, [0, anim.durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: undefined,
  });
  switch (anim.type) {
    case 'fade':
      return { opacity: t, tx: 0, ty: 0, scale: 1 };
    case 'scale':
      return { opacity: t, tx: 0, ty: 0, scale: 0.85 + 0.15 * t };
    case 'slide': {
      const offset = (1 - t) * 80;
      switch (anim.direction) {
        case 'left':  return { opacity: t, tx: -offset, ty: 0, scale: 1 };
        case 'right': return { opacity: t, tx:  offset, ty: 0, scale: 1 };
        case 'up':    return { opacity: t, tx: 0, ty: -offset, scale: 1 };
        case 'down':  return { opacity: t, tx: 0, ty:  offset, scale: 1 };
        default:      return { opacity: t, tx: -offset, ty: 0, scale: 1 };
      }
    }
    default:
      return { opacity: t, tx: 0, ty: 0, scale: 1 };
  }
}

function applyExit(localFrame: number, layerEndFrame: number, anim: Animation | undefined) {
  if (!anim || anim.type === 'none' || anim.durationFrames === 0) {
    return { opacity: 1, tx: 0, ty: 0, scale: 1 };
  }
  const exitStart = layerEndFrame - anim.durationFrames;
  const t = interpolate(localFrame, [exitStart, layerEndFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  switch (anim.type) {
    case 'fade':  return { opacity: t, tx: 0, ty: 0, scale: 1 };
    case 'scale': return { opacity: t, tx: 0, ty: 0, scale: 0.85 + 0.15 * t };
    case 'slide': {
      const offset = (1 - t) * 80;
      switch (anim.direction) {
        case 'left':  return { opacity: t, tx:  offset, ty: 0, scale: 1 };
        case 'right': return { opacity: t, tx: -offset, ty: 0, scale: 1 };
        case 'up':    return { opacity: t, tx: 0, ty:  offset, scale: 1 };
        case 'down':  return { opacity: t, tx: 0, ty: -offset, scale: 1 };
        default:      return { opacity: t, tx:  offset, ty: 0, scale: 1 };
      }
    }
    default: return { opacity: t, tx: 0, ty: 0, scale: 1 };
  }
}

export const LayerHost: React.FC<{
  layer: Layer;
  sceneDuration: number;
  children: React.ReactNode;
}> = ({ layer, sceneDuration, children }) => {
  // useCurrentFrame() inside <TransitionSeries.Sequence> is scene-relative.
  const sceneFrame = useCurrentFrame();
  const layerDuration = layer.durationFrames ?? sceneDuration - layer.from;
  const layerEndFrame = layer.from + layerDuration;

  if (sceneFrame < layer.from || sceneFrame >= layerEndFrame) return null;

  const localFrame = sceneFrame - layer.from;
  const enter = applyEnter(localFrame, layer.enter);
  const exit = applyExit(localFrame, layerDuration, layer.exit);
  const opacity = enter.opacity * exit.opacity;
  const tx = enter.tx + exit.tx;
  const ty = enter.ty + exit.ty;
  const scale = enter.scale * exit.scale;

  return (
    <AbsoluteFill
      style={{
        opacity,
        transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
        zIndex: layer.zIndex,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
