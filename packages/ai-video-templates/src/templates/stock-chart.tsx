import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { registerTemplate } from '../registry';

const CandleSchema = z.object({
  t: z.string(),
  o: z.number(),
  h: z.number(),
  l: z.number(),
  c: z.number(),
  v: z.number().optional(),
});

const AnnotationSchema = z.object({
  timestamp: z.string(),
  label: z.string(),
  color: z.string().optional(),
  placement: z.enum(['top', 'bottom']).default('top'),
});

const PropsSchema = z.object({
  ticker: z.string().min(1),
  displayName: z.string().optional(),
  chartType: z.enum(['candle', 'line']).default('candle'),
  series: z.array(CandleSchema).optional(),
  dataRef: z.string().optional(),
  annotations: z.array(AnnotationSchema).default([]),
  scheme: z.enum(['us', 'cn']).default('us'),
  showVolume: z.boolean().default(false),
});

type Props = z.infer<typeof PropsSchema>;

const SCHEME_COLORS = {
  us: { up: '#22c55e', down: '#ef4444' },
  cn: { up: '#ef4444', down: '#22c55e' },
} as const;

const StockChart: React.FC<Props> = ({
  ticker,
  displayName,
  chartType,
  series,
  annotations,
  scheme,
}) => {
  const frame = useCurrentFrame();
  const data = series ?? [];
  const colors = SCHEME_COLORS[scheme];

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const w = 1500;
  const h = 600;
  const padX = 60;
  const padY = 30;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const last = data[data.length - 1]?.c ?? 0;
  const first = data[0]?.o ?? last;
  const pct = first === 0 ? 0 : ((last - first) / first) * 100;
  const isUp = pct >= 0;

  const allHighs = data.map((d) => d.h);
  const allLows = data.map((d) => d.l);
  const max = allHighs.length ? Math.max(...allHighs) : 1;
  const min = allLows.length ? Math.min(...allLows) : 0;
  const range = max - min || 1;
  const yFor = (v: number) => padY + (1 - (v - min) / range) * innerH;
  const xFor = (i: number) => padX + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);

  // Line path reveal (chartType==='line')
  const lineReveal = interpolate(frame, [20, 80], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const visiblePoints = Math.max(1, Math.floor(lineReveal * data.length));
  const linePath = data
    .slice(0, visiblePoints)
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d.c)}`)
    .join(' ');

  return (
    <AbsoluteFill
      style={{
        padding: '80px 120px',
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 32,
          marginBottom: 32,
          opacity: titleOpacity,
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700 }}>{displayName ?? ticker}</div>
        <div style={{ fontSize: 32, opacity: 0.7, fontFamily: 'Inter' }}>{ticker}</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 56, fontWeight: 700, fontFamily: 'Inter' }}>{last.toFixed(2)}</div>
        <div
          style={{
            fontSize: 40,
            color: isUp ? colors.up : colors.down,
            fontFamily: 'Inter',
            fontWeight: 600,
          }}
        >
          {isUp ? '▲' : '▼'} {pct.toFixed(2)}%
        </div>
      </div>

      <svg width={w} height={h} style={{ overflow: 'visible' }}>
        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={w - padX}
            y1={padY + g * innerH}
            y2={padY + g * innerH}
            stroke="#ffffff"
            strokeOpacity={0.1}
            strokeDasharray="4 4"
          />
        ))}

        {chartType === 'candle' &&
          data.map((d, i) => {
            const startFrame = 20 + i * 2;
            const grow = interpolate(frame, [startFrame, startFrame + 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const x = xFor(i);
            const up = d.c >= d.o;
            const color = up ? colors.up : colors.down;
            const yHigh = yFor(d.h);
            const yLow = yFor(d.l);
            const yOpen = yFor(d.o);
            const yClose = yFor(d.c);
            const bodyTop = Math.min(yOpen, yClose);
            const bodyH = Math.max(2, Math.abs(yClose - yOpen)) * grow;
            const cw = Math.max(2, innerW / Math.max(data.length, 1) - 6);
            return (
              <g key={i} opacity={grow}>
                <line x1={x} x2={x} y1={yHigh} y2={yLow} stroke={color} strokeWidth={1.5} />
                <rect
                  x={x - cw / 2}
                  y={bodyTop}
                  width={cw}
                  height={bodyH}
                  fill={color}
                />
              </g>
            );
          })}

        {chartType === 'line' && (
          <>
            <path d={linePath} fill="none" stroke={isUp ? colors.up : colors.down} strokeWidth={4} />
            {visiblePoints > 0 && (
              <circle
                cx={xFor(visiblePoints - 1)}
                cy={yFor(data[visiblePoints - 1]?.c ?? 0)}
                r={8}
                fill={isUp ? colors.up : colors.down}
              />
            )}
          </>
        )}

        {/* annotations */}
        {annotations.map((a, i) => {
          const idx = data.findIndex((d) => d.t === a.timestamp);
          if (idx === -1) return null;
          const fallStart = 60 + i * 8;
          const fall = interpolate(frame, [fallStart, fallStart + 14], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const x = xFor(idx);
          const labelY = a.placement === 'bottom' ? h - 20 : 36;
          return (
            <g key={i} opacity={fall}>
              <line x1={x} x2={x} y1={padY} y2={h - padY} stroke={a.color ?? '#fbbf24'} strokeDasharray="6 4" strokeWidth={1.5} />
              <rect
                x={x - 100}
                y={labelY - 28}
                width={200}
                height={36}
                rx={6}
                fill={a.color ?? '#fbbf24'}
              />
              <text x={x} y={labelY - 4} textAnchor="middle" fill="#0a0e27" fontSize={20} fontWeight={600}>
                {a.label}
              </text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'StockChart',
  tier: 'data',
  description: 'K线 / 折线图 + 关键事件标注。支持美股 / A股配色。',
  schema: PropsSchema,
  defaults: { chartType: 'candle', scheme: 'us', showVolume: false, annotations: [] },
  component: StockChart,
});
