import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate, Sequence, Composition} from 'remotion';

const TitleSlide: React.FC<{title: string}> = ({title}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({frame, fps, config: {damping: 15, stiffness: 100}});
  const opacity = interpolate(frame, [0, 20], [0, 1]);

  return (
    <div
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a2e',
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 'bold',
          color: 'white',
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {title}
      </div>
    </div>
  );
};

const ContentSlide: React.FC<{content: string}> = ({content}) => {
  const frame = useCurrentFrame();

  const translateX = interpolate(frame, [0, 30], [-200, 0]);
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  return (
    <div
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#16213e',
        padding: 100,
      }}
    >
      <div
        style={{
          fontSize: 48,
          color: 'white',
          maxWidth: 1000,
          transform: `translateX(${translateX}px)`,
          opacity,
        }}
      >
        {content}
      </div>
    </div>
  );
};

const MyVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#0f0f0f'}}>
      <Sequence from={0} durationInFrames={90}>
        <TitleSlide title="Hello World" />
      </Sequence>
      <Sequence from={90} durationInFrames={150}>
        <ContentSlide content="This is a Remotion video created with React and TypeScript." />
      </Sequence>
      <Sequence from={240} durationInFrames={90}>
        <TitleSlide title="The End" />
      </Sequence>
    </AbsoluteFill>
  );
};

export const RemotionVideo: React.FC = () => {
  return (
    <Composition
      id="MyVideo"
      component={MyVideo}
      durationInFrames={330}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
