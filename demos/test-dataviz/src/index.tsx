import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {DataVizTest} from './DataVizTest';

registerRoot(() => (
  <Composition
    id="DataVizTest"
    component={DataVizTest}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
  />
));
