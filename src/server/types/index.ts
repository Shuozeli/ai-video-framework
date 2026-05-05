// ============================================
// Server-side type definitions
// ============================================

import type { Pipeline as DSLPipeline } from '@ai-video/dsl';

// Re-export Pipeline from DSL
export type { Pipeline as DSLPipeline, Workflow } from '@ai-video/dsl';

// Pipeline status enum
export enum PipelineStatus {
  PENDING = 0,
  COMPILING = 1,
  GENERATING_AUDIO = 2,
  RENDERING = 3,
  COMPLETED = 4,
  FAILED = 5,
  CANCELLED = 6,
}

// Pipeline execution state
export interface PipelineState {
  pipelineId: string;
  status: PipelineStatus;
  progressPercent: number;
  currentScene: string;
  audioResults: Map<string, AudioResult>;
  videoPath: string | null;
  errorMessage: string | null;
  createdAt: number;
  cancelled: boolean;
}

export interface AudioResult {
  sceneName: string;
  lang?: 'zh' | 'en';
  audioPath: string;
  audioLengthMs: number;
}

// Material types
export type MaterialType = 'audio' | 'image' | 'video' | 'data';

export interface MaterialInfo {
  materialId: string;
  name: string;
  materialType: MaterialType;
  projectName: string;
  sizeBytes: number;
  createdAt: number;
  path: string;
}

// TTS Configuration
export interface TTSConfig {
  apiKey: string;
  baseUrl: string;
}

// Server configuration
export interface ServerConfig {
  host: string;
  port: number;
  storagePath: string;
  ttsConfig: TTSConfig;
}

// Execution options
export interface ExecuteOptions {
  generateAudio: boolean;
  generateVideo: boolean;
  outputPath: string;
  lang?: 'zh' | 'en';
}
