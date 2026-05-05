import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Html5Audio} from 'remotion';

// Test with a known working public domain audio sample
// Using a simple test tone from a reliable source
const AUDIO_SRC =
  'https://www.kozco.com/tech/LRMonoPhase4.wav';

export const AudioTest: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  // Create animated waveform bars (visual indicator even without audio)
  const barCount = 12;
  const bars = Array.from({length: barCount}, (_, i) => {
    // Create wave-like motion using sine interpolation
    const phase = (i / barCount) * Math.PI * 2;
    const animatedHeight = interpolate(
      Math.sin(frame * 0.3 + phase),
      [-1, 1],
      [20, 100]
    );
    return animatedHeight;
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Audio component with public domain audio */}
      <Html5Audio src={AUDIO_SRC} />

      {/* Title */}
      <div
        style={{
          color: 'white',
          fontSize: 48,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          marginBottom: 60,
        }}
      >
        Audio Test
      </div>

      {/* Animated waveform bars */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          height: 120,
          padding: '20px 40px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 16,
        }}
      >
        {bars.map((height, i) => (
          <div
            key={i}
            style={{
              width: 20,
              height,
              backgroundColor: `hsl(${(i / barCount) * 360 + frame * 2}, 70%, 60%)`,
              borderRadius: 4,
              transition: 'height 0.05s ease-out',
            }}
          />
        ))}
      </div>

      {/* Status indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 40,
          color: '#888',
          fontSize: 18,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#4ecdc4',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
        <span>Frame: {frame} / {durationInFrames}</span>
      </div>

      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
          }
        `}
      </style>
    </AbsoluteFill>
  );
};
