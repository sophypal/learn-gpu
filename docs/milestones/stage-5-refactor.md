# Stage 5: Modular refactor

Tag: `stage-5-refactor` · Source: exact

## Concepts
- `main.ts` split by concern: gpu, vertexLayout, geometry, camera, pipeline, render
- The vertex format is defined in one file, shared by the data writer and the pipeline
- Depth format is one constant shared by pipeline and texture
- No behavior change: every quirk (one-time render, `window` sizes, `'auto'` layout) kept

## Mistakes → rules
- (none; this stage exists to prevent the stage-2 layout drift from recurring)
