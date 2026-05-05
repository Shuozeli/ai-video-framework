import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {PathAnimationTest} from './PathAnimationTest';

registerRoot(() => (
  <Composition
    id="PathAnimationTest"
    component={PathAnimationTest}
    durationInFrames={180}
    fps={30}
    width={1920}
    height={1080}
  />
));
