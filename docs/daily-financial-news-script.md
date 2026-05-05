# 每日财经新闻视频 - 内容设计

## 视频信息
- **时长**: 100 秒 (v2)
- **风格**: 现代简洁的新闻播报风格
- **配色**: 深蓝 + 金色点缀，专业感
- **分辨率**: 1920x1080
- **帧率**: 30fps
- **字体**: Noto Serif CJK SC (支持中文显示)

---

## 脚本内容

### 开场 (0-3秒)
**画面**: 全屏深蓝色渐变背景，中央显示日期和"今日财经"标题
**文字**:
```
2026年4月16日 星期四
今日财经
```

### 新闻一：市场概览 (3-15秒)
**画面**: 数据可视化面板
- 上证指数: +1.23% (绿色)
- 深证成指: +0.95% (绿色)
- 创业板: +1.47% (绿色)
- 沪深300: +1.15% (绿色)

**文字内容**:
```
A股三大指数集体上涨

上证指数收于 3,286 点
深证成指收于 10,572 点
创业板指收于 2,021 点

市场成交额突破 9,000 亿元
```

### 新闻二：板块热点 (15-28秒)
**画面**: 横向柱状图展示板块涨跌
- 半导体: +3.2%
- 人工智能: +2.8%
- 新能源车: +2.1%
- 医疗健康: +1.5%
- 白酒: -0.3%

**文字内容**:
```
板块热点：科技股领涨

半导体板块表现强劲，受益于 AI 芯片需求激增
新能源汽车销量持续增长，渗透率突破 40%
```

### 新闻三：个股聚焦 (28-42秒)
**画面**: 新闻卡片式布局，展示3只股票

1. **宁德时代** (电池龙头)
   - 涨跌幅: +5.2%
   - 原因: 欧洲市场大单落地

2. **科大讯飞** (AI龙头)
   - 涨跌幅: +4.8%
   - 原因: 发布新一代大模型

3. **比亚迪** (新能源车)
   - 涨跌幅: +3.6%
   - 原因: 月销量再创新高

### 新闻四：资金动向 (42-52秒)
**画面**: 资金流向图
- 北向资金: +126 亿 (净买入)
- 南向资金: +45 亿 (净买入)

**文字内容**:
```
资金面：北向资金大幅净流入

外资持续看好A股核心资产
机构持仓集中度提升
```

### 结尾 (52-60秒)
**画面**: 结束画面，显示总结和免责声明

**文字内容**:
```
今日要点
✓ 市场情绪回暖，量能回升
✓ 科技板块仍是主线
✓ 关注业绩超预期个股

本视频仅供信息参考，不构成投资建议
```

---

## 已实现场景 (v2 - 100秒)

| 场景 | 名称 | 时间 | 时长 | 核心元素 |
|------|------|------|------|----------|
| 1 | 开场动画 | 0-60 | 2s | 标题 + 日期 |
| 2 | 市场概览 | 60-450 | 13s | 4大指数卡片 + 成交额 |
| 3 | 板块热点 | 450-840 | 13s | 横向柱状图 |
| 4 | 个股聚焦 | 840-1260 | 14s | 3只股票卡片 |
| 5 | 资金动向 | 1260-1560 | 10s | 北向/南向资金 |
| 6 | 结尾 | 1560-1800 | 8s | 要点总结 + 免责声明 |
| A | 全球市场 | 1800-2190 | 13s | 全球指数卡片网格 |
| C | 财经要闻 | 2190-2490 | 10s | 滚动新闻字幕 |
| F | 期权市场 | 2490-2700 | 7s | VIX + Put/Call + 隐含波动率 |
| 7 | 最终结尾 | 2700-3000 | 10s | 要点总结 + 免责声明 |

**总帧数**: 3000 (100秒 @ 30fps)

---

## 扩展场景建议

### 场景A: 全球市场 (Global Markets)
- 美股：道琼斯、纳斯达克、标普500
- 港股：恒生指数
- 欧股：FTSE、CAC、Dax
- 日经225
- **视觉**: 多市场指数并排 + 涨跌幅颜色编码

