override WORKGROUP_SIZE: u32 = 64;
override CULL_SCALE: f32 = 1.0;

struct IndirectDrawArgs {
    indexCount: u32,
    instanceCount: atomic<u32>,
    firstIndex: u32,
    baseVertex: i32,
    firstInstance: u32
};

@group(0) @binding(0) var<uniform> viewProjection: mat4x4f;
@group(1) @binding(0) var<storage, read> entityModel: array<mat4x4f>;
@group(2) @binding(0) var<storage, read_write> visibleList: array<u32>;
@group(2) @binding(1) var<storage, read_write> indirectDrawArgs: IndirectDrawArgs;

@compute
@workgroup_size(WORKGROUP_SIZE)
fn csMain (
    @builtin(global_invocation_id) globalIndex: vec3u,
    @builtin(local_invocation_id) localIndex: vec3u
) {
    if (globalIndex.x >= arrayLength(&entityModel)) {
        return;
    }

    let clip  = viewProjection * entityModel[globalIndex.x][3];
    let w = clip.w * CULL_SCALE;

    let inside = all(abs(clip.xy) <= vec2f(w)) && clip.z >= 0.0 && clip.z <= clip.w;
    if (!inside) {
        return;
    }

    let slot = atomicAdd(&indirectDrawArgs.instanceCount, 1u);
    visibleList[slot] = globalIndex.x;
}