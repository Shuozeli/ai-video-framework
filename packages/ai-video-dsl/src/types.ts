import { z } from 'zod';

// ============================================
// Common
// ============================================

export const ResolutionSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});
export type Resolution = z.infer<typeof ResolutionSchema>;

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Position = z.infer<typeof PositionSchema>;

export const SizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});
export type Size = z.infer<typeof SizeSchema>;

export const LangSchema = z.enum(['zh', 'en']);
export type Lang = z.infer<typeof LangSchema>;

// ============================================
// Animation
// ============================================

export const AnimationSchema = z.object({
  type: z.enum(['fade', 'slide', 'scale', 'spring', 'none']).default('fade'),
  durationFrames: z.number().int().nonnegative().default(15),
  direction: z.enum(['left', 'right', 'up', 'down']).optional(),
  easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']).default('ease-out'),
});
export type Animation = z.infer<typeof AnimationSchema>;

// ============================================
// Background
// ============================================

export const BackgroundSchema = z.object({
  kind: z.enum(['solid', 'gradient', 'image']).default('solid'),
  color: z.string().default('#0a0e27'),
  color2: z.string().optional(),
  imageRef: z.string().optional(),
  blur: z.number().nonnegative().default(0),
});
export type Background = z.infer<typeof BackgroundSchema>;

// ============================================
// Voice / Audio
// ============================================

export const VoiceSettingSchema = z.object({
  voice_id: z.string().default('male-qn-qingse'),
  speed: z.number().min(0.5).max(2).default(1),
  vol: z.number().min(0).max(10).default(1),
  pitch: z.number().min(-12).max(12).default(0),
  emotion: z
    .enum(['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'calm', 'fluent', 'whisper'])
    .default('calm'),
});
export type VoiceSetting = z.infer<typeof VoiceSettingSchema>;

export const AudioAlternateSchema = z.object({
  text: z.string().min(1),
  voice: VoiceSettingSchema.optional(),
});
export type AudioAlternate = z.infer<typeof AudioAlternateSchema>;

export const AudioBlockSchema = z.object({
  text: z.string().optional(),
  audioRef: z.string().optional(),
  voice: VoiceSettingSchema.optional(),
  // partial record keyed by lang code (e.g. 'en'); not all langs are required
  alternates: z.record(z.string(), AudioAlternateSchema).optional(),
});
export type AudioBlock = z.infer<typeof AudioBlockSchema>;

// ============================================
// Layer
// ============================================

export const LayerSchema = z.object({
  id: z.string().optional(),
  type: z.string().min(1),
  from: z.number().int().nonnegative().default(0),
  durationFrames: z.number().int().positive().optional(),
  zIndex: z.number().int().default(0),
  enter: AnimationSchema.optional(),
  exit: AnimationSchema.optional(),
  props: z.record(z.string(), z.unknown()).default({}),
});
export type Layer = z.infer<typeof LayerSchema>;

// ============================================
// Scene
// ============================================

export const SceneSchema = z.object({
  name: z.string().min(1),
  duration: z.number().positive(),
  audio: AudioBlockSchema.optional(),
  background: BackgroundSchema.optional(),
  layers: z.array(LayerSchema).min(1),
});
export type Scene = z.infer<typeof SceneSchema>;

// ============================================
// Transition
// ============================================

export const TransitionSchema = z.object({
  from: z.string(),
  to: z.string(),
  kind: z.enum(['fade', 'slide', 'wipe', 'none']).default('fade'),
  durationFrames: z.number().int().positive().default(15),
  direction: z.enum(['left', 'right', 'up', 'down']).optional(),
  easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']).default('ease-out'),
});
export type Transition = z.infer<typeof TransitionSchema>;

// ============================================
// Materials
// ============================================

export const MaterialsSchema = z.object({
  data: z.record(z.string(), z.unknown()).default({}),
  images: z.record(z.string(), z.string()).default({}),
  audio: z.record(z.string(), z.string()).default({}),
});
export type Materials = z.infer<typeof MaterialsSchema>;

// ============================================
// Workflow
// ============================================

export const VideoMetadataSchema = z.object({
  title: z.string().min(1),
  duration: z.number().positive(),
  fps: z.number().positive().default(30),
  resolution: ResolutionSchema.default({ width: 1920, height: 1080 }),
  format: z.enum(['mp4', 'webm']).default('mp4'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  primaryLang: LangSchema.default('zh'),
});
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;

export const WorkflowSchema = z.object({
  metadata: VideoMetadataSchema,
  materials: MaterialsSchema.default({ data: {}, images: {}, audio: {} }),
  scenes: z.array(SceneSchema).min(1),
  transitions: z.array(TransitionSchema).default([]),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

// ============================================
// Pipeline (compile output)
// ============================================

export const AudioTaskSchema = z.object({
  taskId: z.string(),
  contentHash: z.string(),
  lang: LangSchema,
  sceneName: z.string(),
  text: z.string(),
  voice: VoiceSettingSchema,
  outputPath: z.string(),
});
export type AudioTask = z.infer<typeof AudioTaskSchema>;

export const RenderTaskSchema = z.object({
  taskId: z.string(),
  contentHash: z.string(),
  sceneName: z.string(),
  startFrame: z.number().int().nonnegative(),
  durationFrames: z.number().int().positive(),
  layers: z.array(LayerSchema),
  background: BackgroundSchema.optional(),
});
export type RenderTask = z.infer<typeof RenderTaskSchema>;

export const PipelineSceneSchema = z.object({
  name: z.string(),
  startFrame: z.number().int().nonnegative(),
  durationFrames: z.number().int().positive(),
  layers: z.array(LayerSchema),
  background: BackgroundSchema.optional(),
  // partial record keyed by lang code; not all langs are required
  audioTasks: z.record(z.string(), AudioTaskSchema).default({}),
  renderTask: RenderTaskSchema,
});
export type PipelineScene = z.infer<typeof PipelineSceneSchema>;

export const PipelineSchema = z.object({
  pipelineId: z.string(),
  metadata: VideoMetadataSchema,
  materials: MaterialsSchema,
  scenes: z.array(PipelineSceneSchema),
  transitions: z.array(TransitionSchema).default([]),
  totalFrames: z.number().int().positive(),
});
export type Pipeline = z.infer<typeof PipelineSchema>;

// ============================================
// Validation
// ============================================

export function validateWorkflow(workflow: unknown): Workflow {
  return WorkflowSchema.parse(workflow);
}

export function validateWorkflowOrThrow(workflow: unknown): Workflow {
  const result = WorkflowSchema.safeParse(workflow);
  if (!result.success) {
    const issues = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Workflow validation failed:\n${issues.join('\n')}`);
  }
  return result.data;
}
