import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {interpolatePath} from '@remotion/paths';

// Two SVG paths to interpolate between
// Path 1: A simple circle
const circlePath = 'M 100 50 A 50 50 0 1 1 100 49.99 Z';

// Path 2: A square-ish shape
const squarePath = 'M 50 50 L 150 50 L 150 150 L 50 150 Z';

// Path 3: A star shape
const starPath = 'M 100 25 L 120 80 L 180 80 L 130 115 L 150 175 L 100 140 L 50 175 L 70 115 L 20 80 L 80 80 Z';

// Path 4: Heart shape (using cubic beziers)
const heartPath = 'M 100 160 C 100 160 40 110 40 70 A 30 30 0 0 1 100 70 A 30 30 0 0 1 160 70 C 160 110 100 160 100 160 Z';

export const InterpolatePathDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Full animation duration: 150 frames
  // Interpolate value from 0 to 1
  const t = interpolate(frame, [0, 149], [0, 1]);

  // Interpolate between circle and square (frames 0-74)
  const circleToSquare = interpolatePath(t, circlePath, squarePath);

  // Interpolate between square and star (frames 37-112)
  const squareToStar = interpolatePath(
    interpolate(frame, [37, 112], [0, 1]),
    squarePath,
    starPath
  );

  // Interpolate between star and heart (frames 75-149)
  const starToHeart = interpolatePath(
    interpolate(frame, [75, 149], [0, 1]),
    starPath,
    heartPath
  );

  // Blend: first half circle->square, second half star->heart
  const morphPath = frame < 75 ? circleToSquare : starToHeart;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
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

      {/* Title */}
      <div style={{
        position: 'absolute',
        top: 40,
        left: 40,
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
      }}>
        interpolatePath() Test
      </div>

      {/* Primary morphing path */}
      <svg
        width="400"
        height="400"
        viewBox="0 0 200 200"
        style={{marginBottom: 40}}
      >
        <path
          d={morphPath}
          fill="none"
          stroke="#4ecdc4"
          strokeWidth="3"
        />
      </svg>

      {/* Interpolated value display */}
      <div style={{
        color: '#ffe66d',
        fontSize: 28,
        fontFamily: 'monospace',
        marginBottom: 20,
      }}>
        t = {t.toFixed(3)}
      </div>

      {/* Instruction text */}
      <div style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: 20,
        maxWidth: 600,
        textAlign: 'center',
      }}>
        {frame < 75 ? 'Morphing: Circle → Square → Star' : 'Morphing: Star → Heart'}
      </div>

      {/* Phase indicator */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 16,
      }}>
        Phase: {frame < 37 ? '1 (circle→square)' : frame < 75 ? '2 (square→star)' : '3 (star→heart)'}
      </div>
    </AbsoluteFill>
  );
};
