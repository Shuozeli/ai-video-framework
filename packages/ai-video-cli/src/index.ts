#!/usr/bin/env node

import { Command } from 'commander';
import { createCompileCommand } from './commands/compile.js';
import { createRenderCommand } from './commands/render.js';
import { createCancelCommand } from './commands/cancel.js';
import { createStatusCommand } from './commands/status.js';
import { createListCommand } from './commands/list.js';
import { createUploadCommand } from './commands/upload.js';
import {
  createMaterialsCommand,
  createMaterialsDownloadCommand,
} from './commands/materials.js';
import { createInitCommand } from './commands/init.js';
import { createProjectsCommand } from './commands/projects.js';
import { createTemplatesCommand } from './commands/templates.js';
import { createPreviewCommand } from './commands/preview.js';
import { createRenderSceneCommand } from './commands/render-scene.js';

const program = new Command();

program
  .name('ai-video')
  .description('CLI client for AI Video Pipeline Framework')
  .version('0.1.0');

// Workflow / pipeline
program.addCommand(createCompileCommand());
program.addCommand(createListCommand());
program.addCommand(createStatusCommand());
program.addCommand(createRenderCommand());
program.addCommand(createCancelCommand());

// Preview / partial render
program.addCommand(createPreviewCommand());
program.addCommand(createRenderSceneCommand());

// Templates
program.addCommand(createTemplatesCommand());

// Materials
const materialsCmd = new Command('materials').description('Material management');
materialsCmd.addCommand(createMaterialsCommand());
materialsCmd.addCommand(createMaterialsDownloadCommand());
program.addCommand(materialsCmd);
program.addCommand(createUploadCommand());

// Projects
program.addCommand(createInitCommand());
program.addCommand(createProjectsCommand());

program.parse();
