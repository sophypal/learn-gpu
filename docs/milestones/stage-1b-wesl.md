# Stage 1b: Shaders as WESL modules

Tag: `stage-1b-wesl` · Source: reconstructed

## Concepts
- `vert.wesl` / `frag.wesl` import a shared `VertexOutput` from `types.wesl`
- `wesl.toml` defines the `package` root; the default is `./shaders`
- `?static` links at build time and produces plain WGSL
- The linker checks syntax and names, never types (see `docs/reference/wesl-tooling.md`)

## Mistakes → rules
- "Can't find VertexOutput": no `wesl.toml`, so `package::` pointed at a missing folder
- Editor still unresolved: wgsl-analyzer needs `edition` in `wesl.toml`
- No errors from Vite: `?raw` skips the WESL plugin
- No errors on save: Vite transforms on request, so reload the page
