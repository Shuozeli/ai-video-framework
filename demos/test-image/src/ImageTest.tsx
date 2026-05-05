import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate, Img} from 'remotion';

export const ImageTest: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Spring animation for scale
  const scale = spring({frame, fps, config: {damping: 15, stiffness: 100, mass: 1}});

  // Fade in using interpolate
  const opacity = interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Rotation animation
  const rotation = interpolate(frame, [0, 60], [0, 360], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // Image URL (unsplash source)
  const imageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

  return (
    <AbsoluteFill style={{backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40}}>
        {/* Image with spring scale and fade */}
        <div style={{
          transform: `scale(${scale})`,
          opacity: opacity,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}>
          <Img
            src={imageUrl}
            style={{
              width: 500,
              height: 350,
              objectFit: 'cover',
              borderRadius: 20,
            }}
          />
        </div>

        {/* Image with rotation */}
        <div style={{
          transform: `rotate(${rotation}deg)`,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
        }}>
          <Img
            src={imageUrl}
            style={{
              width: 300,
              height: 200,
              objectFit: 'cover',
              borderRadius: 20,
            }}
          />
        </div>

        {/* Static image with rounded corners and shadow */}
        <div style={{
          borderRadius: 30,
          overflow: 'hidden',
          boxShadow: '0 15px 50px rgba(78, 205, 196, 0.3)',
        }}>
          <Img
            src={imageUrl}
            style={{
              width: 400,
              height: 280,
              objectFit: 'cover',
              borderRadius: 30,
            }}
          />
        </div>
      </div>

      <div style={{color: '#888', marginTop: 60, fontSize: 18}}>
        Image Test - Frame: {frame}
      </div>
    </AbsoluteFill>
  );
};
