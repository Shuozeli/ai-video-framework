import React from 'react';
import { z } from 'zod';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { registerTemplate } from '../registry';

const PropsSchema = z.object({
  platform: z.enum(['x', 'weibo', 'threads', 'linkedin']),
  authorName: z.string().min(1),
  authorHandle: z.string().min(1),
  authorAvatarRef: z.string().optional(),
  authorVerified: z.boolean().default(false),
  content: z.string().min(1),
  postedAt: z.string().optional(),
  likes: z.number().int().nonnegative().optional(),
  reposts: z.number().int().nonnegative().optional(),
  screenshotRef: z.string().optional(),
});

type Props = z.infer<typeof PropsSchema>;

const PLATFORMS = {
  x: { name: 'X', accent: '#1d9bf0', bg: '#000000', color: '#e7e9ea', glyph: '𝕏' },
  weibo: { name: 'Weibo', accent: '#e6162d', bg: '#ffffff', color: '#0f172a', glyph: '微' },
  threads: { name: 'Threads', accent: '#101010', bg: '#0a0a0a', color: '#f5f5f5', glyph: '@' },
  linkedin: { name: 'LinkedIn', accent: '#0a66c2', bg: '#ffffff', color: '#0f172a', glyph: 'in' },
} as const;

function formatCount(n: number | undefined): string {
  if (n === undefined) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const SocialCard: React.FC<Props> = ({
  platform,
  authorName,
  authorHandle,
  authorVerified,
  content,
  postedAt,
  likes,
  reposts,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 24], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 24], [0.95, 1], { extrapolateRight: 'clamp' });
  const y = interpolate(frame, [0, 24], [30, 0], { extrapolateRight: 'clamp' });

  const p = PLATFORMS[platform];

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <div
        style={{
          width: 900,
          background: p.bg,
          color: p.color,
          borderRadius: 20,
          padding: 40,
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          fontFamily: '"Inter", "Noto Sans CJK SC", sans-serif',
          opacity,
          transform: `scale(${scale}) translateY(${y}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: p.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {authorName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 700 }}>{authorName}</span>
              {authorVerified && (
                <span
                  style={{
                    color: p.accent,
                    fontSize: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  ✓
                </span>
              )}
            </div>
            <div style={{ fontSize: 24, opacity: 0.6 }}>
              {authorHandle}
              {postedAt && <span> · {postedAt}</span>}
            </div>
          </div>
          <div style={{ fontSize: 36, opacity: 0.9, fontWeight: 700 }}>{p.glyph}</div>
        </div>

        <div style={{ fontSize: 36, lineHeight: 1.5, marginTop: 24, whiteSpace: 'pre-wrap' }}>
          {content}
        </div>

        {(likes !== undefined || reposts !== undefined) && (
          <div
            style={{
              display: 'flex',
              gap: 40,
              marginTop: 24,
              paddingTop: 20,
              borderTop: `1px solid ${p.color}22`,
              fontSize: 24,
              opacity: 0.7,
            }}
          >
            {reposts !== undefined && (
              <div>
                <span style={{ fontWeight: 700 }}>{formatCount(reposts)}</span> Reposts
              </div>
            )}
            {likes !== undefined && (
              <div>
                <span style={{ fontWeight: 700 }}>{formatCount(likes)}</span> Likes
              </div>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

registerTemplate({
  name: 'SocialCard',
  tier: 'logic',
  description: '社交平台帖子卡(X / Weibo / Threads / LinkedIn);fade-up + 轻缩放。',
  schema: PropsSchema,
  defaults: { authorVerified: false },
  component: SocialCard,
});
