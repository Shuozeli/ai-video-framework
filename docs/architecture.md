# AI Video Framework · Architecture

> 一句话:**把"有时间轴的渲染指令(JSON)"编译并执行为带配音的 MP4 视频,面向财经/资讯类内容。**

本文是高层架构。具体 schema 见 [`framework-design.md`](./framework-design.md);模板目录见 [`templates.md`](./templates.md)。

---

## 1. 设计目标

| 目标 | 说明 |
|---|---|
| **Agent 友好** | DSL 是结构化 JSON,便于 LLM/Agent 直接产出,不需要写 React 代码 |
| **模板化** | 财经视频的常见展示形态(K线、财报、对比表…)固化成模板,Agent 只填数据 |
| **可组合** | Scene 由多个 Layer 叠加,允许"主图 + 字幕条 + 角标"同时存在 |
| **可扩展** | 新模板 = 新 React 组件 + 新 Zod schema,不改 server / compiler |
| **可缓存** | 同一份 audio / chart 数据不重复合成、不重复渲染 |

**非目标(MVP):** Talking Head / 数字人、3D、实拍混剪、Web 编辑器。

---

## 2. 核心概念

```
Workflow ──compile──▶ Pipeline ──execute──▶ MP4
   │                     │                    ▲
   ├─ metadata           ├─ audioTask[]       │
   ├─ materials          ├─ renderTask[]      │
   └─ scenes[]           └─ totalFrames    Remotion
        └─ layers[]
              └─ template + props
```

### 2.1 Workflow
用户/Agent 提交的源对象。包含 `metadata`(标题/分辨率/fps)、`materials`(预上传的资源池)、`scenes[]`(时间轴)。

### 2.2 Scene
一段时间窗口。由 `layers[]` 组成,layer 之间叠加(z-order)、可独立设置 `from` / `durationFrames` 实现层内时序。

> 旧设计中 Scene 只能放 1 个 text + 1 个 image + 1 个 chart。新设计 Scene = `layers[]`,允许多层叠加。

### 2.3 Layer
最小渲染单元。每个 layer 引用一个 **Template**,并提供该 template 要求的 `props`。

```jsonc
{
  "type": "EarningsDashboard",   // ← 模板名
  "from": 0,
  "durationFrames": 180,
  "zIndex": 0,
  "props": { "company": "NVDA", "metrics": [...] }
}
```

### 2.4 Template
一个 React 组件 + 一份 Zod schema + 一组默认值。**Template Registry** 在 DSL 端(校验)和 Render 端(分发)共享。

16 个模板分四档 —— 见 [`templates.md`](./templates.md):

- **Tier 1 · Narrative**:TitleCard / KeyTakeawaysCard / SectionDivider / EndCard
- **Tier 2 · Data Viz**:StockChart / EarningsDashboard / MultiDimChart / BigNumberCard / ComparisonTable / RankingList / Heatmap
- **Tier 3 · News & Logic**:PiPNewsQuote / SocialCard / LogicFlow / Timeline
- **Tier 4 · Decoration**:LowerThird

### 2.5 Material
预先存在的资源(音频、图片、数据 JSON)。Layer 通过 ID 引用,避免大对象内联到 workflow。

```jsonc
"materials": {
  "data":   { "nvda-q3": { "revenue": 18.12, "eps": 0.51, ... } },
  "images": { "bloomberg-logo": "logos/bloomberg.png" },
  "audio":  { "intro": "audio/intro.mp3" }   // 通常由 TTS 阶段填入
}
```

### 2.6 Pipeline
Workflow 的编译产物。把"渲染意图"展开成一连串 **可执行任务**:

- `audioTask[]` — 给 TTS 服务的请求(text → mp3)
- `renderTask[]` — 给 Remotion 的渲染请求(每个 scene 一个,包含其 layers + 帧范围)
- `totalFrames` — 视频总长度

Pipeline 是不可变的、可序列化的、可缓存的中间表示。

---

## 3. 系统架构

