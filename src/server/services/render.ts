import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';
import type { Pipeline, Lang } from '@ai-video/dsl';

// ============================================
// Static Remotion project location
// ============================================

// Path to the @ai-video/renderer package. Override with RENDERER_PROJECT_DIR.
const DEFAULT_RENDERER_DIR = path.resolve(
  __dirname,
  '../../../../packages/ai-video-renderer',
);
const RENDERER_PROJECT_DIR =
  process.env.RENDERER_PROJECT_DIR || DEFAULT_RENDERER_DIR;
const RENDERER_ENTRY = path.join(RENDERER_PROJECT_DIR, 'src', 'index.ts');
const COMPOSITION_ID = 'Video';

// ============================================
// Public types
// ============================================

export interface RenderConfig {
  pipeline: Pipeline;
  lang?: Lang;
  outputPath: string;
  onProgress?: (progress: number) => void;
}

export interface RenderResult {
  videoPath: string;
  totalFrames: number;
}

export interface StillConfig {
  pipeline: Pipeline;
  frame: number;
  format?: 'png' | 'jpeg';
  lang?: Lang;
}

// ============================================
// Helpers
// ============================================

function writePropsFile(pipeline: Pipeline, lang: Lang | undefined): string {
  const dir = path.join(os.tmpdir(), 'ai-video-renderer-props');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${pipeline.pipelineId}-${lang ?? pipeline.metadata.primaryLang}.json`);
  fs.writeFileSync(file, JSON.stringify({ ...pipeline, _lang: lang ?? pipeline.metadata.primaryLang }));
  return file;
}

function codecForFormat(format: 'mp4' | 'webm'): string {
  return format === 'webm' ? 'vp9' : 'h264';
}

function runRemotion(args: string[], onProgress?: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['remotion', ...args], {
      cwd: RENDERER_PROJECT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const progressRegex = /(\d{1,3})\s*%/;

    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      process.stdout.write(text);
      if (onProgress) {
        const m = text.match(progressRegex);
        if (m) onProgress(parseInt(m[1], 10));
      }
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`remotion exited with code ${code}`));
    });
  });
}

// ============================================
// Render full pipeline → MP4
// ============================================

export async function renderPipeline(cfg: RenderConfig): Promise<RenderResult> {
  const lang = cfg.lang ?? cfg.pipeline.metadata.primaryLang;
  const propsFile = writePropsFile(cfg.pipeline, lang);
  const codec = codecForFormat(cfg.pipeline.metadata.format);

  fs.mkdirSync(path.dirname(cfg.outputPath), { recursive: true });

  await runRemotion(
    [
      'render',
      RENDERER_ENTRY,
      COMPOSITION_ID,
      cfg.outputPath,
      '--props',
      propsFile,
      '--codec',
      codec,
      '--concurrency',
      String(os.cpus().length),
      '--log',
      'error',
    ],
    cfg.onProgress,
  );

  return { videoPath: cfg.outputPath, totalFrames: cfg.pipeline.totalFrames };
}

// ============================================
// Render single frame → image bytes
// ============================================

export async function renderStill(cfg: StillConfig): Promise<Buffer> {
  const lang = cfg.lang ?? cfg.pipeline.metadata.primaryLang;
  const format = cfg.format ?? 'png';
  const propsFile = writePropsFile(cfg.pipeline, lang);
  const out = path.join(
    os.tmpdir(),
    `ai-video-still-${cfg.pipeline.pipelineId}-${cfg.frame}.${format}`,
  );

  await runRemotion([
    'still',
    RENDERER_ENTRY,
    COMPOSITION_ID,
    out,
    '--frame',
    String(cfg.frame),
    '--props',
    propsFile,
    '--image-format',
    format,
    '--log',
    'error',
  ]);

  const buf = fs.readFileSync(out);
  fs.unlinkSync(out);
  return buf;
}

// ============================================
// Health
// ============================================

export function isRendererAvailable(): boolean {
  try {
    return fs.existsSync(RENDERER_ENTRY);
  } catch {
    return false;
  }
}
