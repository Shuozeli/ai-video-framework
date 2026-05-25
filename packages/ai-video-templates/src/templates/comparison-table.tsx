import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { registerTemplate } from '../registry';

const ColumnSchema = z.object({
  label: z.string().min(1),
  logoRef: z.string().optional(),
  accent: z.string().optional(),
});

const RowSchema = z.object({
  label: z.string().min(1),
  values: z.array(z.union([z.string(), z.number()])),
  highlight: z.number().int().min(0).optional(),
  higherIsBetter: z.boolean().optional(),
});

const PropsSchema = z.object({
  title: z.string().optional(),
  columns: z.array(ColumnSchema).min(2).max(4),
  rows: z.array(RowSchema).min(1),
});

type Props = z.infer<typeof PropsSchema>;

function resolveHighlight(row: z.infer<typeof RowSchema>): number | null {
  if (row.highlight !== undefined) return row.highlight;
  if (row.higherIsBetter === undefined) return null;
  const numeric = row.values.map((v) => (typeof v === 'number' ? v : Number(v)));
  if (numeric.some(Number.isNaN)) return null;
  const target = row.higherIsBetter ? Math.max(...numeric) : Math.min(...numeric);
  return numeric.indexOf(target);
}

const ComparisonTable: React.FC<Props> = ({ title, columns, rows }) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        padding: '80px 120px',
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
      }}
    >
      {title && (
        <div style={{ fontSize: 56, fontWeight: 700, marginBottom: 40, opacity: titleOpacity }}>
          {title}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `260px repeat(${columns.length}, 1fr)`,
          rowGap: 12,
          columnGap: 16,
          fontSize: 32,
        }}
      >
        {/* header row */}
        <div />
        {columns.map((c, i) => {
          const headerOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });
          return (
            <div
              key={i}
              style={{
                padding: 20,
                background: 'rgba(255,255,255,0.06)',
                borderTop: `4px solid ${c.accent ?? '#22c55e'}`,
                borderRadius: '8px 8px 0 0',
                fontWeight: 700,
                textAlign: 'center',
                opacity: headerOpacity,
              }}
            >
              {c.label}
            </div>
          );
        })}

        {rows.map((row, ri) => {
          const startFrame = 25 + ri * 6;
          const rowOpacity = interpolate(frame, [startFrame, startFrame + 16], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const rowY = interpolate(frame, [startFrame, startFrame + 16], [20, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const winner = resolveHighlight(row);
          const pulseFrame = frame - (startFrame + 18);
          const pulse =
            winner === null
              ? 0
              : interpolate(pulseFrame, [0, 8, 16], [0, 0.6, 0.25], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });

          return (
            <React.Fragment key={ri}>
              <div
                style={{
                  padding: 20,
                  opacity: rowOpacity * 0.85,
                  transform: `translateY(${rowY}px)`,
                  fontSize: 28,
                }}
              >
                {row.label}
              </div>
              {row.values.map((v, ci) => {
                const isWinner = winner === ci;
                return (
                  <div
                    key={ci}
                    style={{
                      padding: 20,
                      textAlign: 'center',
                      background: isWinner
                        ? `rgba(34,197,94,${0.15 + pulse * 0.2})`
                        : 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      fontWeight: isWinner ? 700 : 400,
                      fontFamily: typeof v === 'number' ? 'Inter' : undefined,
                      opacity: rowOpacity,
                      transform: `translateY(${rowY}px)`,
                    }}
                  >
                    {v}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'ComparisonTable',
  tier: 'data',
  description: '2-4 列对比表,胜出格自动 pulse 高亮(highlight 显式 or higherIsBetter 自动)。',
  schema: PropsSchema,
  defaults: {},
  component: ComparisonTable,
});
