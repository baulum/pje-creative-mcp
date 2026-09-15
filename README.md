# pje-creative-mcp

An MCP server that gives Claude Code image and video generation through the
[KIE.ai](https://kie.ai) API: text-to-image, image editing, text-to-video,
image-to-video, video-to-video, upscaling, task tracking and local downloads.

Every endpoint, parameter, enum value and model id in this project was taken
from the current [KIE.ai API documentation](https://docs.kie.ai). Nothing is
invented; capabilities KIE does not currently expose are listed under
[Not implemented](#not-implemented).

---

## 1. Prerequisites

- **Node.js 20 or newer** (`node -v`)
- **npm**
- A **KIE.ai account with credits**
- **Claude Code**, if you want to use it as an MCP server

## 2. KIE API key

1. Sign in at <https://kie.ai>.
2. Create a key at <https://kie.ai/api-key>.
3. Copy it — you will put it in `.env` or in the MCP server's `env` block.

The key is read from the `KIE_API_KEY` environment variable and is never
hard-coded, logged or written to disk by this server. The server loads
`.env.local` first and then `.env`; neither overrides a variable that is already
set, so an `env` block in the Claude Code MCP config always wins. Both files are
gitignored.

## 3. Installation

```bash
git clone <your-repo-url> pje-creative-mcp
cd pje-creative-mcp
npm install
cp .env.example .env
# edit .env and set KIE_API_KEY
```

## 4. Development

```bash
npm run dev         # run from source with tsx, restarts on change
npm run typecheck   # tsc --noEmit
npm test            # unit tests (no network, no credits)
npm run inspect     # open the MCP Inspector against the source
```

Logs go to **stderr** (stdout carries the JSON-RPC stream). Set
`PJE_LOG_LEVEL=debug` to see request payloads; API keys are redacted.

## 5. Build

```bash
npm run build       # compiles to dist/
npm start           # runs dist/index.js over stdio
```

## 6. Install in Claude Code

From the project directory, after `npm run build`:

```bash
claude mcp add --env KIE_API_KEY=your_kie_api_key_here \
  --transport stdio pje-creative --scope user \
  -- node "$(pwd)/dist/index.js"
```

Scopes: `local` (default, this project only), `project` (writes `.mcp.json`,
shared with the team), `user` (available in every project).

Verify:

```bash
claude mcp list
claude mcp get pje-creative
```

Inside Claude Code, `/mcp` shows the connected servers and their tools.

### Config file form

`examples/claude-code-mcp.json` is a ready-to-copy `.mcp.json`:

```json
{
  "mcpServers": {
    "pje-creative": {
      "type": "stdio",
      "command": "node",
      "args": ["${CLAUDE_PROJECT_DIR}/dist/index.js"],
      "env": {
        "KIE_API_KEY": "your_kie_api_key_here",
        "PJE_OUTPUT_DIR": "${CLAUDE_PROJECT_DIR}/output",
        "PJE_LOG_LEVEL": "info"
      },
      "timeout": 900000
    }
  }
}
```

`examples/claude-code-mcp.dev.json` runs the TypeScript source via `tsx`
instead, which is handy while developing.

> The generous `timeout` matters: video tasks legitimately take several minutes
> and `wait_for_task` blocks for the duration.

### Skill

`skills/kie-creative/SKILL.md` teaches Claude when to use which tool, how to
write image and video prompts, and how to handle errors. Install it with:

```bash
mkdir -p ~/.claude/skills
cp -r skills/kie-creative ~/.claude/skills/
```

Or copy it into `.claude/skills/` inside a project to scope it there.

## 7. Configuration

| Variable | Default | Purpose |
|---|---|---|
| `KIE_API_KEY` | — | **Required.** KIE API key. |
| `KIE_BASE_URL` | `https://api.kie.ai` | KIE API base URL. |
| `KIE_UPLOAD_BASE_URL` | `https://kieai.redpandaai.co` | KIE file-upload host. |
| `KIE_REQUEST_TIMEOUT_MS` | `120000` | Per-HTTP-request timeout. |
| `PJE_OUTPUT_DIR` | `./output` | Root for `download_result`. Writes outside it are refused. |
| `PJE_LOG_LEVEL` | `info` | `silent` / `error` / `info` / `debug`. |

## 8. Available tools

| Tool | What it does |
|---|---|
| `list_models` | List supported models with capabilities, ratios, resolutions, durations. |
| `get_model` | Full parameter detail for one model, including model-specific options. |
| `generate_image` | Text-to-image. |
| `edit_image` | Edit an existing image (local path or URL); masked inpainting via Ideogram v3. |
| `upscale_image` | Upscale (Topaz, Recraft) or remove a background (Recraft). |
| `generate_video` | Text-to-video. |
| `image_to_video` | Animate a still into a video. |
| `video_to_video` | Restyle a video, or lip-sync it to an audio track. |
| `get_task` | Non-blocking status of one task. |
| `wait_for_task` | Poll until a task completes or fails, then return the result URLs. |
| `upload_file` | Put a local file into KIE storage and get a URL back. |
| `download_result` | Save a result URL to disk. |
| `get_credits` | Remaining KIE credit balance. |

### Normalised responses

KIE responses are never passed through raw. Success:

```json
{
  "success": true,
  "type": "video",
  "task_id": "task_abc123",
  "status": "completed",
  "results": [{ "url": "https://...", "mime_type": "video/mp4" }],
  "metadata": {
    "provider": "kie",
    "model": "kling/v3-turbo-image-to-video",
    "credits_consumed": 50,
    "cost_ms": 45000
  }
}
```

In progress:

```json
{ "success": true, "type": "image", "task_id": "task_abc123", "status": "queued",
  "metadata": { "provider": "kie", "model": "google/nano-banana" } }
```

Failure:

```json
{ "success": false,
  "error": { "code": "INSUFFICIENT_CREDITS", "message": "...", "hint": "..." } }
```

KIE task states are mapped to `queued` (`waiting`, `queuing`), `processing`
(`generating`), `completed` (`success`) and `failed` (`fail`). `cancelled`
exists in the union for providers that report it; KIE does not.

### Supported models

**Image — text-to-image:** `google/nano-banana`, `nano-banana-2`,
`nano-banana-2-lite`, `nano-banana-pro`, `google/imagen4`,
`google/imagen4-fast`, `google/imagen4-ultra`,
`bytedance/seedream-v4-text-to-image`, `seedream/5-pro-text-to-image`,
`flux-2/pro-text-to-image`, `gpt-image/1.5-text-to-image`,
`qwen3/text-to-image`, `ideogram/v3-text-to-image`, `z-image`

**Image — editing:** `google/nano-banana-edit`, `nano-banana-2`,
`nano-banana-2-lite`, `nano-banana-pro`, `bytedance/seedream-v4-edit`,
`seedream/5-pro-image-to-image`, `flux-2/pro-image-to-image`,
`gpt-image/1.5-image-to-image`, `qwen3/image-to-image`, `ideogram/v3-edit`
(the only masked-inpainting model)

**Image — finishing:** `topaz/image-upscale`, `recraft/crisp-upscale`,
`recraft/remove-background`

**Video — text-to-video:** `veo-3-1`, `kling/v3-turbo-text-to-video`,
`kling/v2-5-turbo-text-to-video-pro`, `bytedance/seedance-1.5-pro`,
`bytedance/v1-pro-text-to-video`, `hailuo/02-text-to-video-pro`,
`wan/2-6-text-to-video`, `pixverse-v6/text-to-video`,
`grok-imagine/text-to-video`

**Video — image-to-video:** `veo-3-1`, `kling/v3-turbo-image-to-video`,
`bytedance/seedance-1.5-pro`, `bytedance/v1-pro-image-to-video`,
`hailuo/2-3-image-to-video-pro`, `hailuo/02-image-to-video-pro`,
`wan/2-6-image-to-video`, `pixverse-v6/image-to-video`,
`grok-imagine/image-to-video`

**Video — video-to-video:** `wan/2-6-video-to-video`, `runway/gen4-aleph`,
`volcengine/video-to-video-lip-sync`

Run `list_models` for the authoritative, machine-readable version.

## 9. Examples

Ask Claude Code in plain language; the tool calls below are what it will make.

**First image test**

```
generate_image(
  prompt: "A single ceramic espresso cup on a brushed-steel counter in a quiet
           morning cafe. 85mm lens at f/2, tight three-quarter framing, generous
           negative space to the left. Low raking sunlight from frame left rims
           the cup and casts a long soft shadow. Matte unglazed ceramic against
           polished steel, faint steam, fine dust in the light beam. Editorial
           food photography, natural colour.",
  model: "google/nano-banana",
  aspect_ratio: "4:5"
)
wait_for_task(task_id: "...", timeout_seconds: 180)
download_result(url: "...", output_path: "espresso-4x5.png")
```

**First video test (image → video, the recommended route)**

```
image_to_video(
  image: "./output/espresso-4x5.png",
  prompt: "Steam rises and curls slowly to the left. The camera pushes in gently
           and steadily over the full clip, ending tight on the rim. Sunlight
           softens slightly near the end as thin cloud passes. Locked movement,
           no handheld shake. Warm natural grade, subtle film grain.",
  model: "kling/v3-turbo-image-to-video",
  duration: 5,
  resolution: "720p"
)
wait_for_task(task_id: "...", timeout_seconds: 600)
download_result(url: "...", output_path: "espresso-push-in.mp4")
```

**Model-specific options**

```
generate_video(
  prompt: "...",
  model: "bytedance/seedance-1.5-pro",
  duration: 8,
  aspect_ratio: "9:16",
  options: { fixed_lens: true, generate_audio: true }
)
```

`options` only accepts fields documented for that model — anything else is
rejected with the list of valid names.

## 10. Troubleshooting

**`MISSING_API_KEY` / the server exits at startup.** `KIE_API_KEY` is not
reaching the process. Check `.env`, or the `env` block in your MCP config.
`claude mcp get pje-creative` shows what Claude Code passes.

**The server does not appear in `/mcp`.** Run `npm run build` first — the config
points at `dist/index.js`. Check the path is absolute, then `claude mcp list`.

**`UNSUPPORTED_PARAMETER`.** The model does not accept that argument; the hint
lists what it does accept. Call `get_model` or switch models. This is caught
locally, before any credits are spent.

**`INVALID_PARAMETER` with `accepted_values`.** Use one of the listed values.
Aspect ratios and resolutions vary widely between models.

**`TIMEOUT` from `wait_for_task`.** The task is still running on KIE — nothing
was lost. Call `get_task` with the same id, or wait again with a larger
`timeout_seconds`. If Claude Code itself times out, raise `timeout` in the MCP
server config.

**`DOWNLOAD_FAILED`.** KIE result URLs expire. Retry with `refresh_url: true`,
which requests a fresh 20-minute link, or re-query the task.

**`INSUFFICIENT_CREDITS`.** Call `get_credits` and top up at
<https://kie.ai/pricing>.

**`RATE_LIMITED`.** KIE rate-limits per API key and per IP. Back off; do not
retry in a loop.

**Task completes but `results` is empty.** Some KIE models return a
`resultObject` with no URLs (e.g. detection models). Those are not exposed as
generation models here; if you hit this, check `get_task` for the raw state.

**Uploads fail.** Local inputs must be jpeg/png/webp, mp4/mov/mkv/webm or
mp3/wav/aac/m4a/ogg, and under 100 MB. Most image models additionally cap inputs
at 10 MB on KIE's side.

## 11. Architecture

```
src/
  index.ts                 stdio entrypoint
  server/
    server.ts              builds the McpServer, registers every tool
    config.ts              environment configuration, validation, defaults
    tool-helpers.ts        error guard + CallToolResult serialisation
  tools/                   one file per MCP tool; schema + description only
    image/ video/ tasks/ files/ models/ account/
  providers/
    provider.ts            AIProvider contract + normalised Task types
    kie/
      client.ts            HTTP layer, KIE envelope handling, error mapping
      payload.ts           normalised params -> model-specific KIE input
      images.ts videos.ts  capability services
      files.ts             local path / URL -> KIE-readable URL
      tasks.ts             KIE state + resultJson -> normalised Task
      index.ts             KieProvider (implements AIProvider)
  models/
    types.ts               registry types
    image-models.ts        image model catalogue (from the KIE docs)
    video-models.ts        video model catalogue (from the KIE docs)
    registry.ts            lookup, filtering, summaries
  workflows/               multi-step recipes (scaffolded, see below)
  utils/
    errors.ts logger.ts files.ts validation.ts
```

Layering is strict: **tools → provider → client**. Tools never build KIE
payloads; the client never knows about MCP.

### The model registry

Each model declares which *normalised* parameters it supports (`prompt`,
`aspect_ratio`, `resolution`, `duration`, `images`, …), the provider field each
maps to, and the exact accepted values. `payload.ts` uses that to translate tool
arguments and to reject anything the model does not document — so
`aspect_ratio: "16:9"` becomes `image_size: "landscape_16_9"` for Seedream 4 and
`aspect_ratio: "16:9"` for Nano Banana, and a duration passed to a model without
one fails locally with an explanation instead of being silently dropped.

Fields with no normalised equivalent (`cfg_scale`, `mode`, `generate_audio`,
`fixed_lens`, …) are reachable through `options` and validated against the same
registry.

### File handling

Any tool argument that takes an image, video or audio input accepts a local path
or a URL. URLs pass through untouched; local files are uploaded to KIE storage
first and the returned URL is substituted. Callers never deal with KIE's upload
API. `download_result` resolves paths inside `PJE_OUTPUT_DIR`, rejects traversal
out of it, creates missing directories and refuses to overwrite by default.

### Webhooks

KIE recommends `callBackUrl` webhooks over polling for production, with
HMAC-SHA256 signature verification
(`base64(HMAC-SHA256(taskId + "." + timestamp, webhookHmacKey))` in the
`X-Webhook-Signature` / `X-Webhook-Timestamp` headers —
see <https://docs.kie.ai/common-api/webhook-verification>). A local stdio MCP
server has no public endpoint, so this server polls. Every generation tool still
forwards an optional `callback_url` for callers who do run a receiver.

### Workflows

`src/workflows/` fixes the shape of higher-level recipes (`create_social_ad`,
`create_product_video`, `cinematic_video`) that compose provider services. They
are **scaffolded, not registered as tools**: the low-level tools plus the
`kie-creative` skill already let Claude drive these sequences, and an autonomous
workflow would spend credits on steps the user did not explicitly ask for.
Implement `run()` and register a tool when you want one.

## 12. Adding another provider

1. Implement `AIProvider` from `src/providers/provider.ts` in
   `src/providers/<name>/`, returning the same normalised `Task`.
2. Add its models to the registry with `provider: '<name>'`, declaring the same
   normalised parameters so the tools can validate them.
3. Route in `server.ts` — pick the provider from the model's `provider` field
   rather than constructing `KieProvider` directly.

The tool layer does not change: it only speaks normalised parameters and
normalised tasks.

## Not implemented

KIE exposes these; this server deliberately does not:

- **Audio and music** — Suno, ElevenLabs, Gemini TTS.
- **Chat / LLM models** — GPT, Claude, Gemini text models.
- **Avatar and talking-head models** — Kling AI Avatar, OmniHuman, InfiniTalk.
- **Video extension and video upscaling** — Veo `extend-video`, PixVerse and
  Grok extend, and `grok-imagine/upscale`. The Grok upscaler takes a KIE task id
  rather than a file, which does not fit the file-oriented tool surface here.
- **Legacy dedicated endpoints** — `4o-image-api`, `flux-kontext-api`. Those use
  their own task-query endpoints rather than the unified
  `/api/v1/jobs/recordInfo`, and every model here goes through the unified API.
- **Veo 1080p/4K retrieval endpoints** — `get-veo-3-1080-p-video`,
  `get-veo-3-4k-video`. Request the resolution at generation time instead.

There is no documented KIE endpoint for listing models at runtime, so the
registry is static and derived from the documentation. Re-check
<https://docs.kie.ai> when adding models.

## Licence

MIT
