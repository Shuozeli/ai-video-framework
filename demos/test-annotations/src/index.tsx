import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {AnnotationTest} from './AnnotationTest';

registerRoot(() => (
  <Composition
    id="AnnotationTest"
    component={AnnotationTest}
    durationInFrames={180}
    fps={30}
    width={1280}
    height={720}
  />
));