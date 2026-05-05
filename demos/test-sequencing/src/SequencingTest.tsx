import React from 'react';
import {AbsoluteFill, Sequence, Series, useCurrentFrame} from 'remotion';

const SequenceA: React.FC = () => {
	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#ff6b6b',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<h1 style={{color: 'white', fontSize: 48}}>Sequence A (frames 0-29)</h1>
		</AbsoluteFill>
	);
};

const SequenceB: React.FC = () => {
	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#4ecdc4',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<h1 style={{color: 'white', fontSize: 48}}>Sequence B (frames 30-89)</h1>
		</AbsoluteFill>
	);
};

const SequenceC: React.FC = () => {
	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#ffe66d',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<h1 style={{color: 'black', fontSize: 48}}>Sequence C (frames 90-149)</h1>
		</AbsoluteFill>
	);
};

const SeriesSequenceA: React.FC = () => {
	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#a855f7',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<h1 style={{color: 'white', fontSize: 48}}>Series A (auto-connect)</h1>
		</AbsoluteFill>
	);
};

const SeriesSequenceB: React.FC = () => {
	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#f97316',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<h1 style={{color: 'white', fontSize: 48}}>Series B (auto-connect)</h1>
		</AbsoluteFill>
	);
};

const SeriesSequenceC: React.FC = () => {
	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#06b6d4',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<h1 style={{color: 'white', fontSize: 48}}>Series C (auto-connect)</h1>
		</AbsoluteFill>
	);
};

const SequenceDemo: React.FC = () => {
	return (
		<AbsoluteFill style={{width: '100%', height: '100%'}}>
			{/* Test Sequence component with explicit from/durationInFrames */}
			<Sequence from={0} durationInFrames={30}>
				<SequenceA />
			</Sequence>
			<Sequence from={30} durationInFrames={60}>
				<SequenceB />
			</Sequence>
			<Sequence from={90} durationInFrames={60}>
				<SequenceC />
			</Sequence>
		</AbsoluteFill>
	);
};

const SeriesDemo: React.FC = () => {
	return (
		<AbsoluteFill style={{width: '100%', height: '100%'}}>
			{/* Test Series with auto-connecting sequences */}
			<Series>
				<Series.Sequence durationInFrames={30}>
					<SeriesSequenceA />
				</Series.Sequence>
				<Series.Sequence durationInFrames={30}>
					<SeriesSequenceB />
				</Series.Sequence>
				<Series.Sequence durationInFrames={30}>
					<SeriesSequenceC />
				</Series.Sequence>
			</Series>
		</AbsoluteFill>
	);
};

export const SequencingTest: React.FC = () => {
	const frame = useCurrentFrame();

	// First 150 frames: Sequence demo
	// Next 90 frames: Series demo
	if (frame < 150) {
		return <SequenceDemo />;
	}
	return <SeriesDemo />;
};