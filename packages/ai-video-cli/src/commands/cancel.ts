import { Command } from 'commander';
import { createClient } from '../client.js';

export function createCancelCommand(): Command {
  const command = new Command('cancel');

  command
    .description('Cancel a running pipeline')
    .argument('<pipeline_id>')
    .option('-a, --address <address>', 'gRPC server address', 'localhost:50051')
    .action(async (pipelineId: string, options: { address: string }) => {
      const client = createClient({ address: options.address });
      try {
        const response = await client.cancelPipeline({ pipelineId });
        if (response?.success) {
          console.log('✓ Pipeline cancelled');
        } else {
          console.error(`✗ ${response?.message || 'cancel failed'}`);
          process.exit(1);
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
