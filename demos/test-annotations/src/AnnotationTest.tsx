import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from 'remotion';

// Arrow annotation: SVG arrow pointing to content
const ArrowAnnotation: React.FC<{x: number; y: number; toX: number; toY: number; startFrame: number}> = ({
  x,
  y,
  toX,
  toY,
  startFrame,
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    Math.max(0, frame - startFrame),
    [0, 15],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
  );

  // Calculate arrow endpoint based on progress
  const arrowX = x + (toX - x) * progress;
  const arrowY = y + (toY - y) * progress;

  // Arrow head points
  const angle = Math.atan2(toY - y, toX - x);
  const headLength = 20;
  const head1X = arrowX - headLength * Math.cos(angle - Math.PI / 6);
  const head1Y = arrowY - headLength * Math.sin(angle - Math.PI / 6);
  const head2X = arrowX - headLength * Math.cos(angle + Math.PI / 6);
  const head2Y = arrowY - headLength * Math.sin(angle + Math.PI / 6);

  const opacity = interpolate(progress, [0, 0.3, 0.7, 1], [0, 1, 1, 1]);

  return (
    <svg
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <line
        x1={x}
        y1={y}
        x2={arrowX}
        y2={arrowY}
        stroke="#FF0000"
        strokeWidth="4"
        strokeLinecap="round"
        opacity={opacity}
      />
      <polygon
        points={`${arrowX},${arrowY} ${head1X},${head1Y} ${head2X},${head2Y}`}
        fill="#FF0000"
        opacity={opacity}
      />
    </svg>
  );
};

// Circle highlight: oval/circle border around content
const CircleHighlight: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame: number;
  color: string;
}> = ({x, y, width, height, startFrame, color}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    Math.max(0, frame - startFrame),
    [0, 20],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x - (width / 2) * progress,
        top: y - (height / 2) * progress,
        width: width * progress,
        height: height * progress,
        border: `${4 / Math.max(0.1, progress)}px solid ${color}`,
        borderRadius: '50%',
        opacity: progress,
        boxShadow: `0 0 20px ${color}40`,
      }}
    />
  );
};

// Numbered steps: circles with numbers appearing sequentially
const NumberedSteps: React.FC<{startFrame: number}> = ({startFrame}) => {
  const frame = useCurrentFrame();

  const steps = [
    {num: 1, x: 200, y: 150},
    {num: 2, x: 400, y: 250},
    {num: 3, x: 600, y: 350},
  ];

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}}>
      {steps.map((step, i) => {
        const stepStart = startFrame + i * 30;
        const appear = interpolate(
          Math.max(0, frame - stepStart),
          [0, 15],
          [0, 1],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back)}
        );

        const scale = interpolate(
          Math.max(0, frame - stepStart),
          [0, 10],
          [0.5, 1],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}
        );

        return (
          <React.Fragment key={step.num}>
            {/* Number circle */}
            <div
              style={{
                position: 'absolute',
                left: step.x - 30,
                top: step.y - 30,
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: `rgba(0, 120, 255, ${appear * 0.9})`,
                border: `${3}px solid #0078FF`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '28px',
                fontWeight: 'bold',
                transform: `scale(${scale})`,
                opacity: appear,
                boxShadow: '0 4px 20px rgba(0, 120, 255, 0.4)',
              }}
            >
              {step.num}
            </div>
            {/* Connecting line to next step */}
            {i < steps.length - 1 && (
              <svg
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                }}
              >
                <line
                  x1={step.x}
                  y1={step.y + 30}
                  x2={steps[i + 1].x}
                  y2={steps[i + 1].y - 30}
                  stroke="#0078FF"
                  strokeWidth="2"
                  strokeDasharray="8,4"
                  opacity={appear * 0.5}
                />
              </svg>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Highlight/marker effect: semi-transparent colored rectangles over text
const MarkerHighlight: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame: number;
  color: string;
}> = ({x, y, width, height, startFrame, color}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    Math.max(0, frame - startFrame),
    [0, 10],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width * progress,
        height: height,
        backgroundColor: `${color}60`,
        borderRadius: '4px',
      }}
    />
  );
};

export const AnnotationTest: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{backgroundColor: '#1a1a2e'}}>
      {/* Section title */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          left: 400,
          color: 'white',
          fontSize: '32px',
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Annotation Test
      </div>

      {/* 1. Arrow Annotation */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          left: 50,
          color: '#888',
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        1. Arrow Annotation
      </div>
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 100,
          padding: '40px 80px',
          backgroundColor: '#2d2d44',
          borderRadius: '8px',
          color: 'white',
          fontSize: '20px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Target Content
      </div>
      <ArrowAnnotation x={80} y={170} toX={120} toY={170} startFrame={15} />

      {/* 2. Circle Highlight */}
      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 50,
          color: '#888',
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        2. Circle Highlight
      </div>
      <CircleHighlight x={300} y={380} width={200} height={100} startFrame={45} color="#00FF88" />
      <div
        style={{
          position: 'absolute',
          left: 200,
          top: 350,
          padding: '30px 60px',
          backgroundColor: '#2d2d44',
          borderRadius: '8px',
          color: 'white',
          fontSize: '20px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Highlighted Content
      </div>

      {/* 3. Numbered Steps */}
      <div
        style={{
          position: 'absolute',
          top: 480,
          left: 50,
          color: '#888',
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        3. Numbered Steps
      </div>
      <NumberedSteps startFrame={75} />

      {/* 4. Marker Highlight */}
      <div
        style={{
          position: 'absolute',
          top: 620,
          left: 50,
          color: '#888',
          fontSize: '18px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        4. Marker Highlight
      </div>
      <div
        style={{
          position: 'absolute',
          left: 100,
          top: 660,
          padding: '20px 40px',
          backgroundColor: '#2d2d44',
          borderRadius: '8px',
          color: 'white',
          fontSize: '20px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        Important text here
      </div>
      <MarkerHighlight x={108} y={685} width={150} height={24} startFrame={150} color="#FFFF00" />
    </AbsoluteFill>
  );
};