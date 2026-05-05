import { workflow, scene, layer } from './packages/ai-video-dsl/src';

const wf = workflow({
  metadata: {
    title: 'Test Video',
    duration: 4,
    fps: 30,
    primaryLang: 'zh',
  },
  materials: { data: {}, images: {}, audio: {} },
  scenes: [
    scene({
      name: 'intro',
      duration: 2,
      audio: {
        text: '这是一个测试视频。',
        alternates: { en: { text: 'This is a test video.' } },
      },
      background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
      layers: [
        layer('KeyTakeawaysCard', {
          title: '本期看点',
          bullets: ['英伟达财报超预期', '美联储 6 月降息概率上升', '苹果发布会前瞻'],
        }),
      ],
    }),
    scene({
      name: 'outro',
      duration: 2,
      audio: {
        text: '感谢观看,我们下期再见。',
        alternates: { en: { text: 'Thanks for watching.' } },
      },
      layers: [
        layer('MultiDimChart', {
          title: '云市场份额 2026 Q1',
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
  ],
  transitions: [{ from: 'intro', to: 'outro', kind: 'fade', durationFrames: 15 }],
});

console.log(JSON.stringify(wf, null, 2));
