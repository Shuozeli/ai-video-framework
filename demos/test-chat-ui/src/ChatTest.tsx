import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const messages = [
  { side: 'right' as const, text: 'Hey! How are you doing today?', avatar: '#FF6B6B', timestamp: '10:30 AM' },
  { side: 'left' as const, text: "I'm doing great! Just finished working on the new design.", avatar: '#4ECDC4', timestamp: '10:32 AM' },
  { side: 'right' as const, text: 'That sounds awesome! Can you tell me more about it?', avatar: '#FF6B6B', timestamp: '10:33 AM' },
  { side: 'left' as const, text: 'Sure thing! It has these smooth animations and a really clean layout.', avatar: '#4ECDC4', timestamp: '10:35 AM' },
  { side: 'right' as const, text: 'I would love to see it!', avatar: '#FF6B6B', timestamp: '10:36 AM' },
];

export const ChatTest: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
        justifyContent: 'flex-end',
        padding: 60,
      }}
    >
      {messages.map((msg, i) => {
        const baseDelay = i * 40;
        const msgFrame = Math.max(0, frame - baseDelay);

        const opacity = interpolate(msgFrame, [0, 15], [0, 1]);
        const translateY = interpolate(msgFrame, [0, 15], [20, 0]);
        const scale = interpolate(msgFrame, [0, 15], [0.8, 1]);

        const isRight = msg.side === 'right';

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              alignSelf: isRight ? 'flex-end' : 'flex-start',
              marginBottom: 20,
              opacity,
              transform: `translateY(${translateY}px) scale(${scale})`,
            }}
          >
            {!isRight && (
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: msg.avatar,
                  marginRight: 12,
                  flexShrink: 0,
                }}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRight ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  backgroundColor: isRight ? '#FF6B6B' : '#4ECDC4',
                  borderRadius: isRight
                    ? '18px 18px 4px 18px'
                    : '18px 18px 18px 4px',
                  padding: '14px 20px',
                  maxWidth: 500,
                }}
              >
                <span
                  style={{
                    color: '#fff',
                    fontSize: 28,
                    fontFamily: 'Arial, sans-serif',
                    lineHeight: 1.4,
                  }}
                >
                  {msg.text.slice(0, interpolate(msgFrame, [0, 30], [0, msg.text.length], { extrapolateLeft: 'clamp' }))}
                </span>
              </div>

              <span
                style={{
                  color: '#888',
                  fontSize: 18,
                  marginTop: 6,
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {msg.timestamp}
              </span>
            </div>

            {isRight && (
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: msg.avatar,
                  marginLeft: 12,
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
