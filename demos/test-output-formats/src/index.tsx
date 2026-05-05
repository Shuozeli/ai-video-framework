import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {OutputTest} from './OutputTest';

registerRoot(() => (
  <Composition
    id="OutputTest"
    component={OutputTest}
    durationInFrames={60}
    fps={30}
    width={1920}
    height={1080}
  />
));
