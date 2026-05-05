import { createHash } from 'crypto';
import type {
  Workflow,
  Pipeline,
  PipelineScene,
  AudioTask,
  RenderTask,
  Layer,
  Lang,
} from './types';
import {
  WorkflowSchema,
  VoiceSettingSchema,
} from './types';

// ============================================
// Template Registry interface (DI; impl in @ai-video/templates)
// ============================================

export interface TemplateRegistry {
  has(name: string): boolean;
  validateProps(name: string, props: unknown): unknown;
  list(): Array<{ name: string; tier: string }>;
}

// ============================================
// Compile errors
// ============================================

export class CompileError extends Error {
  constructor(message: string, public path?: string[]) {
    super(message);
    this.name = 'CompileError';
  }
}

// ============================================
// Helpers
// ============================================

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function shortHash(input: string): string {
  return sha256(input).slice(0, 16);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return (
    '{' +
    keys.map((k) => JSON.stringify(k) + ':' + stableStringify((value as any)[k])).join(',') +
    '}'
  );
}

// ============================================
// Validation phases
// ============================================

function validateLayers(workflow: Workflow, registry: TemplateRegistry): void {
  for (const scene of workflow.scenes) {
    for (const [i, layer] of scene.layers.entries()) {
      if (!registry.has(layer.type)) {
        throw new CompileError(
          `Unknown template: '${layer.type}'`,
          ['scenes', scene.name, 'layers', String(i), 'type'],
        );
      }
      try {
        layer.props = registry.validateProps(layer.type, layer.props) as Record<string, unknown>;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new CompileError(
          `Invalid props for template '${layer.type}': ${msg}`,
          ['scenes', scene.name, 'layers', String(i), 'props'],
        );
      }
    }
  }
}

function validateMaterialRefs(workflow: Workflow): void {
  const { data, images, audio } = workflow.materials;
  const dataKeys = new Set(Object.keys(data));
  const imageKeys = new Set(Object.keys(images));
  const audioKeys = new Set(Object.keys(audio));

  function visit(value: unknown, path: string[]): void {
    if (value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => visit(v, [...path, String(i)]));
      return;
    }
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const p = [...path, k];
      if (k === 'dataRef' && typeof v === 'string') {
        if (!dataKeys.has(v)) {
          throw new CompileError(`materials.data['${v}'] not found`, p);
        }
      } else if ((k === 'imageRef' || k === 'logoRef' || k === 'iconRef' || k === 'qrCodeRef' ||
                  k === 'authorAvatarRef' || k === 'screenshotRef' || k === 'sourceLogoRef') &&
                  typeof v === 'string') {
        if (!imageKeys.has(v)) {
          throw new CompileError(`materials.images['${v}'] not found`, p);
        }
      } else if (k === 'audioRef' && typeof v === 'string') {
        if (!audioKeys.has(v)) {
          throw new CompileError(`materials.audio['${v}'] not found`, p);
        }
      } else {
        visit(v, p);
      }
    }
  }

  for (const scene of workflow.scenes) {
    visit(scene, ['scenes', scene.name]);
  }
}

function validateTransitions(workflow: Workflow): void {
  const sceneNames = workflow.scenes.map((s) => s.name);
  const sceneIdx = new Map(sceneNames.map((n, i) => [n, i]));

  for (const t of workflow.transitions) {
    const fromIdx = sceneIdx.get(t.from);
    const toIdx = sceneIdx.get(t.to);
    if (fromIdx === undefined) {
      throw new CompileError(`Transition references unknown scene '${t.from}'`, ['transitions']);
    }
    if (toIdx === undefined) {
      throw new CompileError(`Transition references unknown scene '${t.to}'`, ['transitions']);
    }
    if (toIdx !== fromIdx + 1) {
      throw new CompileError(
        `Transition from '${t.from}' to '${t.to}' must be between adjacent scenes`,
        ['transitions'],
      );
    }
  }
}

// ============================================
// Hashing
// ============================================

function hashLayer(layer: Layer, materials: Workflow['materials']): string {
  // Inline any data referenced by *Ref so different data → different hash
  const inlined: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(layer.props)) {
    if (k === 'dataRef' && typeof v === 'string') {
      inlined['_data:' + v] = materials.data[v];
    } else if (k === 'audioRef' && typeof v === 'string') {
      inlined['_audio:' + v] = materials.audio[v];
    }
    inlined[k] = v;
  }
  return shortHash(stableStringify({
    type: layer.type,
    props: inlined,
    from: layer.from,
    durationFrames: layer.durationFrames ?? null,
    zIndex: layer.zIndex,
    enter: layer.enter ?? null,
    exit: layer.exit ?? null,
  }));
}

