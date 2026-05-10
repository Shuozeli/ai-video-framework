import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { registerTemplate } from '../registry';

const PropsSchema = z.object({
  position: z.enum(['top', 'bottom']).default('bottom'),
  fontSize: z.number().default(44),
  color: z.string().default('#ffffff'),
  background: z.string().default('rgba(0, 0, 0, 0.7)'),
  maxWidthPercent: z.number().min(20).max(100).default(80),
});

type Props = z.infer<typeof PropsSchema> & {
  // Injected by the renderer's TemplateDispatcher — opt-in.
  __scene?: string;
  __lang?: string;
  __pipeline?: {
    materials?: {
      subtitleTimings?: Record<
        string,
        { text: string; time_begin: number; time_end: number }[]
      >;
    };
  };
};

const SubtitleBar: React.FC<Props> = ({
  position,
  fontSize,
  color,
  background,
  maxWidthPercent,
  __scene,
  __lang,
  __pipeline,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!__scene || !__lang || !__pipeline) return null;
  const timings = __pipeline.materials?.subtitleTimings?.[`${__scene}:${__lang}`];
  if (!timings || timings.length === 0) return null;

  // Frame is scene-relative inside TransitionSeries.Sequence, so milliseconds
  // are likewise scene-relative — matches MiniMax's title timings.
  const timeMs = (frame / fps) * 1000;
  const active = timings.find((t) => timeMs >= t.time_begin && timeMs < t.time_end);
  if (!active) return null;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: position === 'top' ? 'flex-start' : 'flex-end',
        justifyContent: 'center',
        paddingTop: position === 'top' ? 80 : 0,
        paddingBottom: position === 'bottom' ? 80 : 0,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background,
          color,
          padding: '18px 36px',
          fontSize,
          fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
          borderRadius: 10,
          maxWidth: `${maxWidthPercent}%`,
          textAlign: 'center',
          lineHeight: 1.4,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        {active.text}
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'SubtitleBar',
  tier: 'decoration',
  description: '自动字幕条;按当前 scene + lang 在 materials.subtitleTimings 中查找,同步显示当前句子。',
  schema: PropsSchema,
  defaults: {
    position: 'bottom',
    fontSize: 44,
    color: '#ffffff',
    background: 'rgba(0, 0, 0, 0.7)',
    maxWidthPercent: 80,
  },
  component: SubtitleBar,
});
