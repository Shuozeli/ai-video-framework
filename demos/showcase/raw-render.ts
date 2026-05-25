/**
 * Raw gRPC ExecutePipeline driver — prints every server event verbatim, so
 * we can see TTS errors that the production render CLI silently swallows.
 */
import { createClient } from '../../packages/ai-video-cli/src/client';

const address = process.argv[2] ?? '100.95.116.72:50051';
const pipelineId = process.argv[3];
const outputPath = process.argv[4];

if (!pipelineId || !outputPath) {
  console.error('Usage: raw-render.ts <address> <pipelineId> <outputPath>');
  process.exit(1);
}

const client = createClient({ address });
const stream = client.executePipeline({
  pipelineId,
  options: { generateAudio: true, generateVideo: true, outputPath, outputs: ['mp4'] },
});

stream.on('data', (e: any) => {
  const parts = [
    e.status,
    e.currentScene ? `scene=${e.currentScene}` : null,
    e.progressPercent !== undefined ? `progress=${e.progressPercent}%` : null,
    e.errorMessage ? `ERR=${e.errorMessage}` : null,
    e.videoPath ? `video=${e.videoPath}` : null,
    e.audioResult ? `audio=lang:${e.audioResult.lang} len:${e.audioResult.audioLengthMs}ms` : null,
  ].filter(Boolean);
  console.log(parts.join(' '));
});

stream.on('error', (err: Error) => {
  console.error(`STREAM ERROR: ${err.message}`);
  process.exit(1);
});

stream.on('end', () => {
  client.close();
});
