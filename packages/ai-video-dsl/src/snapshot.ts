import * as yaml from 'js-yaml';
import type { Pipeline, PipelineScene, Layer, Animation, Transition } from './types';

// ============================================
// Snapshot:per-frame symbolic description.
//
// At each sampled frame: which scene is active, which layers are visible,
// each layer's animation progress (enter/exit), and display text extracted
// from props.  Pure function of pipeline JSON — no React rendering.
// ============================================

export interface SnapshotObject {
  pipelineId: string;
  fps: number;
  totalFrames: number;
  primaryLang: string;
  sampledFrames: number[];
  frames: SnapshotFrame[];
}

export interface SnapshotFrame {
  frame: number;
  timeSeconds: number;
  activeScene: string | null;
  transition?: SnapshotTransitionState;
  background?: Record<string, unknown>;
  layers: SnapshotLayer[];
}

export interface SnapshotTransitionState {
  kind: string;
  from: string;
  to: string;
  /** 0..1 — 0 means transition just started; 1 means it just ended */
  progress: number;
}

export interface SnapshotLayer {
  scene: string;            // which scene this layer belongs to
  type: string;
  zIndex: number;
  /** 0..1 — combined effective visibility (layer animation × scene transition) */
  visibility: number;
  /** layer-level enter animation progress: 0..1 (1 = enter completed) */
  enterProgress: number;
  /** layer-level exit animation progress: 0..1 (1 = exit completed) */
  exitProgress: number;
  /** 0..1 — only set when a transition is in progress; reflects this layer's
   *  scene's contribution during the transition (fade-out for `from`, fade-in
   *  for `to`).  When no transition is active, omitted. */
  transitionVisibility?: number;
  text: string[];
  props: Record<string, unknown>;
}

// ============================================
// Sampling: midpoint of each scene + midpoint of each transition.
// ============================================

function pickSampledFrames(pipeline: Pipeline): number[] {
  const out = new Set<number>();
  for (const scene of pipeline.scenes) {
    const mid = scene.startFrame + Math.floor(scene.durationFrames / 2);
    out.add(mid);
  }
  for (const t of pipeline.transitions) {
    const fromScene = pipeline.scenes.find((s) => s.name === t.from);
    if (!fromScene) continue;
    const startsAt = fromScene.startFrame + fromScene.durationFrames - t.durationFrames;
    out.add(startsAt + Math.floor(t.durationFrames / 2));
  }
  return [...out].sort((a, b) => a - b);
}

// ============================================
// Animation progress
// ============================================

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function enterProgress(localFrame: number, anim: Animation | undefined): number {
  if (!anim || anim.type === 'none' || anim.durationFrames === 0) return 1;
  return clamp01(localFrame / anim.durationFrames);
}

function exitProgress(localFrame: number, layerEnd: number, anim: Animation | undefined): number {
  if (!anim || anim.type === 'none' || anim.durationFrames === 0) return 0;
  // Exit starts at layerEnd - anim.durationFrames; reaches 1 at layerEnd.
  const start = layerEnd - anim.durationFrames;
  if (localFrame < start) return 0;
  return clamp01((localFrame - start) / anim.durationFrames);
}

function visibility(enterP: number, exitP: number, hasEnter: boolean, hasExit: boolean): number {
  // enterP: 1 = fully entered. exitP: 1 = fully exited.
  // visibility = enter * (1 - exit), where missing animations default to 1 / 0.
  const e = hasEnter ? enterP : 1;
  const x = hasExit ? 1 - exitP : 1;
  return Math.max(0, Math.min(1, e * x));
}

// ============================================
// Active scene + transition state at a given pipeline frame
// ============================================

function activeAtFrame(
  pipeline: Pipeline,
  frame: number,
): { scene: PipelineScene | null; transition: SnapshotTransitionState | undefined; nextScene: PipelineScene | null } {
  // First, find the scene whose [start, start+dur) contains the frame.
  // Note: scenes overlap by transition.durationFrames.
  let active: PipelineScene | null = null;
  for (const s of pipeline.scenes) {
    if (frame >= s.startFrame && frame < s.startFrame + s.durationFrames) {
      active = s;
      break;
    }
  }

  // Detect transition: if frame is in the overlap zone of two scenes.
  let transState: SnapshotTransitionState | undefined;
  let nextScene: PipelineScene | null = null;
  if (active) {
    const trailing = pipeline.transitions.find((t) => t.from === active!.name);
    if (trailing) {
      const startsAt = active.startFrame + active.durationFrames - trailing.durationFrames;
      if (frame >= startsAt) {
        nextScene = pipeline.scenes.find((s) => s.name === trailing.to) ?? null;
        transState = {
          kind: trailing.kind,
          from: trailing.from,
          to: trailing.to,
          progress: round((frame - startsAt) / trailing.durationFrames, 3),
        };
      }
    }
  }

  return { scene: active, transition: transState, nextScene };
}

