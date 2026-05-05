import {AbsoluteFill, useCurrentFrame} from 'remotion';

// CSS fallback using backdrop-filter blur and box-shadow glow effects
// Works in all browsers without requiring Skia or native modules
export const SkiaTest = () => {
  const frame = useCurrentFrame();
  const time = frame / 30;
  const opacity = Math.sin(time * Math.PI) * 0.5 + 0.5;
  const glowIntensity = Math.sin(time * 2.0) * 0.5 + 0.5;

  return (
    <AbsoluteFill
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      {/* Outer container with blur and glow */}
      <div
        style={{
          width: 300,
          height: 300,
          background: `rgba(255, 255, 255, ${opacity * 0.9})`,
          borderRadius: 20,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: `0 0 ${30 + glowIntensity * 40}px rgba(255, 255, 255, ${glowIntensity * 0.8}), inset 0 0 20px rgba(255,255,255,0.3)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Inner circle with blur */}
        <div
          style={{
            width: 200,
            height: 200,
            background: 'rgba(255, 107, 107, 0.85)',
            borderRadius: 100,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: `0 0 ${20 + glowIntensity * 20}px rgba(255, 107, 107, ${glowIntensity * 0.6})`,
          }}
        />
      </div>
      {/* Text with text shadow */}
      <div
        style={{
          color: 'white',
          fontSize: 24,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          marginTop: 30,
          textShadow: `0 2px 10px rgba(0,0,0,0.3), 0 0 ${10 + glowIntensity * 20}px rgba(255,255,255,${glowIntensity * 0.5})`,
        }}
      >
        CSS Blur + Glow Effects
      </div>
      <div
        style={{
          color: 'rgba(255,255,255,0.8)',
          fontSize: 14,
          fontFamily: 'Arial, sans-serif',
          marginTop: 10,
        }}
      >
        Skia not available - using CSS fallback
      </div>
    </AbsoluteFill>
  );
};