function hashRenderTask(scene: PipelineScene, materials: Workflow['materials']): string {
  return shortHash(stableStringify({
    layers: scene.layers.map((l) => hashLayer(l, materials)),
    background: scene.background ?? null,
    durationFrames: scene.durationFrames,
  }));
}

function hashAudioTask(text: string, voice: AudioTask['voice'], lang: Lang): string {
  return shortHash(stableStringify({ text, voice, lang }));
}

// ============================================
// Build audio tasks per language
// ============================================

function buildAudioTasksForScene(
  scene: Workflow['scenes'][number],
  primaryLang: Lang,
  pipelineId: string,
): Record<string, AudioTask> {
  const out: Record<string, AudioTask> = {};
  if (!scene.audio) return out;

  // Primary language (from audio.text)
  if (scene.audio.text) {
    const voice = VoiceSettingSchema.parse(scene.audio.voice ?? {});
    const hash = hashAudioTask(scene.audio.text, voice, primaryLang);
    out[primaryLang] = {
      taskId: `audio-${scene.name}-${primaryLang}`,
      contentHash: hash,
      lang: primaryLang,
      sceneName: scene.name,
      text: scene.audio.text,
      voice,
      outputPath: `pipelines/${pipelineId}/audio/${primaryLang}/${scene.name}.mp3`,
    };
  }

  // Alternates
  if (scene.audio.alternates) {
    for (const [lang, alt] of Object.entries(scene.audio.alternates)) {
      if (lang === primaryLang) continue; // duplicate of primary
      const voice = VoiceSettingSchema.parse(alt.voice ?? scene.audio.voice ?? {});
      const hash = hashAudioTask(alt.text, voice, lang as Lang);
      out[lang] = {
        taskId: `audio-${scene.name}-${lang}`,
        contentHash: hash,
        lang: lang as Lang,
        sceneName: scene.name,
        text: alt.text,
        voice,
        outputPath: `pipelines/${pipelineId}/audio/${lang}/${scene.name}.mp3`,
      };
    }
  }

  return out;
}

// ============================================
// Main compile
// ============================================

export interface CompileOptions {
  registry: TemplateRegistry;
}

export function compile(workflow: Workflow, options: CompileOptions): Pipeline {
  // 1. Schema validation (and apply defaults)
  workflow = WorkflowSchema.parse(workflow);

  // 2. Layer + material + transition validation
  validateLayers(workflow, options.registry);
  validateMaterialRefs(workflow);
  validateTransitions(workflow);

  // 3. Pipeline ID = workflow content hash
  const pipelineId = shortHash(stableStringify(workflow));

  // 4. Compute frame ranges, accounting for transition overlaps
  const fps = workflow.metadata.fps;
  const transitionFrom = new Map(workflow.transitions.map((t) => [t.from, t]));

  let cursor = 0;
  const scenes: PipelineScene[] = workflow.scenes.map((scene) => {
    const durationFrames = Math.round(scene.duration * fps);
    const startFrame = cursor;

    const audioTasks = buildAudioTasksForScene(scene, workflow.metadata.primaryLang, pipelineId);

    const partial: PipelineScene = {
      name: scene.name,
      startFrame,
      durationFrames,
      layers: scene.layers,
      background: scene.background,
      audioTasks,
      renderTask: {
        taskId: `render-${scene.name}`,
        contentHash: '', // filled below
        sceneName: scene.name,
        startFrame,
        durationFrames,
        layers: scene.layers,
        background: scene.background,
      },
    };
    partial.renderTask.contentHash = hashRenderTask(partial, workflow.materials);

    // Advance cursor: this scene's full length, minus the trailing transition overlap (if any)
    const trailing = transitionFrom.get(scene.name);
    const overlap = trailing ? trailing.durationFrames : 0;
    cursor = startFrame + durationFrames - overlap;

    return partial;
  });

  // totalFrames = end of last scene (cursor + last overlap, but last scene has no trailing overlap)
  const last = scenes[scenes.length - 1];
  const totalFrames = last.startFrame + last.durationFrames;

  return {
    pipelineId,
    metadata: workflow.metadata,
    materials: workflow.materials,
    scenes,
    transitions: workflow.transitions,
    totalFrames,
  };
}

// ============================================
// Serialization helpers
// ============================================

export function serializePipeline(pipeline: Pipeline): string {
  return JSON.stringify(pipeline, null, 2);
}

export function deserializePipeline(json: string): Pipeline {
  return JSON.parse(json);
}
