import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, spring} from 'remotion';

// Scene 1: Intro
const Scene1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp'});
  const scale = interpolate(frame, [0, 30], [0.9, 1], {extrapolateLeft: 'clamp'});

  return (
    <div
      style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div style={{textAlign: 'center'}}>
        <div style={{color: '#f6c343', fontSize: 72, fontWeight: 'bold', marginBottom: 20}}>
          今日财经
        </div>
        <div style={{color: 'white', fontSize: 36, opacity: 0.9}}>
          2026年4月16日 星期四
        </div>
      </div>
    </div>
  );
};

// Scene 2: Market Overview with animated indices
const Scene2_Market: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = {fps: 30};

  const indices = [
    {name: '上证指数', value: 3286, change: 1.23},
    {name: '深证成指', value: 10572, change: 0.95},
    {name: '创业板指', value: 2021, change: 1.47},
    {name: '沪深300', value: 3892, change: 1.15},
  ];

  return (
    <div
      style={{
        flex: 1,
        background: '#0a1628',
        padding: 60,
      }}
    >
      <div style={{color: 'white', fontSize: 42, fontWeight: 'bold', marginBottom: 40}}>
        A股三大指数集体上涨
      </div>

      <div style={{display: 'flex', gap: 40, flexWrap: 'wrap'}}>
        {indices.map((idx, i) => {
          const delay = i * 20;
          const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
          const springVal = spring({frame: frame - delay, fps, config: {damping: 15, stiffness: 100}});
          const scale = interpolate(springVal, [0, 1], [0.8, 1]);
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);

          return (
            <div
              key={idx.name}
              style={{
                width: 400,
                padding: 30,
                background: '#1a2a4a',
                borderRadius: 16,
                opacity,
                transform: `scale(${scale})`,
              }}
            >
              <div style={{color: '#888', fontSize: 24, marginBottom: 10}}>{idx.name}</div>
              <div style={{color: 'white', fontSize: 48, fontWeight: 'bold', marginBottom: 10}}>
                {idx.value.toLocaleString()}
              </div>
              <div style={{color: '#22c55e', fontSize: 28}}>
                +{idx.change.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 40,
          color: '#22c55e',
          fontSize: 28,
          opacity: interpolate(frame, [60, 90], [0, 1], {extrapolateLeft: 'clamp'}),
        }}
      >
        市场成交额突破 9,000 亿元
      </div>
    </div>
  );
};

// Scene 3: Sector Performance with bar chart
const Scene3_Sectors: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = {fps: 30};

  const sectors = [
    {name: '半导体', change: 3.2, color: '#22c55e'},
    {name: '人工智能', change: 2.8, color: '#22c55e'},
    {name: '新能源车', change: 2.1, color: '#22c55e'},
    {name: '医疗健康', change: 1.5, color: '#22c55e'},
    {name: '白酒', change: -0.3, color: '#ef4444'},
  ];

  return (
    <div
      style={{
        flex: 1,
        background: '#0a1628',
        padding: 60,
      }}
    >
      <div style={{color: 'white', fontSize: 42, fontWeight: 'bold', marginBottom: 40}}>
        板块热点：科技股领涨
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
        {sectors.map((sector, i) => {
          const delay = i * 15;
          const progress = Math.max(0, Math.min(1, (frame - delay) / 25));
          const barWidth = interpolate(progress, [0, 1], [0, Math.abs(sector.change) * 30]);

          return (
            <div key={sector.name} style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{width: 120, color: 'white', fontSize: 24}}>{sector.name}</div>
              <div
                style={{
                  width: 300,
                  height: 40,
                  background: '#1a2a4a',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: barWidth,
                    height: '100%',
                    background: sector.color,
                    borderRadius: 8,
                  }}
                />
              </div>
              <div
                style={{
                  color: sector.color,
                  fontSize: 24,
                  fontWeight: 'bold',
                  width: 80,
                }}
              >
                {sector.change > 0 ? '+' : ''}
                {sector.change.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 40,
          color: '#888',
          fontSize: 24,
          opacity: interpolate(frame, [100, 130], [0, 1], {extrapolateLeft: 'clamp'}),
        }}
      >
        半导体板块表现强劲，受益于 AI 芯片需求激增
      </div>
    </div>
  );
};

// Scene 4: Stock Focus Cards
const Scene4_Stocks: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = {fps: 30};

  const stocks = [
    {name: '宁德时代', code: '300750', change: 5.2, reason: '欧洲市场大单落地'},
    {name: '科大讯飞', code: '002230', change: 4.8, reason: '发布新一代大模型'},
    {name: '比亚迪', code: '002594', change: 3.6, reason: '月销量再创新高'},
  ];

  return (
    <div
      style={{
        flex: 1,
        background: '#0a1628',
        padding: 60,
      }}
    >
      <div style={{color: 'white', fontSize: 42, fontWeight: 'bold', marginBottom: 40}}>
        个股聚焦
      </div>

      <div style={{display: 'flex', gap: 30}}>
        {stocks.map((stock, i) => {
          const delay = i * 20;
          const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
          const translateY = interpolate(progress, [0, 1], [100, 0]);
          const opacity = interpolate(progress, [0, 0.2, 1], [0, 1, 1]);

          return (
            <div
              key={stock.code}
              style={{
                flex: 1,
                padding: 30,
                background: '#1a2a4a',
                borderRadius: 16,
                transform: `translateY(${translateY}px)`,
                opacity,
              }}
            >
              <div style={{color: '#f6c343', fontSize: 32, fontWeight: 'bold', marginBottom: 8}}>
                {stock.name}
              </div>
              <div style={{color: '#666', fontSize: 18, marginBottom: 15}}>{stock.code}</div>
              <div style={{color: '#22c55e', fontSize: 42, fontWeight: 'bold', marginBottom: 15}}>
                +{stock.change.toFixed(1)}%
              </div>
              <div style={{color: '#888', fontSize: 20}}>{stock.reason}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Scene 5: Capital Flow
const Scene5_Capital: React.FC = () => {
  const frame = useCurrentFrame();

  const northValue = 126;
  const southValue = 45;

  return (
    <div
      style={{
        flex: 1,
        background: '#0a1628',
        padding: 60,
      }}
    >
      <div style={{color: 'white', fontSize: 42, fontWeight: 'bold', marginBottom: 40}}>
        资金面：北向资金大幅净流入
      </div>

      <div style={{display: 'flex', gap: 60, marginTop: 60}}>
        <div style={{textAlign: 'center'}}>
          <div style={{color: '#22c55e', fontSize: 72, fontWeight: 'bold'}}>
            +{northValue}
          </div>
          <div style={{color: '#888', fontSize: 24, marginTop: 10}}>亿</div>
          <div style={{color: 'white', fontSize: 28, marginTop: 20}}>北向资金</div>
          <div style={{color: '#22c55e', fontSize: 18, marginTop: 10}}>净买入</div>
        </div>

        <div style={{textAlign: 'center'}}>
          <div style={{color: '#22c55e', fontSize: 72, fontWeight: 'bold'}}>
            +{southValue}
          </div>
          <div style={{color: '#888', fontSize: 24, marginTop: 10}}>亿</div>
          <div style={{color: 'white', fontSize: 28, marginTop: 20}}>南向资金</div>
          <div style={{color: '#22c55e', fontSize: 18, marginTop: 10}}>净买入</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 60,
          color: '#888',
          fontSize: 24,
          opacity: interpolate(frame, [50, 80], [0, 1], {extrapolateLeft: 'clamp'}),
        }}
      >
        外资持续看好A股核心资产
      </div>
    </div>
  );
};

// Scene 6: Outro
const Scene6_Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp'});

  return (
    <div
      style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 100%)',
        padding: 60,
        opacity,
      }}
    >
      <div style={{color: 'white', fontSize: 42, fontWeight: 'bold', marginBottom: 40}}>
        今日要点
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
        {[
          '市场情绪回暖，量能回升',
          '科技板块仍是主线',
          '关注业绩超预期个股',
        ].map((point, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 15,
              opacity: interpolate(frame, [20 + i * 15, 50 + i * 15], [0, 1], {extrapolateLeft: 'clamp'}),
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#f6c343',
              }}
            />
            <div style={{color: 'white', fontSize: 28}}>{point}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 60,
          right: 60,
          textAlign: 'center',
          color: '#666',
          fontSize: 18,
        }}
      >
        本视频仅供信息参考，不构成投资建议
      </div>
    </div>
  );
};

