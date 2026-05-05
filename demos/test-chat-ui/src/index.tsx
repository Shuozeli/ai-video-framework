import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {ChatTest} from './ChatTest';

registerRoot(() => (
  <Composition
    id="ChatTest"
    component={ChatTest}
    durationInFrames={240}
    fps={30}
    width={1920}
    height={1080}
  />
));
