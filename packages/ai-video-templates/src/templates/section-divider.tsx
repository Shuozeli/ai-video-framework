import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { registerTemplate } from '../registry';

const PropsSchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  accent: z.string().default('#22c55e'),
  layout: z.enum(['horizontal', 'vertical']).default('horizontal'),
});

type Props = z.infer<typeof PropsSchema>;

const SectionDivider: React.FC<Props> = ({ number, title, accent, layout }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numEnter = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const numScale = interpolate(numEnter, [0, 1], [1.2, 1.0]);

  const titleOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });
  const titleX = interpolate(frame, [10, 25], [-30, 0], { extrapolateRight: 'clamp' });

  const isHorizontal = layout === 'horizontal';

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: isHorizontal ? 'row' : 'column',
        gap: isHorizontal ? 80 : 32,
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
        padding: 80,
      }}
    >
      <div
        style={{
          fontSize: 480,
          fontWeight: 800,
          lineHeight: 1,
          color: accent,
          opacity: numEnter,
          transform: `scale(${numScale})`,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: -8,
        }}
      >
        {number}
      </div>
      <div
        style={{
          fontSize: 72,
          fontWeight: 600,
          opacity: titleOpacity,
          transform: isHorizontal ? `translateX(${titleX}px)` : `translateY(${-titleX}px)`,
          borderLeft: isHorizontal ? `6px solid ${accent}` : 'none',
          borderTop: isHorizontal ? 'none' : `6px solid ${accent}`,
          paddingLeft: isHorizontal ? 32 : 0,
          paddingTop: isHorizontal ? 0 : 24,
          maxWidth: 800,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'SectionDivider',
  tier: 'narrative',
  description: '章节过渡卡:大编号 + 章节标题。编号 spring 弹入,标题 fade-in。',
  schema: PropsSchema,
  defaults: { accent: '#22c55e', layout: 'horizontal' },
  component: SectionDivider,
});
