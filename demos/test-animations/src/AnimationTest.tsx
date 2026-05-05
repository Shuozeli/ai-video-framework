import {AbsoluteFill, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig} from 'remotion';

export const AnimationTest: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ========== SPRING TESTS ==========
  const spring1 = spring({frame, fps, config: {damping: 10, stiffness: 100, mass: 1}});
  const spring2 = spring({frame, fps, config: {damping: 30, stiffness: 100, mass: 1}});
  const spring3 = spring({frame, fps, config: {damping: 10, stiffness: 200, mass: 0.5}});
  const spring4 = spring({frame, fps, config: {damping: 5, stiffness: 50, mass: 2}});

  // ========== INTERPOLATE TESTS ==========
  // Test 1: Basic 0-1 interpolation
  const basic = interpolate(frame, [0, 30], [0, 1]);

  // Test 2: Negative input range
  const negativeRange = interpolate(frame, [-30, 0], [0, 100]);

  // Test 3: Extrapolate clamp
  const clampTest = interpolate(frame, [20, 40], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Test 4: Extrapolate extend (default)
  const extendTest = interpolate(frame, [20, 40], [0, 100], {extrapolateLeft: 'extend', extrapolateRight: 'extend'});

  // Test 5: Multiple keyframes
  const multiKeyframes = interpolate(frame, [0, 30, 60, 90], [0, 100, 50, 200]);

  // Test 6: Reverse range
  const reverseRange = interpolate(frame, [0, 30], [1, 0]);

  // Test 7: Custom easing via interpolate (easing function as option)
  const easeInQuad = interpolate(frame, [0, 30], [0, 1], {easing: (t) => t * t});
  const easeOutQuad = interpolate(frame, [30, 60], [0, 1], {easing: (t) => 1 - (1 - t) * (1 - t)});
  const easeInOutQuad = interpolate(frame, [60, 90], [0, 1], {easing: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2});

  // ========== INTERPOLATE COLORS TESTS ==========
  // Test 1: Two-color transition
  const colorTransition2 = interpolateColors(
    frame,
    [0, 60],
    ['#ff0000', '#00ff00']
  );

  // Test 2: Three-color transition
  const colorTransition3 = interpolateColors(
    frame,
    [0, 60, 120],
    ['#ff0000', '#00ff00', '#0000ff']
  );

  // Test 3: More complex color palette
  const colorTransition4 = interpolateColors(
    frame,
    [0, 40, 80, 120],
    ['#ff6b6b', '#4ecdc4', '#ffe66d', '#c44dff']
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Frame indicator */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 20,
        color: 'white',
        fontSize: 20,
        fontFamily: 'monospace',
      }}>
        Frame: {frame}
      </div>

      {/* ========== SPRING SECTION ========== */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <div style={{color: '#888', fontSize: 16, marginBottom: 10}}>SPRING TESTS</div>

        <div style={{display: 'flex', gap: 40, alignItems: 'flex-end'}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{
              width: 60,
              height: 60,
              backgroundColor: '#ff6b6b',
              borderRadius: 10,
              transform: `scale(${spring1})`,
            }} />
            <div style={{color: 'white', fontSize: 12, marginTop: 8}}>d:10 s:100 m:1</div>
            <div style={{color: '#888', fontSize: 10}}>Bouncy</div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{
              width: 60,
              height: 60,
              backgroundColor: '#4ecdc4',
              borderRadius: 10,
              transform: `scale(${spring2})`,
            }} />
            <div style={{color: 'white', fontSize: 12, marginTop: 8}}>d:30 s:100 m:1</div>
            <div style={{color: '#888', fontSize: 10}}>Smooth</div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{
              width: 60,
              height: 60,
              backgroundColor: '#ffe66d',
              borderRadius: 10,
              transform: `scale(${spring3})`,
            }} />
            <div style={{color: 'white', fontSize: 12, marginTop: 8}}>d:10 s:200 m:0.5</div>
            <div style={{color: '#888', fontSize: 10}}>Fast/snappy</div>
          </div>

          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{
              width: 60,
              height: 60,
              backgroundColor: '#c44dff',
              borderRadius: 10,
              transform: `scale(${spring4})`,
            }} />
            <div style={{color: 'white', fontSize: 12, marginTop: 8}}>d:5 s:50 m:2</div>
            <div style={{color: '#888', fontSize: 10}}>Heavy/wobbly</div>
          </div>
        </div>
      </div>

      {/* ========== INTERPOLATE SECTION ========== */}
      <div style={{
        position: 'absolute',
        top: 200,
        left: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 15,
      }}>
        <div style={{color: '#888', fontSize: 16, marginBottom: 10}}>INTERPOLATE TESTS</div>

        <div style={{color: 'white', fontSize: 14}}>
          basic (0-30): {basic.toFixed(3)}
        </div>
        <div style={{color: 'white', fontSize: 14}}>
          negative range (-30-0): {negativeRange.toFixed(1)}
        </div>
        <div style={{color: 'white', fontSize: 14}}>
          clamp (20-40): {clampTest.toFixed(1)}
        </div>
        <div style={{color: 'white', fontSize: 14}}>
          extend (20-40): {extendTest.toFixed(1)}
        </div>
        <div style={{color: 'white', fontSize: 14}}>
          multi-keyframes: {multiKeyframes.toFixed(1)}
        </div>
        <div style={{color: 'white', fontSize: 14}}>
          reverse (1-0): {reverseRange.toFixed(3)}
        </div>
        <div style={{color: 'white', fontSize: 14}}>
          easeInQuad (t^2): {easeInQuad.toFixed(3)}
        </div>
        <div style={{color: 'white', fontSize: 14}}>
          easeOutQuad: {easeOutQuad.toFixed(3)}
        </div>
        <div style={{color: 'white', fontSize: 14}}>
          easeInOutQuad: {easeInOutQuad.toFixed(3)}
        </div>
      </div>

      {/* ========== INTERPOLATE COLORS SECTION ========== */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <div style={{color: '#888', fontSize: 16, marginBottom: 10}}>INTERPOLATE COLORS</div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 15}}>
          <div>
            <div style={{color: 'white', fontSize: 12, marginBottom: 5}}>2 colors (red to green)</div>
            <div style={{
              width: 200,
              height: 40,
              backgroundColor: colorTransition2,
              borderRadius: 8,
            }} />
          </div>

          <div>
            <div style={{color: 'white', fontSize: 12, marginBottom: 5}}>3 colors (red to green to blue)</div>
            <div style={{
              width: 200,
              height: 40,
              backgroundColor: colorTransition3,
              borderRadius: 8,
            }} />
          </div>

          <div>
            <div style={{color: 'white', fontSize: 12, marginBottom: 5}}>4 colors palette</div>
            <div style={{
              width: 200,
              height: 40,
              backgroundColor: colorTransition4,
              borderRadius: 8,
            }} />
          </div>
        </div>
      </div>

      {/* ========== VISUAL DEMO SECTION ========== */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 20,
        right: 20,
        display: 'flex',
        gap: 30,
        justifyContent: 'center',
      }}>
        {/* Animated square showing spring */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{
            width: 80,
            height: 80,
            backgroundColor: '#ff6b6b',
            borderRadius: 15,
            transform: `scale(${spring1})`,
          }} />
          <div style={{color: '#888', fontSize: 12, marginTop: 10}}>Spring 1</div>
        </div>

        {/* Animated square showing interpolate */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{
            width: 80,
            height: 80,
            backgroundColor: '#4ecdc4',
            borderRadius: 15,
            transform: `translateX(${interpolate(frame, [0, 60], [-100, 100])}px)`,
          }} />
          <div style={{color: '#888', fontSize: 12, marginTop: 10}}>Translate X</div>
        </div>

        {/* Animated square showing color */}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 15,
            backgroundColor: colorTransition3,
          }} />
          <div style={{color: '#888', fontSize: 12, marginTop: 10}}>Color</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};