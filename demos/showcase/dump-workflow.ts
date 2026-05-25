/**
 * Build the showcase workflow and dump it (uncompiled) so the gRPC server
 * can compile it itself via CompileWorkflow.
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { workflow, scene, layer } from '../../packages/ai-video-dsl/src';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCENE_DURATION = 4;
const FPS = 30;

const sceneList = [
  scene({
    name: 'title',
    duration: SCENE_DURATION,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
    audio: { voice: { voice_id: 'audiobook_male_1' }, text: '欢迎收看 AI 视频框架展示,这是第一个端到端的测试视频。' },
    layers: [layer('TitleCard', { title: 'AI 视频框架展示', subtitle: 'gRPC end-to-end · 2026-05-23' })],
  }),
  scene({
    name: 'big-number',
    duration: SCENE_DURATION,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
    audio: { voice: { voice_id: 'audiobook_male_1' }, text: '英伟达盘后涨幅 6.4%,市值突破 4.2 万亿美元。' },
    layers: [
      layer('BigNumberCard', {
        label: '英伟达盘后涨幅',
        value: 6.4,
        unit: '%',
        prefix: '+',
        caption: '市值突破 4.2 万亿美元',
        arrow: 'up',
      }),
    ],
  }),
  scene({
    name: 'pie',
    duration: SCENE_DURATION,
    background: { kind: 'solid', color: '#0a0e27' },
    audio: {
      text: '全球云市场份额方面,AWS 占 31%,Azure 占 25%,GCP 占 11%,其余厂商合计 33%。',
    },
    layers: [
      layer('MultiDimChart', {
        title: '全球云市场份额 2026 Q1',
        chartType: 'pie',
        data: [
          { name: 'AWS', value: 31, color: '#ff9900' },
          { name: 'Azure', value: 25, color: '#0078d4' },
          { name: 'GCP', value: 11, color: '#4285f4' },
          { name: 'Others', value: 33, color: '#888888' },
        ],
      }),
    ],
  }),
];

const wf = workflow({
  metadata: {
    title: 'gRPC end-to-end smoke test',
    duration: sceneList.reduce((s, sc) => s + sc.duration, 0),
    fps: FPS,
    primaryLang: 'zh',
    resolution: { width: 1920, height: 1080 },
  },
  scenes: sceneList,
  transitions: sceneList.slice(0, -1).map((s, i) => ({
    from: s.name,
    to: sceneList[i + 1].name,
    kind: 'fade' as const,
    durationFrames: 12,
  })),
});

const outPath = resolve(__dirname, 'showcase-workflow.json');
writeFileSync(outPath, JSON.stringify(wf, null, 2));
console.log(`Workflow dumped: ${outPath}`);
console.log(`  scenes: ${wf.scenes.length}, duration: ${wf.metadata.duration}s`);
