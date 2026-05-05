import React from 'react';
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const barData = [
  { label: 'A', value: 80, color: '#FF6B6B' },
  { label: 'B', value: 45, color: '#4ECDC4' },
  { label: 'C', value: 70, color: '#45B7D1' },
  { label: 'D', value: 55, color: '#96CEB4' },
  { label: 'E', value: 90, color: '#FFEAA7' },
];

const BarChart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 40,
        height: 400,
        padding: 40,
        backgroundColor: '#1a1a2e',
      }}
    >
      {barData.map((bar, index) => {
        const delay = index * 8;
        const progress = Math.max(0, Math.min(1, (frame - delay) / 30));

        const animatedHeight = interpolate(progress, [0, 1], [0, bar.value * 3]);
        const animatedY = interpolate(progress, [0, 1], [400, 400 - bar.value * 3]);

        return (
          <div
            key={bar.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 60,
                height: animatedHeight,
                backgroundColor: bar.color,
                borderRadius: 8,
                transform: `translateY(${animatedY}px)`,
                transformOrigin: 'bottom',
                boxShadow: `0 4px 20px ${bar.color}40`,
              }}
            />
            <div
              style={{
                color: 'white',
                marginTop: 16,
                fontSize: 24,
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {bar.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const NumberPopup: React.FC<{ value: number; startFrame: number; suffix?: string }> = ({
  value,
  startFrame,
  suffix = '',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = Math.max(0, Math.min(1, (frame - startFrame) / 20));
  const springProgress = spring({ frame: frame - startFrame, fps, config: { damping: 12, stiffness: 100 } });

  const scale = interpolate(springProgress, [0, 1], [0.2, 1.2]);
  const opacity = interpolate(springProgress, [0, 0.3, 1], [0, 1, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        fontSize: 120,
        fontWeight: 'bold',
        fontFamily: 'Arial, sans-serif',
        color: '#fff',
        textShadow: '0 0 40px rgba(255,255,255,0.5)',
      }}
    >
      {value.toLocaleString()}{suffix}
    </div>
  );
};

const NumberPopups: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#16213e',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {frame >= 0 && frame < 60 && <NumberPopup value={100} startFrame={0} />}
      {frame >= 30 && frame < 90 && <NumberPopup value={250} startFrame={30} suffix="%" />}
      {frame >= 60 && frame < 120 && <NumberPopup value={10000} startFrame={60} suffix="+" />}
    </div>
  );
};

const TimelineItem: React.FC<{
  label: string;
  index: number;
  icon: string;
}> = ({ label, index, icon }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startFrame = index * 20;
  const progress = Math.max(0, Math.min(1, (frame - startFrame) / 15));

  const opacity = interpolate(progress, [0, 0.3, 1], [0, 0, 1]);
  const translateX = interpolate(progress, [0, 1], [50, 0]);
  const scale = interpolate(progress, [0, 0.5, 1], [0.8, 1.05, 1]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '16px 24px',
        backgroundColor: '#0f3460',
        borderRadius: 12,
        marginBottom: 12,
        opacity,
        transform: `translateX(${translateX}px) scale(${scale})`,
        borderLeft: `4px solid ${index % 2 === 0 ? '#e94560' : '#00d9ff'}`,
      }}
    >
      <div
        style={{
          fontSize: 32,
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          borderRadius: 8,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          color: 'white',
          fontSize: 24,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {label}
      </div>
    </div>
  );
};

const TimelineSequence: React.FC = () => {
  const items = [
    { label: 'Project Initiation', icon: '🚀' },
    { label: 'Design & Planning', icon: '📐' },
    { label: 'Development Phase', icon: '💻' },
    { label: 'Testing & QA', icon: '🧪' },
    { label: 'Deployment', icon: '✅' },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0a1a',
        padding: 60,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 36,
          fontWeight: 'bold',
          marginBottom: 40,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
        }}
      >
        Project Timeline
      </div>
      {items.map((item, index) => (
        <TimelineItem key={item.label} {...item} index={index} />
      ))}
    </div>
  );
};

export const DataVizTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Divide the video into 3 sections
  const section1End = Math.floor(durationInFrames / 3);
  const section2End = Math.floor((durationInFrames * 2) / 3);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
      }}
    >
      {frame < section1End && <BarChart />}
      {frame >= section1End && frame < section2End && <NumberPopups />}
      {frame >= section2End && <TimelineSequence />}
    </div>
  );
};
