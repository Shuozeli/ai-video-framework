# AI Video Framework · Template Catalog

> 16 个模板的目录。每个模板包含:用途、视觉描述、Zod schema、示例输入、动画行为、默认参数。
>
> 框架机制(layer 模型、registry)见 [`framework-design.md`](./framework-design.md)。

## 模板总览

| Tier | # | 模板 | 用途 |
|---|---|---|---|
| 1 · Narrative | 1 | [TitleCard](#1-titlecard) | 开场封面 |
|  | 2 | [KeyTakeawaysCard](#2-keytakeawayscard) | 要点列表 / 段落总结 |
|  | 3 | [SectionDivider](#3-sectiondivider) | 章节过渡卡 |
|  | 4 | [EndCard](#4-endcard) | 结尾(订阅 / 下期预告) |
| 2 · Data Viz | 5 | [StockChart](#5-stockchart) | K线 / 折线 + 标注 |
|  | 6 | [EarningsDashboard](#6-earningsdashboard) | 财报预期 vs 实际 |
|  | 7 | [MultiDimChart](#7-multidimchart) | bar / pie / stacked / line |
|  | 8 | [BigNumberCard](#8-bignumbercard) | 单一爆点数字 |
|  | 9 | [ComparisonTable](#9-comparisontable) | 双方/多方规格对比 |
|  | 10 | [RankingList](#10-rankinglist) | 排行榜 |
|  | 11 | [Heatmap](#11-heatmap) | 板块/区域热力图 |
| 3 · News & Logic | 12 | [PiPNewsQuote](#12-pipnewsquote) | 新闻卡片 + 高亮笔 |
|  | 13 | [SocialCard](#13-socialcard) | 推特 / 微博嵌入 |
|  | 14 | [LogicFlow](#14-logicflow) | 因果推演图 |
|  | 15 | [Timeline](#15-timeline) | 时间轴 |
| 4 · Decoration | 16 | [LowerThird](#16-lowerthird) | 底部字幕条 |

## 公共约定

- **位置坐标系**:`(x, y)` 以 1920×1080 画布的左上角为原点。竖版(1080×1920)由 metadata.aspectRatio 决定,模板内部用 `useVideoConfig()` 自适应。
- **颜色**:CSS hex 字符串(`#RRGGBB`)。
- **字体**:全部模板默认 `Noto Serif CJK SC`(中文)+ `Inter`(数字 / 英文)。可在 metadata 级别覆盖。
- **`*Ref` 字段**:类型 `string`,指向 `workflow.materials.{data,images,audio}` 中的键。compile 期校验存在性。
- **enter / exit 动画**:所有模板都自动支持 layer-level `enter`/`exit`(见 framework-design.md §2.4),这里不再每个模板单列。

---

# Tier 1 · Narrative

## 1. TitleCard

**用途**:视频开头封面(节目名 + 期号 + 日期)。

**视觉**:
- 大字号主标题居中(font-size 120px)。
- 副标题在主标题下方(font-size 48px)。
- 可选 logo 在右上角。
- 默认背景:深蓝渐变 `#0a0e27 → #1a2455`。

**Schema**:
```ts
{
  title: string,            // 必填,如 "每日财经速递"
  subtitle?: string,        // 期号 / 日期
  logoRef?: string,         // 可选 logo
  accent?: string,          // 主色,默认 '#22c55e'
}
```

**示例**:
```jsonc
{ "type": "TitleCard",
  "props": { "title": "NVDA Q3 财报速递", "subtitle": "Episode 47 · 2026-05-04" } }
```

**动画**:主标题 spring 弹入(damping 12, stiffness 100),副标题 fade-up 延迟 15 帧。

---

## 2. KeyTakeawaysCard

**用途**:开头"本期看点"或段落结束的"课后总结"。

**视觉**:
- 顶部一个标题(font-size 72px,带左侧色条)。
- 下方 3-5 条 bullet,每条带 `▶` 或 `✓` 前缀,逐条入场。
- 每条 bullet 单行不超过 15 字。

**Schema**:
```ts
{
  title: string,
  bullets: string[],         // min 1, max 6,每项 ≤ 40 字
  bulletStyle?: 'arrow' | 'check' | 'number',  // 默认 'arrow'
  accent?: string,           // 默认 '#22c55e'
}
```

**示例**:
```jsonc
{ "type": "KeyTakeawaysCard",
  "props": {
    "title": "本期看点",
    "bullets": [
      "英伟达财报全面超预期,股价盘后 +6%",
      "美联储 6 月降息概率上升至 78%",
      "苹果发布会前瞻:Vision Pro 2 或现身"
    ]
  } }
```

**动画**:bullet 逐条 slide-in-left,每条间隔 8 帧。

---

## 3. SectionDivider

**用途**:章节之间的过渡卡(类似杂志的 "01 / 02 / 03")。

**视觉**:
- 大字号编号("01"占屏高 60%)。
- 编号右侧或下方一行章节名("财报季速递")。
- 短动画后切走(默认 60 帧)。

**Schema**:
```ts
{
  number: string,            // "01" / "02"...
  title: string,             // 章节名
  accent?: string,
  layout?: 'horizontal' | 'vertical',  // 默认 'horizontal'
}
```

**示例**:
```jsonc
{ "type": "SectionDivider",
  "props": { "number": "02", "title": "宏观经济观察" } }
```

**动画**:编号 spring 弹入 + scale 1.2→1.0;标题 fade-in 延迟 10 帧。

---

## 4. EndCard

**用途**:视频结尾(订阅引导 / 下期预告 / 联系方式)。

**视觉**:
- 主文案居中("感谢观看,记得订阅")。
- 下方 1-3 个 CTA 卡片(可放下期标题 / 社交账号 / 二维码)。
- 可选背景视频(轻微视差或粒子)。

**Schema**:
```ts
{
  message: string,
  ctas?: Array<{
    label: string,
    sublabel?: string,
    iconRef?: string,        // images
  }>,                        // 0-3 个
  qrCodeRef?: string,        // images,二维码图
  accent?: string,
}
```

**示例**:
```jsonc
{ "type": "EndCard",
  "props": {
    "message": "下期预告:5 月美联储会议解读",
    "ctas": [
      { "label": "订阅", "sublabel": "B站 / YouTube" },
      { "label": "微信公众号", "sublabel": "@FinanceDaily" }
    ]
  } }
```

**动画**:主文案 fade-in;CTA 依次 fade-up,间隔 12 帧。

---

# Tier 2 · Data Visualization

## 5. StockChart

**用途**:展示个股或指数走势,带关键事件标注。

**视觉**:
- 主区域:K线(蜡烛)或折线图,占屏 70%。
- 顶部:股票名 + 当前价 + 涨跌幅(绿涨红跌,美股配色)。
- 标注:垂直虚线 + 文字气泡,落在指定时间戳。
- 底部:时间轴刻度。

**Schema**:
```ts
{
  ticker: string,                  // "NVDA" / "^GSPC"
  displayName?: string,            // 默认 = ticker
  chartType: 'candle' | 'line',
  // 数据来源:可以 inline,也可以 dataRef
  series?: Array<{ t: string; o: number; h: number; l: number; c: number; v?: number }>,
  dataRef?: string,                // 引用 materials.data
  // 标注
  annotations?: Array<{
    timestamp: string,             // 与 series.t 同格式
    label: string,
    color?: string,
    placement?: 'top' | 'bottom',
  }>,
  // 配色:美股(默认)/A股
  scheme?: 'us' | 'cn',            // us: 绿涨红跌;cn: 红涨绿跌
  showVolume?: boolean,            // 默认 false
}
```

**示例**:
```jsonc
{ "type": "StockChart",
  "props": {
    "ticker": "NVDA",
    "chartType": "candle",
    "dataRef": "nvda-1w-candles",
    "annotations": [
      { "timestamp": "2026-04-24", "label": "财报发布", "placement": "top" }
    ],
    "scheme": "us"
  } }
```

**动画**:
- 折线图:`evolvePath` 从左到右画出。
- K线图:逐根从底部生长(stagger 2 帧)。
- 标注:线先下落、文字 fade-in。

---

## 6. EarningsDashboard

**用途**:拆解某公司季度财报,核心是"预期 vs 实际"对比。

**视觉**:
- 左上:公司 logo + 季度标识(如 "NVDA · 2026 Q3")。
- 主区域:网格 2-4 个指标卡,每卡显示:
  - 指标名(Revenue / EPS / DataCenter Rev)
  - **预期值**(灰色,小字) → **实际值**(大字,绿/红 + 箭头)
  - 同比 / 环比百分比
- 实际超预期:绿色 + ↑;不及预期:红色 + ↓。

**Schema**:
```ts
{
  company: string,
  logoRef?: string,
  quarter: string,                 // "2026 Q3"
  // 指标可以 inline,也可以 dataRef
  metrics?: Array<{
    name: string,                  // "Revenue" / "EPS"
    unit?: string,                 // "B" / "$"
    expected: number,
    actual: number,
    yoyPercent?: number,           // 同比
  }>,
  dataRef?: string,                // shape 同 metrics[]
  scheme?: 'us' | 'cn',
}
```

**示例**:
```jsonc
{ "type": "EarningsDashboard",
  "props": {
    "company": "NVIDIA",
    "logoRef": "nvda-logo",
    "quarter": "2026 Q3",
    "metrics": [
      { "name": "Revenue", "unit": "B", "expected": 17.20, "actual": 18.12, "yoyPercent": 94 },
      { "name": "EPS",     "unit": "$", "expected": 0.45,  "actual": 0.51,  "yoyPercent": 168 },
      { "name": "Data Center Rev", "unit": "B", "expected": 14.8, "actual": 15.5 }
    ]
  } }
```

**动画**:
- Logo + 季度先入。
- 指标卡逐个 scale-up 出现,stagger 10 帧。
- 实际值数字用 `interpolate` 从 0 滚到目标值(20 帧)。

---

## 7. MultiDimChart

**用途**:通用图表,适合宏观数据(CPI 构成、市场份额等)。

**视觉**:
- 顶部标题。
- 主区域是 bar / pie / stacked-bar / line,按 chartType 切换。
- 图例在右侧或下方。

**Schema**:
```ts
{
  title: string,
  chartType: 'bar' | 'pie' | 'stacked' | 'line',
  data: Array<{
    name: string,
    value: number,
    color?: string,
    // stacked / 多维:用 series
    series?: Array<{ name: string; value: number; color?: string }>,
  }>,
  yAxisLabel?: string,
  xAxisLabel?: string,
  legend?: boolean,                // 默认 true
}
```

**示例**:
```jsonc
{ "type": "MultiDimChart",
  "props": {
    "title": "全球云市场份额 2026 Q1",
    "chartType": "pie",
    "data": [
      { "name": "AWS", "value": 31, "color": "#ff9900" },
      { "name": "Azure", "value": 25, "color": "#0078d4" },
      { "name": "GCP", "value": 11, "color": "#4285f4" },
      { "name": "Others", "value": 33, "color": "#888" }
    ]
  } }
```

**动画**:bar 从底部生长;pie 扇形 sweep;stacked 各层依次堆起;line `evolvePath` 画出。

---

## 8. BigNumberCard

**用途**:把单一数字放到全屏中心的"爆点"展示(如 "+47.5%")。

**视觉**:
- 数字占屏高 50%,数字本身可滚动(从 0 滚到目标)。
- 上方一行小字标签("英伟达盘后涨幅")。
- 下方可选副本("市值突破 4 万亿美元")。
- 数字旁可带 ↑/↓ 箭头。

**Schema**:
```ts
{
  label: string,                   // 上方标签
  value: number,                   // 数字
  unit?: string,                   // "%" / "B" / "$" 等,贴在数字尾
  prefix?: string,                 // "+" / "-"
  caption?: string,                // 下方副文案
  arrow?: 'up' | 'down' | 'none',
  color?: string,                  // 默认根据 arrow:up=绿、down=红
  rollFromZero?: boolean,          // 默认 true,数字滚动效果
}
```

**示例**:
```jsonc
{ "type": "BigNumberCard",
  "props": {
    "label": "英伟达盘后涨幅",
    "value": 6.4, "unit": "%", "prefix": "+",
    "caption": "市值突破 4.2 万亿美元",
    "arrow": "up"
  } }
```

**动画**:数字 0→target 滚动(30 帧);箭头 spring 弹入。

---

## 9. ComparisonTable

**用途**:并排对比 2-3 个对象的多个维度(NVDA vs AMD vs INTC 规格 / 财报)。

**视觉**:
- 列头是被对比对象(可带 logo)。
- 行是维度(参数名)。
- "胜出"的格子高亮(绿色背景或加粗)。

**Schema**:
```ts
{
  title?: string,
  columns: Array<{
    label: string,
    logoRef?: string,
    accent?: string,
  }>,                              // 2-4 个
  rows: Array<{
    label: string,                 // 维度名
    values: Array<string | number>,// 长度 == columns.length
    highlight?: number,            // 0-based 列索引,标记胜出
    higherIsBetter?: boolean,      // 用于自动判定 highlight
  }>,
}
```

**示例**:
```jsonc
{ "type": "ComparisonTable",
  "props": {
    "title": "数据中心 GPU 对比",
    "columns": [
      { "label": "H200", "logoRef": "nvda-logo" },
      { "label": "MI300X", "logoRef": "amd-logo" }
    ],
    "rows": [
      { "label": "显存",    "values": ["141 GB", "192 GB"], "highlight": 1 },
      { "label": "FP8 算力", "values": ["3958 TFLOPS", "5230 TFLOPS"], "highlight": 1 },
      { "label": "TDP",     "values": ["700 W", "750 W"], "highlight": 0 }
    ]
  } }
```

**动画**:行逐行从下入场,stagger 6 帧;高亮格延迟 1 行后触发 pulse 高亮。

---

## 10. RankingList

**用途**:涨跌幅榜、持仓榜、市值榜。

**视觉**:
- 顶部标题("今日涨幅榜 · 美股")。
- 1-10 条横向条目,每条:`# 序号 | logo | 名称 | 数值 | 涨跌幅`。
- 数值条形长度按 value 比例。

**Schema**:
```ts
{
  title: string,
  items: Array<{
    rank?: number,                 // 不填则按数组顺序
    name: string,
    logoRef?: string,
    value: number,
    delta?: number,                // 涨跌幅(百分比,正负有色)
    suffix?: string,               // "%" / "$"
  }>,                              // max 10
  sort?: 'asc' | 'desc' | 'none',  // 默认 'desc' 按 delta
  scheme?: 'us' | 'cn',
}
```

**示例**:
```jsonc
{ "type": "RankingList",
  "props": {
    "title": "今日 AI 概念股涨幅榜",
    "items": [
      { "name": "NVDA", "logoRef": "nvda-logo", "value": 950.12, "delta": 6.4 },
      { "name": "AMD",  "logoRef": "amd-logo",  "value": 178.30, "delta": 4.1 },
      { "name": "PLTR", "value": 28.45, "delta": 3.7 }
    ]
  } }
```

**动画**:逐条 slide-in-right,数值条 width 0→target(20 帧)。

---

## 11. Heatmap

**用途**:行业涨跌热力图、地区数据热力图。

**视觉**:
- 网格(grid)布局,每格大小可按 value 加权(树状图 treemap)或固定。
- 颜色深浅按 value 映射(支持自定义 colorScale)。
- 每格内显示标签和数值。

**Schema**:
```ts
{
  title?: string,
  layout: 'grid' | 'treemap',      // grid 等大,treemap 按 weight 加权
  cells: Array<{
    label: string,
    value: number,                 // 用于颜色
    weight?: number,               // treemap 大小;grid 忽略
    sublabel?: string,             // 第二行小字
  }>,
  colorScale?: {
    min: number,                   // 最低值对应 minColor
    max: number,
    minColor: string,
    maxColor: string,
    midColor?: string,             // 三色渐变
    midValue?: number,
  },
  scheme?: 'us' | 'cn' | 'mono',   // 内置三色配色
}
```

**示例**:
```jsonc
{ "type": "Heatmap",
  "props": {
    "title": "标普 11 大板块今日表现",
    "layout": "treemap",
    "cells": [
      { "label": "Tech",    "value":  2.1, "weight": 28 },
      { "label": "Energy",  "value": -1.4, "weight": 4 },
      { "label": "Health",  "value":  0.3, "weight": 13 }
    ],
    "scheme": "us"
  } }
```

**动画**:全部格子 stagger fade-in,持续 30 帧。

---

# Tier 3 · News & Logic

## 12. PiPNewsQuote

**用途**:画中画引述新闻报道,主体口播 + 一侧滑入新闻卡。

**视觉**:
- 卡片(右侧,带阴影):
  - 顶部 source logo + 日期
  - 标题(粗体)
  - 摘录(2-3 句),其中关键句子有"高亮笔"涂抹效果
- 主屏剩余空间留白或保留原来 layer。

**Schema**:
```ts
{
  source: string,                  // "Bloomberg" / "WSJ"
  sourceLogoRef?: string,
  publishedAt?: string,            // "2026-05-04"
  headline: string,
  body: string,                    // 引述内容,可含 markdown 加粗
  highlights?: string[],           // body 内要高亮的子串(精确匹配)
  position?: 'left' | 'right',     // 默认 'right'
  cardStyle?: 'newspaper' | 'web' | 'minimal',  // 默认 'newspaper'
}
```

**示例**:
```jsonc
{ "type": "PiPNewsQuote",
  "props": {
    "source": "Bloomberg",
    "sourceLogoRef": "bloomberg-logo",
    "publishedAt": "2026-05-04",
    "headline": "Nvidia 财报全面超预期,数据中心营收同比增长近一倍",
    "body": "英伟达公布的第三财季营收为 181 亿美元,同比增长 94%。其中数据中心业务贡献 155 亿,同比增长 169%。",
    "highlights": ["营收为 181 亿美元", "数据中心业务贡献 155 亿"]
  } }
```

**动画**:卡片从屏外 slide-in(20 帧),进入后高亮笔从左到右涂抹关键句(每句 12 帧)。

---

## 13. SocialCard

**用途**:嵌入推特 / 微博 / Threads 等社交平台帖子。

**视觉**:
- 仿原平台 UI(头像、用户名、handle、时间、正文、互动数)。
- 平台图标在右上角。
- 支持长帖折叠(超出 4 行显示 "..." )。

**Schema**:
```ts
{
  platform: 'x' | 'weibo' | 'threads' | 'linkedin',
  authorName: string,
  authorHandle: string,            // "@elonmusk"
  authorAvatarRef?: string,
  authorVerified?: boolean,
  content: string,                 // 帖子正文
  postedAt?: string,
  likes?: number,
  reposts?: number,
  // 截图模式:直接渲染图片,忽略其它字段
  screenshotRef?: string,
}
```

**示例**:
```jsonc
{ "type": "SocialCard",
  "props": {
    "platform": "x",
    "authorName": "Elon Musk",
    "authorHandle": "@elonmusk",
    "authorAvatarRef": "elon-avatar",
    "authorVerified": true,
    "content": "Optimus Gen 3 ships next quarter. The future is automated.",
    "postedAt": "2026-05-03",
    "likes": 482000,
    "reposts": 87000
  } }
```

**动画**:卡片 fade-up + 轻微缩放(scale 0.95→1.0)。

---

## 14. LogicFlow

**用途**:展示因果推演 / 思维导图。

**视觉**:
- 节点(矩形 / 圆角矩形,带文字)+ 连线(箭头或粗线)。
- 节点按提供的顺序逐个亮起,连线在两端节点都出现后画出。
- 自动布局(水平 / 垂直 / 树状)。

**Schema**:
```ts
{
  layout: 'horizontal' | 'vertical' | 'tree',
  nodes: Array<{
    id: string,                    // 唯一,供 edges 引用
    label: string,
    sublabel?: string,
    color?: string,
    accent?: 'positive' | 'negative' | 'neutral',  // 自动配色
  }>,
  edges: Array<{
    from: string,                  // node id
    to: string,
    label?: string,                // 边上的文字
    style?: 'solid' | 'dashed',
  }>,
  reveal?: 'sequential' | 'all',   // 默认 sequential
  revealStaggerFrames?: number,    // 默认 15
}
```

**示例**:
```jsonc
{ "type": "LogicFlow",
  "props": {
    "layout": "horizontal",
    "nodes": [
      { "id": "a", "label": "大厂缩减 Capex", "accent": "negative" },
      { "id": "b", "label": "云巨头现金流改善", "accent": "positive" },
      { "id": "c", "label": "GPU 需求承压", "accent": "negative" }
    ],
    "edges": [
      { "from": "a", "to": "b" },
      { "from": "a", "to": "c", "style": "dashed", "label": "传导" }
    ]
  } }
```

**动画**:节点 sequential 出现(scale + fade);出现完成后 edge 从 from→to 画出,sublabel 跟随。

---

## 15. Timeline

**用途**:时间轴展示(公司大事记、政策时点、产品迭代)。

**视觉**:
- 一条横线或竖线 + 节点(带日期标记)。
- 每个节点上下交替放卡片(标题 + 简短描述)。
- 动画:线先延伸,节点逐个亮起,卡片随节点 fade-in。

**Schema**:
```ts
{
  title?: string,
  orientation: 'horizontal' | 'vertical',
  events: Array<{
    date: string,                  // "2024-Q1" / "2024-03-15"
    title: string,
    description?: string,
    iconRef?: string,
    accent?: string,
  }>,                              // max 8
}
```

**示例**:
```jsonc
{ "type": "Timeline",
  "props": {
    "title": "OpenAI 关键时刻",
    "orientation": "horizontal",
    "events": [
      { "date": "2022-11", "title": "ChatGPT 发布" },
      { "date": "2023-03", "title": "GPT-4 上线" },
      { "date": "2024-05", "title": "GPT-4o 多模态" },
      { "date": "2025-12", "title": "GPT-5 发布" }
    ]
  } }
```

**动画**:线 evolvePath 延伸 → 节点逐个 scale-pop → 卡片 fade-up。

---

# Tier 4 · Decoration

## 16. LowerThird

**用途**:底部字幕条 / 人物名条 / 数据来源条。**这个模板设计上就是和别的模板叠加用,不应单独成 scene。**

**视觉**:
- 底部矩形条(高度约屏幕 12%)。
- 左侧色条 + 主标题 + 副标题。
- 支持出现时滑入、消失时滑出。

**Schema**:
```ts
{
  title: string,                   // 主行(人名 / 来源 / 数据点)
  subtitle?: string,               // 副行(职位 / 详情)
  accent?: string,                 // 左色条颜色
  position?: 'bottom-left' | 'bottom-center' | 'bottom-right',  // 默认 'bottom-left'
  width?: 'full' | 'half' | 'auto',                             // 默认 'half'
}
```

**示例**:
```jsonc
{ "type": "LowerThird",
  "from": 60, "durationFrames": 90,
  "props": {
    "title": "Source: NVIDIA Investor Relations",
    "subtitle": "Q3 FY26 Earnings Release"
  } }
```

**动画**:slide-in-left(15 帧) → hold → slide-out-left(15 帧)。

---

## 模板设计原则(回顾)

1. **窄而专** — 每个模板做一件事,不做高度参数化的"通用画布"。视觉一致性 > 灵活度。
2. **数据外引** — 大数据用 `dataRef` 走 materials pool,不内联。
3. **Agent 可枚举** — 所有 schema 是 Zod,可通过 `zod-to-json-schema` 输出给 LLM 作为 tool spec。
4. **动画自带** — Agent 不写动画参数;模板内置定时动画,只用 layer-level enter/exit 微调。
5. **配色统一** — `scheme: 'us' | 'cn'` 控制涨跌色;`accent` 控制品牌主色。模板不接受任意配色字段。
