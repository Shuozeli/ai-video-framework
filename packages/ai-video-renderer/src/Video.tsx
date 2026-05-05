import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming, type TransitionPresentation } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import type { Transition } from '@ai-video/dsl';
import type { VideoInputProps } from './Root';
import { SceneRoot } from './SceneRoot';

function makePresentation(t: Transition): TransitionPresentation<any> {
  const dirMap: Record<string, 'from-left' | 'from-right' | 'from-top' | 'from-bottom'> = {
    left: 'from-left',
    right: 'from-right',
    up: 'from-top',
    down: 'from-bottom',
  };
  const direction = dirMap[t.direction ?? 'right'];
  if (t.kind === 'slide') return slide({ direction }) as TransitionPresentation<any>;
  if (t.kind === 'wipe') return wipe({ direction }) as TransitionPresentation<any>;
  // 'fade' or 'none' (none is filtered before reaching here)
  return fade() as TransitionPresentation<any>;
}

export const Video: React.FC<VideoInputProps> = (pipeline) => {
  if (!pipeline.scenes || pipeline.scenes.length === 0) {
    return <AbsoluteFill style={{ backgroundColor: '#000' }} />;
  }

  const transitionsByFrom = new Map<string, Transition>(
    (pipeline.transitions ?? []).map((t) => [t.from, t]),
  );

  const children: React.ReactNode[] = [];

  pipeline.scenes.forEach((scene, idx) => {
    children.push(
      <TransitionSeries.Sequence
        key={scene.name}
        durationInFrames={scene.durationFrames}
      >
        <SceneRoot scene={scene} pipeline={pipeline} />
      </TransitionSeries.Sequence>,
    );

    const t = transitionsByFrom.get(scene.name);
    if (t && t.kind !== 'none' && idx < pipeline.scenes.length - 1) {
      children.push(
        <TransitionSeries.Transition
          key={`t-${scene.name}`}
          presentation={makePresentation(t)}
          timing={linearTiming({ durationInFrames: t.durationFrames })}
        />,
      );
    }
  });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>{children}</TransitionSeries>
    </AbsoluteFill>
  );
};
