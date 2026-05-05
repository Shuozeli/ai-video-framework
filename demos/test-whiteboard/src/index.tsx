import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {WhiteboardDemo} from './WhiteboardTest';

registerRoot(() => (
  <Composition
    id="WhiteboardDemo"
    component={WhiteboardDemo}
    durationInFrames={120}
    fps={30}
    width={1920}
    height={1080}
  />
));