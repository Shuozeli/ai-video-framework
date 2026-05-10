// ============================================
// Re-exports: types, schemas, validators
// ============================================

export type {
  Lang,
  Resolution,
  Position,
  Size,
  Animation,
  Background,
  VoiceSetting,
  AudioAlternate,
  AudioBlock,
  Layer,
  Scene,
  Transition,
  Materials,
  SubtitleTiming,
  VideoMetadata,
  Workflow,
  AudioTask,
  RenderTask,
  PipelineScene,
  Pipeline,
} from './types';

export {
  LangSchema,
  ResolutionSchema,
  PositionSchema,
  SizeSchema,
  AnimationSchema,
  BackgroundSchema,
  VoiceSettingSchema,
  AudioAlternateSchema,
  AudioBlockSchema,
  LayerSchema,
  SceneSchema,
  TransitionSchema,
  MaterialsSchema,
  SubtitleTimingSchema,
  VideoMetadataSchema,
  WorkflowSchema,
  AudioTaskSchema,
  RenderTaskSchema,
  PipelineSceneSchema,
  PipelineSchema,
  validateWorkflow,
  validateWorkflowOrThrow,
} from './types';

// Compiler
export type { TemplateRegistry, CompileOptions } from './compiler';
export { compile, serializePipeline, deserializePipeline, CompileError } from './compiler';

// Manifest (structural description, deterministic from pipeline)
export type {
  ManifestObject,
  ManifestScene,
  ManifestLayer,
  ManifestTransition,
  ManifestAudioTaskRef,
} from './manifest';
export {
  describeManifestObject,
  describeManifestYaml,
  describeManifestJson,
} from './manifest';

// Snapshot (per-sampled-frame description)
export type {
  SnapshotObject,
  SnapshotFrame,
  SnapshotLayer,
  SnapshotTransitionState,
  SnapshotOptions,
} from './snapshot';
export {
  describeSnapshotObject,
  describeSnapshotYaml,
  describeSnapshotJson,
} from './snapshot';

// ============================================
// Builder helpers (thin wrappers around schemas)
// ============================================

import {
  WorkflowSchema,
  SceneSchema,
  LayerSchema,
  type Workflow,
  type Scene,
  type Layer,
} from './types';

export function workflow(spec: unknown): Workflow {
  return WorkflowSchema.parse(spec);
}

export function scene(spec: unknown): Scene {
  return SceneSchema.parse(spec);
}

export function layer<P extends Record<string, unknown>>(
  type: string,
  props: P,
  opts?: Partial<Omit<Layer, 'type' | 'props'>>,
): Layer {
  return LayerSchema.parse({
    type,
    props,
    ...opts,
  });
}
