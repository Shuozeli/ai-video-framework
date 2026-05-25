import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { registerTemplate } from '../registry';

const NodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  sublabel: z.string().optional(),
  color: z.string().optional(),
  accent: z.enum(['positive', 'negative', 'neutral']).default('neutral'),
});

const EdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  label: z.string().optional(),
  style: z.enum(['solid', 'dashed']).default('solid'),
});

const PropsSchema = z.object({
  layout: z.enum(['horizontal', 'vertical', 'tree']).default('horizontal'),
  nodes: z.array(NodeSchema).min(1),
  edges: z.array(EdgeSchema).default([]),
  reveal: z.enum(['sequential', 'all']).default('sequential'),
  revealStaggerFrames: z.number().int().positive().default(15),
});

type Props = z.infer<typeof PropsSchema>;

const ACCENT_COLORS: Record<'positive' | 'negative' | 'neutral', string> = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#3b82f6',
};

const NODE_W = 280;
const NODE_H = 120;
const CANVAS_W = 1600;
const CANVAS_H = 800;

function layoutNodes(
  nodes: z.infer<typeof NodeSchema>[],
  layout: 'horizontal' | 'vertical' | 'tree',
): Map<string, { x: number; y: number }> {
  const pos = new Map<string, { x: number; y: number }>();
  if (layout === 'horizontal') {
    const step = nodes.length <= 1 ? 0 : (CANVAS_W - NODE_W) / (nodes.length - 1);
    nodes.forEach((n, i) => {
      pos.set(n.id, { x: i * step, y: CANVAS_H / 2 - NODE_H / 2 });
    });
  } else if (layout === 'vertical') {
    const step = nodes.length <= 1 ? 0 : (CANVAS_H - NODE_H) / (nodes.length - 1);
    nodes.forEach((n, i) => {
      pos.set(n.id, { x: CANVAS_W / 2 - NODE_W / 2, y: i * step });
    });
  } else {
    // tree: root at top, fan out below
    const root = nodes[0];
    const children = nodes.slice(1);
    pos.set(root.id, { x: CANVAS_W / 2 - NODE_W / 2, y: 0 });
    const step = children.length <= 1 ? 0 : (CANVAS_W - NODE_W) / Math.max(children.length - 1, 1);
    const yChild = CANVAS_H - NODE_H;
    children.forEach((n, i) => {
      pos.set(n.id, { x: i * step, y: yChild });
    });
  }
  return pos;
}

const LogicFlow: React.FC<Props> = ({ layout, nodes, edges, reveal, revealStaggerFrames }) => {
  const frame = useCurrentFrame();
  const positions = layoutNodes(nodes, layout);

  const nodeStartFrame = (i: number) =>
    reveal === 'all' ? 0 : 10 + i * revealStaggerFrames;
  const lastNodeFrame = reveal === 'all' ? 30 : nodeStartFrame(nodes.length - 1) + 24;

  return (
    <AbsoluteFill
      style={{
        padding: 80,
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
      }}
    >
      <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H }}>
        <svg
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <defs>
            <marker
              id="lf-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="5"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.8)" />
            </marker>
          </defs>
          {edges.map((e, ei) => {
            const a = positions.get(e.from);
            const b = positions.get(e.to);
            if (!a || !b) return null;
            const startFrame = lastNodeFrame + ei * 6;
            const drawProgress = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const x1 = a.x + NODE_W / 2;
            const y1 = a.y + NODE_H / 2;
            const x2c = b.x + NODE_W / 2;
            const y2c = b.y + NODE_H / 2;
            // Clip the segment so it terminates at the destination node's
            // rect edge — otherwise the arrowhead sits inside the node div
            // and is occluded.
            const dx = x2c - x1;
            const dy = y2c - y1;
            const halfW = NODE_W / 2;
            const halfH = NODE_H / 2;
            const tEdge =
              dx === 0 && dy === 0
                ? 0
                : Math.min(
                    Math.abs(dx) > 0 ? halfW / Math.abs(dx) : Infinity,
                    Math.abs(dy) > 0 ? halfH / Math.abs(dy) : Infinity,
                  );
            const x2 = x2c - dx * tEdge;
            const y2 = y2c - dy * tEdge;
            const cx = x1 + (x2 - x1) * drawProgress;
            const cy = y1 + (y2 - y1) * drawProgress;
            return (
              <g key={ei}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={cx}
                  y2={cy}
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth={3}
                  strokeDasharray={e.style === 'dashed' ? '8 6' : undefined}
                  markerEnd={drawProgress >= 0.95 ? 'url(#lf-arrow)' : undefined}
                />
                {e.label && drawProgress > 0.6 && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 12}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={22}
                    opacity={(drawProgress - 0.6) / 0.4}
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {nodes.map((n, i) => {
          const p = positions.get(n.id)!;
          const startFrame = nodeStartFrame(i);
          const enter = interpolate(frame, [startFrame, startFrame + 20], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const scale = interpolate(enter, [0, 1], [0.7, 1]);
          const color = n.color ?? ACCENT_COLORS[n.accent];
          return (
            <div
              key={n.id}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y,
                width: NODE_W,
                height: NODE_H,
                background: 'rgba(255,255,255,0.04)',
                border: `3px solid ${color}`,
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                opacity: enter,
                transform: `scale(${scale})`,
                transformOrigin: 'center',
                boxShadow: `0 0 24px ${color}33`,
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 700, color }}>{n.label}</div>
              {n.sublabel && (
                <div style={{ fontSize: 18, opacity: 0.7, marginTop: 4 }}>{n.sublabel}</div>
              )}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'LogicFlow',
  tier: 'logic',
  description: '因果推演 / 思维导图;节点 sequential 入场,边在两端节点出现后绘制。',
  schema: PropsSchema,
  defaults: { layout: 'horizontal', edges: [], reveal: 'sequential', revealStaggerFrames: 15 },
  component: LogicFlow,
});
