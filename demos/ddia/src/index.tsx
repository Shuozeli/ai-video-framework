import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {DDIAVideo} from './DDIAVideo';

registerRoot(() => (
  <Composition
    id="DDIAVideo"
    component={DDIAVideo}
    durationInFrames={3000}
    fps={30}
    width={1920}
    height={1080}
  />
));
