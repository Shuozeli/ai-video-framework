import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {SkiaTest} from './SkiaTest';

registerRoot(() => (
  <Composition
    id="SkiaTest"
    component={SkiaTest}
    durationInFrames={120}
    fps={30}
    width={1920}
    height={1080}
  />
));
