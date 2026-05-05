import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring} from 'remotion';

export const InterpolationDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Test 1: opacity 0 -> 1 over 30 frames
  const opacity1 = interpolate(frame, [0, 30], [0, 1]);

  // Test 2: position -200 -> 0
  const translateX = interpolate(frame, [30, 60], [-200, 0]);

  // Test 3: scale 0.5 -> 1.5
  const scale = interpolate(frame, [60, 90], [0.5, 1.5]);

  // Test 4: rotate 0 -> 360
  const rotate = interpolate(frame, [0, 120], [0, 360]);

  // Test 5: with extrapolate clamp (default)
  const clampTest = interpolate(frame, [0, 30], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Test 6: color interpolation
  const bgColorR = interpolate(frame, [0, 60], [255, 100]);
  const bgColorB = interpolate(frame, [0, 60], [100, 200]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgb(${bgColorR}, 50, ${bgColorB})`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Frame indicator */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        color: 'white',
        fontSize: 24,
        fontFamily: 'monospace',
      }}>
        Frame: {frame}
      </div>

      {/* Test 1: Opacity fade in */}
      <div
        style={{
          width: 200,
          height: 200,
          backgroundColor: '#ff6b6b',
          borderRadius: 20,
          opacity: opacity1,
          marginBottom: 40,
        }}
      />
      <div style={{color: 'white', marginBottom: 60}}>opacity: 0 → 1 (frames 0-30)</div>

      {/* Test 2: Slide in from left */}
      <div
        style={{
          width: 200,
          height: 200,
          backgroundColor: '#4ecdc4',
          borderRadius: 20,
          transform: `translateX(${translateX}px)`,
          marginBottom: 40,
        }}
      />
      <div style={{color: 'white', marginBottom: 60}}>translateX: -200 → 0 (frames 30-60)</div>

      {/* Test 3: Scale */}
      <div
        style={{
          width: 100,
          height: 100,
          backgroundColor: '#ffe66d',
          borderRadius: 10,
          transform: `scale(${scale})`,
          marginBottom: 40,
        }}
      />
      <div style={{color: 'white', marginBottom: 60}}>scale: 0.5 → 1.5 (frames 60-90)</div>

      {/* Test 4: Rotation */}
      <div
        style={{
          width: 100,
          height: 100,
          backgroundColor: '#c44dff',
          borderRadius: 10,
          transform: `rotate(${rotate}deg)`,
          marginBottom: 40,
        }}
      />
      <div style={{color: 'white', marginBottom: 60}}>rotate: 0 → 360 (frames 0-120)</div>

      {/* Test 5: Clamp */}
      <div style={{color: 'white', fontSize: 24}}>
        clampTest (extrapolate clamp): {clampTest.toFixed(1)}
      </div>
    </AbsoluteFill>
  );
};
