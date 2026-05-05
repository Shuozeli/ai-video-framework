import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { MaterialInfo, MaterialType } from '../types';

// ============================================
// Material Bank Service
// ============================================

const CHUNK_SIZE = 64 * 1024; // 64KB chunks

export interface StoredMaterial extends MaterialInfo {
  data: Buffer;
}

// In-memory material store (in production, this would be a database)
const materialStore = new Map<string, StoredMaterial>();

// Storage paths
let storagePath = path.resolve(process.cwd(), 'storage');

export function setStoragePath(p: string): void {
  storagePath = p;
}

export function getStoragePath(): string {
  return storagePath;
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function getMaterialDir(materialType: MaterialType): string {
  const dir = path.join(storagePath, 'materials', materialType);
  ensureDir(dir);
  return dir;
}

function generateMaterialId(): string {
  return crypto.randomUUID();
}

// ============================================
// UploadMaterial Implementation (server-side streaming)
// ============================================

export interface UploadContext {
  materialId: string | null;
  metadata: {
    name: string;
    materialType: MaterialType;
    projectName: string;
  } | null;
  chunks: Buffer[];
}

export function createUploadContext(): UploadContext {
  return {
    materialId: null,
    metadata: null,
    chunks: [],
  };
}

export function handleUploadChunk(
  context: UploadContext,
  request: any
): { needsMore: boolean; error?: string } {
  // Handle metadata
  const metadata = request.getMetadata();
  if (metadata) {
    context.materialId = generateMaterialId();
    context.metadata = {
      name: metadata.getName() || 'unnamed',
      materialType: (metadata.getMaterialType() || 'video') as MaterialType,
      projectName: metadata.getProjectName() || 'default',
    };
  }

  // Handle data chunk
  const chunk = request.getChunk();
  if (chunk && chunk.length > 0) {
    context.chunks.push(Buffer.from(chunk));
  }

  // Check if this is the last chunk (empty chunk after all data sent)
  // In our proto, we use is_last in GetMaterial response, for upload we detect end by chunk being empty
  // Actually let's check if there's a flag - we'll use a different approach
  // The last chunk is followed by a null/empty request

  return { needsMore: true };
}

export function finalizeUpload(context: UploadContext): { materialId: string; path: string } | null {
  if (!context.materialId || !context.metadata || context.chunks.length === 0) {
    return null;
  }

  const { materialType, projectName, name } = context.metadata;
  const data = Buffer.concat(context.chunks);

  // Determine file extension
  const ext = getExtensionForType(materialType);
  const filename = `${context.materialId}${ext}`;
  const materialPath = path.join(getMaterialDir(materialType), filename);

  // Write file
  fs.writeFileSync(materialPath, data);

  // Store metadata
  const material: StoredMaterial = {
    materialId: context.materialId,
    name,
    materialType,
    projectName,
    sizeBytes: data.length,
    createdAt: Date.now(),
    path: materialPath,
    data, // Keep in memory for streaming retrieval
  };
  materialStore.set(context.materialId, material);

  return {
    materialId: context.materialId,
    path: materialPath,
  };
}

function getExtensionForType(type: MaterialType): string {
  switch (type) {
    case 'audio':
      return '.mp3';
    case 'image':
      return '.png';
    case 'video':
      return '.mp4';
    default:
      return '.bin';
  }
}

// ============================================
// ListMaterials Implementation
// ============================================

export interface ListMaterialsOptions {
  projectName?: string;
  materialType?: MaterialType;
}

export function listMaterials(options: ListMaterialsOptions): MaterialInfo[] {
  const results: MaterialInfo[] = [];

  materialStore.forEach((material) => {
    if (options.projectName && material.projectName !== options.projectName) {
      return;
    }
    if (options.materialType && material.materialType !== options.materialType) {
      return;
    }

    results.push({
      materialId: material.materialId,
      name: material.name,
      materialType: material.materialType,
      projectName: material.projectName,
      sizeBytes: material.sizeBytes,
      createdAt: material.createdAt,
      path: material.path,
    });
  });

  // Sort by creation time (newest first)
  results.sort((a, b) => b.createdAt - a.createdAt);

  return results;
}

// ============================================
// GetMaterial Implementation (streaming)
// ============================================

export interface GetMaterialOptions {
  materialId: string;
}

export function* streamMaterial(
  options: GetMaterialOptions
): Generator<{ materialId: string; chunk: Buffer; isLast: boolean }, void, unknown> {
  const material = materialStore.get(options.materialId);

  if (!material) {
    throw new Error(`Material ${options.materialId} not found`);
  }

  // Stream in chunks
  const data = material.data;
  let offset = 0;

  while (offset < data.length) {
    const chunkSize = Math.min(CHUNK_SIZE, data.length - offset);
    const chunk = data.slice(offset, offset + chunkSize);
    offset += chunkSize;

    yield {
      materialId: material.materialId,
      chunk,
      isLast: offset >= data.length,
    };
  }
}

export function getMaterialInfo(materialId: string): MaterialInfo | null {
  const material = materialStore.get(materialId);
  if (!material) {
    return null;
  }

  return {
    materialId: material.materialId,
    name: material.name,
    materialType: material.materialType,
    projectName: material.projectName,
    sizeBytes: material.sizeBytes,
    createdAt: material.createdAt,
    path: material.path,
  };
}

// ============================================
// DeleteMaterial
// ============================================

export function deleteMaterial(materialId: string): boolean {
  const material = materialStore.get(materialId);
  if (!material) {
    return false;
  }

  // Delete file
  if (fs.existsSync(material.path)) {
    fs.unlinkSync(material.path);
  }

  // Remove from store
  materialStore.delete(materialId);
  return true;
}
