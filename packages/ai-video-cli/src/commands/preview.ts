import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '../client.js';

export function createPreviewCommand(): Command {
  const command = new Command('preview');

  command
    .description('Render a single frame for fast preview')
    .argument('<pipeline_id>')
    .argument('<frame>', 'Frame number (0-based)')
    .option('-o, --output <path>', 'Output path (default: ./preview-<id>-<frame>.png)')
    .option('-f, --format <fmt>', 'png | jpeg', 'png')
    .option('-l, --lang <lang>', 'zh / en')
    .option('-a, --address <address>', 'gRPC server address', 'localhost:50051')
    .action(async (
      pipelineId: string,
      frameStr: string,
      options: { output?: string; format: string; lang?: string; address: string },
    ) => {
      const frame = parseInt(frameStr, 10);
      if (Number.isNaN(frame) || frame < 0) {
        console.error('Error: frame must be a non-negative integer');
        process.exit(1);
      }
      const format = options.format === 'jpeg' ? 'jpeg' : 'png';
      const out = path.resolve(
        options.output ?? `preview-${pipelineId.substring(0, 8)}-${frame}.${format}`,
      );

      const client = createClient({ address: options.address });
      try {
        const response = await client.renderFrame({
          pipelineId,
          frame,
          format,
          lang: options.lang ?? '',
        });
        const data = Buffer.isBuffer(response.imageData)
          ? response.imageData
          : Buffer.from(response.imageData);
        fs.writeFileSync(out, data);
        console.log(`✓ Saved frame ${frame} → ${out} (${data.length} bytes)`);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  return command;
}
