struct IndirectDrawArgs {
    indexCount: u32,
    instanceCount: u32,
    firstIndex: u32,
    baseVertex: i32,
    firstInstance: u32
};

@global(0) @binding(0) var<storage, read> entityModel: array<mat4x4f>;
@global(0) @binding(1) var<storage, read_write> visibleList: array<u32>;
@global(0) @binding(2) var<storage, read_write> indirectDrawArgs: IndirectDrawArgs;

@compute
fn csMain (
    @builtin(global_invocation_id) globalIndex: vec3u,
    @builtin(local_invocation_id) localIndex: vec3u
) {

}