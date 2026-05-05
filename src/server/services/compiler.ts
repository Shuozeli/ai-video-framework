import * as grpc from '@grpc/grpc-js';
import { compile, type Workflow, type Pipeline as DSLPipeline } from '@ai-video/dsl';
import { dslRegistry, listTemplates } from '@ai-video/templates';
import { pipelineStore } from './pipeline-store';
import { PipelineStatus } from '../types';

// ============================================
// proto ↔ DSL adapters
// (proto-loader returns plain JS objects with camelCased field names)
// ============================================

function protoToWorkflow(def: any): Workflow {
  const md = def.metadata ?? {};
  const mats = def.materials ?? { dataJson: {}, images: {}, audio: {} };

  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(mats.dataJson ?? {})) {
    try {
      data[k] = JSON.parse(v as string);
    } catch {
      data[k] = v;
    }
  }

  return {
    metadata: {
      title: md.title || 'Untitled',
      duration: md.durationSeconds ?? 0,
      fps: md.fps || 30,
      resolution: {
        width: md.resolution?.width || 1920,
        height: md.resolution?.height || 1080,
      },
      format: (md.format || 'mp4') as 'mp4' | 'webm',
      aspectRatio: (md.aspectRatio || '16:9') as '16:9' | '9:16' | '1:1',
      primaryLang: (md.primaryLang || 'zh') as 'zh' | 'en',
    },
    materials: {
      data,
      images: { ...(mats.images ?? {}) },
      audio: { ...(mats.audio ?? {}) },
    },
    scenes: (def.scenes ?? []).map((s: any) => ({
      name: s.name,
      duration: s.durationSeconds,
      audio: s.audio
        ? {
            text: s.audio.text || undefined,
            audioRef: s.audio.audioRef || undefined,
            voice: s.audio.voice
              ? {
                  voice_id: s.audio.voice.voiceId || 'male-qn-qingse',
                  speed: s.audio.voice.speed || 1,
                  vol: s.audio.voice.vol || 1,
                  pitch: s.audio.voice.pitch || 0,
                  emotion: s.audio.voice.emotion || 'calm',
                }
              : undefined,
            alternates: s.audio.alternates
              ? Object.fromEntries(
                  Object.entries(s.audio.alternates).map(([lang, alt]: [string, any]) => [
                    lang,
                    {
                      text: alt.text,
                      voice: alt.voice
                        ? {
                            voice_id: alt.voice.voiceId || 'male-qn-qingse',
                            speed: alt.voice.speed || 1,
                            vol: alt.voice.vol || 1,
                            pitch: alt.voice.pitch || 0,
                            emotion: alt.voice.emotion || 'calm',
                          }
                        : undefined,
                    },
                  ]),
                )
              : undefined,
          }
        : undefined,
      background: s.background
        ? {
            kind: (s.background.kind || 'solid') as 'solid' | 'gradient' | 'image',
            color: s.background.color || '#0a0e27',
            color2: s.background.color2 || undefined,
            imageRef: s.background.imageRef || undefined,
            blur: s.background.blur || 0,
          }
        : undefined,
      layers: (s.layers ?? []).map((l: any) => {
        let props: Record<string, unknown> = {};
        if (l.propsJson) {
          try {
            props = JSON.parse(l.propsJson);
          } catch {
            throw new Error(`Invalid props_json for layer in scene '${s.name}'`);
          }
        }
        return {
          id: l.id || undefined,
          type: l.template,
          from: l.fromFrame || 0,
          durationFrames: l.durationFrames > 0 ? l.durationFrames : undefined,
          zIndex: l.zIndex || 0,
          enter: l.enter ? convertAnimation(l.enter) : undefined,
          exit: l.exit ? convertAnimation(l.exit) : undefined,
          props,
        };
      }),
    })),
    transitions: (def.transitions ?? []).map((t: any) => ({
      from: t.from,
      to: t.to,
      kind: (t.kind || 'fade') as 'fade' | 'slide' | 'wipe' | 'none',
      durationFrames: t.durationFrames || 15,
      direction: t.direction ? (t.direction as 'left' | 'right' | 'up' | 'down') : undefined,
      easing: (t.easing || 'ease-out') as 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out',
    })),
  };
}

function convertAnimation(a: any) {
  return {
    type: (a.type || 'fade') as 'fade' | 'slide' | 'scale' | 'spring' | 'none',
    durationFrames: a.durationFrames || 15,
    direction: a.direction ? (a.direction as 'left' | 'right' | 'up' | 'down') : undefined,
    easing: (a.easing || 'ease-out') as 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out',
  };
}