### 场景B: 经济数据 (Economic Data)
- CPI 同比/环比
- PPI 数据
- PMI 采购经理指数
- GDP 增速
- 失业率
- **视觉**: 数字卡片 + 同比/环比箭头 + 数据解读

### 场景C: 热点新闻轮播 (News Ticker)
- 5-8条简短新闻标题滚动
- 财经大事、政策发布、公司公告
- **视觉**: 底部/顶部滚动字幕条

### 场景D: K线技术分析 (Technical Analysis)
- 个股K线图 (Candlestick chart)
- 均线系统 (MA5, MA10, MA20)
- 成交量柱状图
- **视觉**: SVG/Canvas 绘制K线 + 均线叠加

### 场景E: 资金流向详图 (Fund Flow Detail)
- 北向资金分时流向
- 南向资金分时流向
- **视觉**: 面积图展示资金净流入趋势

### 场景F: 期权市场 (Options Market)
- VIX 恐慌指数
- Put/Call Ratio
- 隐含波动率
- **视觉**: 数字仪表盘 + 警戒线

### 场景G: 财经日历 (Economic Calendar)
- 今日重要数据发布时间
- 央行动态
- 美联储讲话
- **视觉**: 时间轴 + 事件标记点

### 场景H: 舆情热点 (Sentiment Hot Topics)
- 社交媒体讨论热度排行
- 相关概念板块
- **视觉**: 词云 + 热度条形图

### 场景I: 机构观点 (Analyst Calls)
- 券商研报评级变动
- 目标价调整
- **视觉**: 股票卡片 + 评级星级 + 目标价vs现价

### 场景J: 风险提示 (Risk Alerts)
- 涨跌停股票池
- 融资金额变化
- 市场情绪温度计
- **视觉**: 警示图标 + 红色/绿色颜色编码

---

## 推荐扩展场景组合

**短版 (额外30秒)**:
- 场景A: 全球市场 (13s)
- 场景C: 新闻轮播 (10s)
- 场景F: VIX指标 (7s)

**长版 (额外60秒)**:
- 场景A: 全球市场 (13s)
- 场景B: 经济数据 (13s)
- 场景C: 新闻轮播 (10s)
- 场景D: K线分析 (13s)
- 场景G: 财经日历 (11s)

---

## 场景设计详情

