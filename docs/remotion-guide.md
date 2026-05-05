# Remotion Guide

> 基于实际测试验证的 Remotion v4.0.448 文档

## 基础概念

Remotion 是一个 React 框架，用于以代码方式创建视频。

### 核心 Hooks

```typescript
import { useCurrentFrame, spring, interpolate, AbsoluteFill } from 'remotion';

// 获取当前帧数
const frame = useCurrentFrame(); // 0, 1, 2, ...

// 弹簧动画
const springVal = spring({ frame, fps: 30, config: { damping: 15, stiffness: 100 } });

// 数值插值
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp' });
const scale = interpolate(frame, [0, 30], [0.9, 1]);
```

### 基础配置

```typescript
// index.tsx
import { registerRoot } from 'remotion';
import { Composition } from 'remotion';

registerRoot(() => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={1800}  // 60秒 @ 30fps
    fps={30}
    width={1920}
    height={1080}
  />
));
```

---

## 动画模式

### 1. 淡入淡出 (Fade)

```typescript
const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp' });
// opacity 从 0 → 1 在 30 帧内
```

### 2. 缩放 (Scale)

```typescript
const scale = interpolate(frame, [0, 30], [0.9, 1], { extrapolateLeft: 'clamp' });
<div style={{ transform: `scale(${scale})` }} />
```

### 3. 弹簧弹跳 (Spring Bounce)

```typescript
const springVal = spring({ frame: frame - delay, fps: 30, config: { damping: 15, stiffness: 100 } });
const scale = interpolate(springVal, [0, 1], [0.8, 1]);
```

### 4. 交错入场 (Staggered Entrance)

```typescript
const delay = i * 20;  // 每项延迟 20 帧
const progress = Math.max(0, Math.min(1, (frame - delay) / 30));
const translateY = interpolate(progress, [0, 1], [100, 0]);
```

### 5. 进度条 (Progress Bar)

```typescript
const barWidth = interpolate(progress, [0, 1], [0, Math.abs(value) * 30]);
```

### 6. 滚动字幕 (Scrolling Ticker)

```typescript
const tickerWidth = 800;
const totalWidth = news.length * tickerWidth;
const speed = 2;
const offset = (frame * speed) % totalWidth;
transform: `translateX(${1920 - offset}px)`
```

---

## 场景组织

### 组件结构

```typescript
const Scene1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a1628', opacity }}>
      <div style={{ color: 'white', fontSize: 72 }}>
        今日财经
      </div>
    </AbsoluteFill>
  );
};
```

### 场景编排

```typescript
export const MyVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a1628' }}>
      {frame < 60 && <Scene1_Intro />}
      {frame >= 60 && frame < 450 && <Scene2_Market />}
      {frame >= 450 && frame < 840 && <Scene3_Sectors />}
      {frame >= 840 && <Scene4_Stocks />}
    </AbsoluteFill>
  );
};
```

---

## 样式系统

### 颜色主题

```typescript
const colors = {
  bg: '#1a1a2e',
  bgLight: '#16213e',
  accent: '#e94560',
  text: '#eaeaea',
  green: '#4ade80',
  yellow: '#facc15',
  blue: '#38bdf8',
  purple: '#a78bfa',
};
```

### 布局模式

```typescript
// 水平居中
<div style={{ display: 'flex', justifyContent: 'center' }}>

// 垂直居中
<div style={{ display: 'flex', alignItems: 'center' }}>

// 网格
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 30 }}>
```

### 间距系统

- marginBottom: 10, 15, 20, 40
- padding: 30, 60
- gap: 15, 20, 30, 40, 60
- borderRadius: 8, 16

---

## Remotion 配置

```typescript
// remotion.config.ts
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');  // 或 'png'
Config.setOverwriteOutput(true);
```

---

## 构建和预览

```bash
# 安装依赖
pnpm install

# 预览 (热重载)
pnpm preview

# 渲染视频
pnpm build
# 输出: out/<composition_id>.mp4
```

---

## 字体支持

### 安装中文字体

```bash
sudo apt-get install fonts-noto-cjk
fc-cache -f
```

### 在 CSS 中使用

```typescript
<div style={{
  fontFamily: 'Noto Serif CJK SC, sans-serif',
  fontSize: 48
}}>
  中文文本
</div>
```

---

## 高级特性

### 1. SVG 绘制

```typescript
<svg width="500" height="300">
  <line x1="0" y1="0" x2="500" y2="300" stroke="#fff" strokeWidth="2" />
  <polygon points="250,20 50,250 450,250" fill="none" stroke="#888" />
</svg>
```

### 2. 条件渲染

```typescript
const isPartitioned = i === 1 && frame > 120;
const color = isPartitioned ? colors.accent : colors.textDim;

<line stroke={color} strokeDasharray={isPartitioned ? '10,10' : 'none'} />
```

### 3. 动态高度

```typescript
const barWidth = interpolate(progress, [0, 1], [0, level.level * 200]);
```

---

## 已知问题

1. **CSS keyframes** - Remotion 不直接支持 CSS keyframes，需用 `interpolate` + `frame` 模拟
2. **中文字体** - 系统需安装 Noto CJK 字体才能正确渲染中文
3. **esbuild 警告** - `pnpm approve-builds` 后忽略 esbuild 构建脚本警告

---

## 相关文件

- [daily-financial-news-script.md](./daily-financial-news-script.md) - 完整场景设计
- [api-minimax-t2a.md](./api-minimax-t2a.md) - MiniMax TTS API
