import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

// Try importing @remotion/paths - it may not be available
// If not available, we fall back to stroke-dashoffset animation
let interpolatePath: ((from: string, to: string, progress: number) => string) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const paths = require('@remotion/paths');
  interpolatePath = paths.interpolatePath;
} catch {
  // @remotion/paths not available
}

// Calculate path length for stroke-dashoffset animation
const CIRCLE_RADIUS = 80;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS; // ~502

// Rectangle outline path (200x120)
const RECT_PATH = 'M 0 0 L 200 0 L 200 120 L 0 120 Z';
const RECT_LENGTH = 2 * (200 + 120); // 640

// Simple polyline (triangle)
const TRIANGLE_PATH = 'M 100 0 L 200 173 L 0 173 Z';
const TRIANGLE_LENGTH = 3 * 200; // 600

export const PathAnimationTest: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  // Total duration: 180 frames (6 seconds at 30fps)
  const totalFrames = 180;
  const progress = Math.min(frame / totalFrames, 1);

  // Animation delays for staggered entrance
  const stagger = (offset: number) => Math.max(0, (frame - offset) / (fps * 1.5));

  // Circle drawing progress (starts at frame 0)
  const circleDraw = interpolate(stagger(0), [0, 1], [0, 1], {extrapolateClamp: true});

  // Rectangle drawing progress (starts at frame 30)
  const rectDraw = interpolate(stagger(30), [0, 1], [0, 1], {extrapolateClamp: true});

  // Triangle drawing progress (starts at frame 60)
  const triangleDraw = interpolate(stagger(60), [0, 1], [0, 1], {extrapolateClamp: true});

  // Fade in text
  const textOpacity = interpolate(stagger(90), [0, 0.5, 1], [0, 0, 1], {extrapolateClamp: true});

  // Check if @remotion/paths interpolatePath is available
  const hasInterpolatePath = interpolatePath !== null;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f0f23',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 60,
        }}
      >
        {/* Title */}
        <div style={{color: '#ffffff', fontSize: 32, fontWeight: 'bold', marginBottom: 20}}>
          SVG Path Animation Test
        </div>

        {/* Shapes row */}
        <div style={{display: 'flex', gap: 100, alignItems: 'center'}}>
          {/* Circle - stroke-dashoffset animation */}
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Background guide circle */}
              <circle
                cx="100"
                cy="100"
                r={CIRCLE_RADIUS}
                fill="none"
                stroke="#333"
                strokeWidth="4"
              />
              {/* Animated circle */}
              <circle
                cx="100"
                cy="100"
                r={CIRCLE_RADIUS}
                fill="none"
                stroke="#ff6b6b"
                strokeWidth="6"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - circleDraw)}
                strokeLinecap="round"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '100px 100px',
                }}
              />
            </svg>
            <div style={{color: '#888', fontSize: 14}}>Circle - stroke-dashoffset</div>
            <div style={{color: '#ff6b6b', fontSize: 12}}>pathLength: {CIRCLE_CIRCUMFERENCE.toFixed(0)}</div>
          </div>

          {/* Rectangle - stroke-dashoffset animation */}
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
            <svg width="240" height="160" viewBox="0 0 240 160">
              {/* Background guide */}
              <rect
                x="20"
                y="20"
                width="200"
                height="120"
                fill="none"
                stroke="#333"
                strokeWidth="4"
              />
              {/* Animated rectangle */}
              <rect
                x="20"
                y="20"
                width="200"
                height="120"
                fill="none"
                stroke="#4ecdc4"
                strokeWidth="6"
                strokeDasharray={RECT_LENGTH}
                strokeDashoffset={RECT_LENGTH * (1 - rectDraw)}
                strokeLinecap="round"
              />
            </svg>
            <div style={{color: '#888', fontSize: 14}}>Rectangle - stroke-dashoffset</div>
            <div style={{color: '#4ecdc4', fontSize: 12}}>pathLength: {RECT_LENGTH}</div>
          </div>

          {/* Triangle - stroke-dashoffset animation */}
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
            <svg width="220" height="200" viewBox="0 0 220 200">
              {/* Background guide */}
              <polygon
                points="110,10 210,185 10,185"
                fill="none"
                stroke="#333"
                strokeWidth="4"
              />
              {/* Animated triangle */}
              <polygon
                points="110,10 210,185 10,185"
                fill="none"
                stroke="#ffe66d"
                strokeWidth="6"
                strokeDasharray={TRIANGLE_LENGTH}
                strokeDashoffset={TRIANGLE_LENGTH * (1 - triangleDraw)}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div style={{color: '#888', fontSize: 14}}>Triangle - stroke-dashoffset</div>
            <div style={{color: '#ffe66d', fontSize: 12}}>pathLength: {TRIANGLE_LENGTH}</div>
          </div>
        </div>

        {/* Status row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            opacity: textOpacity,
          }}
        >
          {/* @remotion/paths availability */}
          <div style={{color: hasInterpolatePath ? '#4ecdc4' : '#ff6b6b', fontSize: 18}}>
            @remotion/paths interpolatePath: {hasInterpolatePath ? 'AVAILABLE' : 'NOT AVAILABLE'}
          </div>

          {/* Frame counter */}
          <div style={{color: '#888', fontSize: 16}}>
            Frame: {frame} / {totalFrames} (progress: {(progress * 100).toFixed(1)}%)
          </div>

          {/* Method note */}
          <div style={{color: '#666', fontSize: 14, textAlign: 'center', maxWidth: 500}}>
            Method: stroke-dashoffset animation using pathLength estimation.
            <br />
            Note: stroke-dasharray/stroke-dashoffset with pathLength attribute works in SVG,
            <br />
            but exact path length calculation requires path.getTotalLength() at runtime.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
