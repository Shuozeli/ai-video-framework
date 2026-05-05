import type { Pipeline as DSLPipeline, Workflow } from '@ai-video/dsl';
import { PipelineStatus } from '../types';
import type { PipelineState, AudioResult } from '../types';

// ============================================
// In-memory pipeline store
// ============================================

export interface StoredPipeline extends DSLPipeline {
  status: PipelineStatus;
  progressPercent: number;
  currentScene: string;
  audioResults: Map<string, AudioResult>;
  videoPath: string | null;
  errorMessage: string | null;
  createdAt: number;
  cancelled: boolean;
}

class PipelineStore extends Map<string, StoredPipeline> {
  getOrThrow(pipelineId: string): StoredPipeline {
    const pipeline = this.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }
    return pipeline;
  }

  updateStatus(
    pipelineId: string,
    status: PipelineStatus,
    progressPercent?: number,
    currentScene?: string
  ): void {
    const pipeline = this.getOrThrow(pipelineId);
    pipeline.status = status;
    if (progressPercent !== undefined) {
      pipeline.progressPercent = progressPercent;
    }
    if (currentScene !== undefined) {
      pipeline.currentScene = currentScene;
    }
  }

  setAudioResult(pipelineId: string, result: AudioResult): void {
    const pipeline = this.getOrThrow(pipelineId);
    const key = result.lang ? `${result.sceneName}:${result.lang}` : result.sceneName;
    pipeline.audioResults.set(key, result);
  }

  setVideoPath(pipelineId: string, videoPath: string): void {
    const pipeline = this.getOrThrow(pipelineId);
    pipeline.videoPath = videoPath;
  }

  setError(pipelineId: string, errorMessage: string): void {
    const pipeline = this.getOrThrow(pipelineId);
    pipeline.status = PipelineStatus.FAILED;
    pipeline.errorMessage = errorMessage;
  }

  cancel(pipelineId: string): boolean {
    const pipeline = this.getOrThrow(pipelineId);
    if (
      pipeline.status === PipelineStatus.COMPLETED ||
      pipeline.status === PipelineStatus.FAILED
    ) {
      return false;
    }
    pipeline.status = PipelineStatus.CANCELLED;
    pipeline.cancelled = true;
    return true;
  }
}

export const pipelineStore = new PipelineStore();
