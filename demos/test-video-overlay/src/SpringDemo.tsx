import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const SpringDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Test different spring configs
  const scale1 = spring({frame, fps, config: {damping: 10, stiffness: 100, mass: 1}});
  const scale2 = spring({frame, fps, config: {damping: 20, stiffness: 100, mass: 1}});
  const scale3 = spring({frame, fps, config: {damping: 5, stiffness: 200, mass: 0.5}});

  // Simulated video overlay - animated gradient background
  const hue = (230 + frame * 0.5) % 360;
  const saturation = 70 + Math.sin(frame * 0.05) * 20;

  return (
    <AbsoluteFill style={{backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center'}}>
      {/* Simulated video layer - animated gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, hsl(${hue}, ${saturation}%, 60%) 0%, hsl(${(hue + 50) % 360}, ${saturation}%, 50%) 100%)`,
      }} />

      {/* Text overlay (using native div, not Remotion Text) */}
      <div style={{
        position: 'absolute',
        top: 80,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        textShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
        VIDEO OVERLAY TEST - Frame {frame}
      </div>

      <div style={{display: 'flex', gap: 100}}>
        {/* Bouncy spring */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div
            style={{
              width: 100,
              height: 100,
              backgroundColor: '#ff6b6b',
              borderRadius: 20,
              transform: `scale(${scale1})`,
            }}
          />
          <div style={{color: 'white', marginTop: 20, fontSize: 14}}>
            Video Layer
          </div>
        </div>

        {/* Smooth spring */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div
            style={{
              width: 100,
              height: 100,
              backgroundColor: '#4ecdc4',
              borderRadius: 20,
              transform: `scale(${scale2})`,
            }}
          />
          <div style={{color: 'white', marginTop: 20, fontSize: 14}}>
            Text Overlay
          </div>
        </div>

        {/* Fast & snappy */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div
            style={{
              width: 100,
              height: 100,
              backgroundColor: '#ffe66d',
              borderRadius: 20,
              transform: `scale(${scale3})`,
            }}
          />
          <div style={{color: 'white', marginTop: 20, fontSize: 14}}>
            Frame: {frame}
          </div>
        </div>
      </div>

      <div style={{color: 'rgba(255,255,255,0.8)', marginTop: 60, fontSize: 18}}>
        spring() Animation Test with Video Overlay Capability
      </div>
    </AbsoluteFill>
  );
};