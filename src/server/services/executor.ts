import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
import * as path from 'path';
import type { Pipeline, AudioTask, Lang } from '@ai-video/dsl';
import { describeManifestYaml, describeSnapshotYaml } from '@ai-video/dsl';
import type { PipelineState, AudioResult } from '../types';
import { PipelineStatus } from '../types';
import { pipelineStore } from './pipeline-store';
import { TTSService } from './tts';
import { renderPipeline, renderStill } from './render';

type OutputKind = 'mp4' | 'manifest' | 'snapshot';
const VALID_OUTPUTS: readonly OutputKind[] = ['mp4', 'manifest', 'snapshot'];

function normalizeOutputs(raw: string[] | undefined): OutputKind[] {
  if (!raw || raw.length === 0) return ['mp4'];
  const out: OutputKind[] = [];
  for (const r of raw) {
    const v = r.toLowerCase().trim() as OutputKind;
    if (VALID_OUTPUTS.includes(v) && !out.includes(v)) out.push(v);
  }
  return out.length ? out : ['mp4'];
}

function sidecarPath(videoPath: string, suffix: string): string {
  const ext = path.extname(videoPath);
  const base = videoPath.slice(0, videoPath.length - ext.length);
  return `${base}.${suffix}`;
}

function writeManifest(pipeline: Pipeline, videoPath: string): string {
  const out = sidecarPath(videoPath, 'manifest.yaml');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, describeManifestYaml(pipeline));
  return out;
}

function writeSnapshot(pipeline: Pipeline, videoPath: string): string {
  const out = sidecarPath(videoPath, 'snapshot.yaml');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, describeSnapshotYaml(pipeline));
  return out;
}

// ============================================
// Pipeline Executor
// ============================================

export interface ExecutorConfig {
  ttsService: TTSService;
  storagePath: string;
}

interface ExecuteEventOpts {
  generateAudio?: boolean;
  generateVideo?: boolean;
  outputPath?: string;
  lang?: Lang;
  outputs?: string[];
}

export class PipelineExecutor {
  private ttsService: TTSService;
  private storagePath: string;

  constructor(config: ExecutorConfig) {
    this.ttsService = config.ttsService;
    this.storagePath = config.storagePath;
  }

