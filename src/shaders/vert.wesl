import package::types::VertexOutput;

struct VertexInput {
    @location(0) position: vec3f,
    @location(1) color: vec4f
};

@group(0) @binding(0) var<uniform> perspective: mat4x4f;

@vertex
fn vsMain (vertex: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = perspective * vec4f(vertex.position,  1.0);
    out.color = vertex.color;

    return out;
}
