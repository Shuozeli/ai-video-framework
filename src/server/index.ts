import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

import {
  compileWorkflow,
  getPipeline,
  listPipelines,
  handleListTemplates,
} from './services/compiler';
import {
  executePipeline,
  cancelPipeline,
  setGlobalExecutor,
  PipelineExecutor,
  handleRenderFrame,
  handleRenderScene,
} from './services/executor';
import { TTSService } from './services/tts';
import {
  setStoragePath,
  createUploadContext,
  finalizeUpload,
  listMaterials,
  streamMaterial,
  getMaterialInfo,
} from './services/material';

// ============================================
// Configuration
// ============================================

const PROTO_PATH = path.resolve(__dirname, '../proto/video_pipeline.proto');
const SERVER_HOST = process.env.TAILSCALE_IP || process.env.GRPC_HOST || '0.0.0.0';
const SERVER_PORT = parseInt(process.env.GRPC_PORT || '50051', 10);
const STORAGE_PATH = process.env.STORAGE_PATH || path.resolve(process.cwd(), 'storage');
const TTS_API_KEY = process.env.MINIMAX_API_KEY || '';
const TTS_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io';

// ============================================
// Proto loading (proto-loader → plain JS objects with camelCased fields)
// ============================================

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const videoPipelineProto = protoDescriptor.video_pipeline;

// ============================================
// Material upload (client streaming)
// ============================================

function handleUploadMaterial(
  call: grpc.ServerReadableStream<any, any>,
  callback: grpc.sendUnaryData<any>,
): void {
  const context = createUploadContext();

  call.on('data', (request: any) => {
    if (request.metadata) {
      context.materialId = crypto.randomUUID();
      context.metadata = {
        name: request.metadata.name || 'unnamed',
        materialType: (request.metadata.materialType || 'video') as
          | 'audio'
          | 'image'
          | 'video'
          | 'data',
        projectName: request.metadata.projectName || 'default',
      };
    }
    if (request.chunk && request.chunk.length > 0) {
      context.chunks.push(Buffer.from(request.chunk));
    }
  });

  call.on('end', () => {
    const result = finalizeUpload(context);
    if (!result) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'No material data received',
      });
    }
    callback(null, { materialId: result.materialId, path: result.path });
  });

  call.on('error', (err) => {
    console.error('UploadMaterial stream error:', err);
  });
}

async function handleListMaterials(
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
): Promise<void> {
  try {
    const materials = listMaterials({
      projectName: call.request.projectName || undefined,
      materialType: (call.request.materialType as any) || undefined,
    });
    callback(null, {
      materials: materials.map((m) => ({
        materialId: m.materialId,
        name: m.name,
        materialType: m.materialType,
        sizeBytes: m.sizeBytes,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error instanceof Error ? error.message : 'Failed to list materials',
    });
  }
}

async function handleGetMaterial(call: grpc.ServerWritableStream<any, any>): Promise<void> {
  try {
    const materialId = call.request.materialId;
    if (!materialId) {
      call.write({ materialId: '', chunk: Buffer.alloc(0), isLast: true });
      call.end();
      return;
    }
    const info = getMaterialInfo(materialId);
    if (!info) {
      call.write({ materialId, chunk: Buffer.alloc(0), isLast: true });
      call.end();
      return;
    }
    for (const chunk of streamMaterial({ materialId })) {
      call.write({ materialId: chunk.materialId, chunk: chunk.chunk, isLast: chunk.isLast });
    }
    call.end();
  } catch (error) {
    console.error('GetMaterial error:', error);
    call.end();
  }
}

// ============================================
// Service handlers
// ============================================

const serviceHandlers = {
  CompileWorkflow: compileWorkflow,
  GetPipeline: getPipeline,
  ListPipelines: listPipelines,

  ExecutePipeline: executePipeline,
  CancelPipeline: cancelPipeline,

  UploadMaterial: handleUploadMaterial,
  ListMaterials: handleListMaterials,
  GetMaterial: handleGetMaterial,

  ListTemplates: handleListTemplates,
  RenderFrame: handleRenderFrame,
  RenderScene: handleRenderScene,
};

// ============================================
// Main
// ============================================

function createServer(): grpc.Server {
  const server = new grpc.Server();
  server.addService(videoPipelineProto.VideoPipeline.service, serviceHandlers);
  return server;
}

async function main(): Promise<void> {
  setStoragePath(STORAGE_PATH);
  const storageDir = path.join(STORAGE_PATH, 'materials');
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });

  const ttsService = new TTSService({ apiKey: TTS_API_KEY, baseUrl: TTS_BASE_URL });
  const executor = new PipelineExecutor({ ttsService, storagePath: STORAGE_PATH });
  setGlobalExecutor(executor);

  const server = createServer();
  const bindAddress = `${SERVER_HOST}:${SERVER_PORT}`;

  server.bindAsync(bindAddress, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      console.error('Failed to bind server:', err);
      process.exit(1);
    }
    console.log(`AI Video Framework gRPC Server`);
    console.log(`================================`);
    console.log(`Listening on:  ${bindAddress}`);
    console.log(`Storage path:  ${STORAGE_PATH}`);
    console.log(`TTS API:       ${TTS_BASE_URL}`);
    console.log(`Proto:         ${PROTO_PATH}`);
  });

  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.tryShutdown(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    server.tryShutdown(() => process.exit(0));
  });
}

main().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

export { createServer, main };
