import {registerRoot} from 'remotion';
import {Composition} from 'remotion';
import {DailyFinancialNews} from './DailyFinancialNews';

registerRoot(() => (
  <Composition
    id="DailyFinancialNews"
    component={DailyFinancialNews}
    durationInFrames={3000}
    fps={30}
    width={1920}
    height={1080}
  />
));
