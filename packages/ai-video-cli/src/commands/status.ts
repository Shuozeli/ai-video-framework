import { Command } from 'commander';
import { createClient } from '../client.js';

export function createStatusCommand(): Command {
  const command = new Command('status');

  command
    .description('Get pipeline details')
    .argument('<pipeline_id>')
    .option('-a, --address <address>', 'gRPC server address', 'localhost:50051')
    .action(async (pipelineId: string, options: { address: string }) => {
      const client = createClient({ address: options.address });
      try {
        const response = await client.getPipeline({ pipelineId });
        const p = response.pipeline;
        console.log('Pipeline:');
        console.log(`  id:           ${p.pipelineId}`);
        console.log(`  title:        ${p.metadata.title}`);
        console.log(`  scenes:       ${p.scenes.length}`);
        console.log(`  total_frames: ${p.totalFrames}`);
        console.log(`  fps:          ${p.metadata.fps}`);
        console.log(`  primary_lang: ${p.metadata.primaryLang}`);
        if (p.metadata.resolution) {
          console.log(`  resolution:   ${p.metadata.resolution.width}x${p.metadata.resolution.height}`);
        }
        if (p.transitions?.length) {
          console.log(`  transitions:  ${p.transitions.length}`);
        }
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  return command;
}