  async *execute(
    pipelineId: string,
    options: ExecuteEventOpts,
  ): AsyncGenerator<{
    status: PipelineStatus;
    currentScene: string;
    progressPercent: number;
    audioResult?: AudioResult;
    videoPath?: string;
    errorMessage?: string;
  }> {
    let pipeline: Pipeline;
    try {
      pipeline = pipelineStore.getOrThrow(pipelineId);
    } catch {
      yield {
        status: PipelineStatus.FAILED,
        currentScene: '',
        progressPercent: 0,
        errorMessage: `Pipeline ${pipelineId} not found`,
      };
      return;
    }

    const lang: Lang = options.lang ?? pipeline.metadata.primaryLang;
    const outputs = normalizeOutputs(options.outputs);
    const wantMp4 = outputs.includes('mp4');
    const wantManifest = outputs.includes('manifest');
    const wantSnapshot = outputs.includes('snapshot');
    const opts = {
      generateAudio: (options.generateAudio ?? true) && wantMp4,
      generateVideo: (options.generateVideo ?? true) && wantMp4,
      outputPath:
        options.outputPath ??
        path.join(this.storagePath, 'pipelines', pipelineId, `video.${lang}.mp4`),
    };

    const totalScenes = pipeline.scenes.length;
    let completed = 0;

    if (opts.generateAudio) {
      yield {
        status: PipelineStatus.GENERATING_AUDIO,
        currentScene: '',
        progressPercent: 0,
      };

      for (const scene of pipeline.scenes) {
        const state = pipelineStore.get(pipelineId);
        if (state?.cancelled) {
          yield {
            status: PipelineStatus.CANCELLED,
            currentScene: scene.name,
            progressPercent: Math.round((completed / totalScenes) * 50),
          };
          return;
        }

        // Pick the audio task for the requested lang, fall back to primary
        const task: AudioTask | undefined =
          scene.audioTasks[lang] ?? scene.audioTasks[pipeline.metadata.primaryLang];

        if (!task) {
          completed++;
          continue;
        }

        yield {
          status: PipelineStatus.GENERATING_AUDIO,
          currentScene: scene.name,
          progressPercent: Math.round((completed / totalScenes) * 50),
        };

        try {
          const audioResult = await this.ttsService.generateAudio({
            text: task.text,
            voiceId: task.voice.voice_id,
            speed: task.voice.speed,
            vol: task.voice.vol,
            pitch: task.voice.pitch,
            emotion: task.voice.emotion,
            outputPath: path.join(
              this.storagePath,
              'pipelines',
              pipelineId,
              'audio',
              task.lang,
              `${scene.name}.mp3`,
            ),
          });

          const augmented: AudioResult = { ...audioResult, lang: task.lang } as AudioResult;
          pipelineStore.setAudioResult(pipelineId, augmented);

          // Update materials.audio so renderer can find the file via audioRef "<scene>:<lang>"
          pipeline.materials.audio[`${scene.name}:${task.lang}`] = audioResult.audioPath;

          completed++;
          yield {
            status: PipelineStatus.GENERATING_AUDIO,
            currentScene: scene.name,
            progressPercent: Math.round((completed / totalScenes) * 50),
            audioResult: augmented,
          };
        } catch (error) {
          completed++;
          yield {
            status: PipelineStatus.GENERATING_AUDIO,
            currentScene: scene.name,
            progressPercent: Math.round((completed / totalScenes) * 50),
            errorMessage: `Audio generation failed for ${scene.name}: ${
              error instanceof Error ? error.message : 'unknown'
            }`,
          };
        }
      }
    }

    if (opts.generateVideo) {
      yield {
        status: PipelineStatus.RENDERING,
        currentScene: '',
        progressPercent: 50,
      };

      try {
        const result = await renderPipeline({
          pipeline,
          lang,
          outputPath: opts.outputPath,
          onProgress: (p) => {
            pipelineStore.updateStatus(
              pipelineId,
              PipelineStatus.RENDERING,
              50 + Math.round(p / 2),
              '',
            );
          },
        });

        pipelineStore.setVideoPath(pipelineId, result.videoPath);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'rendering failed';
        pipelineStore.setError(pipelineId, msg);
        yield {
          status: PipelineStatus.FAILED,
          currentScene: '',
          progressPercent: 100,
          errorMessage: msg,
        };
        return;
      }
    }

    // Manifest / snapshot sidecars (always cheap, run after MP4 if requested)
    if (wantManifest) {
      const p = writeManifest(pipeline, opts.outputPath);
      console.log(`[manifest] ${p}`);
    }
    if (wantSnapshot) {
      const p = writeSnapshot(pipeline, opts.outputPath);
      console.log(`[snapshot] ${p}`);
    }

    pipelineStore.updateStatus(pipelineId, PipelineStatus.COMPLETED, 100, '');
    yield {
      status: PipelineStatus.COMPLETED,
      currentScene: '',
      progressPercent: 100,
      videoPath: wantMp4 ? opts.outputPath : '',
    };
  }

  cancel(pipelineId: string): boolean {
    const state = pipelineStore.get(pipelineId);
    if (!state) return false;
    return pipelineStore.cancel(pipelineId);
  }

  getState(pipelineId: string): PipelineState | null {
    return pipelineStore.get(pipelineId) || null;
  }
}

// ============================================
// gRPC handlers
// ============================================

let globalExecutor: PipelineExecutor | null = null;

export function setGlobalExecutor(executor: PipelineExecutor): void {
  globalExecutor = executor;
}

