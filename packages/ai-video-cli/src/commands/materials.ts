import { Command } from 'commander';
import * as fs from 'fs';
import { createClient } from '../client.js';

export function createMaterialsCommand(): Command {
  const command = new Command('list');

  command
    .description('List materials')
    .argument('[project]', 'Project name')
    .option('-t, --type <type>', 'Filter by type (audio/image/video/data)')
    .option('-a, --address <address>', 'gRPC server address', 'localhost:50051')
    .option('--json', 'Output as JSON')
    .action(async (project: string | undefined, options: {
      type?: string;
      address: string;
      json?: boolean;
    }) => {
      const client = createClient({ address: options.address });
      try {
        const response = await client.listMaterials({
          projectName: project ?? '',
          materialType: options.type ?? '',
        });
        const materials: any[] = response.materials || [];
        if (materials.length === 0) {
          console.log('No materials found');
          return;
        }
        if (options.json) {
          console.log(JSON.stringify(materials, null, 2));
          return;
        }
        console.log(`\nFound ${materials.length} material(s):\n`);
        console.log(
          'ID'.padEnd(20) +
            'Name'.padEnd(30) +
            'Type'.padEnd(10) +
            'Size'.padEnd(12) +
            'Created',
        );
        console.log('-'.repeat(95));
        for (const m of materials) {
          console.log(
            String(m.materialId).substring(0, 18).padEnd(20) +
              String(m.name).substring(0, 28).padEnd(30) +
              String(m.materialType).padEnd(10) +
              formatBytes(Number(m.sizeBytes)).padEnd(12) +
              new Date(Number(m.createdAt)).toLocaleString(),
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

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function createMaterialsDownloadCommand(): Command {
  const command = new Command('download');

  command
    .description('Download a material file')
    .argument('<material_id>')
    .argument('<output>')
    .option('-a, --address <address>', 'gRPC server address', 'localhost:50051')
    .action(async (materialId: string, output: string, options: { address: string }) => {
      const client = createClient({ address: options.address });
      const stream = client.getMaterial({ materialId });
      const chunks: Buffer[] = [];

      stream.on('data', (resp: any) => {
        if (resp.chunk && resp.chunk.length > 0) chunks.push(Buffer.from(resp.chunk));
      });
      stream.on('error', (err: Error) => {
        console.error(`Error: ${err.message}`);
        client.close();
        process.exit(1);
      });
      stream.on('end', () => {
        const data = Buffer.concat(chunks);
        fs.writeFileSync(output, data);
        console.log(`✓ Saved ${formatBytes(data.length)} → ${output}`);
        client.close();
      });
    });

  return command;
}
