import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '../client.js';

const CHUNK_SIZE = 64 * 1024;

export function createUploadCommand(): Command {
  const command = new Command('upload');

  command
    .description('Upload a material file (audio / image / video / data)')
    .argument('<file>')
    .option('-p, --project <project>', 'Project name')
    .option('-t, --type <type>', 'Material type (audio/image/video/data)', '')
    .option('-n, --name <name>', 'Material name')
    .option('-a, --address <address>', 'gRPC server address', 'localhost:50051')
    .action(async (file: string, options: {
      project?: string;
      type?: string;
      name?: string;
      address: string;
    }) => {
      const filePath = path.resolve(file);
      if (!fs.existsSync(filePath)) {
        console.error(`Error: file not found: ${filePath}`);
        process.exit(1);
      }
      const fileName = options.name || path.basename(filePath);
      const materialType = options.type || guessMaterialType(filePath);

      console.log(`Uploading: ${fileName} (${materialType})`);

      const client = createClient({ address: options.address });
      const { stream, response } = client.uploadMaterial();

      stream.write({
        metadata: {
          name: fileName,
          materialType,
          projectName: options.project ?? 'default',
        },
      });

      const data = fs.readFileSync(filePath);
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        stream.write({ chunk: data.subarray(i, Math.min(i + CHUNK_SIZE, data.length)) });
      }
      stream.end();

      try {
        const resp = await response;
        console.log('✓ Upload completed');
        console.log(`  material_id: ${resp.materialId}`);
        console.log(`  path:        ${resp.path}`);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(1);
      } finally {
        client.close();
      }
    });

  return command;
}

function guessMaterialType(filePath: string): 'audio' | 'image' | 'video' | 'data' | 'other' {
  const ext = path.extname(filePath).toLowerCase();
  if (['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext)) return 'audio';
  if (['.mp4', '.webm', '.mov', '.avi'].includes(ext)) return 'video';
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
  if (['.json', '.csv', '.tsv'].includes(ext)) return 'data';
  return 'other';
}