### 场景1: 开场动画
- 背景: 深蓝渐变 (#0a1628 → #1a365d)
- 标题: 金色 (#f6c343)，居中
- 日期: 白色，标题下方
- 动画: 淡入 + 轻微放大

### 场景2: 市场概览
- 背景: 深蓝色
- 左侧: 指数数字跳动动画
- 右侧: 小型K线示意图
- 底部: 成交额数字滚动

### 场景3: 板块热点
- 背景: 深蓝色
- 主视觉: 横向柱状图，从左到右依次生长
- 配色: 涨绿 (#22c55e)，跌红 (#ef4444)
- 动画: barscaleY + transform-origin: bottom

### 场景4: 个股聚焦
- 背景: 深蓝色
- 布局: 三列卡片
- 每个卡片: 股票名 + 代码 + 涨跌幅 + 原因
- 卡片从下往上弹出动画 (staggered)

### 场景5: 资金动向
- 背景: 深蓝色
- 可视化: 箭头指示资金流入/流出
- 数字: 滚动计数动画

### 场景6: 结尾
- 背景: 深蓝渐变
- 要点: 左侧列表，右侧图标
- 免责声明: 底部小字，透明度降低

### 场景A: 全球市场
- 背景: 深蓝色
- 布局: 分区展示 (美国/香港/欧洲/日本)
- 每个分区下多个指数卡片
- 动画: staggered entrance (按区域分组延迟)
- 配色: 涨绿 (#22c55e)，跌红 (#ef4444)

### 场景C: 财经要闻
- 背景: 深蓝色
- 主视觉: 底部滚动字幕条
- 内容: 8条财经要闻循环滚动
- 左侧: 金色 "滚动" 标签
- 动画: translateX 连续滚动

### 场景F: 期权市场
- 背景: 深蓝色
- 布局: 三列等宽卡片
- 卡片内容: 指标名 + 数值 + 变化值
- VIX颜色编码: >20红, >15黄, ≤15绿
- 底部: 市场情绪解读文字框

---

## 技术实现

### Remotion 组件结构
```
DailyFinancialNews/
├── src/
│   ├── index.tsx          # Composition 入口
│   ├── Scene1_Intro.tsx   # 开场
│   ├── Scene2_Market.tsx   # 市场概览
│   ├── Scene3_Sectors.tsx  # 板块热点
│   ├── Scene4_Stocks.tsx   # 个股聚焦
│   ├── Scene5_Capital.tsx   # 资金动向
│   └── Scene6_Outro.tsx    # 结尾
│   └── components/
│       ├── BarChart.tsx     # 柱状图组件
│       ├── StockCard.tsx    # 股票卡片组件
│       └── NumberCounter.tsx # 数字滚动组件
```

### 动画时长分配
- Scene1: 0-60 (2秒)
- Scene2: 60-450 (13秒)
- Scene3: 450-840 (13秒)
- Scene4: 840-1260 (14秒)
- Scene5: 1260-1560 (10秒)
- Scene6: 1560-1800 (8秒)
- SceneA: 1800-2190 (13秒)
- SceneC: 2190-2490 (10秒)
- SceneF: 2490-2700 (7秒)
- Scene7: 2700-3000 (10秒)

### 总帧数: 3000 (100秒 @ 30fps)

---

## 动画模式库

### 淡入淡出 (Fade In/Out)
```tsx
const opacity = interpolate(frame, [0, 30], [0, 1], {extrapolateLeft: 'clamp'});
```

### 缩放 (Scale)
```tsx
const scale = interpolate(frame, [0, 30], [0.9, 1], {extrapolateLeft: 'clamp'});
transform: `scale(${scale})`
```

### 弹簧弹跳 (Spring Bounce)
```tsx
const springVal = spring({frame: frame - delay, fps, config: {damping: 15, stiffness: 100}});
const scale = interpolate(springVal, [0, 1], [0.8, 1]);
```

### 交错入场 (Staggered Entrance)
```tsx
const delay = i * 20;
const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
const translateY = interpolate(progress, [0, 1], [100, 0]);
```

### 进度条动画 (Progress Bar)
```tsx
const barWidth = interpolate(progress, [0, 1], [0, Math.abs(value) * 30]);
```

### 滚动字幕 (Scrolling Ticker)
```tsx
const offset = (frame * speed) % totalWidth;
transform: `translateX(${1920 - offset}px)`
```

### 颜色阈值 (Color Threshold)
```tsx
const vixColor = value > 20 ? '#ef4444' : value > 15 ? '#f6c343' : '#22c55e';
```

---

## 待探索动画方向

### 高级动画效果
1. **路径动画 (Path Morphing)** - SVG path interpolatePath() for shape transitions
2. **3D变换 (3D Transforms)** - rotateX/Y/Z + perspective for depth
3. **SVG滤波 (SVG Filters)** - feGaussianBlur, feColorMatrix for glow effects
4. **音频可视化 (Audio Visualization)** - useAudioData() + visualizeAudio()
5. **过渡效果 (Transitions)** - slide, fade, flip, wipe, iris from @remotion/transitions
6. **序列帧动画 (Sequence Frames)** - 图片序列逐帧播放
7. **粒子效果 (Particles)** - Canvas/SVG 粒子系统
8. **图表动画 (Chart Animation)** - 环形图、面积图、K线图绘制动画

### 交互增强
1. **Remotion Studio** - GUI timeline scrubber, property panel, live preview
2. **动态输入** - 外部数据实时更新视频
3. **多语言字幕轨道** - WebVTT 字幕叠加

### 性能优化
1. **GPU加速** - WebGL rendering via Remotion
2. **预渲染缓存** - 复杂场景预渲染为静态序列
3. **并行渲染** - 多worker同时渲染不同scene
