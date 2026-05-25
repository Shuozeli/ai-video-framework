import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { registerTemplate } from '../registry';

const ItemSchema = z.object({
  rank: z.number().int().optional(),
  name: z.string().min(1),
  logoRef: z.string().optional(),
  value: z.number(),
  delta: z.number().optional(),
  suffix: z.string().optional(),
});

const PropsSchema = z.object({
  title: z.string().min(1),
  items: z.array(ItemSchema).min(1).max(10),
  sort: z.enum(['asc', 'desc', 'none']).default('desc'),
  scheme: z.enum(['us', 'cn']).default('us'),
});

type Props = z.infer<typeof PropsSchema>;

const SCHEME_COLORS = {
  us: { up: '#22c55e', down: '#ef4444' },
  cn: { up: '#ef4444', down: '#22c55e' },
} as const;

const RankingList: React.FC<Props> = ({ title, items, sort, scheme }) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const sorted = (() => {
    if (sort === 'none') return [...items];
    return [...items].sort((a, b) => {
      const ka = a.delta ?? a.value;
      const kb = b.delta ?? b.value;
      return sort === 'desc' ? kb - ka : ka - kb;
    });
  })();

  const maxAbsValue = Math.max(...sorted.map((i) => Math.abs(i.value)), 1);
  const colors = SCHEME_COLORS[scheme];

  return (
    <AbsoluteFill
      style={{
        padding: '80px 120px',
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
      }}
    >
      <div style={{ fontSize: 56, fontWeight: 700, marginBottom: 40, opacity: titleOpacity }}>
        {title}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {sorted.map((it, i) => {
          const startFrame = 18 + i * 6;
          const opacity = interpolate(frame, [startFrame, startFrame + 16], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const x = interpolate(frame, [startFrame, startFrame + 16], [60, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const barProgress = interpolate(frame, [startFrame + 10, startFrame + 30], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const widthPct = (Math.abs(it.value) / maxAbsValue) * 60 * barProgress;
          const rankNum = it.rank ?? i + 1;
          const deltaColor =
            it.delta === undefined ? '#fff' : it.delta >= 0 ? colors.up : colors.down;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: 16,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                opacity,
                transform: `translateX(${x}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  width: 80,
                  textAlign: 'center',
                  fontFamily: 'Inter',
                  color: rankNum <= 3 ? '#fbbf24' : 'rgba(255,255,255,0.6)',
                }}
              >
                {rankNum}
              </div>
              <div style={{ fontSize: 32, fontWeight: 600, width: 220 }}>{it.name}</div>
              <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
                <div
                  style={{
                    width: `${widthPct}%`,
                    height: '100%',
                    background: it.delta !== undefined && it.delta < 0 ? colors.down : colors.up,
                    borderRadius: 8,
                  }}
                />
              </div>
              <div
                style={{
                  width: 140,
                  textAlign: 'right',
                  fontSize: 32,
                  fontFamily: 'Inter',
                  fontWeight: 600,
                }}
              >
                {it.value}
                {it.suffix ?? ''}
              </div>
              {it.delta !== undefined && (
                <div
                  style={{
                    width: 120,
                    textAlign: 'right',
                    fontSize: 28,
                    color: deltaColor,
                    fontFamily: 'Inter',
                    fontWeight: 600,
                  }}
                >
                  {it.delta >= 0 ? '+' : ''}
                  {it.delta.toFixed(2)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'RankingList',
  tier: 'data',
  description: '排行榜:每条 slide-in-right,数值条 width 0→target。',
  schema: PropsSchema,
  defaults: { sort: 'desc', scheme: 'us' },
  component: RankingList,
});
