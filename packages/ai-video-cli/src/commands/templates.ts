import { Command } from 'commander';
import { createClient } from '../client.js';

export function createTemplatesCommand(): Command {
  const command = new Command('templates');

  command
    .description('List available templates and their JSON schemas')
    .option('-a, --address <address>', 'gRPC server address', 'localhost:50051')
    .option('--json', 'Output as JSON')
    .option('--schema <name>', 'Print full JSON schema for a single template')
    .action(async (options: { address: string; json?: boolean; schema?: string }) => {
      const client = createClient({ address: options.address });
      try {
        const response = await client.listTemplates();
        const templates: any[] = response.templates || [];

        if (options.schema) {
          const t = templates.find((x) => x.name === options.schema);
          if (!t) {
            console.error(`Template not found: ${options.schema}`);
            process.exit(1);
          }
          console.log(t.schemaJson);
          return;
        }

        if (options.json) {
          console.log(JSON.stringify(templates, null, 2));
          return;
        }

        console.log(`Available templates: ${templates.length}\n`);
        const byTier: Record<string, any[]> = {};
        for (const t of templates) {
          (byTier[t.tier] = byTier[t.tier] || []).push(t);
        }
        for (const tier of ['narrative', 'data', 'logic', 'decoration']) {
          if (!byTier[tier]) continue;
          console.log(`[${tier}]`);
          for (const t of byTier[tier]) {
            console.log(`  ${t.name.padEnd(28)} ${t.description ?? ''}`);
          }
          console.log();
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
