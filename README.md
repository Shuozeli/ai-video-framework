# ai-video-framework

Programmable video generation pipeline for financial / news content.
Agent-friendly TypeScript DSL → compiled pipeline → Remotion MP4, with
gRPC server, CLI client, MiniMax T2A integration, and 17 self-animating
React templates.

```
Workflow JSON ──compile──▶ Pipeline ──execute──▶ MP4
   │                          │                    ▲
   ├─ metadata                ├─ audioTasks[]      │
   ├─ materials                ├─ renderTasks[]    │
   └─ scenes[]                 └─ totalFrames    Remotion
        └─ layers[] = template + props
```

## Quick Start

### 1. Build the packages

```bash
# Order matters: dsl is a peer dep of the rest via link: protocol
for p in packages/ai-video-dsl packages/ai-video-templates \
         packages/ai-video-renderer packages/ai-video-cli src/server; do
  (cd $p && pnpm install && pnpm build)
done
```

### 2. Start the gRPC server

```bash
cd src/server
TAILSCALE_IP=$(tailscale ip -4) \
MINIMAX_API_KEY=<your-key> \
STORAGE_PATH=$PWD/../../storage \
node dist/index.js
```

The server binds to `$TAILSCALE_IP:50051` (defaults to `0.0.0.0`). Set
`MINIMAX_API_KEY` to enable TTS; without it audio generation will fail.

### 3. Drive it from the CLI

```bash
cd packages/ai-video-cli

# Author a workflow programmatically
pnpm dlx tsx ../../demos/showcase/dump-workflow.ts
# → demos/showcase/showcase-workflow.json

# Compile via gRPC
node dist/index.js compile ../../demos/showcase/showcase-workflow.json \
  --address $TAILSCALE_IP:50051
# → pipeline_id=<hash>

# Render to MP4 (audio + video)
node dist/index.js render <pipeline_id> \
  --address $TAILSCALE_IP:50051 \
  --output /tmp/out.mp4

# Render without TTS (skip audio)
node dist/index.js render <pipeline_id> \
  --address $TAILSCALE_IP:50051 \
  --video-only --output /tmp/out.mp4
```

## Showcase

`demos/showcase/build-showcase.ts` builds a workflow that exercises every
registered template. Render all 16 scenes to one MP4:

```bash
pnpm dlx tsx demos/showcase/build-showcase.ts
# → demos/showcase/showcase-pipeline.json (62s @ 1920×1080)

cd packages/ai-video-renderer
./node_modules/.bin/remotion render src/index.ts Video \
  /tmp/showcase.mp4 \
  --props=../../demos/showcase/showcase-pipeline.json \
  --concurrency=8
```

`demos/showcase/render-stills.sh` dumps one PNG per scene if you just want
visual proofs without a full render.

## Packages

| Package | Purpose |
|---------|---------|
| `@ai-video/dsl` | Workflow/scene/layer schemas (Zod), compiler, manifest + snapshot, cache interfaces |
| `@ai-video/templates` | 17 self-animating React templates registered against the DSL: TitleCard, KeyTakeawaysCard, SectionDivider, EndCard, StockChart, EarningsDashboard, MultiDimChart, BigNumberCard, ComparisonTable, RankingList, Heatmap, PiPNewsQuote, SocialCard, LogicFlow, Timeline, LowerThird, SubtitleBar |
| `@ai-video/renderer` | Static Remotion project: composes scenes via `TransitionSeries`, supports fade/slide/wipe transitions, layer enter/exit animations, materials ref resolution |
| `@ai-video/cli` | gRPC client + 13 CLI commands: `compile`, `render`, `render-scene`, `preview`, `templates`, `materials`, `upload`, etc. |
| `@ai-video/server` (`src/server/`) | gRPC server implementing 11 RPCs: `CompileWorkflow`, `ExecutePipeline` (streaming progress), `RenderFrame`, `UploadMaterial` (client streaming), MiniMax T2A integration |

## Templates

16 templates across 4 tiers + 1 decoration bonus (`SubtitleBar`). Each is a
Zod-validated React component with self-contained animation. Schemas are
introspectable via `ai-video templates --json` so an LLM agent can author
workflows without seeing the React code.

See [`docs/templates.md`](docs/templates.md) for the full catalog with props,
visual descriptions, and sample inputs.

## Architecture

See [`docs/architecture.md`](docs/architecture.md) for the high-level
design (workflow / pipeline / materials / cache strategies) and
[`docs/framework-design.md`](docs/framework-design.md) for the DSL schema,
template registry, executor, and gRPC contract.

## Tech Stack

| Layer | Technology |
|-------|------------|
| DSL | TypeScript + Zod |
| Templates | React + Remotion 4 |
| Renderer | Static Remotion project (`@remotion/cli`, `@remotion/transitions`) |
| RPC | gRPC + Protobuf (`@grpc/grpc-js`, `@grpc/proto-loader`) |
| Audio (TTS) | MiniMax T2A async API |
| Storage | Local filesystem |
| Build | pnpm 10, Node 22, TypeScript 5.9 |

## License

MIT — see [LICENSE](LICENSE).
