import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from 'remotion';
import { registerTemplate } from '../registry';

const PropsSchema = z.object({
  title: z.string().min(1),
  bullets: z.array(z.string().min(1).max(40)).min(1).max(6),
  bulletStyle: z.enum(['arrow', 'check', 'number']).default('arrow'),
  accent: z.string().default('#22c55e'),
});

type Props = z.infer<typeof PropsSchema>;

const BULLET_PREFIX: Record<Props['bulletStyle'], (i: number) => string> = {
  arrow: () => '▶',
  check: () => '✓',
  number: (i) => `${i + 1}.`,
};

const KeyTakeawaysCard: React.FC<Props> = ({ title, bullets, bulletStyle, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 15], [-20, 0], { extrapolateRight: 'clamp' });

  const prefix = BULLET_PREFIX[bulletStyle];

  return (
    <AbsoluteFill
      style={{
        padding: '120px 160px',
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          marginBottom: 60,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          paddingLeft: 24,
          borderLeft: `8px solid ${accent}`,
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {bullets.map((b, i) => {
          const startFrame = 20 + i * 8;
          const enter = spring({
            frame: frame - startFrame,
            fps,
            config: { damping: 16, stiffness: 120 },
          });
          const x = interpolate(enter, [0, 1], [-60, 0]);
          return (
            <div
              key={i}
              style={{
                fontSize: 44,
                opacity: enter,
                transform: `translateX(${x}px)`,
                display: 'flex',
                gap: 24,
                alignItems: 'flex-start',
              }}
            >
              <span style={{ color: accent, fontWeight: 700, minWidth: 60 }}>{prefix(i)}</span>
              <span style={{ flex: 1 }}>{b}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'KeyTakeawaysCard',
  tier: 'narrative',
  description: '要点列表。一个标题 + 3-5 条 bullet,逐条入场。',
  schema: PropsSchema,
  defaults: { bulletStyle: 'arrow', accent: '#22c55e' },
  component: KeyTakeawaysCard,
});
