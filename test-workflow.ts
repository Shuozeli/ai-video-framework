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
      duration: 4,
      audio: {
        text: '欢迎收看本期财经速递,这里是今天的看点。',
        alternates: { en: { text: 'Welcome to today\'s finance briefing. Here are the highlights.' } },
      },
      background: { kind: 'gradient', color: '#0a0e27', color2: '#1a2455' },
      layers: [
        layer('KeyTakeawaysCard', {
          title: '本期看点',
          bullets: ['英伟达财报超预期', '美联储 6 月降息概率上升', '苹果发布会前瞻'],
        }),
        layer('SubtitleBar', { position: 'bottom' }, { zIndex: 100 }),
      ],
    }),
    scene({
      name: 'outro',
      duration: 5,
      audio: {
        text: '感谢观看,我们下期再见。',
        alternates: { en: { text: 'Thanks for watching, see you next time.' } },
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
        layer('SubtitleBar', { position: 'bottom' }, { zIndex: 100 }),
      ],
    }),
  ],
  transitions: [{ from: 'intro', to: 'outro', kind: 'fade', durationFrames: 15 }],
});

console.log(JSON.stringify(wf, null, 2));