// Scene A: Global Markets
const SceneA_Global: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = {fps: 30};

  const markets = [
    {region: '美国', indices: [
      {name: '道琼斯', value: 38654, change: 0.82},
      {name: '纳斯达克', value: 15628, change: 1.24},
      {name: '标普500', value: 5027, change: 0.95},
    ]},
    {region: '香港', indices: [
      {name: '恒生指数', value: 17201, change: 1.56},
    ]},
    {region: '欧洲', indices: [
      {name: 'FTSE', value: 7745, change: 0.43},
      {name: 'CAC', value: 8062, change: 0.67},
      {name: 'Dax', value: 17723, change: 0.89},
    ]},
    {region: '日本', indices: [
      {name: '日经225', value: 38923, change: -0.34},
    ]},
  ];

  return (
    <div
      style={{
        flex: 1,
        background: '#0a1628',
        padding: 60,
      }}
    >
      <div style={{color: 'white', fontSize: 42, fontWeight: 'bold', marginBottom: 40}}>
        全球市场
      </div>

      <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
        {markets.map((market, mi) => (
          <div key={market.region}>
            <div style={{color: '#f6c343', fontSize: 24, marginBottom: 15}}>{market.region}</div>
            <div style={{display: 'flex', gap: 30, flexWrap: 'wrap'}}>
              {market.indices.map((idx, ii) => {
                const delay = mi * 60 + ii * 20;
                const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
                const translateY = interpolate(progress, [0, 1], [50, 0]);
                const opacity = interpolate(progress, [0, 0.2, 1], [0, 1, 1]);
                const changeColor = idx.change >= 0 ? '#22c55e' : '#ef4444';

                return (
                  <div
                    key={idx.name}
                    style={{
                      padding: 20,
                      background: '#1a2a4a',
                      borderRadius: 12,
                      transform: `translateY(${translateY}px)`,
                      opacity,
                    }}
                  >
                    <div style={{color: '#888', fontSize: 18, marginBottom: 8}}>{idx.name}</div>
                    <div style={{color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 5}}>
                      {idx.value.toLocaleString()}
                    </div>
                    <div style={{color: changeColor, fontSize: 22}}>
                      {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Scene C: News Ticker
const SceneC_News: React.FC = () => {
  const frame = useCurrentFrame();

  const news = [
    '央行宣布定向降准 释放长期资金约5000亿',
    '人工智能板块获主力资金净流入超20亿',
    '特斯拉上海工厂产能利用率突破95%',
    '茅台批价企稳 白酒板块估值修复',
    '宁德时代与欧洲某车企签署战略合作协议',
    '科创板做市商制度效果显现',
    '人民币汇率企稳回升 北向资金加速流入',
    '多家券商发布年报 财富管理转型加速',
  ];

  // Scrolling animation - loop through news items
  const tickerWidth = 800;
  const totalWidth = news.length * tickerWidth;
  const speed = 2;
  const offset = (frame * speed) % totalWidth;

  return (
    <div
      style={{
        flex: 1,
        background: '#0a1628',
        padding: 60,
      }}
    >
      <div style={{color: 'white', fontSize: 42, fontWeight: 'bold', marginBottom: 40}}>
        财经要闻
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 0,
          right: 0,
          height: 80,
          background: '#1a2a4a',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            transform: `translateX(${1920 - offset}px)`,
            width: totalWidth + 1920,
          }}
        >
          {news.map((item, i) => (
            <div
              key={i}
              style={{
                width: tickerWidth,
                padding: '0 60px',
                color: 'white',
                fontSize: 26,
                whiteSpace: 'nowrap',
                borderRight: '1px solid #333',
              }}
            >
              {item}
            </div>
          ))}
          {news.map((item, i) => (
            <div
              key={`dup-${i}`}
              style={{
                width: tickerWidth,
                padding: '0 60px',
                color: 'white',
                fontSize: 26,
                whiteSpace: 'nowrap',
                borderRight: '1px solid #333',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: 0,
          width: 150,
          height: 80,
          background: '#f6c343',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{color: '#0a1628', fontSize: 24, fontWeight: 'bold'}}>滚动</div>
      </div>
    </div>
  );
};

// Scene F: VIX / Options Market
const SceneF_VIX: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = {fps: 30};

  const metrics = [
    {name: 'VIX 恐慌指数', value: 18.5, unit: '', change: -0.8},
    {name: 'Put/Call 比值', value: 0.87, unit: '', change: -0.05},
    {name: '隐含波动率', value: 22.3, unit: '%', change: 1.2},
  ];

  return (
    <div
      style={{
        flex: 1,
        background: '#0a1628',
        padding: 60,
      }}
    >
      <div style={{color: 'white', fontSize: 42, fontWeight: 'bold', marginBottom: 40}}>
        期权市场
      </div>

      <div style={{display: 'flex', gap: 40, marginTop: 60}}>
        {metrics.map((metric, i) => {
          const delay = i * 30;
          const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
          const scale = interpolate(progress, [0, 1], [0.8, 1]);
          const opacity = interpolate(progress, [0, 0.3, 1], [0, 1, 1]);

          const isVIX = metric.name === 'VIX 恐慌指数';
          const vixColor = isVIX
            ? (metric.value > 20 ? '#ef4444' : metric.value > 15 ? '#f6c343' : '#22c55e')
            : metric.change >= 0 ? '#22c55e' : '#ef4444';

          return (
            <div
              key={metric.name}
              style={{
                flex: 1,
                padding: 40,
                background: '#1a2a4a',
                borderRadius: 16,
                opacity,
                transform: `scale(${scale})`,
                textAlign: 'center',
              }}
            >
              <div style={{color: '#888', fontSize: 22, marginBottom: 15}}>{metric.name}</div>
              <div style={{color: vixColor, fontSize: 64, fontWeight: 'bold', marginBottom: 10}}>
                {metric.value}
                <span style={{fontSize: 28}}>{metric.unit}</span>
              </div>
              <div style={{color: metric.change >= 0 ? '#22c55e' : '#ef4444', fontSize: 24}}>
                {metric.change >= 0 ? '+' : ''}{metric.change}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 50,
          padding: 30,
          background: '#1a2a4a',
          borderRadius: 12,
          opacity: interpolate(frame, [100, 130], [0, 1], {extrapolateLeft: 'clamp'}),
        }}
      >
        <div style={{color: '#888', fontSize: 20, marginBottom: 15}}>市场情绪解读</div>
        <div style={{color: 'white', fontSize: 26}}>
          VIX指数处于正常区间，市场恐慌情绪可控
        </div>
      </div>
    </div>
  );
};

// Main component with scene orchestration
export const DailyFinancialNews: React.FC = () => {
  const frame = useCurrentFrame();

  // Scene timing
  // Scene1: 0-60 (2s)
  // Scene2: 60-450 (13s)
  // Scene3: 450-840 (13s)
  // Scene4: 840-1260 (14s)
  // Scene5: 1260-1560 (10s)
  // Scene6: 1560-1800 (8s)
  // SceneA: 1800-2190 (13s) - Global Markets
  // SceneC: 2190-2490 (10s) - News Ticker
  // SceneF: 2490-2700 (7s) - VIX
  // Scene7: 2700-3000 (10s) - Final Outro

  return (
    <AbsoluteFill style={{backgroundColor: '#0a1628'}}>
      {frame < 60 && <Scene1_Intro />}
      {frame >= 60 && frame < 450 && <Scene2_Market />}
      {frame >= 450 && frame < 840 && <Scene3_Sectors />}
      {frame >= 840 && frame < 1260 && <Scene4_Stocks />}
      {frame >= 1260 && frame < 1560 && <Scene5_Capital />}
      {frame >= 1560 && frame < 1800 && <Scene6_Outro />}
      {frame >= 1800 && frame < 2190 && <SceneA_Global />}
      {frame >= 2190 && frame < 2490 && <SceneC_News />}
      {frame >= 2490 && frame < 2700 && <SceneF_VIX />}
      {frame >= 2700 && <Scene6_Outro />}
    </AbsoluteFill>
  );
};
