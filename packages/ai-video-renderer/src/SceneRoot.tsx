import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { PipelineScene, Pipeline } from '@ai-video/dsl';
import { SceneBackground } from './SceneBackground';
import { LayerHost } from './LayerHost';
import { TemplateDispatcher } from './TemplateDispatcher';

export const SceneRoot: React.FC<{ scene: PipelineScene; pipeline: Pipeline }> = ({
  scene,
  pipeline,
}) => {
  const ordered = [...scene.layers].sort((a, b) => a.zIndex - b.zIndex);
  return (
    <AbsoluteFill>
      <SceneBackground bg={scene.background} pipeline={pipeline} />
      {ordered.map((layer, i) => (
        <LayerHost key={layer.id ?? i} layer={layer} sceneDuration={scene.durationFrames}>
          <TemplateDispatcher layer={layer} pipeline={pipeline} />
        </LayerHost>
      ))}
    </AbsoluteFill>
  );
};
