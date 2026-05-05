import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {InterpolationDemo} from './InterpolationDemo';

registerRoot(() => (
  <Composition
    id="InterpolationDemo"
    component={InterpolationDemo}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
  />
));
