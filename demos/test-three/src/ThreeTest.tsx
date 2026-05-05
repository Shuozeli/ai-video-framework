import React, {useState, useEffect} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Canvas, useFrame} from '@react-three/fiber';
import {Object3D} from 'three';

const ThreeCube: React.FC = () => {
  const meshRef = React.useRef<Object3D>(null);

  useFrame(({clock}) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime();
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.7;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
};

const CSS3DCube: React.FC<{frame: number}> = ({frame}) => {
  const rotateY = (frame * 3) % 360;
  const rotateX = (frame * 2) % 360;

  return (
    <div
      style={{
        width: 200,
        height: 200,
        position: 'relative',
        transformStyle: 'preserve-3d',
        transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
        transition: 'none',
      }}
    >
      {/* Front */}
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          background: 'linear-gradient(135deg, #ff6b6b, #ee5a5a)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 24,
          fontWeight: 'bold',
          boxShadow: '0 0 30px rgba(255,107,107,0.5)',
          backfaceVisibility: 'hidden',
        }}
      >
        Front
      </div>
      {/* Back */}
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          background: 'linear-gradient(135deg, #4ecdc4, #3dbdb5)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 24,
          fontWeight: 'bold',
          transform: 'rotateY(180deg)',
          boxShadow: '0 0 30px rgba(78,205,196,0.5)',
          backfaceVisibility: 'hidden',
        }}
      >
        Back
      </div>
    </div>
  );
};

export const ThreeTest: React.FC = () => {
  const [useThree, setUseThree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const frame = useCurrentFrame();

  useEffect(() => {
    // Check if we're in a browser environment with WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        setUseThree(true);
      } else {
        setError('WebGL not available - using CSS fallback');
      }
    } catch {
      setError('WebGL check failed - using CSS fallback');
    }
  }, []);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        perspective: 1000,
      }}
    >
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            color: '#ffe66d',
            fontSize: 14,
            background: 'rgba(0,0,0,0.5)',
            padding: '8px 16px',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {useThree ? (
        <div style={{width: 400, height: 400}}>
          <Canvas camera={{position: [0, 0, 5]}}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <ThreeCube />
          </Canvas>
        </div>
      ) : (
        <CSS3DCube frame={frame} />
      )}

      <div
        style={{
          color: '#888',
          marginTop: 40,
          fontSize: 18,
        }}
      >
        Three.js Test - Frame: {frame} - {useThree ? 'WebGL' : 'CSS 3D'}
      </div>
    </AbsoluteFill>
  );
};
