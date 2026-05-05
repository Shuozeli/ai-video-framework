import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { createClient, workflowToProto } from '../client.js';

export function createCompileCommand(): Command {
  const command = new Command('compile');

  command
    .description('Compile a workflow file (JSON) into a pipeline')
    .argument('<workflow_file>', 'Path to the workflow JSON file')
    .option('-o, --output <path>', 'Output path for the pipeline JSON')
    .option('-n, --name <name>', 'Name for the pipeline')
    .option('-a, --address <address>', 'gRPC server address', 'localhost:50051')
    .action(async (workflowFile: string, options: { output?: string; name?: string; address: string }) => {
      const filePath = path.resolve(workflowFile);
      if (!fs.existsSync(filePath)) {
        console.error(`Error: workflow file not found: ${filePath}`);
        process.exit(1);
      }
      if (!filePath.endsWith('.json')) {
        console.error('Error: workflow file must be .json (run TS workflows through tsx and pipe stdout to a .json file)');
        process.exit(1);
      }

      const workflow = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const client = createClient({ address: options.address });
      try {
        const response = await client.compileWorkflow({
          name: options.name || workflow.metadata?.title || path.basename(filePath, '.json'),
          workflow: workflowToProto(workflow),
        });

        const pipelineId = response.pipelineId;
        console.log(`✓ Compiled. pipeline_id=${pipelineId}`);
        console.log(`  scenes:        ${response.pipeline.scenes.length}`);
        console.log(`  total_frames:  ${response.pipeline.totalFrames}`);
        console.log(`  fps:           ${response.pipeline.metadata.fps}`);
        console.log(`  primary_lang:  ${response.pipeline.metadata.primaryLang}`);

        if (options.output) {
          const out = path.resolve(options.output);
          fs.writeFileSync(out, JSON.stringify(response.pipeline, null, 2));
          console.log(`  saved to:      ${out}`);
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
