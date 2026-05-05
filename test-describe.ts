import * as fs from 'fs';
import * as path from 'path';
import {
  workflow,
  scene,
  layer,
  compile,
  describeManifestYaml,
  describeSnapshotYaml,
} from './packages/ai-video-dsl/src';
import { dslRegistry } from './packages/ai-video-templates/src';

const wf = workflow({
  metadata: { title: 'Describe Test', duration: 4, fps: 30, primaryLang: 'zh' },
  materials: { data: {}, images: {}, audio: {} },
  scenes: [
    scene({
      name: 'intro',
      duration: 2,
      audio: {
        text: '欢迎收看本期财经速递。',
        alternates: { en: { text: 'Welcome to today\'s finance briefing.' } },
      },
      background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
      layers: [
        layer(
          'KeyTakeawaysCard',
          {
            title: '本期看点',
            bullets: ['英伟达财报超预期', '美联储 6 月降息概率上升', '苹果发布会前瞻'],
          },
          { enter: { type: 'fade', durationFrames: 15 } },
        ),
      ],
    }),
    scene({
      name: 'outro',
      duration: 2,
      audio: { text: '我们下期再见。' },
      layers: [
        layer('MultiDimChart', {
          title: '云市场份额 2026 Q1',
          chartType: 'pie',
          data: [
            { name: 'AWS', value: 31, color: '#ff9900' },
            { name: 'Azure', value: 25, color: '#0078d4' },
            { name: 'GCP', value: 11, color: '#4285f4' },
          ],
        }),
      ],
    }),
  ],
  transitions: [{ from: 'intro', to: 'outro', kind: 'fade', durationFrames: 15 }],
});

const pipeline = compile(wf, { registry: dslRegistry });

const outDir = path.resolve('./test-output');
fs.mkdirSync(outDir, { recursive: true });

const manifestPath = path.join(outDir, 'manifest.yaml');
const snapshotPath = path.join(outDir, 'snapshot.yaml');

fs.writeFileSync(manifestPath, describeManifestYaml(pipeline));
fs.writeFileSync(snapshotPath, describeSnapshotYaml(pipeline));

console.log(`Pipeline: ${pipeline.pipelineId}`);
console.log(`Total frames: ${pipeline.totalFrames}`);
console.log();
console.log(`✓ Manifest → ${manifestPath}`);
console.log(`✓ Snapshot → ${snapshotPath}`);
