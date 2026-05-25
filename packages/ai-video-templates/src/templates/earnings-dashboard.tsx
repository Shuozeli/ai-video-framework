import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { registerTemplate } from '../registry';

const MetricSchema = z.object({
  name: z.string().min(1),
  unit: z.string().optional(),
  expected: z.number(),
  actual: z.number(),
  yoyPercent: z.number().optional(),
});

const PropsSchema = z.object({
  company: z.string().min(1),
  logoRef: z.string().optional(),
  quarter: z.string().min(1),
  metrics: z.array(MetricSchema).min(1).max(4).optional(),
  dataRef: z.string().optional(),
  scheme: z.enum(['us', 'cn']).default('us'),
});

type Props = z.infer<typeof PropsSchema>;

const SCHEME_COLORS = {
  us: { up: '#22c55e', down: '#ef4444' },
  cn: { up: '#ef4444', down: '#22c55e' },
} as const;

const MetricCard: React.FC<{
  metric: z.infer<typeof MetricSchema>;
  index: number;
  scheme: 'us' | 'cn';
}> = ({ metric, index, scheme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = 20 + index * 10;
  const enter = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const scale = interpolate(enter, [0, 1], [0.7, 1]);

  const beat = metric.actual >= metric.expected;
  const color = beat ? SCHEME_COLORS[scheme].up : SCHEME_COLORS[scheme].down;
  const arrow = beat ? '↑' : '↓';

  const rollProgress = interpolate(
    frame,
    [startFrame + 10, startFrame + 30],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const displayActual = metric.actual * rollProgress;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '2px solid rgba(255,255,255,0.12)',
        borderRadius: 16,
        padding: 36,
        opacity: enter,
        transform: `scale(${scale})`,
        minWidth: 320,
      }}
    >
      <div style={{ fontSize: 28, opacity: 0.7, marginBottom: 12 }}>{metric.name}</div>
      <div style={{ fontSize: 22, opacity: 0.5, fontFamily: 'Inter' }}>
        预期 {metric.expected.toFixed(2)}
        {metric.unit ?? ''}
      </div>
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          fontFamily: 'Inter',
          color,
          marginTop: 12,
          letterSpacing: -1,
        }}
      >
        {arrow} {displayActual.toFixed(2)}
        <span style={{ fontSize: 32, marginLeft: 4 }}>{metric.unit ?? ''}</span>
      </div>
      {metric.yoyPercent !== undefined && (
        <div style={{ fontSize: 24, marginTop: 8, color, opacity: enter }}>
          YoY {metric.yoyPercent >= 0 ? '+' : ''}
          {metric.yoyPercent.toFixed(0)}%
        </div>
      )}
    </div>
  );
};

const EarningsDashboard: React.FC<Props> = ({ company, quarter, metrics = [], scheme }) => {
  const frame = useCurrentFrame();
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        padding: '80px 120px',
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 24, opacity: headerOpacity, marginBottom: 48 }}>
        <div style={{ fontSize: 56, fontWeight: 700 }}>{company}</div>
        <div style={{ fontSize: 32, opacity: 0.7, fontFamily: 'Inter' }}>· {quarter}</div>
      </div>

      <div
        style={{
          display: 'grid',
          // Floor at 1 so an empty `metrics` doesn't produce `repeat(0, 1fr)`,
          // which is invalid CSS and collapses the grid area.
          gridTemplateColumns: `repeat(${Math.max(1, Math.min(metrics.length, 2))}, 1fr)`,
          gap: 32,
          flex: 1,
          alignContent: 'start',
        }}
      >
        {metrics.map((m, i) => (
          <MetricCard key={i} metric={m} index={i} scheme={scheme} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'EarningsDashboard',
  tier: 'data',
  description: '财报"预期 vs 实际"对比;指标卡 stagger 出现,数字 0→target 滚动。',
  schema: PropsSchema,
  defaults: { scheme: 'us' },
  component: EarningsDashboard,
});
