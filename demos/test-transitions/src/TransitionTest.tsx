import React from 'react';
import { AbsoluteFill } from 'remotion';
import {
  TransitionSeries,
  springTiming,
  linearTiming,
} from '@remotion/transitions';
import { slide } from '@remotion/transitions/slide';
import { fade } from '@remotion/transitions/fade';

const Scene: React.FC<{
  children: React.ReactNode;
  bgColor: string;
  label: string;
}> = ({ children, bgColor, label }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 48,
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div>{label}</div>
      {children}
    </AbsoluteFill>
  );
};

export const TransitionTest: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene bgColor="#e74c3c" label="Scene 1 - Slide from Left">
            <div style={{ fontSize: 24, marginTop: 20 }}>
              Using slide transition with springTiming()
            </div>
          </Scene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-left' })}
          timing={springTiming({
            config: {
              damping: 15,
              stiffness: 100,
              mass: 1,
            },
          })}
        />

        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene bgColor="#3498db" label="Scene 2 - Slide from Bottom">
            <div style={{ fontSize: 24, marginTop: 20 }}>
              Another slide transition
            </div>
          </Scene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-bottom' })}
          timing={springTiming({
            config: {
              damping: 15,
              stiffness: 100,
              mass: 1,
            },
          })}
        />

        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene bgColor="#2ecc71" label="Scene 3 - Fade">
            <div style={{ fontSize: 24, marginTop: 20 }}>
              Using fade transition
            </div>
          </Scene>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({
            durationInFrames: 20,
          })}
        />

        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene bgColor="#9b59b6" label="Scene 4 - Complete">
            <div style={{ fontSize: 24, marginTop: 20 }}>
              Transitions test complete!
            </div>
          </Scene>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