export async function executePipeline(
  call: grpc.ServerWritableStream<any, any>,
): Promise<void> {
  if (!globalExecutor) {
    call.write({
      pipelineId: call.request.pipelineId,
      status: PipelineStatus.FAILED,
      currentScene: '',
      progressPercent: 0,
      errorMessage: 'Executor not initialized',
    });
    call.end();
    return;
  }

  const pipelineId = call.request.pipelineId;
  const options = call.request.options ?? {};

  const opts: ExecuteEventOpts = {
    generateAudio: options.generateAudio ?? true,
    generateVideo: options.generateVideo ?? true,
    outputPath: options.outputPath || undefined,
    lang: (options.lang as Lang) || undefined,
    outputs: Array.isArray(options.outputs) ? options.outputs : undefined,
  };

  try {
    for await (const event of globalExecutor.execute(pipelineId, opts)) {
      call.write({
        pipelineId,
        status: event.status,
        currentScene: event.currentScene,
        progressPercent: event.progressPercent,
        audioResult: event.audioResult
          ? {
              sceneName: event.audioResult.sceneName,
              lang: (event.audioResult as any).lang || '',
              audioPath: event.audioResult.audioPath,
              audioLengthMs: event.audioResult.audioLengthMs,
            }
          : null,
        videoPath: event.videoPath || '',
        errorMessage: event.errorMessage || '',
      });
    }
  } catch (error) {
    call.write({
      pipelineId,
      status: PipelineStatus.FAILED,
      currentScene: '',
      progressPercent: 0,
      errorMessage: error instanceof Error ? error.message : 'Execution failed',
    });
  }
  call.end();
}

export async function cancelPipeline(
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
): Promise<void> {
  if (!globalExecutor) {
    return callback({ code: grpc.status.INTERNAL, message: 'Executor not initialized' });
  }
  const pipelineId = call.request.pipelineId;
  if (!pipelineId) {
    return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'pipeline_id is required' });
  }
  const success = globalExecutor.cancel(pipelineId);
  callback(null, {
    success,
    message: success ? 'Pipeline cancelled' : 'Pipeline not found or already terminal',
  });
}

// ============================================
// RenderFrame (single-frame preview)
// ============================================

export async function handleRenderFrame(
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
): Promise<void> {
  try {
    const req = call.request;
    const pipelineId = req.pipelineId;
    if (!pipelineId) {
      return callback({ code: grpc.status.INVALID_ARGUMENT, message: 'pipeline_id is required' });
    }
    const stored = pipelineStore.get(pipelineId);
    if (!stored) {
      return callback({ code: grpc.status.NOT_FOUND, message: `Pipeline ${pipelineId} not found` });
    }

    const format = (req.format || 'png') as 'png' | 'jpeg';
    const lang = (req.lang as Lang) || undefined;
    const frame = req.frame || 0;

    const buf = await renderStill({
      pipeline: stored,
      frame,
      format,
      lang,
    });

    callback(null, { imageData: buf, format });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error instanceof Error ? error.message : 'RenderFrame failed',
    });
  }
}

// ============================================
// RenderScene (single-scene MP4)
// ============================================

export async function handleRenderScene(
  call: grpc.ServerWritableStream<any, any>,
): Promise<void> {
  const req = call.request;
  const pipelineId: string = req.pipelineId;
  const sceneName: string = req.sceneName;
  const outputPath: string = req.outputPath;
  const lang = (req.lang as Lang) || undefined;

  const fail = (msg: string) => {
    call.write({
      status: PipelineStatus.FAILED,
      progressPercent: 0,
      videoPath: '',
      errorMessage: msg,
    });
    call.end();
  };

  if (!pipelineId || !sceneName || !outputPath) {
    return fail('pipeline_id, scene_name, output_path are required');
  }

  const stored = pipelineStore.get(pipelineId);
  if (!stored) return fail(`Pipeline ${pipelineId} not found`);

  const scene = stored.scenes.find((s) => s.name === sceneName);
  if (!scene) return fail(`Scene '${sceneName}' not found in pipeline`);

  // Build a sliced pipeline containing only this scene at frame 0.
  const sliced: Pipeline = {
    ...stored,
    pipelineId: `${stored.pipelineId}:${sceneName}`,
    scenes: [{ ...scene, startFrame: 0 }],
    transitions: [],
    totalFrames: scene.durationFrames,
  };

  call.write({
    status: PipelineStatus.RENDERING,
    progressPercent: 0,
    videoPath: '',
    errorMessage: '',
  });

  try {
    const result = await renderPipeline({
      pipeline: sliced,
      lang,
      outputPath,
    });
    call.write({
      status: PipelineStatus.COMPLETED,
      progressPercent: 100,
      videoPath: result.videoPath,
      errorMessage: '',
    });
  } catch (error) {
    call.write({
      status: PipelineStatus.FAILED,
      progressPercent: 0,
      videoPath: '',
      errorMessage: error instanceof Error ? error.message : 'render failed',
    });
  }
  call.end();
}
