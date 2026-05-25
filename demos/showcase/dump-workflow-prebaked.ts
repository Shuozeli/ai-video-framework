/**
 * Variant of dump-workflow.ts that uses pre-existing MP3s instead of asking
 * the server to TTS via MiniMax (which is flaky right now). Re-uses three
 * audio files from previous test-tts.ts runs.
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { workflow, scene, layer } from '../../packages/ai-video-dsl/src';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '../..');

const FPS = 30;

// Reuse three MP3s; their actual durations vary (~6s each), but each scene is
// 6s long so they fit comfortably.
const AUDIO_TITLE = `${REPO}/test-output/tts/zh.mp3`;          // 6.0s
const AUDIO_BIG = `${REPO}/test-output/tts-debug/zh.mp3`;      // 5.8s
const AUDIO_PIE = `${REPO}/storage/pipelines/a20f2e2e666b2699/audio/zh/pie.mp3`; // 12s (will be cut by scene duration)

const SCENE_DURATION = 6;

const sceneList = [
  scene({
    name: 'title',
    duration: SCENE_DURATION,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
    layers: [layer('TitleCard', { title: 'AI 视频框架展示', subtitle: 'gRPC + audio · 2026-05-24' })],
  }),
  scene({
    name: 'big-number',
    duration: SCENE_DURATION,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
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
    title: 'gRPC + pre-baked audio smoke test',
    duration: sceneList.reduce((s, sc) => s + sc.duration, 0),
    fps: FPS,
    primaryLang: 'zh',
    resolution: { width: 1920, height: 1080 },
  },
  materials: {
    data: {},
    images: {},
    audio: {
      // Key format matches what the renderer's SceneRoot expects: `${scene.name}:${lang}`
      'title:zh': AUDIO_TITLE,
      'big-number:zh': AUDIO_BIG,
      'pie:zh': AUDIO_PIE,
    },
    subtitleTimings: {},
  },
  scenes: sceneList,
  transitions: sceneList.slice(0, -1).map((s, i) => ({
    from: s.name,
    to: sceneList[i + 1].name,
    kind: 'fade' as const,
    durationFrames: 12,
  })),
});

const outPath = resolve(__dirname, 'showcase-workflow-prebaked.json');
writeFileSync(outPath, JSON.stringify(wf, null, 2));
console.log(`Pre-baked workflow dumped: ${outPath}`);
console.log(`  scenes: ${wf.scenes.length}, duration: ${wf.metadata.duration}s`);
console.log(`  audio: ${Object.keys(wf.materials.audio).length} entries`);
