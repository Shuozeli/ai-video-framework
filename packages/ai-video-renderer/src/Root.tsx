import React from 'react';
import { Composition, type CalculateMetadataFunction } from 'remotion';
import type { Pipeline } from '@ai-video/dsl';
import '@ai-video/templates'; // populate registry
import { Video } from './Video';

export type VideoInputProps = Pipeline & { _lang?: 'zh' | 'en' };

const calculateMetadata: CalculateMetadataFunction<VideoInputProps> = ({ props }) => {
  const fps = props.metadata?.fps ?? 30;
  const resolution = props.metadata?.resolution ?? { width: 1920, height: 1080 };
  return {
    durationInFrames: Math.max(1, props.totalFrames ?? 1),
    fps,
    width: resolution.width,
    height: resolution.height,
  };
};

const PLACEHOLDER_PROPS: VideoInputProps = {
  pipelineId: 'placeholder',
  metadata: {
    title: 'Placeholder',
    duration: 1,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    format: 'mp4',
    aspectRatio: '16:9',
    primaryLang: 'zh',
  },
  materials: { data: {}, images: {}, audio: {} },
  scenes: [],
  transitions: [],
  totalFrames: 1,
};

export const Root: React.FC = () => (
  <Composition
    id="Video"
    component={Video}
    durationInFrames={1}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={PLACEHOLDER_PROPS}
    calculateMetadata={calculateMetadata}
  />
);
