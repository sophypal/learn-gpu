# Stage 1: First triangle

Tag: `stage-1-first-quad` · Source: reconstructed

## Concepts
- Adapter → device → `context.configure({ device, format })`
- `createShaderModule`, `createRenderPipeline` (`layout`, `vertex.buffers`, `fragment.targets`, `primitive`)
- Command encoder → render pass (`view`, `loadOp`, `storeOp`, `clearValue`) → draw → `finish` → `queue.submit`
- `layout: 'auto'` builds bind group layouts from the shader; they can't be shared with other pipelines
- The vertex buffer layout says where data sits in memory; the shader's `@location` says what it receives
- `label` shows up in errors and GPU debuggers

## Mistakes → rules
- Scrollbar with zero margins: an inline canvas sits on the text baseline, so use `canvas { display: block; }`
