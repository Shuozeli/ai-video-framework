import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';

export const SvgAvatarTest: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Pose timing: switch poses every 30 frames
  const posePhase = Math.floor(frame / 30) % 3;

  // Spring config for smooth transitions
  const springConfig = {damping: 15, stiffness: 80, mass: 1};

  // Animate pose transitions with springs
  const poseProgress = spring({frame: frame % 30, fps, config: springConfig});

  // Pose 0 -> 1 transition progress (arms up)
  const toArmsUp = posePhase === 0 ? poseProgress : posePhase === 1 ? 1 : 0;
  // Pose 1 -> 2 transition progress (arms down/pointing)
  const toArmsDown = posePhase === 1 ? poseProgress : posePhase === 2 ? 1 : 0;
  // Pose 2 -> 0 transition progress (neutral)
  const toNeutral = posePhase === 2 ? poseProgress : posePhase === 0 ? 1 : 0;

  // Interpolate arm positions
  // Arms down (default): shoulder (150, 140) to (120, 180) and (150, 140) to (180, 180)
  // Arms up: shoulder (150, 140) to (110, 100) and (150, 140) to (190, 100)
  // Pointing: shoulder (150, 140) to (200, 130) and (150, 140) to (100, 170)

  const leftArmX1 = 150;
  const leftArmY1 = 140;
  const leftArmX2Default = 120;
  const leftArmY2Default = 180;
  const leftArmX2Up = 110;
  const leftArmY2Up = 100;
  const leftArmX2Point = 200;
  const leftArmY2Point = 130;

  const rightArmX1 = 150;
  const rightArmY1 = 140;
  const rightArmX2Default = 180;
  const rightArmY2Default = 180;
  const rightArmX2Up = 190;
  const rightArmY2Up = 100;
  const rightArmX2Point = 100;
  const rightArmY2Point = 170;

  // Interpolate left arm
  const leftArmX2 = interpolate(toArmsUp, [0, 1], [leftArmX2Default, leftArmX2Up]);
  const leftArmY2 = interpolate(toArmsUp, [0, 1], [leftArmY2Default, leftArmY2Up]);
  const leftArmX2b = interpolate(toArmsDown, [0, 1], [leftArmX2Up, leftArmX2Point]);
  const leftArmY2b = interpolate(toArmsDown, [0, 1], [leftArmY2Up, leftArmY2Point]);

  // Use spring-based interpolation for smoother animation
  const leftArmEndX = spring({frame: (frame % 30), fps, config: {damping: 12, stiffness: 60}});
  const leftArmEndY = spring({frame: (frame % 30), fps, config: {damping: 12, stiffness: 60}});

  // Stick figure dimensions
  const headCenterX = 150;
  const headCenterY = 80;
  const headRadius = 30;
  const bodyTopY = headCenterY + headRadius;
  const bodyBottomY = 220;
  const hipY = bodyBottomY;
  const hipLeftX = 140;
  const hipRightX = 160;
  const kneeY = 280;
  const footY = 340;
  const footLeftX = 130;
  const footRightX = 170;

  // Leg positions (subtle movement)
  const leftLegAngle = interpolate(
    spring({frame, fps, config: {damping: 20, stiffness: 50}}),
    [0, 1],
    [0, 5]
  );
  const rightLegAngle = interpolate(
    spring({frame, fps, config: {damping: 20, stiffness: 50}}),
    [0, 1],
    [0, -5]
  );

  // Current pose arm positions
  const getArmPositions = () => {
    const t = (frame % 30) / 30;

    if (posePhase === 0) {
      // Arms down -> arms up
      return {
        leftArmEndX: leftArmX2Default + (leftArmX2Up - leftArmX2Default) * t,
        leftArmEndY: leftArmY2Default + (leftArmY2Up - leftArmY2Default) * t,
        rightArmEndX: rightArmX2Default + (rightArmX2Up - rightArmX2Default) * t,
        rightArmEndY: rightArmY2Default + (rightArmY2Up - rightArmY2Default) * t,
      };
    } else if (posePhase === 1) {
      // Arms up -> pointing
      return {
        leftArmEndX: leftArmX2Up + (leftArmX2Point - leftArmX2Up) * t,
        leftArmEndY: leftArmY2Up + (leftArmY2Point - leftArmY2Up) * t,
        rightArmEndX: rightArmX2Up + (rightArmX2Point - rightArmX2Up) * t,
        rightArmEndY: rightArmY2Up + (rightArmY2Point - rightArmY2Up) * t,
      };
    } else {
      // Pointing -> arms down
      return {
        leftArmEndX: leftArmX2Point + (leftArmX2Default - leftArmX2Point) * t,
        leftArmEndY: leftArmY2Point + (leftArmY2Default - leftArmY2Point) * t,
        rightArmEndX: rightArmX2Point + (rightArmX2Default - rightArmX2Point) * t,
        rightArmEndY: rightArmY2Point + (rightArmY2Default - rightArmY2Point) * t,
      };
    }
  };

  const armPos = getArmPositions();

  // Simple walk cycle for legs
  const walkCycle = Math.sin(frame * 0.2) * 8;

  return (
    <AbsoluteFill style={{backgroundColor: '#16213e', justifyContent: 'center', alignItems: 'center'}}>
      <svg width="400" height="450" viewBox="0 0 300 400">
        {/* Background circle for visual interest */}
        <circle cx="150" cy="200" r="180" fill="#1a1a2e" opacity="0.5" />

        {/* Stick Figure */}
        <g stroke="#4ecdc4" strokeWidth="4" strokeLinecap="round" fill="none">
          {/* Head */}
          <circle cx={headCenterX} cy={headCenterY} r={headRadius} stroke="#ffe66d" fill="none" />

          {/* Body */}
          <line x1={headCenterX} y1={bodyTopY} x2={headCenterX} y2={bodyBottomY} stroke="#4ecdc4" />

          {/* Left Arm */}
          <line
            x1={leftArmX1}
            y1={leftArmY1}
            x2={armPos.leftArmEndX}
            y2={armPos.leftArmEndY}
          />

          {/* Right Arm */}
          <line
            x1={rightArmX1}
            y1={rightArmY1}
            x2={armPos.rightArmEndX}
            y2={armPos.rightArmEndY}
          />

          {/* Left Leg */}
          <line
            x1={hipLeftX}
            y1={hipY}
            x2={hipLeftX + walkCycle}
            y2={kneeY}
          />
          <line
            x1={hipLeftX + walkCycle}
            y1={kneeY}
            x2={footLeftX + walkCycle * 1.5}
            y2={footY}
          />

          {/* Right Leg */}
          <line
            x1={hipRightX}
            y1={hipY}
            x2={hipRightX - walkCycle}
            y2={kneeY}
          />
          <line
            x1={hipRightX - walkCycle}
            y1={kneeY}
            x2={footRightX - walkCycle * 1.5}
            y2={footY}
          />
        </g>

        {/* Face - simple eyes */}
        <circle cx="140" cy="75" r="4" fill="#ffe66d" />
        <circle cx="160" cy="75" r="4" fill="#ffe66d" />
        <circle cx="140" cy="75" r="2" fill="#1a1a2e" />
        <circle cx="160" cy="75" r="2" fill="#1a1a2e" />
      </svg>

      {/* Pose label */}
      <div style={{
        color: '#888',
        marginTop: 20,
        fontSize: 16,
        fontFamily: 'monospace',
      }}>
        Frame: {frame} | Pose: {posePhase === 0 ? 'Arms Down -> Up' : posePhase === 1 ? 'Arms Up -> Point' : 'Point -> Down'}
      </div>

      {/* Instructions */}
      <div style={{
        color: '#555',
        marginTop: 10,
        fontSize: 14,
        fontFamily: 'monospace',
      }}>
        SVG Avatar Test - Stick figure with animated poses
      </div>
    </AbsoluteFill>
  );
};
