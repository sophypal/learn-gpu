override WORKGROUP_SIZE: u32 = 64;
/* Below 1.0, shrinks the on-screen bound so culling can be seen. Testing only. */
override CULL_SCALE: f32 = 1.0;

/*
 * The layout drawIndexedIndirect reads (5 x 4 bytes). Only instanceCount is
 * written here, by many invocations at once, so it's atomic.
 */
struct IndirectDrawArgs {
    indexCount: u32,
    instanceCount: atomic<u32>,
    firstIndex: u32,
    baseVertex: i32,
    firstInstance: u32
};

/*
 * Groups 0 and 1 are the same bind groups the render pipeline uses.
 * Group 2 is the compute-side version: both bindings writable.
 */
@group(0) @binding(0) var<uniform> viewProjection: mat4x4f;
@group(1) @binding(0) var<storage, read> entityModel: array<mat4x4f>;
@group(2) @binding(0) var<storage, read_write> visibleList: array<u32>;
@group(2) @binding(1) var<storage, read_write> indirectDrawArgs: IndirectDrawArgs;

/*
 * One invocation per object: keep it if its origin is on screen, appending its
 * index to visibleList and counting it in instanceCount. instanceCount must be
 * zeroed before the dispatch: no barrier spans workgroups, so the shader can't.
 */
@compute
@workgroup_size(WORKGROUP_SIZE)
fn csMain (@builtin(global_invocation_id) globalIndex: vec3u) {
    let index = globalIndex.x;

    /* The dispatch is rounded up to whole workgroups; extra invocations do nothing. */
    if (index >= arrayLength(&entityModel)) {
        return;
    }

    /* The object's origin (translation column) in clip space. */
    let clip = viewProjection * entityModel[index][3];
    let edge = clip.w * CULL_SCALE;

    /* Before the divide by w: |x|, |y| <= w on screen, and 0 <= z <= w (WebGPU depth is 0..1). */
    let inside = all(abs(clip.xy) <= vec2f(edge)) && clip.z >= 0.0 && clip.z <= clip.w;
    if (!inside) {
        return;
    }

    /* atomicAdd returns the count before the add: a slot no other invocation gets. */
    let slot = atomicAdd(&indirectDrawArgs.instanceCount, 1u);
    visibleList[slot] = index;
}
