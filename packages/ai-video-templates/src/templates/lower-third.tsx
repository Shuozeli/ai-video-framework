import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { registerTemplate } from '../registry';

const PropsSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  accent: z.string().default('#22c55e'),
  position: z.enum(['bottom-left', 'bottom-center', 'bottom-right']).default('bottom-left'),
  width: z.enum(['full', 'half', 'auto']).default('half'),
});

type Props = z.infer<typeof PropsSchema>;

const LowerThird: React.FC<Props> = ({ title, subtitle, accent, position, width }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width: vw } = useVideoConfig();

  const enterEnd = 15;
  const exitStart = Math.max(enterEnd + 15, durationInFrames - 15);

  const x = interpolate(
    frame,
    [0, enterEnd, exitStart, durationInFrames],
    [-600, 0, 0, -600],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const opacity = interpolate(
    frame,
    [0, enterEnd, exitStart, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const barWidth = width === 'full' ? vw - 80 : width === 'half' ? vw / 2 : 'auto';

  // Remotion's AbsoluteFill is flexDirection:'column'.
  // Vertical = justifyContent, horizontal = alignItems.
  const horizontalAlign =
    position === 'bottom-center'
      ? 'center'
      : position === 'bottom-right'
      ? 'flex-end'
      : 'flex-start';

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: horizontalAlign,
        padding: 40,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          background: 'rgba(10, 14, 39, 0.92)',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          width: barWidth,
          minWidth: 480,
          transform: `translateX(${x}px)`,
          opacity,
        }}
      >
        <div style={{ width: 10, background: accent }} />
        <div
          style={{
            padding: '20px 32px',
            fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
            color: '#fff',
            flex: 1,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
          {subtitle && (
            <div style={{ fontSize: 22, opacity: 0.75, marginTop: 6 }}>{subtitle}</div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'LowerThird',
  tier: 'decoration',
  description: '底部字幕条 / 人物名条 / 数据来源条;slide-in-left → hold → slide-out-left。',
  schema: PropsSchema,
  defaults: { accent: '#22c55e', position: 'bottom-left', width: 'half' },
  component: LowerThird,
});
