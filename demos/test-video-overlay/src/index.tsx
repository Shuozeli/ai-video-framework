import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {SpringDemo} from './SpringDemo';

registerRoot(() => (
  <Composition
    id="SpringDemo"
    component={SpringDemo}
    durationInFrames={120}
    fps={30}
    width={1920}
    height={1080}
  />
));