```
┌──────────────────────────────────────────────────────────────┐
│                      Client (TS DSL / CLI)                   │
│   构造 Workflow JSON                                         │
└────────────────────────┬─────────────────────────────────────┘
                         │ gRPC
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    gRPC Server (:50051)                      │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │   Compiler   │──▶│   Executor   │──▶│  Cache Manager   │  │
│  │              │   │  (async,     │   │ (LRU / pressure) │  │
│  │ Workflow →   │   │  dirty-flag) │   └──────────────────┘  │
│  │ Pipeline     │   └──────┬───────┘                         │
│  └──────────────┘          │                                 │
│                            ├──▶ TTS (MiniMax T2A) ──┐        │
│                            └──▶ Render (Remotion) ──┤        │
│                                                     ▼        │
│                                            ┌────────────────┐│
│                                            │ Material Bank  ││
│                                            │ (audio/img/    ││
│                                            │  data/video)   ││
│                                            └────────────────┘│
└──────────────────────────────────────────────────────────────┘
                                                     │
                                                     ▼
                                                output.mp4
```

---

## 4. 数据流

```
1. Client       → Workflow JSON (DSL 校验)
2. Compiler     → 校验 layer.template 和 props 是否符合 registry schema
                 → 展开 audioTask + renderTask
                 → 计算 totalFrames
                 → 输出 Pipeline
3. Executor     → 并行调用 TTS:audioTask[] → audio/*.mp3
                 → 一次性调用 Remotion 渲染:把 Pipeline 当 inputProps 传入
4. Render       → Static Remotion 项目读 inputProps,
                 → TemplateDispatcher 按 layer.type 渲染对应组件
                 → 输出 MP4
5. Material Bank 在每一步之前/之后被读写,提供资源寻址
```

---

## 5. 关键设计决策

### 决策 1:Layer-based Scene(而非单坑位)

**问题**:旧 Scene 只能装 1 个 text + 1 个 image + 1 个 chart。无法同时存在"主图 + 底部字幕 + 角标 logo"。

**决定**:`Scene.layers: Layer[]`。每个 layer 自带相对时间窗 + zIndex。

**代价**:DSL 略冗长。但 trade 来"任意叠加 + 任意时序"的表达力。

---

### 决策 2:Static Remotion Project + inputProps(而非动态生成 TSX)

**问题**:旧 `render.ts` 用模板字符串拼出 `GeneratedScene.tsx`,每次渲染都临时 `npm install` 一份 Remotion。慢、不可热重载、模板没法做 visual regression。

**决定**:维护一个长期存在的 Remotion 工程(`packages/ai-video-renderer/`),里面是每个模板的 React 组件。Server 把 Pipeline JSON 当 `inputProps` 传给 `npx remotion render`。

**代价**:模板开发与 server 解耦,需要走"加组件 → build → restart"流程。

---

### 决策 3:Template Registry(而非把节点类型硬编码进 DSL)

**问题**:旧 `types.ts` 把所有节点写成一个 `discriminated union`,加新节点要改 DSL/compiler/render 三处。

**决定**:模板通过 `registerTemplate({ name, schema, component, defaults })` 注册。DSL compiler 只查"layer.type 是否在 registry + props 是否过 schema",不关心实现。

**代价**:需要保证 client 和 server 看到同一份 registry(共享 npm 包 `@ai-video/templates`)。

---

### 决策 4:Materials Pool(而非内联数据)

**问题**:同一份财报数据可能被 EarningsDashboard、LogicFlow、Timeline 三个模板引用。内联会导致重复 + Workflow JSON 膨胀。

**决定**:`workflow.materials.{audio,images,data}` 资源池;layer 通过 `dataRef` / `imageRef` 引用。

**代价**:多一层间接,Agent 写脚本时要先注册资源再引用。

---

### 决策 5:Dirty Flag 缓存(而非每次全量重渲染)

**问题**:Agent 改一句旁白就重新跑 TTS + 渲染整个视频,慢。

**决定**:每个 audioTask / renderTask 算一个 hash(文本 + 模板 + props + 上游依赖)。命中缓存的任务直接复用产物;只有变化的部分重跑。

