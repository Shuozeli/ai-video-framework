import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {AudioTest} from './AudioTest';

registerRoot(() => (
  <Composition
    id="AudioTest"
    component={AudioTest}
    durationInFrames={180}
    fps={30}
    width={1920}
    height={1080}
  />
));
