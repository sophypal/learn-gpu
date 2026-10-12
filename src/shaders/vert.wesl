import package::types::VertexOutput;

struct VertexAttributes {
    @location(0) position: vec3f,
    @location(1) color: vec4f,
};

@group(0) @binding(0) var<uniform> viewProjection: mat4x4f;
@group(1) @binding(0) var<storage> model: array<mat4x4f>;
@group(2) @binding(0) var<storage> visibleList: array<u32>;

@vertex
fn vsMain (vertexAttributes: VertexAttributes, @builtin(instance_index) instance: u32) -> VertexOutput {
    let modelMatrix: mat4x4f = model[visibleList[instance]];
    var out: VertexOutput;

    out.position = viewProjection * modelMatrix * vec4f(vertexAttributes.position,  1.0);
    out.color = vertexAttributes.color;

    return out;
}
