import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {SvgAvatarTest} from './SvgAvatarTest';

registerRoot(() => (
  <Composition
    id="SvgAvatarTest"
    component={SvgAvatarTest}
    durationInFrames={90}
    fps={30}
    width={1920}
    height={1080}
  />
));
