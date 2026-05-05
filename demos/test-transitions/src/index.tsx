import { registerRoot, Composition } from 'remotion';
import { TransitionTest } from './TransitionTest';

registerRoot(() => (
  <Composition
    id="TransitionTest"
    component={TransitionTest}
    durationInFrames={240}
    fps={30}
    width={1920}
    height={1080}
  />
));
