import package::types::VertexOutput;

/* Per-vertex inputs, read from vertex buffer slot 0 as described by meshLayout. */
struct VertexAttributes {
    @location(0) position: vec3f,
    @location(1) color: vec4f,
};

/*
 * Per-instance inputs, read from vertex buffer slot 1 as described by modelLayout.
 * A mat4x4f is too big for one attribute, so it arrives as its four columns.
 */
struct InstanceAttributes {
    @location(2) model0: vec4f,
    @location(3) model1: vec4f,
    @location(4) model2: vec4f,
    @location(5) model3: vec4f,
};

/* group 0: the camera matrix, the same for every vertex. */
@group(0) @binding(0) var<uniform> viewProjection: mat4x4f;

/*
 * Runs once per (vertex, instance): moves the vertex by its instance's model
 * matrix, then applies the camera.
 */
@vertex
fn vsMain (vertexAttributes: VertexAttributes, instance: InstanceAttributes) -> VertexOutput {
    let modelMatrix = mat4x4f(instance.model0, instance.model1, instance.model2, instance.model3);
    var out: VertexOutput;

    out.position = viewProjection * modelMatrix * vec4f(vertexAttributes.position, 1.0);
    out.color = vertexAttributes.color;

    return out;
}
