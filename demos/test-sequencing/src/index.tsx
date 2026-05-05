import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {SequencingTest} from './SequencingTest';

registerRoot(() => (
	<Composition
		id="SequencingTest"
		component={SequencingTest}
		durationInFrames={240}
		fps={30}
		width={1920}
		height={1080}
	/>
));