**代价**:缓存目录管理 + 失效策略复杂度。

---

## 6. 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| Client DSL | TypeScript + Zod | `@ai-video/dsl`,纯函数式构造器 |
| CLI | TypeScript + Commander | `@ai-video/cli`,gRPC client |
| Server | Node.js + `@grpc/grpc-js` | `:50051` |
| Templates | React + Remotion 4 | `@ai-video/templates`(client/server 共享) |
| Renderer | `@ai-video/renderer`(静态 Remotion 项目) | Pipeline → MP4 |
| Audio | MiniMax T2A API | TTS,输出 mp3 |
| Storage | 本地文件系统 | `storage/{cache,materials,pipelines,projects}/` |
| Transport | gRPC + Protobuf | `src/server/proto/video_pipeline.proto` |

---

## 7. 仓库布局(目标态)

```
ai-video-framework/
├── packages/
│   ├── ai-video-dsl/          # Workflow 构造器 + Zod schema
│   ├── ai-video-templates/    # 16 个模板组件 + registry(client/server 共享)
│   ├── ai-video-renderer/     # 静态 Remotion 项目(核心:TemplateDispatcher)
│   └── ai-video-cli/          # gRPC client
├── src/
│   └── server/                # gRPC server, compiler, executor, TTS, cache
├── storage/                   # 运行时数据
│   ├── cache/                 # 渲染/TTS 中间缓存
│   ├── materials/             # 用户上传资源
│   ├── pipelines/             # 已编译 pipeline + 产物
│   └── projects/              # 项目元数据
├── demos/                     # Remotion 示例(开发模板时参考)
└── docs/
    ├── README.md
    ├── architecture.md        ← 本文
    ├── framework-design.md    ← DSL/Compiler/Executor 详细设计
    ├── templates.md           ← 16 模板目录
    ├── remotion-guide.md
    ├── remotion-capabilities-checklist.md
    ├── api-minimax-t2a.md
    └── daily-financial-news-script.md
```

---

## 8. 路线图

| Phase | 内容 | 状态 |
|---|---|---|
| **0 · 框架重构** | Layer 化 Scene + Template Registry + 静态 Remotion 项目 + Transitions(fade/slide/wipe)+ 多语言 schema(zh/en) | 设计完成 |
| **1 · 核心模板 + 预览** | Tier 1(4 个 Narrative)+ MultiDimChart + KeyTakeawaysCard;`RenderFrame` / `RenderScene` RPC | 待开始 |
| **2 · 财经数据模板 + 多语言执行** | StockChart / EarningsDashboard / BigNumberCard / ComparisonTable / RankingList;接通 `ExecuteOptions.lang` 输出 zh + en MP4 | 待开始 |
| **3 · 信息逻辑模板** | PiPNewsQuote / SocialCard / LogicFlow / Timeline / Heatmap / LowerThird | 待开始 |
| **4 · 缓存与执行优化** | Dirty flag、并行 TTS、增量渲染 | 待开始 |
| **5 · 多格式输出** | WebM / 9:16 竖版 | 未来 |
| ~~6 · 自定义模板上传~~ | **不做**。新模板走 PR 进 `@ai-video/templates` | 已决策放弃 |

---

## 9. 与 v1 设计的差异

| 维度 | v1(旧 architecture.md) | v2(本文) |
|---|---|---|
| 实现语言 | Rust + egui + ffmpeg | TypeScript + Node + Remotion |
| Scene 模型 | 单一坑位(text/image/chart 各一) | Layers 数组,任意叠加 |
| 模板系统 | 无,节点类型硬编码 | Template Registry,组件化 |
| 渲染管线 | 字符串拼 TSX,临时 `npm install` | 静态 Remotion 项目 + inputProps |
| 数据资源 | 内联到 scene | Materials Pool(audio/images/data) |
| 缓存 | 无 | Dirty flag + 内容 hash |

> v1 的 Rust+egui 设想已废弃,本仓库不再追求 native 渲染。
