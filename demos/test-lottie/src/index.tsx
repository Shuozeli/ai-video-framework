import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {LottieTest} from './LottieTest';

registerRoot(() => (
  <Composition
    id="LottieTest"
    component={LottieTest}
    durationInFrames={120}
    fps={30}
    width={1920}
    height={1080}
  />
));