import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {InterpolatePathDemo} from './InterpolatePathDemo';

registerRoot(() => (
  <Composition
    id="InterpolatePathDemo"
    component={InterpolatePathDemo}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
  />
));
