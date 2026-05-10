import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import type { PipelineScene, Pipeline } from '@ai-video/dsl';
import { SceneBackground } from './SceneBackground';
import { LayerHost } from './LayerHost';
import { TemplateDispatcher } from './TemplateDispatcher';

function assetSrc(path: string): string {
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('file://')
  ) {
    return path;
  }
  // Relative path → resolved via Remotion's --public-dir (set by render.ts to
  // the pipeline storage root).
  return staticFile(path);
}

export const SceneRoot: React.FC<{
  scene: PipelineScene;
  pipeline: Pipeline;
  lang: string;
}> = ({ scene, pipeline, lang }) => {
  const ordered = [...scene.layers].sort((a, b) => a.zIndex - b.zIndex);
  const audioPath = pipeline.materials.audio[`${scene.name}:${lang}`];

  return (
    <AbsoluteFill>
      <SceneBackground bg={scene.background} pipeline={pipeline} />
      {audioPath && <Audio src={assetSrc(audioPath)} />}
      {ordered.map((layer, i) => (
        <LayerHost key={layer.id ?? i} layer={layer} sceneDuration={scene.durationFrames}>
          <TemplateDispatcher layer={layer} pipeline={pipeline} scene={scene} lang={lang} />
        </LayerHost>
      ))}
    </AbsoluteFill>
  );
};
