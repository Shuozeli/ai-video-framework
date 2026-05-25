/**
 * Build a showcase pipeline that exercises every registered template.
 * Emits demos/showcase/showcase-pipeline.json — feed into remotion render.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { workflow, scene, layer, compile, serializePipeline } from '../../packages/ai-video-dsl/src';
import { dslRegistry } from '../../packages/ai-video-templates/src';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCENE_DURATION = 4; // seconds per scene
const FPS = 30;

const scenes = [
  // ---------- Tier 1 · Narrative ----------
  scene({
    name: 'title',
    duration: SCENE_DURATION,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
    layers: [
      layer('TitleCard', {
        title: 'AI 视频框架展示',
        subtitle: 'Episode 47 · 2026-05-23',
      }),
    ],
  }),
  scene({
    name: 'takeaways',
    duration: SCENE_DURATION,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
    layers: [
      layer('KeyTakeawaysCard', {
        title: '本期看点',
        bullets: ['英伟达财报超预期', '美联储 6 月降息概率上升', '苹果发布会前瞻'],
      }),
    ],
  }),
  scene({
    name: 'divider',
    duration: SCENE_DURATION,
    background: { kind: 'solid', color: '#0a0e27' },
    layers: [layer('SectionDivider', { number: '02', title: '宏观经济观察' })],
  }),
  scene({
    name: 'end-card',
    duration: SCENE_DURATION,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
    layers: [
      layer('EndCard', {
        message: '下期预告:5 月美联储会议解读',
        ctas: [
          { label: '订阅', sublabel: 'B站 / YouTube' },
          { label: '微信公众号', sublabel: '@FinanceDaily' },
        ],
      }),
    ],
  }),

  // ---------- Tier 2 · Data Visualization ----------
  scene({
    name: 'stock-chart',
    duration: SCENE_DURATION,
    background: { kind: 'solid', color: '#0a0e27' },
    layers: [
      layer('StockChart', {
        ticker: 'NVDA',
        displayName: 'NVIDIA',
        chartType: 'candle',
        scheme: 'us',
        series: Array.from({ length: 20 }, (_, i) => {
          const base = 880 + Math.sin(i * 0.4) * 30 + i * 4;
          const o = base + (i % 3 === 0 ? -8 : 4);
          const c = base + (i % 3 === 0 ? -2 : 9);
          return { t: `2026-04-${(i + 1).toString().padStart(2, '0')}`, o, h: Math.max(o, c) + 6, l: Math.min(o, c) - 5, c };
        }),
        annotations: [{ timestamp: '2026-04-15', label: '财报发布', placement: 'top' }],
      }),
    ],
  }),
  scene({
    name: 'earnings',
    duration: SCENE_DURATION,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
    layers: [
      layer('EarningsDashboard', {
        company: 'NVIDIA',
        quarter: '2026 Q3',
        metrics: [
          { name: 'Revenue', unit: 'B', expected: 17.2, actual: 18.12, yoyPercent: 94 },
          { name: 'EPS', unit: '$', expected: 0.45, actual: 0.51, yoyPercent: 168 },
          { name: 'Data Center Rev', unit: 'B', expected: 14.8, actual: 15.5, yoyPercent: 112 },
          { name: 'Gross Margin', unit: '%', expected: 75.0, actual: 76.4 },
        ],
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
    name: 'comparison',
    duration: SCENE_DURATION,
    background: { kind: 'solid', color: '#0a0e27' },
    layers: [
      layer('ComparisonTable', {
        title: '数据中心 GPU 对比',
        columns: [
          { label: 'H200', accent: '#22c55e' },
          { label: 'MI300X', accent: '#ef4444' },
        ],
        rows: [
          { label: '显存', values: ['141 GB', '192 GB'], highlight: 1 },
          { label: 'FP8 算力', values: ['3958 TFLOPS', '5230 TFLOPS'], highlight: 1 },
          { label: 'TDP', values: ['700 W', '750 W'], highlight: 0 },
          { label: '售价', values: ['$32k', '$28k'], highlight: 1 },
        ],
      }),
    ],
  }),
  scene({
    name: 'ranking',
    duration: SCENE_DURATION,
    background: { kind: 'solid', color: '#0a0e27' },
    layers: [
      layer('RankingList', {
        title: '今日 AI 概念股涨幅榜',
        items: [
          { name: 'NVDA', value: 950.12, delta: 6.4 },
          { name: 'AMD', value: 178.3, delta: 4.1 },
          { name: 'PLTR', value: 28.45, delta: 3.7 },
          { name: 'TSM', value: 192.5, delta: 2.9 },
          { name: 'AVGO', value: 1480.2, delta: 1.4 },
        ],
      }),
    ],
  }),
  scene({
    name: 'heatmap',
    duration: SCENE_DURATION,
    background: { kind: 'solid', color: '#0a0e27' },
    layers: [
      layer('Heatmap', {
        title: '标普 11 大板块今日表现',
        layout: 'treemap',
        cells: [
          { label: 'Tech', value: 2.1, weight: 28 },
          { label: 'Health', value: 0.3, weight: 13 },
          { label: 'Finance', value: 0.7, weight: 13 },
          { label: 'Consumer', value: 1.1, weight: 11 },
          { label: 'Industrial', value: 0.5, weight: 9 },
          { label: 'Energy', value: -1.4, weight: 4 },
          { label: 'Utilities', value: -0.2, weight: 3 },
          { label: 'Materials', value: -0.6, weight: 3 },
        ],
        scheme: 'us',
      }),
    ],
  }),

  // ---------- Tier 3 · News & Logic ----------
  scene({
    name: 'pip-quote',
    duration: SCENE_DURATION,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
    layers: [
      layer('PiPNewsQuote', {
        source: 'Bloomberg',
        publishedAt: '2026-05-04',
        headline: 'Nvidia 财报全面超预期,数据中心营收同比增长近一倍',
        body: '英伟达公布的第三财季营收为 181 亿美元,同比增长 94%。其中数据中心业务贡献 155 亿,同比增长 169%。',
        highlights: ['营收为 181 亿美元', '数据中心业务贡献 155 亿'],
        cardStyle: 'newspaper',
      }),
    ],
  }),
  scene({
    name: 'social',
    duration: SCENE_DURATION,
    background: { kind: 'solid', color: '#0a0e27' },
    layers: [
      layer('SocialCard', {
        platform: 'x',
        authorName: 'Elon Musk',
        authorHandle: '@elonmusk',
        authorVerified: true,
        content: 'Optimus Gen 3 ships next quarter. The future is automated.',
        postedAt: '2026-05-03',
        likes: 482000,
        reposts: 87000,
      }),
    ],
  }),
  scene({
    name: 'logic-flow',
    duration: SCENE_DURATION + 2,
    background: { kind: 'solid', color: '#0a0e27' },
    layers: [
      layer('LogicFlow', {
        layout: 'horizontal',
        nodes: [
          { id: 'a', label: '大厂缩减 Capex', accent: 'negative' },
          { id: 'b', label: '云巨头现金流改善', accent: 'positive' },
          { id: 'c', label: 'GPU 需求承压', accent: 'negative' },
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'a', to: 'c', style: 'dashed', label: '传导' },
        ],
      }),
    ],
  }),
  scene({
    name: 'timeline',
    duration: SCENE_DURATION + 2,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
    layers: [
      layer('Timeline', {
        title: 'OpenAI 关键时刻',
        orientation: 'horizontal',
        events: [
          { date: '2022-11', title: 'ChatGPT 发布' },
          { date: '2023-03', title: 'GPT-4 上线' },
          { date: '2024-05', title: 'GPT-4o 多模态' },
          { date: '2025-12', title: 'GPT-5 发布' },
        ],
      }),
    ],
  }),

  // ---------- Tier 4 · Decoration (LowerThird over a base layer) ----------
  scene({
    name: 'lower-third',
    duration: SCENE_DURATION,
    background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
    layers: [
      layer('BigNumberCard', {
        label: 'Q3 营收',
        value: 181,
        unit: 'B',
        prefix: '$',
        arrow: 'up',
      }),
      layer(
        'LowerThird',
        {
          title: 'Source: NVIDIA Investor Relations',
          subtitle: 'Q3 FY26 Earnings Release',
        },
        { zIndex: 100 },
      ),
    ],
  }),
];

const wf = workflow({
  metadata: {
    title: 'AI Video Framework — Template Showcase',
    duration: scenes.reduce((s, sc) => s + sc.duration, 0),
    fps: FPS,
    primaryLang: 'zh',
    resolution: { width: 1920, height: 1080 },
  },
  scenes,
  transitions: scenes.slice(0, -1).map((s, i) => ({
    from: s.name,
    to: scenes[i + 1].name,
    kind: 'fade' as const,
    durationFrames: 12,
  })),
});

const pipeline = compile(wf, { registry: dslRegistry });

const outDir = resolve(__dirname);
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, 'showcase-pipeline.json');
writeFileSync(outPath, serializePipeline(pipeline));

console.log(`Showcase pipeline written: ${outPath}`);
console.log(`  scenes: ${pipeline.scenes.length}`);
console.log(`  totalFrames: ${pipeline.totalFrames} (${(pipeline.totalFrames / FPS).toFixed(1)}s @ ${FPS}fps)`);
console.log(`  pipelineId: ${pipeline.pipelineId}`);
