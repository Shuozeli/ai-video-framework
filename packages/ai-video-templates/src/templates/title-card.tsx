import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { registerTemplate } from '../registry';

const PropsSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  logoRef: z.string().optional(),
  accent: z.string().default('#22c55e'),
});

type Props = z.infer<typeof PropsSchema>;

const TitleCard: React.FC<Props> = ({ title, subtitle, accent }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const titleEnter = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleScale = interpolate(titleEnter, [0, 1], [0.85, 1]);
  const titleOpacity = titleEnter;

  const subtitleOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: 'clamp' });
  const subtitleY = interpolate(frame, [15, 30], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
        textAlign: 'center',
        padding: 120,
      }}
    >
      <div
        style={{
          width: 240,
          height: 6,
          background: accent,
          marginBottom: 48,
          opacity: titleOpacity,
        }}
      />
      <div
        style={{
          fontSize: 120,
          fontWeight: 800,
          lineHeight: 1.1,
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          maxWidth: width - 240,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: 48,
            fontWeight: 400,
            marginTop: 40,
            opacity: subtitleOpacity * 0.85,
            transform: `translateY(${subtitleY}px)`,
            letterSpacing: 2,
          }}
        >
          {subtitle}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: height * 0.08,
          width: 80,
          height: 4,
          background: accent,
          opacity: subtitleOpacity * 0.6,
        }}
      />
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'TitleCard',
  tier: 'narrative',
  description: '视频开头封面:主标题 + 副标题。spring 弹入,副标题 fade-up。',
  schema: PropsSchema,
  defaults: { accent: '#22c55e' },
  component: TitleCard,
});
