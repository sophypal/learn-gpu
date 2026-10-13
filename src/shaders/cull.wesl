override WORKGROUP_SIZE: u32 = 64;

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
 * Group 1 is the same bind group the render pipeline uses.
 * Group 2 is the compute-side version: both bindings writable.
 */
@group(1) @binding(0) var<storage, read> entityModel: array<mat4x4f>;
@group(2) @binding(0) var<storage, read_write> visibleList: array<u32>;
@group(2) @binding(1) var<storage, read_write> indirectDrawArgs: IndirectDrawArgs;

/*
 * One invocation per object. For now every object is kept: its index goes onto
 * visibleList and counting it in instanceCount. instanceCount must be
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

    /* atomicAdd returns the count before the add: a slot no other invocation gets. */
    let slot = atomicAdd(&indirectDrawArgs.instanceCount, 1u);
    visibleList[slot] = index;
}
