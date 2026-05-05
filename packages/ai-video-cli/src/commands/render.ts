import { Command } from 'commander';
import { createClient, pipelineStatusString } from '../client.js';

export function createRenderCommand(): Command {
  const command = new Command('render');

  command
    .description('Execute a pipeline to render video/audio')
    .argument('<pipeline_id>', 'The pipeline ID to render')
    .option('-a, --audio-only', 'Only generate audio')
    .option('-v, --video-only', 'Only generate video')
    .option('-o, --output <path>', 'Output path for the result')
    .option('-l, --lang <lang>', 'Language (zh / en) — defaults to pipeline.metadata.primaryLang')
    .option('--outputs <list>', 'Comma-separated outputs: mp4,manifest,snapshot (default: mp4)', 'mp4')
    .option('--address <address>', 'gRPC server address', 'localhost:50051')
    .action(async (pipelineId: string, options: {
      audioOnly?: boolean;
      videoOnly?: boolean;
      output?: string;
      lang?: string;
      outputs?: string;
      address: string;
    }) => {
      console.log(`Rendering pipeline: ${pipelineId}`);
      console.log(`Server: ${options.address}`);
      if (options.lang) console.log(`Lang:   ${options.lang}`);

      const outputs = (options.outputs ?? 'mp4').split(',').map((s) => s.trim()).filter(Boolean);

      const client = createClient({ address: options.address });
      const stream = client.executePipeline({
        pipelineId,
        options: {
          generateAudio: !options.videoOnly,
          generateVideo: !options.audioOnly,
          outputPath: options.output ?? '',
          lang: options.lang ?? '',
          outputs,
        },
      });

      let lastStatus: string | null = null;

      stream.on('data', (response: any) => {
        const status = response.status as string;
        if (status !== lastStatus) {
          lastStatus = status;
          process.stdout.write(`\n[${pipelineStatusString(status)}] `);
        }
        process.stdout.write(`\r  ${response.progressPercent}%`);
        if (response.currentScene) process.stdout.write(` — ${response.currentScene}`);

        if (status === 'COMPLETED') {
          console.log('\n\n✓ Render completed.');
          if (response.videoPath) console.log(`  Video: ${response.videoPath}`);
          client.close();
          process.exit(0);
        } else if (status === 'FAILED') {
          console.error(`\n\n✗ Failed: ${response.errorMessage || 'unknown error'}`);
          client.close();
          process.exit(1);
        }
      });

      stream.on('error', (err: Error) => {
        console.error(`\n\nError: ${err.message}`);
        client.close();
        process.exit(1);
      });

      stream.on('end', () => {
        client.close();
      });

      process.on('SIGINT', async () => {
        console.log('\nCancelling...');
        try {
          stream.cancel();
          await client.cancelPipeline({ pipelineId });
          console.log('Pipeline cancelled');
        } catch (err) {
          console.error(`Error: ${(err as Error).message}`);
        } finally {
          client.close();
          process.exit(0);
        }
      });
    });

  return command;
}
