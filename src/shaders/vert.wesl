import package::types::VertexOutput;

struct VertexAttributes {
    @location(0) position: vec3f,
    @location(1) color: vec4f,
};

struct InstanceAttributes {
    @location(2) model0: vec4f,
    @location(3) model1: vec4f,
    @location(4) model2: vec4f,
    @location(5) model3: vec4f
};

@group(0) @binding(0) var<uniform> viewProjection: mat4x4f;

fn getModelMatrix (in: InstanceAttributes) -> mat4x4f {
    return mat4x4f(in.model0, in.model1, in.model2, in.model3);
}

@vertex
fn vsMain (vertexAttributes: VertexAttributes, instanceAttributes: InstanceAttributes) -> VertexOutput {
    let modelMatrix: mat4x4f = getModelMatrix(instanceAttributes);
    var out: VertexOutput;

    out.position = viewProjection * modelMatrix * vec4f(vertexAttributes.position,  1.0);
    out.color = vertexAttributes.color;

    return out;
}
