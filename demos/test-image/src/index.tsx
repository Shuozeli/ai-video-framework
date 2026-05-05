import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {ImageTest} from './ImageTest';

registerRoot(() => (
  <Composition
    id="ImageTest"
    component={ImageTest}
    durationInFrames={180}
    fps={30}
    width={1920}
    height={1080}
  />
));
