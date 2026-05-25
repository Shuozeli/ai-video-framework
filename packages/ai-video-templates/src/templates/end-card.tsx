import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { registerTemplate } from '../registry';

const CtaSchema = z.object({
  label: z.string().min(1),
  sublabel: z.string().optional(),
  iconRef: z.string().optional(),
});

const PropsSchema = z.object({
  message: z.string().min(1),
  ctas: z.array(CtaSchema).max(3).default([]),
  qrCodeRef: z.string().optional(),
  accent: z.string().default('#22c55e'),
});

type Props = z.infer<typeof PropsSchema>;

const EndCard: React.FC<Props> = ({ message, ctas, accent }) => {
  const frame = useCurrentFrame();

  const msgOpacity = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: 'clamp' });
  const msgY = interpolate(frame, [0, 24], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 64,
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
        padding: 120,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 88,
          fontWeight: 700,
          opacity: msgOpacity,
          transform: `translateY(${msgY}px)`,
          maxWidth: 1500,
          lineHeight: 1.2,
        }}
      >
        {message}
      </div>

      {ctas.length > 0 && (
        <div style={{ display: 'flex', gap: 40, marginTop: 24 }}>
          {ctas.map((c, i) => {
            const startFrame = 30 + i * 12;
            const opacity = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const y = interpolate(frame, [startFrame, startFrame + 18], [30, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: `2px solid ${accent}`,
                  borderRadius: 16,
                  padding: '32px 48px',
                  minWidth: 280,
                  opacity,
                  transform: `translateY(${y}px)`,
                }}
              >
                <div style={{ fontSize: 44, fontWeight: 700, color: accent }}>{c.label}</div>
                {c.sublabel && (
                  <div style={{ fontSize: 28, marginTop: 12, opacity: 0.8 }}>{c.sublabel}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'EndCard',
  tier: 'narrative',
  description: '视频结尾:主文案 + 0-3 个 CTA 卡。主文案 fade-up,CTA 依次 fade-up。',
  schema: PropsSchema,
  defaults: { accent: '#22c55e', ctas: [] },
  component: EndCard,
});
