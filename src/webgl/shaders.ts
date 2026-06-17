export const VERTEX_SHADER = `#version 300 es
precision highp float;

const vec2 positions[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2( 3.0, -1.0),
  vec2(-1.0,  3.0)
);

out vec2 v_uv;

void main() {
  vec2 pos = positions[gl_VertexID];
  v_uv = pos * 0.5 + 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_cursor;
uniform float u_scroll;
uniform float u_color_temp;
uniform vec2 u_flow_bias;
uniform vec2 u_resolution;
uniform float u_layer_count;
uniform vec2 u_phase;
uniform float u_hue_shift;
uniform vec4 u_layer_y;

// Simplex 2D noise (Ashima Arts / Ian McEwan)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 3; i++) {
    value += amplitude * snoise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

vec3 auroraLayer(vec2 uv, float timeScale, float yOffset, float depth) {
  float t = u_time * timeScale;
  vec2 p = uv + u_phase;
  p.x += u_flow_bias.x;
  p.y += u_flow_bias.y + u_scroll * depth * 0.3;

  float curtain = smoothstep(0.1, 0.9, uv.y + yOffset);
  curtain *= smoothstep(1.0, 0.3, uv.y + yOffset);

  float n = fbm(vec2(p.x * 2.0 + t * 0.05, p.y * 3.0 - t * 0.03));
  float n2 = fbm(vec2(p.x * 1.5 - t * 0.04, p.y * 2.5 + n));

  float ribbon = smoothstep(0.2, 0.8, n * 0.5 + 0.5 + n2 * 0.3);
  ribbon *= curtain;

  vec3 coolColor = mix(vec3(0.12, 0.75, 0.58), vec3(0.18, 0.83, 0.66), u_hue_shift);
  vec3 warmColor = vec3(0.96, 0.45, 0.71);
  vec3 edgeColor = mix(vec3(0.35, 0.15, 0.75), vec3(0.49, 0.23, 0.93), u_hue_shift);

  vec3 baseColor = mix(coolColor, edgeColor, n2 * 0.5 + 0.5);
  baseColor = mix(baseColor, warmColor, u_color_temp * ribbon);

  return baseColor * ribbon * 0.35;
}

void main() {
  vec2 uv = v_uv;
  uv.y = 1.0 - uv.y;

  vec3 sky = mix(vec3(0.04, 0.055, 0.08), vec3(0.05, 0.08, 0.12), uv.y);

  vec3 color = sky;

  if (u_layer_count >= 1.0) color += auroraLayer(uv, 0.3, u_layer_y.x, 0.2);
  if (u_layer_count >= 2.0) color += auroraLayer(uv, 0.5, u_layer_y.y, 0.4);
  if (u_layer_count >= 3.0) color += auroraLayer(uv, 0.7, u_layer_y.z, 0.6);
  if (u_layer_count >= 4.0) color += auroraLayer(uv, 1.0, u_layer_y.w, 0.8);

  color = color / (color + vec3(1.0));

  fragColor = vec4(color, 1.0);
}
`;