function pipelineToProto(p: DSLPipeline): any {
  return {
    pipelineId: p.pipelineId,
    metadata: {
      title: p.metadata.title,
      durationSeconds: p.metadata.duration,
      fps: p.metadata.fps,
      resolution: { width: p.metadata.resolution.width, height: p.metadata.resolution.height },
      format: p.metadata.format,
      aspectRatio: p.metadata.aspectRatio,
      primaryLang: p.metadata.primaryLang,
    },
    materials: {
      dataJson: Object.fromEntries(
        Object.entries(p.materials.data).map(([k, v]) => [k, JSON.stringify(v)]),
      ),
      images: { ...p.materials.images },
      audio: { ...p.materials.audio },
    },
    scenes: p.scenes.map((s) => ({
      name: s.name,
      startFrame: s.startFrame,
      durationFrames: s.durationFrames,
      background: s.background ?? null,
      layers: s.layers.map((l) => ({
        id: l.id || '',
        template: l.type,
        fromFrame: l.from,
        durationFrames: l.durationFrames || 0,
        zIndex: l.zIndex,
        enter: l.enter ?? null,
        exit: l.exit ?? null,
        propsJson: JSON.stringify(l.props),
      })),
      audioTasks: Object.fromEntries(
        Object.entries(s.audioTasks).map(([lang, t]) => [
          lang,
          {
            taskId: t.taskId,
            contentHash: t.contentHash,
            lang: t.lang,
            sceneName: t.sceneName,
            text: t.text,
            voice: {
              voiceId: t.voice.voice_id,
              speed: t.voice.speed,
              vol: t.voice.vol,
              pitch: t.voice.pitch,
              emotion: t.voice.emotion,
            },
            outputPath: t.outputPath,
          },
        ]),
      ),
      renderTask: {
        taskId: s.renderTask.taskId,
        contentHash: s.renderTask.contentHash,
        sceneName: s.renderTask.sceneName,
        startFrame: s.renderTask.startFrame,
        durationFrames: s.renderTask.durationFrames,
      },
    })),
    transitions: p.transitions,
    totalFrames: p.totalFrames,
  };
}

// ============================================
// CompileWorkflow
// ============================================

export async function compileWorkflow(
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
): Promise<void> {
  try {
    const req = call.request;
    if (!req.workflow) {
      return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'workflow is required' });
    }

    const workflow = protoToWorkflow(req.workflow);
    const pipeline = compile(workflow, { registry: dslRegistry });

    pipelineStore.set(pipeline.pipelineId, {
      ...pipeline,
      status: PipelineStatus.PENDING,
      progressPercent: 0,
      currentScene: '',
      audioResults: new Map(),
      videoPath: null,
      errorMessage: null,
      createdAt: Date.now(),
      cancelled: false,
    });

    callback(null, {
      pipelineId: pipeline.pipelineId,
      pipeline: pipelineToProto(pipeline),
    });
  } catch (error) {
    console.error('CompileWorkflow error:', error);
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: error instanceof Error ? error.message : 'compile failed',
    });
  }
}

// ============================================
// GetPipeline
// ============================================

export async function getPipeline(
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
): Promise<void> {
  const pipelineId = call.request.pipelineId;
  if (!pipelineId) {
    return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'pipeline_id is required' });
  }
  const stored = pipelineStore.get(pipelineId);
  if (!stored) {
    return callback({ code: grpc.status.NOT_FOUND, message: `Pipeline ${pipelineId} not found` });
  }
  callback(null, { pipeline: pipelineToProto(stored) });
}

// ============================================
// ListPipelines
// ============================================

export async function listPipelines(
  _call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
): Promise<void> {
  const pipelines: any[] = [];
  pipelineStore.forEach((s) => {
    pipelines.push({
      pipelineId: s.pipelineId,
      title: s.metadata?.title || 'Untitled',
      status: s.status,
      progressPercent: s.progressPercent,
      createdAt: s.createdAt,
    });
  });
  callback(null, { pipelines });
}

// ============================================
// ListTemplates
// ============================================

export async function handleListTemplates(
  _call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
): Promise<void> {
  const templates = listTemplates().map((t) => ({
    name: t.name,
    tier: t.tier,
    description: t.description,
    schemaJson: JSON.stringify(t.schemaJson),
  }));
  callback(null, { templates });
}
