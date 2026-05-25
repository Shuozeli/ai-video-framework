import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { registerTemplate } from '../registry';

const PropsSchema = z.object({
  label: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
  prefix: z.string().optional(),
  caption: z.string().optional(),
  arrow: z.enum(['up', 'down', 'none']).default('none'),
  color: z.string().optional(),
  rollFromZero: z.boolean().default(true),
});

type Props = z.infer<typeof PropsSchema>;

const BigNumberCard: React.FC<Props> = ({
  label,
  value,
  unit,
  prefix,
  caption,
  arrow,
  color,
  rollFromZero,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const resolvedColor =
    color ?? (arrow === 'up' ? '#22c55e' : arrow === 'down' ? '#ef4444' : '#ffffff');

  const labelOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const labelY = interpolate(frame, [0, 18], [-20, 0], { extrapolateRight: 'clamp' });

  const rollProgress = rollFromZero
    ? interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;
  const displayValue = value * rollProgress;
  const decimals = Number.isInteger(value) ? 0 : Math.min(2, (value.toString().split('.')[1] ?? '').length);

  const arrowEnter = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 130 },
  });

  const captionOpacity = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        fontFamily: '"Noto Serif CJK SC", "Inter", sans-serif',
        color: '#fff',
        padding: 80,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 44,
          opacity: labelOpacity * 0.8,
          transform: `translateY(${labelY}px)`,
          marginBottom: 32,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 24,
          color: resolvedColor,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {arrow !== 'none' && (
          <div
            style={{
              fontSize: 240,
              transform: `scale(${arrowEnter})`,
              lineHeight: 1,
            }}
          >
            {arrow === 'up' ? '▲' : '▼'}
          </div>
        )}
        <div
          style={{
            fontSize: 360,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: -8,
          }}
        >
          {prefix ?? ''}
          {displayValue.toFixed(decimals)}
          <span style={{ fontSize: 180, marginLeft: 16 }}>{unit ?? ''}</span>
        </div>
      </div>
      {caption && (
        <div
          style={{
            fontSize: 40,
            marginTop: 48,
            opacity: captionOpacity * 0.85,
            maxWidth: 1400,
            lineHeight: 1.3,
          }}
        >
          {caption}
        </div>
      )}
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'BigNumberCard',
  tier: 'data',
  description: '单一爆点数字全屏展示;数字 0→target 滚动 + 箭头 spring 弹入。',
  schema: PropsSchema,
  defaults: { arrow: 'none', rollFromZero: true },
  component: BigNumberCard,
});
