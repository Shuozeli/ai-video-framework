import { Command } from 'commander';
import { createClient, pipelineStatusString } from '../client.js';

export function createListCommand(): Command {
  const command = new Command('list');

  command
    .description('List all pipelines')
    .option('-a, --address <address>', 'gRPC server address', 'localhost:50051')
    .option('--json', 'Output as JSON')
    .action(async (options: { address: string; json?: boolean }) => {
      const client = createClient({ address: options.address });
      try {
        const response = await client.listPipelines();
        const pipelines: any[] = response.pipelines || [];

        if (pipelines.length === 0) {
          console.log('No pipelines found');
          return;
        }
        if (options.json) {
          console.log(JSON.stringify(pipelines, null, 2));
          return;
        }
        console.log(`\nFound ${pipelines.length} pipeline(s):\n`);
        console.log('ID'.padEnd(20) + 'Title'.padEnd(30) + 'Status'.padEnd(20) + 'Progress');
        console.log('-'.repeat(90));
        for (const p of pipelines) {
          const created = new Date(Number(p.createdAt)).toLocaleString();
          console.log(
            String(p.pipelineId).substring(0, 18).padEnd(20) +
              String(p.title).substring(0, 28).padEnd(30) +
              pipelineStatusString(p.status).padEnd(20) +
              `${p.progressPercent}%  ${created}`,
          );
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
