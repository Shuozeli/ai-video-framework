# AI Video Framework · Framework Design

> 本文是框架机制的详细设计:DSL schema、Template Registry、Compiler、Executor、Render Pipeline、gRPC API。
> 高层架构见 [`architecture.md`](./architecture.md);16 个模板的具体 schema 见 [`templates.md`](./templates.md)。

---

## 目录

1. [概念回顾](#1-概念回顾)
2. [DSL 设计](#2-dsl-设计)
3. [Template Registry](#3-template-registry)
4. [Compiler:Workflow → Pipeline](#4-compilerworkflow--pipeline)
5. [Executor:Pipeline → MP4](#5-executorpipeline--mp4)
6. [Render Pipeline:Static Remotion Project](#6-render-pipelinestatic-remotion-project)
7. [Cache 系统](#7-cache-系统)
8. [Material Bank](#8-material-bank)
9. [gRPC API](#9-grpc-api)
10. [文件布局](#10-文件布局)
11. [错误处理](#11-错误处理)
12. [开放问题](#12-开放问题)

---

## 1. 概念回顾

```
Workflow = metadata + materials + scenes[]
Scene    = duration + layers[]
Layer    = template + props + (from, durationFrames, zIndex)
Template = name + Zod schema + React component + defaults
```

数据流:**Workflow ──compile──▶ Pipeline ──execute──▶ MP4**

---

## 2. DSL 设计

DSL 包位置:`packages/ai-video-dsl/`。所有 schema 用 Zod 定义,运行时校验,编译时类型推导。

### 2.1 VideoMetadata

```ts
export const VideoMetadataSchema = z.object({
  title: z.string().min(1),
  duration: z.number().positive(),         // seconds, 计算用,含转场重叠后的总长
  fps: z.number().positive().default(30),
  resolution: ResolutionSchema.default({ width: 1920, height: 1080 }),
  format: z.enum(['mp4', 'webm']).default('mp4'),               // ← 新增
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'), // ← 新增
  primaryLang: z.enum(['zh', 'en']).default('zh'),              // ← 新增,默认旁白语言
});
```

> `format`、`aspectRatio`、`primaryLang` 是 v2 新增字段。
> `duration` 是 *最终视频时长*(已扣除转场重叠),Agent 不需要自己算。

### 2.2 Materials Pool

```ts
export const MaterialsSchema = z.object({
  // 数据对象池(供 chart / dashboard / table 引用)
  data: z.record(z.string(), z.unknown()).default({}),
  // 图片池(logo / 截图 / 头像 / 背景)
  images: z.record(z.string(), z.string()).default({}),
  // 音频池(开场音乐 / 转场音效;TTS 产物在执行时填入)
  audio: z.record(z.string(), z.string()).default({}),
});
```

引用方式:layer 内部通过 `dataRef: 'nvda-q3'` / `imageRef: 'logo'` / `audioRef: 'intro-music'` 指向。

### 2.3 Scene + Layer

```ts
export const LayerBaseSchema = z.object({
  id: z.string().optional(),                 // 可选,用于缓存定位
  type: z.string(),                          // 模板名,registry 校验
  from: z.number().int().nonnegative().default(0),         // frames,scene 内偏移
  durationFrames: z.number().int().positive().optional(),  // 不填则到 scene 结束
  zIndex: z.number().int().default(0),
  enter: AnimationSchema.optional(),         // 入场动画
  exit: AnimationSchema.optional(),          // 出场动画
  props: z.record(z.string(), z.unknown()),  // 模板专属字段,registry schema 校验
});

// 多语言旁白:主语言 + 可选 alternates(目前支持 zh / en)
export const AudioBlockSchema = z.object({
  text: z.string().optional(),               // 主语言文案
  audioRef: z.string().optional(),           // 或直接引用 materials.audio(免 TTS)
  voice: VoiceSettingSchema.optional(),
  alternates: z.record(
    z.enum(['zh', 'en']),
    z.object({
      text: z.string(),
      voice: VoiceSettingSchema.optional(),
    }),
  ).optional(),
});

export const SceneSchema = z.object({
  name: z.string().min(1),
  duration: z.number().positive(),           // seconds(scene 自身时长,不含转场)
  audio: AudioBlockSchema.optional(),
  background: BackgroundSchema.optional(),   // 整 scene 底色/底图
  layers: z.array(LayerBaseSchema).min(1),
});
```

> **多语言语义**:`audio.text` 是 metadata.primaryLang(默认 `zh`)的旁白。
> 如果 `alternates.en` 存在,Executor 在 `ExecuteOptions.lang = 'en'` 时会改用英文文本(见 §5.2)。
> 不存在的语言:fallback 到 primaryLang 文本(不报错)。

### 2.4 Animation

```ts
export const AnimationSchema = z.object({
  type: z.enum(['fade', 'slide', 'scale', 'spring', 'none']).default('fade'),
  durationFrames: z.number().int().nonnegative().default(15),
  direction: z.enum(['left', 'right', 'up', 'down']).optional(),
  easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']).default('ease-out'),
});
```

`spring` 直接映射到 Remotion 的 `spring()`;其它走 `interpolate()` + 缓动函数。

### 2.5 Background

```ts
export const BackgroundSchema = z.object({
  kind: z.enum(['solid', 'gradient', 'image']).default('solid'),
  color: z.string().default('#0a0e27'),     // solid / gradient stop1
  color2: z.string().optional(),             // gradient stop2
  imageRef: z.string().optional(),           // kind: image
  blur: z.number().nonnegative().default(0),
});
```

### 2.6 Transitions(scene 间过渡)

```ts
export const TransitionSchema = z.object({
  from: z.string(),                          // scene name
  to: z.string(),                            // scene name
  kind: z.enum(['fade', 'slide', 'wipe', 'none']).default('fade'),
  durationFrames: z.number().int().positive().default(15),
  direction: z.enum(['left', 'right', 'up', 'down']).optional(),  // slide / wipe 用
  easing: z.enum(['linear', 'ease-in', 'ease-out', 'ease-in-out']).default('ease-out'),
});
```

**语义**:转场 *重叠* 两个 scene 各 `durationFrames/2` 帧(Remotion `<TransitionSeries>` 的默认行为)。
未在 `transitions` 中声明的相邻 scene 之间是硬切。

**对 totalFrames 的影响**:
```
totalFrames = sum(scene.duration * fps for scene in scenes)
            - sum(t.durationFrames for t in transitions)
```

### 2.7 Workflow 顶层

```ts
export const WorkflowSchema = z.object({
  metadata: VideoMetadataSchema,
  materials: MaterialsSchema.default({ data: {}, images: {}, audio: {} }),
  scenes: z.array(SceneSchema).min(1),
  transitions: z.array(TransitionSchema).default([]),    // ← 新增
});
```

### 2.8 例子(Agent 直接产出的形态)

```jsonc
{
  "metadata": {
    "title": "每日财经 2026-05-04",
    "duration": 13.5,                  // 14s scenes - 0.5s transition
    "fps": 30,
    "primaryLang": "zh"
  },
  "materials": {
    "data": {
      "nvda-q3": { "revenueExpected": 17.20, "revenueActual": 18.12, "epsExpected": 0.45, "epsActual": 0.51 }
    },
    "images": { "nvda-logo": "logos/nvda.png" }
  },
  "scenes": [
    {
      "name": "intro",
      "duration": 4,
      "audio": {
        "text": "今天我们关注英伟达的最新财报。",
        "alternates": { "en": { "text": "Today we look at NVIDIA's latest earnings." } }
      },
      "background": { "kind": "gradient", "color": "#0a0e27", "color2": "#1a2455" },
      "layers": [
        { "type": "TitleCard",
          "props": { "title": "NVDA Q3 财报速递", "subtitle": "2026-05-04" } }
      ]
    },
    {
      "name": "earnings",
      "duration": 10,
      "audio": {
        "text": "营收 181 亿,超出预期。EPS 0.51 元...",
        "alternates": { "en": { "text": "Revenue came in at 18.1B, beating consensus..." } }
      },
      "layers": [
        { "type": "EarningsDashboard",
          "props": { "company": "NVDA", "logoRef": "nvda-logo", "dataRef": "nvda-q3" } },
        { "type": "LowerThird",
          "from": 60, "durationFrames": 90,
          "props": { "title": "Source: NVIDIA Investor Relations" } }
      ]
    }
  ],
  "transitions": [
    { "from": "intro", "to": "earnings", "kind": "fade", "durationFrames": 15 }
  ]
}
```

---

## 3. Template Registry

模板的"插件"机制。Client 和 Server **共享同一份注册表**(包名 `@ai-video/templates`)。

### 3.1 注册接口

```ts
// packages/ai-video-templates/src/registry.ts
export interface TemplateDefinition<P = unknown> {
  name: string;                              // 唯一,如 'EarningsDashboard'
  tier: 'narrative' | 'data' | 'logic' | 'decoration';
  schema: z.ZodType<P>;                      // props 校验
  defaults: Partial<P>;
  component: React.FC<P>;                    // Remotion 端用
  preview?: () => React.ReactNode;           // 文档生成用,可选
}

const REGISTRY = new Map<string, TemplateDefinition>();

export function registerTemplate<P>(def: TemplateDefinition<P>) {
  if (REGISTRY.has(def.name)) {
    throw new Error(`Template ${def.name} already registered`);
  }
  REGISTRY.set(def.name, def as TemplateDefinition);
}

export function getTemplate(name: string): TemplateDefinition | undefined {
  return REGISTRY.get(name);
}

export function listTemplates(): TemplateDefinition[] {
  return [...REGISTRY.values()];
}
```

### 3.2 一个模板的完整定义(范例)

```ts
// packages/ai-video-templates/src/templates/key-takeaways.tsx
import { z } from 'zod';
import { registerTemplate } from '../registry';

const PropsSchema = z.object({
  title: z.string().min(1),
  bullets: z.array(z.string().min(1).max(40)).min(1).max(6),
  accent: z.string().default('#22c55e'),
});

type Props = z.infer<typeof PropsSchema>;

const KeyTakeawaysCard: React.FC<Props> = ({ title, bullets, accent }) => {
  // ... Remotion 组件实现
};

registerTemplate({
  name: 'KeyTakeawaysCard',
  tier: 'narrative',
  schema: PropsSchema,
  defaults: { accent: '#22c55e' },
  component: KeyTakeawaysCard,
});
```

### 3.3 共享给 client / server

```
@ai-video/templates
├── src/
│   ├── registry.ts              # 注册表实现
│   ├── templates/               # 16 个模板,每个一个文件
│   │   ├── title-card.tsx
│   │   ├── key-takeaways.tsx
│   │   └── ...
│   └── index.ts                 # 副作用:逐个 import 触发 registerTemplate
```

- **Client / DSL 端**:只需要 schema,通过 `getTemplate(name).schema.parse(props)` 校验。无需 React 渲染。
- **Server / Renderer 端**:需要 component 渲染。Remotion 项目 import `@ai-video/templates`,registry 自动充满。

### 3.4 自定义模板(未来)

预留 `loadExternalTemplate(modulePath)` 接口,允许从 `materials/templates/<name>/index.ts` 动态加载。MVP 不实现。

---

## 4. Compiler:Workflow → Pipeline

`packages/ai-video-dsl/src/compiler.ts`(纯 TypeScript,可在 client/server 任一端运行)。

### 4.1 输入与输出

```ts
function compile(workflow: Workflow): Pipeline
```

### 4.2 步骤

1. **结构校验** — `WorkflowSchema.parse(workflow)`
2. **Layer schema 校验** — 遍历每个 scene 的每个 layer:
   ```ts
   const tpl = getTemplate(layer.type);
   if (!tpl) throw new Error(`Unknown template: ${layer.type}`);
   const merged = { ...tpl.defaults, ...layer.props };
   layer.props = tpl.schema.parse(merged);   // 写回校验后的值
   ```
3. **Material 引用校验** — 任何 `dataRef` / `imageRef` / `audioRef` 必须在 `materials` 中存在
4. **Transition 校验** — `transition.from` / `transition.to` 必须是已定义的 scene name,且必须相邻
5. **时间轴展开**:
   ```
   totalFrames = sum(scene.duration * fps) - sum(transition.durationFrames)
   ```
   每个 scene 的 `[startFrame, endFrame)` 也要扣掉前面的转场重叠帧
6. **物化任务** — 为每个 scene 产出一个 `RenderTask`,为每个有 `audio.text` 或 `alternates[lang].text` 的 scene 产出对应语言的 `AudioTask`(每个语言一个 task,各自 hash)
7. **任务 hash** — 每个任务计算 `contentHash`(用于缓存,见 §7)

### 4.3 Pipeline schema

```ts
export const PipelineSchema = z.object({
  pipelineId: z.string(),                    // 通常是 workflow hash
  metadata: VideoMetadataSchema,
  materials: MaterialsSchema,                // 透传,executor 需要解析 ref
  scenes: z.array(z.object({
    name: z.string(),
    startFrame: z.number().int(),
    durationFrames: z.number().int(),
    layers: z.array(LayerBaseSchema),        // 已校验过的 layers
    background: BackgroundSchema.optional(),
    audioTasks: z.record(                    // key: lang code ('zh' / 'en' / ...)
      z.string(),
      AudioTaskSchema,
    ).default({}),
    renderTask: RenderTaskSchema,
  })),
  transitions: z.array(TransitionSchema).default([]),
  totalFrames: z.number().int(),
});

export const AudioTaskSchema = z.object({
  taskId: z.string(),
  contentHash: z.string(),
  lang: z.enum(['zh', 'en']),
  text: z.string(),
  voice: VoiceSettingSchema,
  outputPath: z.string(),                    // 相对 storage/pipelines/<id>/audio/<lang>/
});

export const RenderTaskSchema = z.object({
  taskId: z.string(),
  contentHash: z.string(),
  sceneName: z.string(),
  startFrame: z.number().int(),
  durationFrames: z.number().int(),
  layers: z.array(LayerBaseSchema),
  background: BackgroundSchema.optional(),
});
```

### 4.4 增量编译

`compile()` 是纯函数。重复编译同一个 workflow 应得到相同 `pipelineId`(workflow 内容 hash)。这是缓存命中的前提。

---

## 5. Executor:Pipeline → MP4

`src/server/services/executor.ts`。

### 5.1 状态机

```
PENDING → COMPILING → GENERATING_AUDIO → RENDERING → COMPLETED
                                                  ↘  FAILED / CANCELLED
```

### 5.2 主流程

```ts
type ExecuteOptions = {
  outputPath: string,
  lang?: 'zh' | 'en',                        // 默认 metadata.primaryLang
  generateAudio?: boolean,
  generateVideo?: boolean,
};

async function execute(pipelineId: string, opts: ExecuteOptions): AsyncIterable<ExecuteResponse> {
  const pipeline = await store.get(pipelineId);
  const lang = opts.lang ?? pipeline.metadata.primaryLang;

  // 1. Audio 阶段:为指定 lang 抽取对应 audioTask
  yield { status: 'GENERATING_AUDIO', progress: 0 };
  const audioTasks = pipeline.scenes
    .map(s => s.audioTasks[lang] ?? s.audioTasks[pipeline.metadata.primaryLang])  // fallback 主语言
    .filter(Boolean);
  const audioResults = await Promise.all(
    audioTasks.map(t => runAudioTask(t, { cache, tts }))
  );
  for (const r of audioResults) pipeline.materials.audio[r.audioRef] = r.path;

  // 2. Render 阶段
  yield { status: 'RENDERING', progress: 50 };
  const result = await renderPipeline({
    pipeline,
    lang,
    outputPath: opts.outputPath,             // 调用方拼后缀,如 video.en.mp4
    onProgress: (frame, total) => emit({ status: 'RENDERING', progress: 50 + 50 * frame/total }),
  });

  yield { status: 'COMPLETED', videoPath: result.videoPath, progress: 100 };
}
```

> 一份 pipeline 渲染 N 种语言 = N 次 `execute()` 调用。每次输出独立 MP4。
> 调用方负责给输出路径加语言后缀(如 `video.zh.mp4` / `video.en.mp4`)。

### 5.3 并发控制

| 任务 | 默认并发 | 可调 |
|---|---|---|
| TTS 调用 | 4 | `EXECUTOR_TTS_CONCURRENCY` env |
| Remotion 渲帧 | 由 Remotion 自管理 | `--concurrency` flag |

TTS QPS 上限由 `services/tts.ts` 的 token bucket 控制。

### 5.4 Cancel

`cancelPipeline` 设置 `pipelineId` 的中止标志。每个 await 点检查;TTS 用 `AbortController`;Remotion 用子进程 SIGTERM。

---

## 6. Render Pipeline:Static Remotion Project

新增包 `packages/ai-video-renderer/`,这是一个**长期存在**的 Remotion 工程。

### 6.1 项目结构

```
packages/ai-video-renderer/
├── package.json                # @remotion/cli, @remotion/bundler, react, @ai-video/templates
├── remotion.config.ts
├── src/
│   ├── index.ts                # registerRoot
│   ├── Root.tsx                # <Composition> 声明
│   ├── Video.tsx               # ← 顶层组件,读 inputProps
│   └── TemplateDispatcher.tsx  # 按 layer.type 派发到对应组件
└── public/
    └── (字体、默认 logo 等静态资源)
```

### 6.2 顶层组件:`Video.tsx`

用 Remotion 的 `<TransitionSeries>` 把 scene 串起来,转场在 scene 边界自动重叠。

```tsx
import { AbsoluteFill, getInputProps } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import type { Pipeline } from '@ai-video/dsl';
import { SceneRoot } from './SceneRoot';

const PRESENTATIONS = { fade, slide, wipe };

export const Video: React.FC = () => {
  const pipeline = getInputProps() as Pipeline;
  const transitionsByFrom = new Map(pipeline.transitions.map(t => [t.from, t]));

  return (
    <TransitionSeries>
      {pipeline.scenes.flatMap((scene, idx) => {
        const seq = (
          <TransitionSeries.Sequence
            key={scene.name}
            durationInFrames={scene.durationFrames}>
            <SceneRoot scene={scene} pipeline={pipeline} />
          </TransitionSeries.Sequence>
        );
        const t = transitionsByFrom.get(scene.name);
        if (!t || t.kind === 'none' || idx === pipeline.scenes.length - 1) return [seq];
        const presentation = PRESENTATIONS[t.kind];
        const trans = (
          <TransitionSeries.Transition
            key={`t-${scene.name}`}
            presentation={presentation({ direction: t.direction })}
            timing={linearTiming({ durationInFrames: t.durationFrames })}
          />
        );
        return [seq, trans];
      })}
    </TransitionSeries>
  );
};
```

`SceneRoot` 渲染单个 scene 的 background + layers(原本 `Video.tsx` 的内层逻辑搬过来):

```tsx
const SceneRoot: React.FC<{ scene: Scene; pipeline: Pipeline }> = ({ scene, pipeline }) => (
  <AbsoluteFill>
    <SceneBackground bg={scene.background} />
    {scene.layers
      .sort((a, b) => a.zIndex - b.zIndex)
      .map((layer, i) => (
        <LayerHost key={i} layer={layer}>
          <TemplateDispatcher layer={layer} pipeline={pipeline} />
        </LayerHost>
      ))}
  </AbsoluteFill>
);
```

> 注意:用 TransitionSeries 后,`LayerHost` 内部的 `useCurrentFrame()` 自动是 *scene-relative*,不再需要手动减 `sceneStartFrame`。

### 6.3 `TemplateDispatcher.tsx`

```tsx
import { getTemplate } from '@ai-video/templates';

export const TemplateDispatcher: React.FC<{ layer: Layer; pipeline: Pipeline }> = ({ layer, pipeline }) => {
  const tpl = getTemplate(layer.type);
  if (!tpl) {
    return <ErrorPlaceholder text={`Unknown template: ${layer.type}`} />;
  }
  // 解析 *Ref 字段为实际值
  const resolved = resolveRefs(layer.props, pipeline.materials);
  const Component = tpl.component;
  return <Component {...resolved} />;
};
```

### 6.4 `LayerHost`(处理 from / durationFrames / 入出场动画)

```tsx
const LayerHost: React.FC<{ layer: Layer; children: React.ReactNode }> = ({ layer, children }) => {
  const frame = useCurrentFrame();    // ← TransitionSeries 内部已经是 scene-relative
  if (frame < layer.from) return null;
  if (layer.durationFrames && frame >= layer.from + layer.durationFrames) return null;

  const localFrame = frame - layer.from;
  const enterOpacity = layer.enter
    ? interpolate(localFrame, [0, layer.enter.durationFrames], [0, 1], { extrapolateRight: 'clamp' })
    : 1;
  // ... exit 同理

  return <div style={{ opacity: enterOpacity, position: 'absolute', inset: 0, zIndex: layer.zIndex }}>{children}</div>;
};
```

### 6.5 调用 Remotion

Server 不再生成 TSX。只是:

```ts
// src/server/services/render.ts (重写后)
export async function renderPipeline(cfg: RenderConfig): Promise<RenderResult> {
  const propsFile = path.join(tmpdir(), `${cfg.pipeline.pipelineId}-${cfg.lang}.json`);
  // 把 lang 注入 inputProps,Renderer 选取对应 audio 路径
  fs.writeFileSync(propsFile, JSON.stringify({ ...cfg.pipeline, _lang: cfg.lang }));

  const cmd = [
    'npx', 'remotion', 'render',
    'Video',                                  // composition id
    cfg.outputPath,
    '--props', propsFile,
    '--concurrency', String(os.cpus().length),
    '--codec', cfg.pipeline.metadata.format === 'webm' ? 'vp9' : 'h264',
  ];

  await spawn(cmd[0], cmd.slice(1), {
    cwd: RENDERER_PROJECT_DIR,                // 长期存在的 Remotion 工程
    onProgress: cfg.onProgress,
  });

  return { videoPath: cfg.outputPath, totalFrames: cfg.pipeline.totalFrames };
}

// 单帧预览
export async function renderStill(cfg: StillConfig): Promise<Buffer> {
  const propsFile = writePropsFile(cfg.pipeline, cfg.lang);
  const out = path.join(tmpdir(), `${cfg.pipeline.pipelineId}-${cfg.frame}.${cfg.format}`);
  await spawn('npx', [
    'remotion', 'still', 'Video', out,
    '--frame', String(cfg.frame),
    '--props', propsFile,
    '--image-format', cfg.format,
  ], { cwd: RENDERER_PROJECT_DIR });
  return fs.readFileSync(out);
}
```

### 6.6 输出格式矩阵

| metadata.format | metadata.aspectRatio | Remotion flags | 输出 |
|---|---|---|---|
| `mp4` (默认) | `16:9` | `--codec h264` | `*.mp4` 1920×1080 |
| `mp4` | `9:16` | `--codec h264` | `*.mp4` 1080×1920 |
| `webm` | any | `--codec vp9` | `*.webm` |

GIF / ProRes 暂不支持。

---

## 7. Cache 系统

`services/cache.ts`,目录 `storage/cache/`。

### 7.1 缓存键

每个 task 的 `contentHash` =

```
sha256(JSON.stringify({
  template: layer.type,
  props: layer.props,
  duration: layer.durationFrames,
  // 对于 RenderTask 的 layer 列表,递归
  // 对于 AudioTask:text + voice 全字段
  // 对于引用 dataRef 的 layer:把 data 实际内容也参与 hash
}))
```

### 7.2 命中流程

```
audioTask.contentHash → cache/audio/<hash>.mp3   命中?直接复用,跳过 TTS
renderTask.contentHash → cache/render/<hash>.mp4 命中?直接复用,跳过该 scene 渲染
```

> Remotion 一次只产一个 MP4,scene 级别命中的"复用"实际是用 ffmpeg `concat` 把命中的片段和新渲染的片段拼接。MVP 可先做"全部命中才跳过"的简化版。

### 7.3 失效策略

| 模式 | 行为 |
|---|---|
| `LRU`(默认) | 容量上限 10 GB,按访问时间淘汰 |
| `RAM_PRESSURE` | 内存压力 > 80% 时触发清理 |
| `CLASSIC` | 仅按时间淘汰(7 天) |

可通过 `CACHE_STRATEGY` env 切换。

---

## 8. Material Bank

`services/material.ts`,目录 `storage/materials/<project>/{audio,images,data,video}/`。

### 8.1 上传(gRPC streaming)

```
client → UploadMaterialRequest{ metadata } → server
client → UploadMaterialRequest{ chunk } * N → server
server → UploadMaterialResponse{ materialId, path }
```

### 8.2 寻址

`materials.images.foo: "logos/foo.png"` 实际指向 `storage/materials/<project>/images/logos/foo.png`。

`data` 类型 inline 进 workflow JSON(小),也可上传成 JSON 文件后通过 `materialId` 引用(大)。

### 8.3 GC

未被任何 pipeline 引用的 material 在 30 天后回收(可关闭)。

---

## 9. gRPC API

Proto 文件:`src/server/proto/video_pipeline.proto`。

### 9.1 主要变化(v1 → v2)

| Message | v1 | v2 |
|---|---|---|
| `Scene` | 单坑位 audio/text/image/chart | `repeated Layer layers`,模板由 `layer.template` 字符串确定 |
| `Layer`(新) | — | `template` + `props_json`(字符串,因为 props shape 由 registry 决定,proto 无法静态描述) |
| `AudioConfig` | `text` + `voice` | + `map<string, AudioAlternate> alternates`(支持 zh/en) |
| `WorkflowDefinition` | metadata + scenes | + `Materials materials`、`repeated Transition transitions` |
| `Materials`(新) | — | `map<string, string> data_json`、`map<string, string> images`、`map<string, string> audio` |
| `Transition`(新) | — | `from`、`to`、`kind`、`duration_frames`、`direction`、`easing` |
| `RenderTask.config` | `map<string,string>` | `string layers_json`(整 scene 的 layers 序列化) |
| `VideoMetadata` | + `string format`、`string aspect_ratio`、`string primary_lang` | |
| `ExecuteOptions` | `generate_audio`、`generate_video`、`output_path` | + `string lang`(默认 metadata.primary_lang) |

### 9.2 RPC 列表

```
CompileWorkflow(CompileRequest) → CompileResponse
GetPipeline(GetPipelineRequest) → GetPipelineResponse
ExecutePipeline(ExecuteRequest) → stream ExecuteResponse
CancelPipeline(CancelRequest) → CancelResponse
ListPipelines(ListPipelinesRequest) → ListPipelinesResponse
UploadMaterial(stream UploadMaterialRequest) → UploadMaterialResponse
ListMaterials(ListMaterialsRequest) → ListMaterialsResponse
GetMaterial(GetMaterialRequest) → stream MaterialData
ListTemplates(ListTemplatesRequest) → ListTemplatesResponse        ← 新增
RenderFrame(RenderFrameRequest) → RenderFrameResponse              ← 新增,单帧预览
RenderScene(RenderSceneRequest) → stream RenderSceneResponse       ← 新增,单 scene 渲染
```

### 9.3 ListTemplates(新)

```proto
message ListTemplatesRequest {}
message ListTemplatesResponse {
  repeated TemplateInfo templates = 1;
}
message TemplateInfo {
  string name = 1;
  string tier = 2;
  string schema_json = 3;       // JSON Schema 字符串(zod-to-json-schema 转换)
  string description = 4;
}
```

Agent 在生成 workflow 前先调一次 `ListTemplates` 拉到全部可用模板的 schema,然后按 schema 填字段。

### 9.4 RenderFrame / RenderScene(新)

供 Agent / 调试场景做"快速反馈循环"。

```proto
message RenderFrameRequest {
  string pipeline_id = 1;
  int32 frame = 2;                   // 0-based
  string format = 3;                 // "png" | "jpeg",默认 "png"
  string lang = 4;                   // 可选,默认 metadata.primary_lang
}
message RenderFrameResponse {
  bytes image_data = 1;
  string format = 2;
}

message RenderSceneRequest {
  string pipeline_id = 1;
  string scene_name = 2;
  string output_path = 3;
  string lang = 4;
}
message RenderSceneResponse {
  PipelineStatus status = 1;
  int32 progress_percent = 2;
  string video_path = 3;
  string error_message = 4;
}
```

- `RenderFrame`:wrap `npx remotion still`,典型 1-3 秒返回。**用于 Agent 改了 props 后立刻看效果**。
- `RenderScene`:渲染单个 scene,跳过 TTS(直接用 cache 或空音轨)。用于本地 review 单个模板。

---

## 10. 文件布局

### 10.1 仓库

```
ai-video-framework/
├── packages/
│   ├── ai-video-dsl/                # 工作流构造器 + compiler
│   │   └── src/
│   │       ├── types.ts             # 所有 Zod schema
│   │       ├── builder.ts           # 函数式 DSL(video / scene / layer 构造器)
│   │       ├── compiler.ts          # workflow → pipeline
│   │       └── index.ts
│   │
│   ├── ai-video-templates/          # 模板包,client/server 共享
│   │   └── src/
│   │       ├── registry.ts
│   │       ├── templates/           # 16 个模板,一文件一个
│   │       └── index.ts
│   │
│   ├── ai-video-renderer/           # 静态 Remotion 工程
│   │   ├── remotion.config.ts
│   │   └── src/
│   │       ├── index.ts             # registerRoot
│   │       ├── Root.tsx
│   │       ├── Video.tsx
│   │       ├── TemplateDispatcher.tsx
│   │       └── LayerHost.tsx
│   │
│   └── ai-video-cli/                # gRPC client + 命令
│       └── src/
│           ├── client.ts
│           ├── commands/
│           └── index.ts
│
├── src/server/
│   ├── index.ts                     # gRPC server 入口
│   ├── proto/video_pipeline.proto
│   ├── services/
│   │   ├── compiler.ts              # 调 dsl 的 compile(),做服务层封装
│   │   ├── executor.ts
│   │   ├── render.ts                # 调 ai-video-renderer 子进程
│   │   ├── tts.ts                   # MiniMax T2A
│   │   ├── cache.ts
│   │   ├── material.ts
│   │   └── pipeline-store.ts
│   └── types/
│
├── storage/                         # 运行时
│   ├── cache/{audio,render}/<hash>.{mp3,mp4}
│   ├── materials/<project>/{audio,images,data,video}/
│   ├── pipelines/<id>/{pipeline.json,audio/,video.mp4}
│   └── projects/
│
└── docs/
```

### 10.2 运行时存储约定

| 路径 | 内容 |
|---|---|
| `storage/cache/audio/<hash>.mp3` | TTS 缓存 |
| `storage/cache/render/<hash>.mp4` | scene 级渲染缓存(MVP 可不做) |
| `storage/materials/<project>/...` | 用户上传 |
| `storage/pipelines/<id>/pipeline.json` | 已编译 pipeline 持久化 |
| `storage/pipelines/<id>/audio/<scene>.mp3` | 该 pipeline 的 audio 产物 |
| `storage/pipelines/<id>/video.mp4` | 最终输出 |

---

## 11. 错误处理

### 11.1 错误类型

| 类型 | 抛出位置 | gRPC 状态码 |
|---|---|---|
| `ValidationError`(workflow schema 不过) | compiler | `INVALID_ARGUMENT` |
| `UnknownTemplateError` | compiler | `INVALID_ARGUMENT` |
| `MissingRefError`(dataRef 找不到) | compiler | `INVALID_ARGUMENT` |
| `TtsError`(MiniMax 调用失败) | executor | `UNAVAILABLE`(可重试)/ `INTERNAL` |
| `RenderError`(Remotion 退出非 0) | executor | `INTERNAL` |
| `CancelledError` | executor | `CANCELLED` |

### 11.2 部分失败

- TTS:某个 scene 失败,整个 pipeline 失败(不允许哑场)。
- Render:Remotion 一次性渲染整个视频,无法部分成功;失败重新跑(命中 cache 跳过已成功 audio)。

### 11.3 错误信息回传

`ExecuteResponse.error_message` 携带人类可读 message;`error_code` 携带枚举。Agent 可据此决定重试或改 prompt。

---

## 12. 决策记录

| # | 议题 | 决定 | 落点 |
|---|---|---|---|
| 1 | Scene 间转场 | **做**。4 种(fade / slide / wipe / none),workflow 级 `transitions[]` 声明,用 Remotion `<TransitionSeries>` 实现。转场重叠两 scene,扣减 totalFrames。 | §2.6 / §6.2 |
| 2 | 切片渲染 | **defer**。Remotion 单 composition 内 `--concurrency=N` 已够用。等出现 5+ 分钟视频再做。 | — |
| 3 | 自定义 Template 上传 | **不做**。新模板走 PR 进 `@ai-video/templates`,不开放运行时上传(沙箱成本过高,MVP 不值)。 | — |
| 4 | 多语言旁白 | **做**(zh + en)。`audio.alternates` 字段,执行时通过 `ExecuteOptions.lang` 选择。一份 pipeline 多次 execute 输出多 MP4。 | §2.3 / §5.2 |
| 5 | 单帧 / 单 scene 预览 | **做**。`RenderFrame` 单帧(PNG),`RenderScene` 单 scene(MP4)。给 Agent 快速反馈用。 | §6.5 / §9.4 |
| 6 | gRPC props typed binding | **不做**。保持 `props_json` 字符串,client 用 zod 校验。Agent 不写,不用考虑跨语言 client。 | §9.1 |

后续可能新增的问题在该议题对应章节内 inline 标记,不再集中维护本表。

---

## 附录 A:DSL Builder API(便于人手写或快速构造)

```ts
import { video, scene, layer, materials } from '@ai-video/dsl';

const wf = video({ title: 'Demo', duration: 30 }, [
  scene('intro', s => {
    s.duration(4);
    s.audio({ text: '欢迎收看' });
    s.layer('TitleCard', { title: '财经速递', subtitle: '2026-05-04' });
  }),
  scene('earnings', s => {
    s.duration(8);
    s.audio({ text: '英伟达营收 181 亿...' });
    s.layer('EarningsDashboard', {
      company: 'NVDA',
      dataRef: 'nvda-q3',
    });
    s.layer('LowerThird', {
      title: 'Source: NVIDIA IR',
    }, { from: 60, durationFrames: 90 });
  }),
]).materials(materials({
  data: { 'nvda-q3': { revenueExpected: 17.20, revenueActual: 18.12 } },
}));
```

builder 是 `WorkflowSchema` 之上的语法糖,最终产出仍然是上面 §2.7 的 JSON,所以 builder 写出的 workflow 和 Agent 输出的 JSON 走完全相同的 compile/execute 路径。
