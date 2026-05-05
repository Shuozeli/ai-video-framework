import {AbsoluteFill} from 'remotion';
import {Lottie} from '@remotion/lottie';
import {useCurrentFrame} from 'remotion';
import {useEffect, useState} from 'react';

const LOTTIE_URL =
  'https://assets.lottiefiles.com/packages/lf20_zyquagfl.json';

export const LottieTest: React.FC = () => {
  const frame = useCurrentFrame();
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch(LOTTIE_URL)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error('Failed to fetch Lottie:', err));
  }, []);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f0f23',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {animationData ? (
        <Lottie
          animationData={animationData}
          style={{
            width: 600,
            height: 600,
          }}
        />
      ) : (
        <div
          style={{
            color: '#ffffff',
            fontSize: 18,
            fontFamily: 'sans-serif',
          }}
        >
          Loading Lottie animation...
        </div>
      )}
      <div
        style={{
          color: '#ffffff',
          marginTop: 30,
          fontSize: 18,
          fontFamily: 'sans-serif',
        }}
      >
        Lottie Playback Test - Frame: {frame}
      </div>
    </AbsoluteFill>
  );
};