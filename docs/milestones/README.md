# Milestones

One file per git tag. Stages 1–3 were reconstructed on 2026-10-11 and approximate the original code. Every tag type-checks; rendering hasn't been verified.

| Tag | Concept | Source |
|---|---|---|
| [`stage-1-first-quad`](stage-1-first-quad.md) | Device, pipeline, render pass; inline WGSL | Reconstructed |
| [`stage-1b-wesl`](stage-1b-wesl.md) | WESL modules, `wesl.toml`, `?static` | Reconstructed |
| [`stage-2-interleaved`](stage-2-interleaved.md) | Interleaved vertex data, index buffer | Reconstructed |
| [`stage-3-camera`](stage-3-camera.md) | Uniforms, bind groups, view-projection | Reconstructed |
| [`stage-4-depth`](stage-4-depth.md) | `baseVertex`, depth buffer | Exact |
| [`stage-5-refactor`](stage-5-refactor.md) | Modules split by concern | Exact |
| [`stage-6-instancing`](stage-6-instancing.md) | Draw packets, per-instance attributes | Real |
| [`stage-7-indirect`](stage-7-indirect.md) | Frame loop, 10k instances, `drawIndexedIndirect` | Real |
