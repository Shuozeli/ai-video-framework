# Documentation Index

## AI Video Framework

A programmable video generation pipeline framework for **financial / news content automation**.
Inputs:Agent 产出的结构化 Workflow JSON。Outputs:带配音的 MP4。

### Core Architecture

```
gRPC Server (:50051)
  ├── Workflow Compiler      (Workflow → Pipeline)
  ├── Pipeline Executor      (async, dirty-flag, cache)
  ├── Render Pipeline        (Static Remotion project + inputProps)
  ├── TTS Service            (MiniMax T2A)
  ├── Cache Manager          (LRU / RAM_PRESSURE / CLASSIC)
  └── Material Bank          (audio / images / data / video)
        ↑ gRPC
gRPC CLI Client (TypeScript DSL)
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| DSL | TypeScript + Zod |
| Templates | React + Remotion 4(`@ai-video/templates`,client/server 共享) |
| Renderer | Static Remotion project(`@ai-video/renderer`) |
| RPC | gRPC + Protobuf |
| Storage | Local filesystem |
| Audio | MiniMax T2A API |

---

## Documentation

| Document | Description |
|----------|-------------|
| [architecture.md](./architecture.md) | **高层架构、核心概念、数据流、关键设计决策** |
| [framework-design.md](./framework-design.md) | DSL schema、Template Registry、Compiler、Executor、Render、gRPC API |
| [templates.md](./templates.md) | **16 个模板目录**(schema + 示例 + 动画) |
| [remotion-guide.md](./remotion-guide.md) | Remotion 用法 / 动画 / 样式 参考 |
| [remotion-capabilities-checklist.md](./remotion-capabilities-checklist.md) | Remotion 能力清单 |
| [api-minimax-t2a.md](./api-minimax-t2a.md) | MiniMax TTS API 参考 |
| [daily-financial-news-script.md](./daily-financial-news-script.md) | Demo 脚本设计 |

---

## Templates Status (16 个)

| Tier | Template | 状态 |
|---|---|---|
| 1 · Narrative | TitleCard | 设计完成 |
|  | KeyTakeawaysCard | 设计完成 |
|  | SectionDivider | 设计完成 |
|  | EndCard | 设计完成 |
| 2 · Data Viz | StockChart | 设计完成 |
|  | EarningsDashboard | 设计完成 |
|  | MultiDimChart | 设计完成 |
|  | BigNumberCard | 设计完成 |
|  | ComparisonTable | 设计完成 |
|  | RankingList | 设计完成 |
|  | Heatmap | 设计完成 |
| 3 · News & Logic | PiPNewsQuote | 设计完成 |
|  | SocialCard | 设计完成 |
|  | LogicFlow | 设计完成 |
|  | Timeline | 设计完成 |
| 4 · Decoration | LowerThird | 设计完成 |

> Talking Head / 数字人模板 **不做**(MVP 范围外)。

---

## Framework Status

| Component | Status | Notes |
|-----------|--------|-------|
| **DSL Types(v2)** | 设计完成 | Layer-based scenes, materials pool, transitions, multi-lang audio |
| **Template Registry** | 设计完成 | 共享包 `@ai-video/templates` |
| **Compiler** | 设计完成 | Workflow → Pipeline,扣转场重叠 |
| **gRPC API(v2)** | 设计完成 | Layer + Materials + Transitions + ListTemplates + RenderFrame + RenderScene |
| **Executor** | 设计完成 | Async, dirty flag, `ExecuteOptions.lang` |
| **Cache System** | 设计完成 | LRU / RAM_PRESSURE / CLASSIC |
| **Static Remotion Renderer** | 设计完成 | TransitionSeries,替换字符串拼 TSX |
| **CLI** | 设计完成 | gRPC client commands |
| **Workflow Versioning** | **Pending** | Version control, history |
| **Web Editor** | **Pending** | ComfyUI-style UI |
| **Custom Template Upload** | **不做** | 走 PR 进 `@ai-video/templates`,不开放运行时上传 |

---

## Implementation Roadmap

| Phase | Scope | Status |
|---|---|---|
| **0 · 框架重构** | Layer 化 Scene + Template Registry + 静态 Remotion 项目 + Transitions + 多语言 schema(zh/en) | 设计完成,待实施 |
| **1 · 核心模板 + 预览** | Tier 1(4 个)+ MultiDimChart + KeyTakeawaysCard;`RenderFrame` / `RenderScene` RPC | 待开始 |
| **2 · 财经数据 + 多语言执行** | StockChart / EarningsDashboard / BigNumberCard / ComparisonTable / RankingList;接通 `ExecuteOptions.lang` 输出 zh+en MP4 | 待开始 |
| **3 · 信息逻辑模板** | PiPNewsQuote / SocialCard / LogicFlow / Timeline / Heatmap / LowerThird | 待开始 |
| **4 · 缓存与执行优化** | Dirty flag、并行 TTS、增量渲染 | 待开始 |
| **5 · 多格式输出** | WebM / 9:16 竖版 | 未来 |

---

## Pending Design Tasks

### Medium Priority
- **Webhook / Events** — Pipeline 完成通知
- **API Key Management** — MiniMax / 数据源密钥安全存储
- **Rate Limit Refinement** — TTS QPS 控制细化

### Low Priority (Future)
- **Distributed Rendering** — 多 worker 切片渲染(defer 至单机渲染瓶颈出现)
- **Web Editor** — ComfyUI-style UI
- **更多语言音轨** — 当前 zh + en;ja / ko 等按需扩展

### 已决策(不做)
- **Custom Template 运行时上传** — 走 PR 进 `@ai-video/templates` 包
- **Scene 切片 + ffmpeg concat 渲染** — Remotion 内并发已够用

---

## Next Steps

1. **实施 Phase 0** — 拆 `@ai-video/templates` 包、写 `@ai-video/renderer` 静态 Remotion 工程、替换 server 的 `render.ts`
2. **挑 2 个最简单的模板验证管线** — 推荐 KeyTakeawaysCard + MultiDimChart(已有 80% 代码可复用)
3. **加 `materials.data` 资源池** — 修改 DSL + proto + executor
4. **批量补剩下 14 个模板** — 大部分是纯前端组件
