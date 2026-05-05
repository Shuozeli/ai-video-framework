import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const SpringDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Test different spring configs
  const scale1 = spring({frame, fps, config: {damping: 10, stiffness: 100, mass: 1}});
  const scale2 = spring({frame, fps, config: {damping: 20, stiffness: 100, mass: 1}});
  const scale3 = spring({frame, fps, config: {damping: 5, stiffness: 200, mass: 0.5}});

  return (
    <AbsoluteFill style={{backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center'}}>
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
            damping: 10, stiffness: 100
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
            damping: 20, stiffness: 100
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
            damping: 5, stiffness: 200
          </div>
        </div>
      </div>

      <div style={{color: '#888', marginTop: 60, fontSize: 18}}>
        spring() Animation Test - Frame: {frame}
      </div>
    </AbsoluteFill>
  );
};
