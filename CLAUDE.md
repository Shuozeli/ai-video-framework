# ai-video-framework

TypeScript framework for programmatic video generation. DSL → Pipeline →
Remotion MP4. Five TS packages: `@ai-video/{dsl,templates,renderer,cli,server}`.

## Quick Orientation

- `README.md` — public-facing intro, quick start, package map
- `docs/architecture.md` — high-level design (workflow/pipeline/materials/cache)
- `docs/framework-design.md` — DSL schema, registry, executor, gRPC contract
- `docs/templates.md` — catalog of 16 templates with props + visual spec
- `docs/api-minimax-t2a.md` — MiniMax TTS API reference

## Git Rules

- Do NOT commit or push unless the user explicitly asks you to
- Do NOT amend commits unless the user explicitly asks you to
- Do NOT force push unless the user explicitly asks you to

## Key Rules

- **No pnpm workspace at root.** Each package has its own `pnpm-lock.yaml`.
  Build per-package via `cd <pkg> && pnpm install && pnpm build`. CI builds
  each package in a matrix job; don't try to introduce a workspace without
  flagging the tradeoff (lockfile churn vs. faster CI).
- **Remotion's `AbsoluteFill` defaults to `flexDirection: 'column'`.** When
  writing templates, this means `justifyContent` controls VERTICAL alignment
  and `alignItems` controls HORIZONTAL. Past bugs: `lower-third.tsx` and
  `pip-news-quote.tsx` both anchored the wrong way before this was fixed.
- **Audio reference convention is implicit:** the renderer (`SceneRoot.tsx`)
  looks up audio purely by `${scene.name}:${lang}` key in `materials.audio`,
  ignoring `scene.audio.audioRef`. The schema's `audioRef` field is dead
  code today; if you implement it, update the renderer at the same time.
- **TTS voice IDs must be from MiniMax's async v2 catalog** (e.g.
  `audiobook_male_1`, `English_Graceful_Lady`). The DSL default
  `male-qn-qingse` is from the legacy sync API and tasks created with it
  stay stuck in "Processing" forever (5-min timeout, no error from
  MiniMax). Don't ship workflows without setting `voice.voice_id`
  explicitly until the DSL default is changed.
- **The CLI's `render` command silently swallows TTS errors** during
  `GENERATING_AUDIO` status — it only prints `errorMessage` on `FAILED`.
  Use `demos/showcase/raw-render.ts` for debugging the event stream.
- **Each template's `*Ref` props are sometimes unused.** `logoRef`,
  `qrCodeRef`, `iconRef`, `authorAvatarRef`, `screenshotRef` are
  declared in schemas but several templates never consume them. Don't
  add new `*Ref` fields without wiring them to the renderer.

## Code Quality Discipline

Shortcuts during exploration are fine. But tech debt must be visible.

- **Leave `// TODO(refactor):` comments** when taking a shortcut. Audio
  retry, voice catalog validation, RPC streaming-backpressure handling
  are all known TODOs — flag new ones the same way.
- **Self-review pass** after a feature: re-read the diff, leave markers
  on anything you'd flag in code review.

## Build & Test

```bash
# Build all packages (no workspace, so iterate)
for p in packages/ai-video-dsl packages/ai-video-templates \
         packages/ai-video-renderer packages/ai-video-cli src/server; do
  (cd $p && pnpm install && pnpm build)
done

# Smoke-test the DSL → MP4 path without the server
pnpm dlx tsx demos/showcase/build-showcase.ts          # → pipeline JSON
cd packages/ai-video-renderer
./node_modules/.bin/remotion render src/index.ts Video /tmp/out.mp4 \
  --props=../../demos/showcase/showcase-pipeline.json --concurrency=8

# End-to-end via gRPC (server must be running)
cd packages/ai-video-cli
node dist/index.js templates --address $TAILSCALE_IP:50051
node dist/index.js compile <workflow.json> --address $TAILSCALE_IP:50051
node dist/index.js render <pipeline_id> --address $TAILSCALE_IP:50051 \
  --video-only --output /tmp/out.mp4
```

## CI

After pushing, check GitHub Actions status:

```bash
gh run list --limit 3
gh run view <run-id>     # if a run fails
```

The CI matrix builds + typechecks all 4 packages and the server in
parallel on Node 22 / pnpm 10.

## Tailscale conventions

When demos serve outputs over HTTP or bind the gRPC server, use the
Tailscale IP via `TAILSCALE_IP` env var (server side) and address via
the MagicDNS hostname (client / docs / URLs). See user's
`infra-defaults.md` rule 8 for the full convention.
