import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

export function createInitCommand(): Command {
  const command = new Command('init');

  command
    .description('Initialize a new project')
    .argument('<project_name>', 'Name of the project to create')
    .option('-p, --path <path>', 'Base path for projects', './storage/projects')
    .action(async (projectName: string, options: { path: string }) => {
      try {
        const basePath = path.resolve(options.path);
        const projectPath = path.join(basePath, projectName);

        if (fs.existsSync(projectPath)) {
          console.error(`Error: Project already exists: ${projectPath}`);
          process.exit(1);
        }

        console.log(`Creating project: ${projectName}`);
        console.log(`Path: ${projectPath}`);

        // Create project directory structure
        const dirs = [
          projectPath,
          path.join(projectPath, 'materials'),
          path.join(projectPath, 'materials', 'audio'),
          path.join(projectPath, 'materials', 'images'),
          path.join(projectPath, 'materials', 'videos'),
          path.join(projectPath, 'workflows'),
          path.join(projectPath, 'outputs'),
        ];

        for (const dir of dirs) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Create metadata.json
        const metadata = {
          name: projectName,
          version: '0.1.0',
          created_at: new Date().toISOString(),
        };
        fs.writeFileSync(
          path.join(projectPath, 'metadata.json'),
          JSON.stringify(metadata, null, 2)
        );

        // Create example workflow
        const exampleWorkflow = {
          metadata: {
            title: `Example Workflow for ${projectName}`,
            duration: 60,
            fps: 30,
            resolution: { width: 1920, height: 1080 },
          },
          scenes: [
            {
              type: 'scene',
              name: 'intro',
              duration: 5,
              audio: {
                type: 'audio',
                text: 'Welcome to your new video project',
                voice_setting: {
                  voice_id: 'male-qn-qingse',
                  speed: 1,
                  vol: 1,
                  pitch: 0,
                  emotion: 'happy',
                },
              },
              text: {
                type: 'text',
                content: projectName,
                style: {
                  fontSize: 48,
                  fontFamily: 'Noto Serif CJK SC',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  textAlign: 'center',
                },
                animation: {
                  type: 'fade',
                  duration: 30,
                  direction: 'up',
                },
                position: {
                  x: 960,
                  y: 540,
                },
              },
            },
          ],
        };
        fs.writeFileSync(
          path.join(projectPath, 'workflows', 'example.json'),
          JSON.stringify(exampleWorkflow, null, 2)
        );

        console.log('\n✓ Project created successfully!');
        console.log('\nProject structure:');
        console.log(`  ${projectName}/`);
        console.log(`  ├── metadata.json`);
        console.log(`  ├── materials/`);
        console.log(`  │   ├── audio/`);
        console.log(`  │   ├── images/`);
        console.log(`  │   └── videos/`);
        console.log(`  ├── workflows/`);
        console.log(`  │   └── example.json`);
        console.log(`  └── outputs/`);
        console.log('\nNext steps:');
        console.log(`  1. cd ${projectPath}`);
        console.log('  2. ai-video compile workflows/example.json');
        console.log('  3. ai-video render <pipeline_id>');
      } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}
