import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { registerTemplate } from '../registry';

const CellSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  weight: z.number().positive().optional(),
  sublabel: z.string().optional(),
});

const ColorScaleSchema = z.object({
  min: z.number(),
  max: z.number(),
  minColor: z.string(),
  maxColor: z.string(),
  midColor: z.string().optional(),
  midValue: z.number().optional(),
});

const PropsSchema = z.object({
  title: z.string().optional(),
  layout: z.enum(['grid', 'treemap']).default('grid'),
  cells: z.array(CellSchema).min(1),
  colorScale: ColorScaleSchema.optional(),
  scheme: z.enum(['us', 'cn', 'mono']).default('us'),
});

type Props = z.infer<typeof PropsSchema>;

const SCHEMES = {
  us: { neg: '#ef4444', mid: '#475569', pos: '#22c55e' },
  cn: { neg: '#22c55e', mid: '#475569', pos: '#ef4444' },
  mono: { neg: '#1e293b', mid: '#475569', pos: '#fbbf24' },
} as const;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function colorFor(
  value: number,
  schemeName: 'us' | 'cn' | 'mono',
  scale: z.infer<typeof ColorScaleSchema> | undefined,
): string {
  if (scale) {
    const { min, max, minColor, maxColor, midColor, midValue } = scale;
    if (midColor !== undefined) {
      const mid = midValue ?? (min + max) / 2;
      if (value <= mid) {
        const t = (value - min) / (mid - min || 1);
        return mix(minColor, midColor, Math.max(0, Math.min(1, t)));
      }
      const t = (value - mid) / (max - mid || 1);
      return mix(midColor, maxColor, Math.max(0, Math.min(1, t)));
    }
    const t = (value - min) / (max - min || 1);
    return mix(minColor, maxColor, Math.max(0, Math.min(1, t)));
  }
  const s = SCHEMES[schemeName];
  // diverging around 0
  if (value === 0) return s.mid;
  if (value > 0) {
    const t = Math.min(1, value / 5);
    return mix(s.mid, s.pos, t);
  }
  const t = Math.min(1, -value / 5);
  return mix(s.mid, s.neg, t);
}

// Recursive-split treemap. At each step, split the items into two roughly
// equal-weight groups and cut the rectangle along its longer axis. Simple,
// always fills the area, and produces a sensible visual hierarchy.
function treemapLayout(
  values: number[],
  width: number,
  height: number,
): { x: number; y: number; w: number; h: number }[] {
  const out: { x: number; y: number; w: number; h: number }[] = new Array(values.length);
  // Sort indices descending so larger boxes lead.
  const indexed = values.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);

  function recurse(group: { v: number; i: number }[], x: number, y: number, w: number, h: number) {
    if (group.length === 0) return;
    if (group.length === 1) {
      out[group[0].i] = { x, y, w, h };
      return;
    }
    const total = group.reduce((s, g) => s + g.v, 0);
    let acc = 0;
    let splitIdx = 1;
    for (let i = 0; i < group.length; i++) {
      acc += group[i].v;
      // Pick the first index where cumulative weight crosses half.
      if (acc >= total / 2) {
        splitIdx = Math.max(1, Math.min(group.length - 1, i + 1));
        break;
      }
    }
    const left = group.slice(0, splitIdx);
    const right = group.slice(splitIdx);
    const leftWeight = left.reduce((s, g) => s + g.v, 0);
    const ratio = leftWeight / total;
    if (w >= h) {
      recurse(left, x, y, w * ratio, h);
      recurse(right, x + w * ratio, y, w * (1 - ratio), h);
    } else {
      recurse(left, x, y, w, h * ratio);
      recurse(right, x, y + h * ratio, w, h * (1 - ratio));
    }
  }

  recurse(indexed, 0, 0, width, height);
  return out;
}

const Heatmap: React.FC<Props> = ({ title, layout, cells, colorScale, scheme }) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const W = 1600;
  const H = 760;

  const rects = (() => {
    if (layout === 'grid') {
      const cols = Math.ceil(Math.sqrt(cells.length));
      const rows = Math.ceil(cells.length / cols);
      const cw = W / cols;
      const ch = H / rows;
      return cells.map((_, i) => ({
        x: (i % cols) * cw,
        y: Math.floor(i / cols) * ch,
        w: cw,
        h: ch,
      }));
    }
    const weights = cells.map((c) => c.weight ?? Math.abs(c.value) + 0.5);
    return treemapLayout(weights, W, H);
  })();

  return (
    <AbsoluteFill
      style={{
        padding: '60px 120px',
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
      }}
    >
      {title && (
        <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 32, opacity: titleOpacity }}>
          {title}
        </div>
      )}
      <div style={{ position: 'relative', width: W, height: H }}>
        {cells.map((cell, i) => {
          const r = rects[i] ?? { x: 0, y: 0, w: 0, h: 0 };
          const startFrame = 15 + Math.min(i, 12) * 2;
          const opacity = interpolate(frame, [startFrame, startFrame + 28], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const bg = colorFor(cell.value, scheme, colorScale);
          const fontSize = Math.max(14, Math.min(48, Math.min(r.w, r.h) * 0.16));
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: r.x,
                top: r.y,
                width: r.w - 4,
                height: r.h - 4,
                background: bg,
                borderRadius: 6,
                opacity,
                padding: 12,
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                overflow: 'hidden',
              }}
            >
              <div style={{ fontSize, fontWeight: 700, lineHeight: 1.1 }}>{cell.label}</div>
              <div
                style={{
                  fontSize: fontSize * 0.7,
                  fontFamily: 'Inter',
                  marginTop: 4,
                  opacity: 0.9,
                }}
              >
                {cell.value >= 0 ? '+' : ''}
                {cell.value.toFixed(2)}
              </div>
              {cell.sublabel && (
                <div style={{ fontSize: fontSize * 0.55, opacity: 0.7, marginTop: 2 }}>
                  {cell.sublabel}
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
  name: 'Heatmap',
  tier: 'data',
  description: '板块/区域热力图;支持 grid 等大或 treemap 按 weight 加权。',
  schema: PropsSchema,
  defaults: { layout: 'grid', scheme: 'us' },
  component: Heatmap,
});
