import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { registerTemplate } from '../registry';

const PropsSchema = z.object({
  source: z.string().min(1),
  sourceLogoRef: z.string().optional(),
  publishedAt: z.string().optional(),
  headline: z.string().min(1),
  body: z.string().min(1),
  // Per-entry min(1): an empty string would make splitWithHighlights loop
  // forever (indexOf("") returns 0 and slice(0) never advances).
  highlights: z.array(z.string().min(1)).default([]),
  position: z.enum(['left', 'right']).default('right'),
  cardStyle: z.enum(['newspaper', 'web', 'minimal']).default('newspaper'),
});

type Props = z.infer<typeof PropsSchema>;

const STYLES = {
  newspaper: {
    bg: '#f5f5dc',
    color: '#1a1a1a',
    titleFont: '"Noto Serif CJK SC", Georgia, serif',
  },
  web: {
    bg: '#ffffff',
    color: '#0f172a',
    titleFont: '"Inter", sans-serif',
  },
  minimal: {
    bg: 'rgba(15, 23, 42, 0.95)',
    color: '#f1f5f9',
    titleFont: '"Inter", sans-serif',
  },
} as const;

// Split body into fragments, marking highlighted ones for animated underline.
function splitWithHighlights(body: string, highlights: string[]): {
  text: string;
  highlight: boolean;
  highlightIndex: number;
}[] {
  if (highlights.length === 0) return [{ text: body, highlight: false, highlightIndex: -1 }];
  const result: { text: string; highlight: boolean; highlightIndex: number }[] = [];
  let rest = body;
  let hIdx = 0;

  while (rest.length > 0) {
    let nextHit: { idx: number; h: string; hi: number } | null = null;
    highlights.forEach((h, hi) => {
      const idx = rest.indexOf(h);
      if (idx >= 0 && (nextHit === null || idx < nextHit.idx)) {
        nextHit = { idx, h, hi };
      }
    });
    if (!nextHit) {
      result.push({ text: rest, highlight: false, highlightIndex: -1 });
      break;
    }
    const hit: { idx: number; h: string; hi: number } = nextHit;
    if (hit.idx > 0) {
      result.push({ text: rest.slice(0, hit.idx), highlight: false, highlightIndex: -1 });
    }
    result.push({ text: hit.h, highlight: true, highlightIndex: hIdx++ });
    rest = rest.slice(hit.idx + hit.h.length);
  }
  return result;
}

const PiPNewsQuote: React.FC<Props> = ({
  source,
  publishedAt,
  headline,
  body,
  highlights,
  position,
  cardStyle,
}) => {
  const frame = useCurrentFrame();
  const slideX = interpolate(frame, [0, 20], [position === 'right' ? 600 : -600, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const style = STYLES[cardStyle];
  const fragments = splitWithHighlights(body, highlights);

  return (
    <AbsoluteFill
      style={{
        // Remotion AbsoluteFill is column-direction:
        // horizontal placement → alignItems, vertical placement → justifyContent.
        alignItems: position === 'right' ? 'flex-end' : 'flex-start',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <div
        style={{
          width: 720,
          background: style.bg,
          color: style.color,
          padding: 40,
          borderRadius: 8,
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          fontFamily: style.titleFont,
          transform: `translateX(${slideX}px)`,
          opacity,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            {source}
          </div>
          {publishedAt && (
            <div style={{ fontSize: 20, opacity: 0.6, fontFamily: 'Inter' }}>· {publishedAt}</div>
          )}
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.2, marginBottom: 20 }}>
          {headline}
        </div>
        <div style={{ fontSize: 26, lineHeight: 1.6 }}>
          {fragments.map((f, i) => {
            if (!f.highlight) return <span key={i}>{f.text}</span>;
            const start = 30 + f.highlightIndex * 12;
            const reveal = interpolate(frame, [start, start + 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <span
                key={i}
                style={{
                  position: 'relative',
                  background: `linear-gradient(120deg, rgba(251,191,36,0.6) ${reveal * 100}%, transparent ${reveal * 100}%)`,
                  padding: '2px 4px',
                  borderRadius: 2,
                }}
              >
                {f.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'PiPNewsQuote',
  tier: 'logic',
  description: '画中画新闻引述卡;滑入后高亮笔涂抹关键句。',
  schema: PropsSchema,
  defaults: { position: 'right', cardStyle: 'newspaper', highlights: [] },
  component: PiPNewsQuote,
});
