import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {AnimationTest} from './AnimationTest';

registerRoot(() => (
  <Composition
    id="AnimationTest"
    component={AnimationTest}
    durationInFrames={360}
    fps={30}
    width={1920}
    height={1080}
  />
));