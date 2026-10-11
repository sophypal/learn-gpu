# WESL tooling

- Shaders live in `src/shaders/*.wesl` and are imported from TypeScript with `?static` (linked at build time). `?raw` skips the plugin entirely.
- `wesl.toml`: `edition = "2026_pre"`, `root = "src/shaders"`, include `src/shaders/**/*.w[eg]sl`. `package::` resolves from `root`.
- wgsl-analyzer (VS Code, WSL side) is the language server. It requires `edition`; wesl-plugin doesn't. After changing `wesl.toml`, run Developer: Reload Window (its own reload command isn't supported). Log: `~/.vscode-server/data/logs/<session>/exthost*/wgsl-analyzer.wgsl-analyzer/`.
- WGSL Studio is a preview and test runner, not a language server.
- Vite transforms a module only when the browser requests it, so a background tab shows no errors until reloaded.

## Who checks what

| Check | Tool | When |
|---|---|---|
| Syntax, names, imports | WESL linker | Page load (Vite terminal, console) |
| Types, validation | Browser compiler (Tint / Naga) | `createShaderModule`, `getCompilationInfo()` |
| Both, approximately | wgsl-analyzer (Naga) | While typing |

Any `@name(...)` parses as an attribute, so a typo like `@locatoin` surfaces as "missing entry point IO".
