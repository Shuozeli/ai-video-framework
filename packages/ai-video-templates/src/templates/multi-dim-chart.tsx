import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { registerTemplate } from '../registry';

const SeriesItem = z.object({
  name: z.string(),
  value: z.number(),
  color: z.string().optional(),
});

const DataItem = z.object({
  name: z.string(),
  value: z.number(),
  color: z.string().optional(),
  series: z.array(SeriesItem).optional(),
});

const PropsSchema = z.object({
  title: z.string(),
  chartType: z.enum(['bar', 'pie', 'stacked', 'line']).default('bar'),
  data: z.array(DataItem).min(1),
  yAxisLabel: z.string().optional(),
  xAxisLabel: z.string().optional(),
  legend: z.boolean().default(true),
});

type Props = z.infer<typeof PropsSchema>;

const DEFAULT_PALETTE = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

const ChartTitle: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div style={{ fontSize: 56, fontWeight: 700, color: '#fff', opacity, marginBottom: 60 }}>
      {title}
    </div>
  );
};

const BarChart: React.FC<Props> = ({ data }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...data.map((d) => d.value));
  const barAreaWidth = 1400;
  const barWidth = barAreaWidth / data.length - 40;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40, height: 600 }}>
      {data.map((d, i) => {
        const startFrame = 15 + i * 4;
        const grow = interpolate(frame, [startFrame, startFrame + 24], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const h = (d.value / max) * 540 * grow;
        const color = d.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: barWidth }}>
            <div
              style={{
                fontSize: 28,
                color: '#fff',
                marginBottom: 12,
                opacity: grow,
              }}
            >
              {d.value}
            </div>
            <div
              style={{
                width: '100%',
                height: h,
                backgroundColor: color,
                borderRadius: '8px 8px 0 0',
              }}
            />
            <div style={{ fontSize: 28, color: '#fff', marginTop: 16, opacity: grow }}>{d.name}</div>
          </div>
        );
      })}
    </div>
  );
};

const PieChart: React.FC<Props> = ({ data }) => {
  const frame = useCurrentFrame();
  const total = data.reduce((s, d) => s + d.value, 0);
  const sweep = interpolate(frame, [15, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  let cumulative = 0;
  const slices = data.map((d, i) => {
    const start = (cumulative / total) * 360;
    cumulative += d.value;
    const end = (cumulative / total) * 360;
    const visibleEnd = start + (end - start) * sweep;
    const color = d.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
    return { start, end: visibleEnd, color, name: d.name, value: d.value };
  });

  const r = 260;
  const cx = 300;
  const cy = 300;
  const polarToCartesian = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  return (
    <div style={{ display: 'flex', gap: 80, alignItems: 'center' }}>
      <svg width={600} height={600}>
        {slices.map((s, i) => {
          if (s.end <= s.start) return null;
          const a = polarToCartesian(s.start);
          const b = polarToCartesian(s.end);
          const large = s.end - s.start > 180 ? 1 : 0;
          const path = `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
          return <path key={i} d={path} fill={s.color} />;
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#fff', fontSize: 32 }}>
            <div style={{ width: 24, height: 24, backgroundColor: s.color, borderRadius: 4 }} />
            <span style={{ minWidth: 200 }}>{s.name}</span>
            <span style={{ opacity: 0.7 }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChart: React.FC<Props> = ({ data }) => {
  const frame = useCurrentFrame();
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const w = 1400;
  const h = 540;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.value - min) / (max - min || 1)) * h;
    return { x, y, name: d.name, value: d.value };
  });

  const reveal = interpolate(frame, [15, 75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const visibleCount = Math.max(1, Math.floor(reveal * points.length));
  const pathPoints = points.slice(0, visibleCount);
  const pathStr = pathPoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  return (
    <svg width={w} height={h + 60}>
      <path d={pathStr} fill="none" stroke="#22c55e" strokeWidth={4} />
      {pathPoints.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={6} fill="#22c55e" />
          <text x={p.x} y={p.y - 16} fill="#fff" fontSize={24} textAnchor="middle">{p.value}</text>
          <text x={p.x} y={h + 40} fill="#fff" fontSize={20} textAnchor="middle" opacity={0.7}>{p.name}</text>
        </g>
      ))}
    </svg>
  );
};

const StackedChart: React.FC<Props> = ({ data }) => {
  const frame = useCurrentFrame();
  const totals = data.map((d) => (d.series ?? []).reduce((s, v) => s + v.value, d.value));
  const max = Math.max(...totals);
  const barAreaWidth = 1400;
  const barWidth = barAreaWidth / data.length - 40;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40, height: 600 }}>
      {data.map((d, i) => {
        const startFrame = 15 + i * 4;
        const grow = interpolate(frame, [startFrame, startFrame + 24], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const series = d.series ?? [{ name: d.name, value: d.value, color: d.color }];
        const total = series.reduce((s, v) => s + v.value, 0);
        const totalH = (total / max) * 540 * grow;
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: barWidth }}>
            <div style={{ width: '100%', height: totalH, display: 'flex', flexDirection: 'column-reverse' }}>
              {series.map((s, j) => {
                const segH = (s.value / total) * totalH;
                const color = s.color ?? DEFAULT_PALETTE[j % DEFAULT_PALETTE.length];
                return <div key={j} style={{ width: '100%', height: segH, backgroundColor: color }} />;
              })}
            </div>
            <div style={{ fontSize: 28, color: '#fff', marginTop: 16, opacity: grow }}>{d.name}</div>
          </div>
        );
      })}
    </div>
  );
};

const MultiDimChart: React.FC<Props> = (props) => {
  return (
    <AbsoluteFill style={{ padding: '120px 160px', fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif' }}>
      <ChartTitle title={props.title} />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        {props.chartType === 'bar' && <BarChart {...props} />}
        {props.chartType === 'pie' && <PieChart {...props} />}
        {props.chartType === 'line' && <LineChart {...props} />}
        {props.chartType === 'stacked' && <StackedChart {...props} />}
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'MultiDimChart',
  tier: 'data',
  description: 'bar / pie / stacked / line 通用图表,带入场动画。',
  schema: PropsSchema,
  defaults: { chartType: 'bar', legend: true },
  component: MultiDimChart,
});
