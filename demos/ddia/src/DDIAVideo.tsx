import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, spring} from 'remotion';

// Colors
const colors = {
  bg: '#1a1a2e',
  bgLight: '#16213e',
  accent: '#e94560',
  accentLight: '#ff6b6b',
  text: '#eaeaea',
  textDim: '#a0a0a0',
  green: '#4ade80',
  yellow: '#facc15',
  blue: '#38bdf8',
  purple: '#a78bfa',
};

// Scene 1: Cover
const Scene1_Cover: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp'});
  const scale = interpolate(frame, [0, 30], [0.9, 1], {extrapolateLeft: 'clamp'});
  const translateY = interpolate(frame, [0, 30], [20, 0], {extrapolateLeft: 'clamp'});

  return (
    <div
      style={{
        flex: 1,
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgLight} 100%)`,
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
      }}
    >
      <div style={{textAlign: 'center', maxWidth: 1200}}>
        <div style={{color: colors.accent, fontSize: 28, marginBottom: 30, letterSpacing: 4}}>
          ENGINEERING
        </div>
        <div style={{color: colors.text, fontSize: 72, fontWeight: 'bold', marginBottom: 20, lineHeight: 1.1}}>
          Designing Data-Intensive Applications
        </div>
        <div style={{color: colors.textDim, fontSize: 32, marginBottom: 60}}>
          The Big Ideas Behind Reliable, Scalable, and Maintainable Systems
        </div>
        <div style={{color: colors.accentLight, fontSize: 24}}>
          Martin Kleppmann
        </div>
      </div>
    </div>
  );
};

// Scene 2: Three Pillars
const Scene2_Pillars: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = {fps: 30};

  const pillars = [
    {name: 'Reliable', desc: 'Functions correctly even when things go wrong', color: colors.green},
    {name: 'Scalable', desc: 'Can handle increased load gracefully', color: colors.blue},
    {name: 'Maintainable', desc: 'Can handle new requirements with minimal effort', color: colors.purple},
  ];

  return (
    <div
      style={{
        flex: 1,
        background: colors.bg,
        padding: 60,
      }}
    >
      <div style={{color: colors.text, fontSize: 42, fontWeight: 'bold', marginBottom: 80}}>
        The Three Pillars
      </div>

      <div style={{display: 'flex', gap: 40, justifyContent: 'center', marginTop: 60}}>
        {pillars.map((pillar, i) => {
          const delay = i * 30;
          const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
          const springVal = spring({frame: frame - delay, fps, config: {damping: 12, stiffness: 100}});
          const scale = interpolate(springVal, [0, 1], [0.5, 1]);
          const translateY = interpolate(progress, [0, 1], [100, 0]);
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);

          return (
            <div
              key={pillar.name}
              style={{
                width: 350,
                padding: 40,
                background: colors.bgLight,
                borderRadius: 16,
                borderTop: `4px solid ${pillar.color}`,
                opacity,
                transform: `scale(${scale}) translateY(${translateY}px)`,
              }}
            >
              <div style={{color: pillar.color, fontSize: 36, fontWeight: 'bold', marginBottom: 20}}>
                {pillar.name}
              </div>
              <div style={{color: colors.textDim, fontSize: 22, lineHeight: 1.4}}>
                {pillar.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 3: Data Models
const Scene3_DataModels: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = {fps: 30};

  const models = [
    {
      name: 'Relational',
      examples: 'PostgreSQL, MySQL',
      desc: 'Tables, rows, foreign keys',
      color: colors.blue,
      icon: '≡',
    },
    {
      name: 'Document',
      examples: 'MongoDB, CouchDB',
      desc: 'JSON-like nested documents',
      color: colors.green,
      icon: '{ }',
    },
    {
      name: 'Graph',
      examples: 'Neo4j, TigerGraph',
      desc: 'Nodes, edges, properties',
      color: colors.purple,
      icon: '◉',
    },
  ];

  return (
    <div
      style={{
        flex: 1,
        background: colors.bg,
        padding: 60,
      }}
    >
      <div style={{color: colors.text, fontSize: 42, fontWeight: 'bold', marginBottom: 60}}>
        Data Models
      </div>

      <div style={{display: 'flex', gap: 40, justifyContent: 'center'}}>
        {models.map((model, i) => {
          const delay = i * 40;
          const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
          const translateX = interpolate(progress, [0, 1], [i === 0 ? -200 : i === 2 ? 200 : 0, 0]);
          const translateY = interpolate(progress, [0, 1], [100, 0]);
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);

          return (
            <div
              key={model.name}
              style={{
                width: 380,
                padding: 40,
                background: colors.bgLight,
                borderRadius: 16,
                opacity,
                transform: `translateX(${translateX}px) translateY(${translateY}px)`,
              }}
            >
              <div style={{color: model.color, fontSize: 64, marginBottom: 20}}>
                {model.icon}
              </div>
              <div style={{color: colors.text, fontSize: 32, fontWeight: 'bold', marginBottom: 10}}>
                {model.name}
              </div>
              <div style={{color: colors.accent, fontSize: 20, marginBottom: 15}}>
                {model.examples}
              </div>
              <div style={{color: colors.textDim, fontSize: 22}}>
                {model.desc}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 4: Storage Engines - B-Tree vs LSM-Tree
const Scene4_StorageEngines: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = {fps: 30};

  const btreeNodes = ['Root', 'Branch A', 'Branch B', 'Leaf 1', 'Leaf 2', 'Leaf 3', 'Leaf 4'];
  const lsmNodes = ['MemTable', 'L0', 'L1', 'L2', 'L3'];

  return (
    <div
      style={{
        flex: 1,
        background: colors.bg,
        padding: 60,
      }}
    >
      <div style={{color: colors.text, fontSize: 42, fontWeight: 'bold', marginBottom: 40}}>
        Storage Engines
      </div>

      <div style={{display: 'flex', gap: 80, justifyContent: 'center', marginTop: 40}}>
        {/* B-Tree */}
        <div style={{textAlign: 'center'}}>
          <div style={{color: colors.blue, fontSize: 28, marginBottom: 30}}>B-Tree</div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
            {btreeNodes.slice(0, 1).map((node, i) => {
              const delay = i * 15;
              const progress = Math.max(0, Math.min(1, (frame - delay) / 20));
              const scale = interpolate(progress, [0, 1], [0, 1]);
              return (
                <div
                  key={node}
                  style={{
                    width: 120,
                    height: 50,
                    background: colors.blue,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${scale})`,
                    opacity: progress,
                  }}
                >
                  <span style={{color: colors.bg, fontWeight: 'bold'}}>{node}</span>
                </div>
              );
            })}
            <div style={{display: 'flex', gap: 10}}>
              {btreeNodes.slice(1, 3).map((node, i) => {
                const delay = (i + 1) * 15;
                const progress = Math.max(0, Math.min(1, (frame - delay) / 20));
                const scale = interpolate(progress, [0, 1], [0, 1]);
                return (
                  <div
                    key={node}
                    style={{
                      width: 100,
                      height: 45,
                      background: colors.blue,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: `scale(${scale})`,
                      opacity: progress,
                    }}
                  >
                    <span style={{color: colors.bg, fontWeight: 'bold', fontSize: 14}}>{node}</span>
                  </div>
                );
              })}
            </div>
            <div style={{display: 'flex', gap: 8}}>
              {btreeNodes.slice(3).map((node, i) => {
                const delay = (i + 3) * 15;
                const progress = Math.max(0, Math.min(1, (frame - delay) / 20));
                const scale = interpolate(progress, [0, 1], [0, 1]);
                return (
                  <div
                    key={node}
                    style={{
                      width: 70,
                      height: 40,
                      background: colors.blue,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: `scale(${scale})`,
                      opacity: progress,
                    }}
                  >
                    <span style={{color: colors.bg, fontWeight: 'bold', fontSize: 12}}>{node}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{color: colors.textDim, fontSize: 18, marginTop: 20}}>
            Write: O(log n) / Read: O(log n)
          </div>
        </div>

        {/* LSM-Tree */}
        <div style={{textAlign: 'center'}}>
          <div style={{color: colors.green, fontSize: 28, marginBottom: 30}}>LSM-Tree</div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
            {lsmNodes.map((node, i) => {
              const delay = i * 20;
              const progress = Math.max(0, Math.min(1, (frame - delay) / 25));
              const scale = interpolate(progress, [0, 1], [0, 1]);
              const width = 120 - i * 15;
              return (
                <div
                  key={node}
                  style={{
                    width,
                    height: 40,
                    background: colors.green,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${scale})`,
                    opacity: progress,
                  }}
                >
                  <span style={{color: colors.bg, fontWeight: 'bold', fontSize: 14}}>{node}</span>
                </div>
              );
            })}
          </div>
          <div style={{color: colors.textDim, fontSize: 18, marginTop: 20}}>
            Write: O(1) / Read: O(log n)
          </div>
        </div>
      </div>
    </div>
  );
};

// Scene 5: Encoding Evolution
const Scene5_Encoding: React.FC = () => {
  const frame = useCurrentFrame();

  const encodings = [
    {name: 'JSON', year: '2005', desc: 'Human-readable, verbose'},
    {name: 'XML', year: '2000', desc: 'Self-describing, overweight'},
    {name: 'Avro', year: '2009', desc: 'Row-based, schema evolution'},
    {name: 'Protobuf', year: '2008', desc: 'Binary, interface definition'},
  ];

  return (
    <div
      style={{
        flex: 1,
        background: colors.bg,
        padding: 60,
      }}
    >
      <div style={{color: colors.text, fontSize: 42, fontWeight: 'bold', marginBottom: 60}}>
        Encoding & Schema Evolution
      </div>

      {/* Timeline */}
      <div style={{position: 'relative', marginTop: 60}}>
        {/* Timeline line */}
        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            height: 3,
            background: colors.bgLight,
          }}
        />

        <div style={{display: 'flex', justifyContent: 'space-between', position: 'relative'}}>
          {encodings.map((enc, i) => {
            const delay = i * 30;
            const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
            const translateY = interpolate(progress, [0, 1], [50, 0]);
            const scale = interpolate(progress, [0, 0.5, 1], [0, 1, 1]);

            return (
              <div
                key={enc.name}
                style={{
                  textAlign: 'center',
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  opacity: progress,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: colors.accent,
                    margin: '0 auto 30px',
                  }}
                />
                <div style={{color: colors.accent, fontSize: 28, fontWeight: 'bold'}}>
                  {enc.name}
                </div>
                <div style={{color: colors.textDim, fontSize: 18, marginBottom: 10}}>
                  {enc.year}
                </div>
                <div style={{color: colors.text, fontSize: 18, maxWidth: 180}}>
                  {enc.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Scene 6: Distributed Challenges
const Scene6_Distributed: React.FC = () => {
  const frame = useCurrentFrame();

  const nodes = [
    {name: 'Node A', x: 300, y: 200},
    {name: 'Node B', x: 700, y: 200},
    {name: 'Node C', x: 500, y: 400},
  ];

  const connections = [
    [0, 1], [1, 2], [2, 0]
  ];

  return (
    <div
      style={{
        flex: 1,
        background: colors.bg,
        padding: 60,
      }}
    >
      <div style={{color: colors.text, fontSize: 42, fontWeight: 'bold', marginBottom: 40}}>
        Distributed Systems Challenges
      </div>

      <div style={{display: 'flex', gap: 40}}>
        {/* Node diagram */}
        <div style={{position: 'relative', flex: 1, height: 450}}>
          {/* Connections */}
          {connections.map(([from, to], i) => {
            const x1 = nodes[from].x;
            const y1 = nodes[from].y;
            const x2 = nodes[to].x;
            const y2 = nodes[to].y;
            const delay = i * 20;
            const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
            const isPartitioned = i === 1 && frame > 120;
            const color = isPartitioned ? colors.accent : colors.textDim;

            return (
              <svg
                key={i}
                style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth={3}
                  opacity={progress}
                  strokeDasharray={isPartitioned ? '10,10' : 'none'}
                />
              </svg>
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const delay = i * 30 + 60;
            const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
            const scale = interpolate(progress, [0, 1], [0, 1]);

            return (
              <div
                key={node.name}
                style={{
                  position: 'absolute',
                  left: node.x - 50,
                  top: node.y - 30,
                  width: 100,
                  height: 60,
                  background: colors.bgLight,
                  borderRadius: 12,
                  border: `3px solid ${colors.accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${scale})`,
                }}
              >
                <span style={{color: colors.text, fontWeight: 'bold'}}>{node.name}</span>
              </div>
            );
          })}

          {/* Partition label */}
          <div
            style={{
              position: 'absolute',
              left: 400,
              top: 280,
              color: colors.accent,
              fontSize: 20,
              fontWeight: 'bold',
              opacity: interpolate(frame, [120, 150], [0, 1], {extrapolateLeft: 'clamp'}),
            }}
          >
            ⚠ Network Partition
          </div>
        </div>

        {/* Challenges list */}
        <div style={{flex: 1, padding: 20}}>
          {[
            'Network delays & failures',
            'Clock synchronization',
            'Partial node failures',
            'Byzantine failures',
            'CAP Theorem trade-offs',
          ].map((challenge, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                marginBottom: 25,
                opacity: interpolate(frame, [180 + i * 20, 240 + i * 20], [0, 1], {extrapolateLeft: 'clamp'}),
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: colors.accent,
                }}
              />
              <div style={{color: colors.text, fontSize: 24}}>{challenge}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Scene 7: CAP Theorem
const Scene7_CAP: React.FC = () => {
  const frame = useCurrentFrame();

  const capItems = [
    {name: 'Consistency', desc: 'Every read receives the most recent write', color: colors.green},
    {name: 'Availability', desc: 'Every request receives a response', color: colors.blue},
    {name: 'Partition', desc: 'System continues despite network partitions', color: colors.accent},
  ];

  return (
    <div
      style={{
        flex: 1,
        background: colors.bg,
        padding: 60,
      }}
    >
      <div style={{color: colors.text, fontSize: 42, fontWeight: 'bold', marginBottom: 60}}>
        CAP Theorem
      </div>

      {/* Triangle visualization */}
      <div style={{position: 'relative', width: 500, height: 300, margin: '0 auto'}}>
        {/* Connecting lines */}
        <svg width="500" height="300" style={{position: 'absolute'}}>
          <polygon
            points="250,20 50,250 450,250"
            fill="none"
            stroke={colors.textDim}
            strokeWidth="2"
            opacity={interpolate(frame, [0, 30], [0, 0.5], {extrapolateLeft: 'clamp'})}
          />
        </svg>

        {/* CAP vertices */}
        {capItems.map((item, i) => {
          const positions = [{x: 250, y: 40}, {x: 70, y: 240}, {x: 430, y: 240}];
          const delay = i * 30;
          const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
          const scale = interpolate(progress, [0, 1], [0.5, 1]);

          return (
            <div
              key={item.name}
              style={{
                position: 'absolute',
                left: positions[i].x - 80,
                top: positions[i].y - 40,
                width: 160,
                textAlign: 'center',
                transform: `scale(${scale})`,
                opacity: progress,
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: item.color,
                  margin: '0 auto 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{color: colors.bg, fontWeight: 'bold', fontSize: 14}}>
                  {item.name.substring(0, 3)}
                </span>
              </div>
              <div style={{color: item.color, fontSize: 18, fontWeight: 'bold'}}>
                {item.name}
              </div>
            </div>
          );
        })}

        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            left: 200,
            top: 130,
            width: 100,
            textAlign: 'center',
            opacity: interpolate(frame, [100, 150], [0, 1], {extrapolateLeft: 'clamp'}),
          }}
        >
          <div style={{color: colors.accent, fontSize: 20, fontWeight: 'bold'}}>
            Pick 2
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 40,
          textAlign: 'center',
          color: colors.textDim,
          fontSize: 24,
          opacity: interpolate(frame, [150, 180], [0, 1], {extrapolateLeft: 'clamp'}),
        }}
      >
        "You can have consistency, availability, or partition tolerance — pick two"
      </div>
    </div>
  );
};

// Scene 8: Transactions & Isolation
const Scene8_Transactions: React.FC = () => {
  const frame = useCurrentFrame();

  const levels = [
    {name: 'Read Uncommitted', level: 1, color: colors.accent},
    {name: 'Read Committed', level: 2, color: colors.yellow},
    {name: 'Repeatable Read', level: 3, color: colors.blue},
    {name: 'Serializable', level: 4, color: colors.green},
  ];

  return (
    <div
      style={{
        flex: 1,
        background: colors.bg,
        padding: 60,
      }}
    >
      <div style={{color: colors.text, fontSize: 42, fontWeight: 'bold', marginBottom: 60}}>
        Transaction Isolation Levels
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 25, maxWidth: 900, margin: '0 auto'}}>
        {levels.map((level, i) => {
          const delay = i * 25;
          const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
          const barWidth = interpolate(progress, [0, 1], [0, level.level * 200]);
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);

          return (
            <div key={level.name} style={{display: 'flex', alignItems: 'center', gap: 30, opacity}}>
              <div style={{width: 200, color: colors.text, fontSize: 22, textAlign: 'right'}}>
                {level.name}
              </div>
              <div
                style={{
                  width: 800,
                  height: 50,
                  background: colors.bgLight,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: barWidth,
                    height: '100%',
                    background: level.color,
                    borderRadius: 8,
                  }}
                />
              </div>
              <div style={{color: level.color, fontSize: 20, width: 60}}>
                L{level.level}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 50,
          textAlign: 'center',
          color: colors.textDim,
          fontSize: 22,
          opacity: interpolate(frame, [130, 160], [0, 1], {extrapolateLeft: 'clamp'}),
        }}
      >
        Higher isolation = Stronger correctness, Lower concurrency
      </div>
    </div>
  );
};

// Scene 9: Stream & Batch Processing
const Scene9_StreamBatch: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        flex: 1,
        background: colors.bg,
        padding: 60,
      }}
    >
      <div style={{color: colors.text, fontSize: 42, fontWeight: 'bold', marginBottom: 60}}>
        Stream vs Batch Processing
      </div>

      <div style={{display: 'flex', gap: 60, justifyContent: 'center'}}>
        {/* Lambda Architecture */}
        <div style={{textAlign: 'center'}}>
          <div style={{color: colors.yellow, fontSize: 28, marginBottom: 30}}>Lambda</div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
            <div
              style={{
                width: 200,
                height: 50,
                background: colors.bgLight,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp'}),
              }}
            >
              <span style={{color: colors.text}}>Master Dataset</span>
            </div>
            <div style={{color: colors.textDim}}>↓ ↓</div>
            <div style={{display: 'flex', gap: 20}}>
              <div
                style={{
                  width: 100,
                  height: 50,
                  background: colors.blue,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: interpolate(frame, [30, 60], [0, 1], {extrapolateLeft: 'clamp'}),
                }}
              >
                <span style={{color: colors.bg, fontSize: 14}}>Batch</span>
              </div>
              <div
                style={{
                  width: 100,
                  height: 50,
                  background: colors.green,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: interpolate(frame, [30, 60], [0, 1], {extrapolateLeft: 'clamp'}),
                }}
              >
                <span style={{color: colors.bg, fontSize: 14}}>Stream</span>
              </div>
            </div>
            <div style={{color: colors.textDim}}>↓</div>
            <div
              style={{
                width: 200,
                height: 50,
                background: colors.yellow,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: interpolate(frame, [90, 120], [0, 1], {extrapolateLeft: 'clamp'}),
              }}
            >
              <span style={{color: colors.bg}}>Serving Layer</span>
            </div>
          </div>
          <div style={{color: colors.textDim, fontSize: 16, marginTop: 20}}>Complex, 2 codebases</div>
        </div>

        {/* Kappa Architecture */}
        <div style={{textAlign: 'center'}}>
          <div style={{color: colors.green, fontSize: 28, marginBottom: 30}}>Kappa</div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
            <div
              style={{
                width: 200,
                height: 50,
                background: colors.bgLight,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp'}),
              }}
            >
              <span style={{color: colors.text}}>Events Log</span>
            </div>
            <div style={{color: colors.textDim}}>↓</div>
            <div
              style={{
                width: 150,
                height: 50,
                background: colors.green,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: interpolate(frame, [30, 60], [0, 1], {extrapolateLeft: 'clamp'}),
              }}
            >
              <span style={{color: colors.bg}}>Stream</span>
            </div>
            <div style={{color: colors.textDim}}>↓</div>
            <div
              style={{
                width: 200,
                height: 50,
                background: colors.green,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: interpolate(frame, [90, 120], [0, 1], {extrapolateLeft: 'clamp'}),
              }}
            >
              <span style={{color: colors.bg}}>Serving Layer</span>
            </div>
          </div>
          <div style={{color: colors.textDim, fontSize: 16, marginTop: 20}}>Simpler, 1 codebase</div>
        </div>
      </div>
    </div>
  );
};

// Scene 10: Summary
const Scene10_Summary: React.FC = () => {
  const frame = useCurrentFrame();

  const takeaways = [
    'Data models shape how applications reason about the world',
    'There is no magic: every system makes explicit trade-offs',
    'Understanding low-level details leads to better architecture',
  ];

  return (
    <div
      style={{
        flex: 1,
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bgLight} 100%)`,
        padding: 60,
        opacity: interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp'}),
      }}
    >
      <div style={{color: colors.text, fontSize: 42, fontWeight: 'bold', marginBottom: 60}}>
        Key Takeaways
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
        {takeaways.map((point, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 20,
              opacity: interpolate(frame, [30 + i * 30, 60 + i * 30], [0, 1], {extrapolateLeft: 'clamp'}),
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: colors.accent,
                marginTop: 8,
              }}
            />
            <div style={{color: colors.text, fontSize: 28, lineHeight: 1.4}}>{point}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 60,
          right: 60,
          textAlign: 'center',
        }}
      >
        <div style={{color: colors.accent, fontSize: 32, fontWeight: 'bold', marginBottom: 15}}>
          "Learning to think distributed"
        </div>
        <div style={{color: colors.textDim, fontSize: 20}}>
          Martin Kleppmann · O'Reilly 2017
        </div>
      </div>
    </div>
  );
};

// Main component with scene orchestration
export const DDIAVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene timing
  // Scene1: 0-60 (2s)
  // Scene2: 60-450 (13s)
  // Scene3: 450-840 (13s)
  // Scene4: 840-1260 (14s)
  // Scene5: 1260-1560 (10s)
  // Scene6: 1560-1800 (8s)
  // Scene7: 1800-2190 (13s)
  // Scene8: 2190-2490 (10s)
  // Scene9: 2490-2700 (7s)
  // Scene10: 2700-3000 (10s)

  return (
    <AbsoluteFill style={{backgroundColor: colors.bg}}>
      {frame < 60 && <Scene1_Cover />}
      {frame >= 60 && frame < 450 && <Scene2_Pillars />}
      {frame >= 450 && frame < 840 && <Scene3_DataModels />}
      {frame >= 840 && frame < 1260 && <Scene4_StorageEngines />}
      {frame >= 1260 && frame < 1560 && <Scene5_Encoding />}
      {frame >= 1560 && frame < 1800 && <Scene6_Distributed />}
      {frame >= 1800 && frame < 2190 && <Scene7_CAP />}
      {frame >= 2190 && frame < 2490 && <Scene8_Transactions />}
      {frame >= 2490 && frame < 2700 && <Scene9_StreamBatch />}
      {frame >= 2700 && <Scene10_Summary />}
    </AbsoluteFill>
  );
};
