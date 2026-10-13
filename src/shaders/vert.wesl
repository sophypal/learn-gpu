import package::types::VertexOutput;

/* Per-vertex inputs, read from vertex buffer slot 0 as described by meshLayout. */
struct VertexAttributes {
    @location(0) position: vec3f,
    @location(1) color: vec4f,
};

/*
 * group 0 (frame):  the camera, projection * view.
 * group 1 (entity): every object's model matrix.
 * group 2 (draw visibility): indices of the objects that passed the cull, filled by cull.wesl.
 */
@group(0) @binding(0) var<uniform> viewProjection: mat4x4f;
@group(1) @binding(0) var<storage, read> model: array<mat4x4f>;
@group(2) @binding(0) var<storage, read> visibleList: array<u32>;

/*
 * Runs once per (vertex, instance). The draw runs instanceCount instances, so
 * instance_index is 0 .. instanceCount - 1: a slot in the visible list, which
 * names the object. Example: visibleList = [7, 9, 4] -> instance 1 draws model[9].
 */
@vertex
fn vsMain (vertexAttributes: VertexAttributes, @builtin(instance_index) instance: u32) -> VertexOutput {
    let modelMatrix: mat4x4f = model[visibleList[instance]];
    var out: VertexOutput;

    out.position = viewProjection * modelMatrix * vec4f(vertexAttributes.position, 1.0);
    out.color = vertexAttributes.color;

    return out;
}
