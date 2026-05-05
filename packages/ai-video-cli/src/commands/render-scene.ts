import { Command } from 'commander';
import { createClient, pipelineStatusString } from '../client.js';

export function createRenderSceneCommand(): Command {
  const command = new Command('render-scene');

  command
    .description('Render a single scene from a pipeline (no TTS, fast preview)')
    .argument('<pipeline_id>')
    .argument('<scene_name>')
    .requiredOption('-o, --output <path>', 'Output MP4 path')
    .option('-l, --lang <lang>', 'zh / en')
    .option('-a, --address <address>', 'gRPC server address', 'localhost:50051')
    .action(async (
      pipelineId: string,
      sceneName: string,
      options: { output: string; lang?: string; address: string },
    ) => {
      const client = createClient({ address: options.address });
      const stream = client.renderScene({
        pipelineId,
        sceneName,
        outputPath: options.output,
        lang: options.lang ?? '',
      });

      stream.on('data', (response: any) => {
        const status = response.status;
        process.stdout.write(`\r[${pipelineStatusString(status)}] ${response.progressPercent}%`);
        if (status === 'COMPLETED') {
          console.log(`\n✓ Saved → ${response.videoPath}`);
          client.close();
          process.exit(0);
        }
        if (status === 'FAILED') {
          console.error(`\n✗ ${response.errorMessage}`);
          client.close();
          process.exit(1);
        }
      });
      stream.on('error', (err: Error) => {
        console.error(`\nError: ${err.message}`);
        client.close();
        process.exit(1);
      });
      stream.on('end', () => {
        client.close();
      });
    });

  return command;
}
