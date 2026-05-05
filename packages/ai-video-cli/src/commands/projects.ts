import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

export function createProjectsCommand(): Command {
  const command = new Command('projects');

  command
    .description('List all projects')
    .option('-p, --path <path>', 'Base path for projects', './storage/projects')
    .option('--json', 'Output as JSON')
    .action(async (options: { path: string; json?: boolean }) => {
      try {
        const basePath = path.resolve(options.path);

        if (!fs.existsSync(basePath)) {
          console.log('No projects found (storage directory does not exist)');
          return;
        }

        const entries = fs.readdirSync(basePath, { withFileTypes: true });
        const projects = entries
          .filter((entry) => entry.isDirectory())
          .map((entry) => {
            const metadataPath = path.join(basePath, entry.name, 'metadata.json');
            let metadata: { name?: string; version?: string; created_at?: string } = {};

            if (fs.existsSync(metadataPath)) {
              try {
                metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
              } catch {
                // ignore parse errors
              }
            }

            return {
              name: entry.name,
              version: metadata.version || 'unknown',
              created_at: metadata.created_at || 'unknown',
              path: path.join(basePath, entry.name),
            };
          });

        if (projects.length === 0) {
          console.log('No projects found');
          return;
        }

        if (options.json) {
          console.log(JSON.stringify(projects, null, 2));
        } else {
          console.log(`Found ${projects.length} project(s):\n`);
          console.log('Name'.padEnd(30) + 'Version'.padEnd(15) + 'Created');
          console.log('-'.repeat(70));

          for (const p of projects) {
            const created = p.created_at !== 'unknown'
              ? new Date(p.created_at).toLocaleString()
              : 'unknown';
            console.log(p.name.padEnd(30) + p.version.padEnd(15) + created);
          }
        }
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
