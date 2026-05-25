import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { registerTemplate } from '../registry';

const EventSchema = z.object({
  date: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  iconRef: z.string().optional(),
  accent: z.string().optional(),
});

const PropsSchema = z.object({
  title: z.string().optional(),
  orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
  events: z.array(EventSchema).min(1).max(8),
});

type Props = z.infer<typeof PropsSchema>;

const Timeline: React.FC<Props> = ({ title, orientation, events }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const lineGrow = interpolate(frame, [10, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const horizontal = orientation === 'horizontal';

  const W = 1600;
  const H = 600;
  const padX = 80;
  const padY = 80;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  return (
    <AbsoluteFill
      style={{
        padding: '60px 80px',
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
      }}
    >
      {title && (
        <div style={{ fontSize: 56, fontWeight: 700, marginBottom: 32, opacity: titleOpacity }}>
          {title}
        </div>
      )}

      <div style={{ position: 'relative', width: W, height: H }}>
        {/* line */}
        {horizontal ? (
          <div
            style={{
              position: 'absolute',
              left: padX,
              top: H / 2 - 3,
              width: innerW * lineGrow,
              height: 6,
              background: '#22c55e',
              borderRadius: 3,
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              left: W / 2 - 3,
              top: padY,
              width: 6,
              height: innerH * lineGrow,
              background: '#22c55e',
              borderRadius: 3,
            }}
          />
        )}

        {events.map((ev, i) => {
          const t = events.length <= 1 ? 0 : i / (events.length - 1);
          const cx = horizontal ? padX + t * innerW : W / 2;
          const cy = horizontal ? H / 2 : padY + t * innerH;
          const nodeStart = 30 + i * 8;
          const nodeEnter = spring({
            frame: frame - nodeStart,
            fps,
            config: { damping: 12, stiffness: 130 },
          });
          const cardOpacity = interpolate(frame, [nodeStart + 6, nodeStart + 26], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const cardY = interpolate(frame, [nodeStart + 6, nodeStart + 26], [16, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const cardAbove = horizontal ? i % 2 === 0 : false;
          const cardLeft = !horizontal && i % 2 === 0;
          const accent = ev.accent ?? '#22c55e';

          return (
            <React.Fragment key={i}>
              <div
                style={{
                  position: 'absolute',
                  left: cx - 16,
                  top: cy - 16,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: accent,
                  boxShadow: `0 0 16px ${accent}aa`,
                  transform: `scale(${nodeEnter})`,
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  // For horizontal mode: clamp card left into [0, W-320] so
                  // first/last cards don't overflow the container.
                  ...(horizontal
                    ? cardAbove
                      ? { left: Math.max(0, Math.min(W - 320, cx - 160)), bottom: H - cy + 36 }
                      : { left: Math.max(0, Math.min(W - 320, cx - 160)), top: cy + 36 }
                    : cardLeft
                    ? { right: W - cx + 36, top: cy - 60 }
                    : { left: cx + 36, top: cy - 60 }),
                  width: 320,
                  padding: 16,
                  background: 'rgba(255,255,255,0.06)',
                  border: `2px solid ${accent}`,
                  borderRadius: 12,
                  opacity: cardOpacity,
                  transform: `translateY(${cardY}px)`,
                  textAlign: horizontal ? 'center' : cardLeft ? 'right' : 'left',
                }}
              >
                <div style={{ fontSize: 22, color: accent, fontFamily: 'Inter', fontWeight: 600 }}>
                  {ev.date}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 4, lineHeight: 1.2 }}>
                  {ev.title}
                </div>
                {ev.description && (
                  <div style={{ fontSize: 20, opacity: 0.75, marginTop: 8, lineHeight: 1.4 }}>
                    {ev.description}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'Timeline',
  tier: 'logic',
  description: '时间轴展示;线先延伸,节点 spring 弹入,卡片随节点 fade-up。',
  schema: PropsSchema,
  defaults: { orientation: 'horizontal' },
  component: Timeline,
});
