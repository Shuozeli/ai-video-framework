import {AbsoluteFill, useCurrentFrame, interpolate, spring} from 'remotion';

// Component for drawing a circle with stroke animation
const DrawingCircle: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame();

  // stroke-dashoffset animation: starts at circumference (hidden), goes to 0 (drawn)
  const dashOffset = interpolate(frame - startFrame, [0, 30], [251.2, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(frame - startFrame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg
      style={{
        position: 'absolute',
        width: 200,
        height: 200,
        opacity,
      }}
      viewBox="0 0 200 200"
    >
      <circle
        cx="100"
        cy="100"
        r="40"
        fill="none"
        stroke="black"
        strokeWidth="3"
        strokeDasharray="251.2"
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </svg>
  );
};

// Component for drawing a line with stroke animation
const DrawingLine: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame();

  // Line length is approximately 283 pixels (100 * sqrt(2) + 100)
  const lineLength = 283;

  const dashOffset = interpolate(frame - startFrame, [0, 30], [lineLength, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const opacity = interpolate(frame - startFrame, [0, 15], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg
      style={{
        position: 'absolute',
        width: 200,
        height: 200,
        opacity,
      }}
      viewBox="0 0 200 200"
    >
      <line
        x1="20"
        y1="20"
        x2="180"
        y2="180"
        fill="none"
        stroke="black"
        strokeWidth="3"
        strokeDasharray={lineLength}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </svg>
  );
};

// Component for drawing text with fade-in
const DrawingText: React.FC<{startFrame: number; text: string}> = ({
  startFrame,
  text,
}) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame - startFrame, [0, 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        fontFamily: 'Comic Sans MS, cursive, sans-serif',
        fontSize: 36,
        color: 'black',
        opacity,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

export const WhiteboardDemo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* Circle appears at frame 15 */}
      <div style={{position: 'absolute', top: 200, left: 400}}>
        <DrawingCircle startFrame={15} />
      </div>

      {/* Line appears at frame 45 */}
      <div style={{position: 'absolute', top: 200, left: 400}}>
        <DrawingLine startFrame={45} />
      </div>

      {/* Text appears at frame 75 */}
      <div style={{position: 'absolute', top: 450, left: 400}}>
        <DrawingText startFrame={75} text="Hello Whiteboard!" />
      </div>

      {/* Frame counter for debugging */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          fontSize: 24,
          color: '#888',
        }}
      >
        Frame: {frame}
      </div>

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          fontSize: 28,
          fontWeight: 'bold',
          color: '#333',
        }}
      >
        Whiteboard Animation Test
      </div>
    </AbsoluteFill>
  );
};