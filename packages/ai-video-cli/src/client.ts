import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Proto file lives in ../proto/ relative to dist/ at runtime, and ../../proto/ from src/.
function resolveProtoPath(): string {
  const candidates = [
    path.resolve(__dirname, '../proto/video_pipeline.proto'),     // dist runtime
    path.resolve(__dirname, '../../proto/video_pipeline.proto'),  // src dev
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

const PROTO_PATH = resolveProtoPath();

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const VideoPipelineService = protoDescriptor.video_pipeline.VideoPipeline;

// ============================================
// Promisified client wrapper
// ============================================

export interface ClientConfig {
  address?: string;
  credentials?: grpc.ChannelCredentials;
}

export interface VideoPipelineClient {
  raw: any;
  compileWorkflow(request: any): Promise<any>;
  getPipeline(request: any): Promise<any>;
  listPipelines(request?: any): Promise<any>;
  cancelPipeline(request: any): Promise<any>;
  executePipeline(request: any): grpc.ClientReadableStream<any>;
  uploadMaterial(): { stream: grpc.ClientWritableStream<any>; response: Promise<any> };
  listMaterials(request: any): Promise<any>;
  getMaterial(request: any): grpc.ClientReadableStream<any>;
  listTemplates(request?: any): Promise<any>;
  renderFrame(request: any): Promise<any>;
  renderScene(request: any): grpc.ClientReadableStream<any>;
  close(): void;
}

function unary(client: any, methodName: string) {
  return (request: any) =>
    new Promise<any>((resolve, reject) => {
      client[methodName](request, (err: grpc.ServiceError | null, response: any) => {
        if (err) reject(err);
        else resolve(response);
      });
    });
}

export function createClient(config: ClientConfig = {}): VideoPipelineClient {
  const address = config.address || 'localhost:50051';
  const credentials = config.credentials || grpc.credentials.createInsecure();
  const client = new VideoPipelineService(address, credentials);

  return {
    raw: client,
    compileWorkflow: unary(client, 'CompileWorkflow'),
    getPipeline: unary(client, 'GetPipeline'),
    listPipelines: (req: any = {}) => unary(client, 'ListPipelines')(req),
    cancelPipeline: unary(client, 'CancelPipeline'),
    executePipeline: (req: any) => client.ExecutePipeline(req),
    uploadMaterial: () => {
      let resolveFn: (v: any) => void;
      let rejectFn: (e: any) => void;
      const response = new Promise<any>((res, rej) => {
        resolveFn = res;
        rejectFn = rej;
      });
      const stream = client.UploadMaterial((err: grpc.ServiceError | null, resp: any) => {
        if (err) rejectFn(err);
        else resolveFn(resp);
      });
      return { stream, response };
    },
    listMaterials: unary(client, 'ListMaterials'),
    getMaterial: (req: any) => client.GetMaterial(req),
    listTemplates: (req: any = {}) => unary(client, 'ListTemplates')(req),
    renderFrame: unary(client, 'RenderFrame'),
    renderScene: (req: any) => client.RenderScene(req),
    close: () => client.close(),
  };
}

// ============================================
// Status helpers
// ============================================

export const PipelineStatus = {
  PENDING: 'PENDING',
  COMPILING: 'COMPILING',
  GENERATING_AUDIO: 'GENERATING_AUDIO',
  RENDERING: 'RENDERING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type PipelineStatusName = keyof typeof PipelineStatus;

export function pipelineStatusString(status: string | number): string {
  if (typeof status === 'string') return status;
  const names = ['PENDING', 'COMPILING', 'GENERATING_AUDIO', 'RENDERING', 'COMPLETED', 'FAILED', 'CANCELLED'];
  return names[status] ?? `UNKNOWN(${status})`;
}

// ============================================
// Workflow → proto WorkflowDefinition
// ============================================

export function workflowToProto(workflow: any): any {
  const md = workflow.metadata ?? {};
  const mats = workflow.materials ?? { data: {}, images: {}, audio: {} };

  return {
    metadata: {
      title: md.title || '',
      durationSeconds: md.duration ?? 0,
      fps: md.fps ?? 30,
      resolution: md.resolution ?? { width: 1920, height: 1080 },
      format: md.format ?? 'mp4',
      aspectRatio: md.aspectRatio ?? '16:9',
      primaryLang: md.primaryLang ?? 'zh',
    },
    materials: {
      dataJson: Object.fromEntries(
        Object.entries(mats.data ?? {}).map(([k, v]) => [k, JSON.stringify(v)]),
      ),
      images: { ...(mats.images ?? {}) },
      audio: { ...(mats.audio ?? {}) },
    },
    scenes: (workflow.scenes ?? []).map((s: any) => ({
      name: s.name,
      durationSeconds: s.duration ?? 0,
      audio: s.audio
        ? {
            text: s.audio.text ?? '',
            audioRef: s.audio.audioRef ?? '',
            voice: s.audio.voice
              ? {
                  voiceId: s.audio.voice.voice_id ?? 'male-qn-qingse',
                  speed: s.audio.voice.speed ?? 1,
                  vol: s.audio.voice.vol ?? 1,
                  pitch: s.audio.voice.pitch ?? 0,
                  emotion: s.audio.voice.emotion ?? 'calm',
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
                            voiceId: alt.voice.voice_id ?? 'male-qn-qingse',
                            speed: alt.voice.speed ?? 1,
                            vol: alt.voice.vol ?? 1,
                            pitch: alt.voice.pitch ?? 0,
                            emotion: alt.voice.emotion ?? 'calm',
                          }
                        : undefined,
                    },
                  ]),
                )
              : {},
          }
        : undefined,
      background: s.background ?? undefined,
      layers: (s.layers ?? []).map((l: any) => ({
        id: l.id ?? '',
        template: l.type,
        fromFrame: l.from ?? 0,
        durationFrames: l.durationFrames ?? 0,
        zIndex: l.zIndex ?? 0,
        enter: l.enter ?? undefined,
        exit: l.exit ?? undefined,
        propsJson: JSON.stringify(l.props ?? {}),
      })),
    })),
    transitions: workflow.transitions ?? [],
  };
}
