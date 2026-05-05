import * as yaml from 'js-yaml';
import type { Pipeline, PipelineScene, Layer, Transition } from './types';

// ============================================
// Manifest:full pipeline structure as deterministic, diff-friendly text.
// Source of truth for structural tests:scenes, layers, props, audio per
// language, transitions, frame ranges.
// ============================================

export interface ManifestObject {
  pipelineId: string;
  metadata: {
    title: string;
    durationSeconds: number;
    fps: number;
    resolution: string;
    format: string;
    aspectRatio: string;
    primaryLang: string;
    totalFrames: number;
  };
  materials: {
    data: string[];
    images: Record<string, string>;
    audio: Record<string, string>;
  };
  scenes: ManifestScene[];
  transitions: ManifestTransition[];
  audioTasks: ManifestAudioTaskRef[];
}

export interface ManifestScene {
  name: string;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  durationSeconds: number;
  audio?: Record<string, { text: string; voiceId: string; speed: number }>;
  background?: Record<string, unknown>;
  layers: ManifestLayer[];
}

export interface ManifestLayer {
  index: number;
  id?: string;
  type: string;
  fromFrame: number;
  durationFrames: number | 'till_scene_end';
  zIndex: number;
  enter?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  props: Record<string, unknown>;
}

export interface ManifestTransition {
  from: string;
  to: string;
  kind: string;
  durationFrames: number;
  startsAtFrame: number;
  endsAtFrame: number;
}

export interface ManifestAudioTaskRef {
  scene: string;
  lang: string;
  contentHash: string;
  outputPath: string;
}

// ============================================

function buildScene(scene: PipelineScene, fps: number): ManifestScene {
  const audioBlock: Record<string, { text: string; voiceId: string; speed: number }> = {};
  for (const [lang, task] of Object.entries(scene.audioTasks)) {
    audioBlock[lang] = {
      text: task.text,
      voiceId: task.voice.voice_id,
      speed: task.voice.speed,
    };
  }

  return {
    name: scene.name,
    startFrame: scene.startFrame,
    endFrame: scene.startFrame + scene.durationFrames,
    durationFrames: scene.durationFrames,
    durationSeconds: round(scene.durationFrames / fps, 3),
    audio: Object.keys(audioBlock).length ? audioBlock : undefined,
    background: scene.background ? { ...scene.background } : undefined,
    layers: scene.layers.map((l, i) => buildLayer(l, i)),
  };
}

function buildLayer(layer: Layer, index: number): ManifestLayer {
  return {
    index,
    id: layer.id,
    type: layer.type,
    fromFrame: layer.from,
    durationFrames: layer.durationFrames ?? 'till_scene_end',
    zIndex: layer.zIndex,
    enter: layer.enter ? { ...layer.enter } : undefined,
    exit: layer.exit ? { ...layer.exit } : undefined,
    props: layer.props,
  };
}

function buildTransition(
  t: Transition,
  scenes: PipelineScene[],
): ManifestTransition {
  // Transition lives at the end of `from` scene
  const fromScene = scenes.find((s) => s.name === t.from);
  if (!fromScene) {
    return {
      from: t.from,
      to: t.to,
      kind: t.kind,
      durationFrames: t.durationFrames,
      startsAtFrame: -1,
      endsAtFrame: -1,
    };
  }
  const startsAt = fromScene.startFrame + fromScene.durationFrames - t.durationFrames;
  return {
    from: t.from,
    to: t.to,
    kind: t.kind,
    durationFrames: t.durationFrames,
    startsAtFrame: startsAt,
    endsAtFrame: startsAt + t.durationFrames,
  };
}

function round(n: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

// ============================================
// Public API
// ============================================

export function describeManifestObject(pipeline: Pipeline): ManifestObject {
  const fps = pipeline.metadata.fps;

  const audioTasks: ManifestAudioTaskRef[] = [];
  for (const scene of pipeline.scenes) {
    for (const [lang, task] of Object.entries(scene.audioTasks)) {
      audioTasks.push({
        scene: scene.name,
        lang,
        contentHash: task.contentHash,
        outputPath: task.outputPath,
      });
    }
  }

  return {
    pipelineId: pipeline.pipelineId,
    metadata: {
      title: pipeline.metadata.title,
      durationSeconds: round(pipeline.totalFrames / fps, 3),
      fps,
      resolution: `${pipeline.metadata.resolution.width}x${pipeline.metadata.resolution.height}`,
      format: pipeline.metadata.format,
      aspectRatio: pipeline.metadata.aspectRatio,
      primaryLang: pipeline.metadata.primaryLang,
      totalFrames: pipeline.totalFrames,
    },
    materials: {
      data: Object.keys(pipeline.materials.data).sort(),
      images: { ...pipeline.materials.images },
      audio: { ...pipeline.materials.audio },
    },
    scenes: pipeline.scenes.map((s) => buildScene(s, fps)),
    transitions: pipeline.transitions.map((t) => buildTransition(t, pipeline.scenes)),
    audioTasks,
  };
}

export function describeManifestYaml(pipeline: Pipeline): string {
  const obj = describeManifestObject(pipeline);
  return yaml.dump(obj, { lineWidth: 120, noRefs: true, sortKeys: false });
}

export function describeManifestJson(pipeline: Pipeline): string {
  return JSON.stringify(describeManifestObject(pipeline), null, 2);
}
