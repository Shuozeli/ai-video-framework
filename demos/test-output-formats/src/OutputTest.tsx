import {AbsoluteFill} from 'remotion';

export const OutputTest: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40}}>
        <div
          style={{
            width: 200,
            height: 200,
            backgroundColor: '#ff6b6b',
            borderRadius: 20,
          }}
        />
        <div style={{color: 'white', fontSize: 36, fontWeight: 'bold'}}>
          Output Format Test
        </div>
        <div style={{color: '#888', fontSize: 24}}>
          Frame: 0-60 @ 30fps
        </div>
      </div>
    </AbsoluteFill>
  );
};