function buildLayer(
  scene: PipelineScene,
  layer: Layer,
  sceneFrame: number,
  sceneTransitionVisibility: number | undefined,
): SnapshotLayer | null {
  const layerDuration = layer.durationFrames ?? scene.durationFrames - layer.from;
  const layerStart = layer.from;
  const layerEnd = layerStart + layerDuration;

  if (sceneFrame < layerStart || sceneFrame >= layerEnd) return null;

  const localFrame = sceneFrame - layerStart;
  const enterP = enterProgress(localFrame, layer.enter);
  const exitP = exitProgress(localFrame, layerDuration, layer.exit);
  const layerVis = visibility(enterP, exitP, !!layer.enter, !!layer.exit);
  const sceneVis = sceneTransitionVisibility ?? 1;

  return {
    scene: scene.name,
    type: layer.type,
    zIndex: layer.zIndex,
    visibility: round(layerVis * sceneVis, 3),
    enterProgress: round(enterP, 3),
    exitProgress: round(exitP, 3),
    transitionVisibility: sceneTransitionVisibility !== undefined
      ? round(sceneTransitionVisibility, 3)
      : undefined,
    text: extractDisplayText(layer.props),
    props: layer.props,
  };
}

// ============================================
// Display-text extraction
//
// Walks the props object, returns string-leaf values that look like display
// text.  Skips: hex colors, URLs, *Ref keys, file extensions, enums.
// ============================================

const TEXT_KEY_PATTERN = /^(title|subtitle|content|body|headline|caption|message|label|name|sublabel|text|date|description|placeholder|cta|cta_label|author_name|author_handle|source|quarter|company|ticker|display_name)$/i;
const REF_KEY_PATTERN = /Ref$/;
const EXCLUDED_KEYS = new Set([
  'kind', 'type', 'chartType', 'bulletStyle', 'scheme', 'layout',
  'orientation', 'platform', 'cardStyle', 'easing', 'direction',
  'reveal', 'position', 'accent', 'color', 'colorScale',
]);
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const URL_LIKE = /^(https?:\/\/|\/|www\.)/;

function isDisplayText(key: string, value: string): boolean {
  if (REF_KEY_PATTERN.test(key)) return false;
  if (EXCLUDED_KEYS.has(key)) return false;
  if (HEX_COLOR.test(value)) return false;
  if (URL_LIKE.test(value)) return false;
  if (value.length === 0) return false;
  return true;
}

function extractDisplayText(props: Record<string, unknown>): string[] {
  const out: string[] = [];

  function visit(value: unknown, key: string): void {
    if (value === null || value === undefined) return;
    if (typeof value === 'string') {
      if (isDisplayText(key, value)) out.push(value);
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return;
    if (Array.isArray(value)) {
      for (const v of value) visit(v, key);
      return;
    }
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        // For nested objects, prefer the inner key over the outer one for matching
        visit(v, k);
      }
    }
  }

  for (const [k, v] of Object.entries(props)) {
    visit(v, k);
  }
  return out;
}

// ============================================
// Per-frame snapshot
// ============================================

function buildFrame(pipeline: Pipeline, frame: number): SnapshotFrame {
  const fps = pipeline.metadata.fps;
  const { scene, transition, nextScene } = activeAtFrame(pipeline, frame);

  if (!scene) {
    return {
      frame,
      timeSeconds: round(frame / fps, 3),
      activeScene: null,
      layers: [],
    };
  }

  const layers: SnapshotLayer[] = [];

  // Scene-level transition visibility:
  //   from-scene fades out as progress goes 0→1
  //   to-scene fades in as progress goes 0→1
  // For non-fade transitions (slide/wipe), pixels are still being shown but
  // moving; we use the same 0..1 model since it captures the "share of
  // visual attention" — close enough for testing.
  const fromSceneVis = transition ? 1 - transition.progress : undefined;
  const toSceneVis = transition ? transition.progress : undefined;

  // Active scene's visible layers
  const sceneFrame = frame - scene.startFrame;
  for (const l of scene.layers) {
    const built = buildLayer(scene, l, sceneFrame, fromSceneVis);
    if (built && built.visibility > 0) layers.push(built);
  }

  // Next scene during transition (fading in)
  if (transition && nextScene) {
    const nextSceneFrame = frame - nextScene.startFrame;
    if (nextSceneFrame >= 0) {
      for (const l of nextScene.layers) {
        const built = buildLayer(nextScene, l, nextSceneFrame, toSceneVis);
        if (built && built.visibility > 0) layers.push(built);
      }
    }
  }

  layers.sort((a, b) => a.zIndex - b.zIndex);

  return {
    frame,
    timeSeconds: round(frame / fps, 3),
    activeScene: scene.name,
    transition,
    background: scene.background ? { ...scene.background } : undefined,
    layers,
  };
}

function round(n: number, digits: number): number {
  const f = Math.pow(10, digits);
  return Math.round(n * f) / f;
}

// ============================================
// Public API
// ============================================

export interface SnapshotOptions {
  /** Override sample frames; default = scene midpoints + transition midpoints. */
  frames?: number[];
}

export function describeSnapshotObject(
  pipeline: Pipeline,
  options: SnapshotOptions = {},
): SnapshotObject {
  const sampledFrames = options.frames ?? pickSampledFrames(pipeline);
  return {
    pipelineId: pipeline.pipelineId,
    fps: pipeline.metadata.fps,
    totalFrames: pipeline.totalFrames,
    primaryLang: pipeline.metadata.primaryLang,
    sampledFrames,
    frames: sampledFrames.map((f) => buildFrame(pipeline, f)),
  };
}

export function describeSnapshotYaml(pipeline: Pipeline, options?: SnapshotOptions): string {
  const obj = describeSnapshotObject(pipeline, options);
  return yaml.dump(obj, { lineWidth: 120, noRefs: true, sortKeys: false });
}

export function describeSnapshotJson(pipeline: Pipeline, options?: SnapshotOptions): string {
  return JSON.stringify(describeSnapshotObject(pipeline, options), null, 2);
}
