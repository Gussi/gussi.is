# gussi.is Aurora Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page personal site with a generative WebGL2 aurora background, film-credit HTML overlay, and Rust/WASM input smoothing.

**Architecture:** Vite bundles TypeScript glue and static assets. A Rust WASM crate exports `init` and `tick` to compute smoothed uniforms each frame. Raw WebGL2 renders a full-screen triangle with layered noise aurora shaders. HTML holds all readable content above the canvas.

**Tech Stack:** Vite, TypeScript, WebGL2, Rust, wasm-bindgen, wasm-pack

**Spec:** `docs/superpowers/specs/2026-06-17-gussi-is-aurora-design.md`

---

## File Map

| File | Responsibility |
|------|----------------|
| `package.json` | Dependencies, dev/build scripts |
| `vite.config.ts` | Vite + WASM plugin config |
| `tsconfig.json` | TypeScript compiler options |
| `index.html` | Semantic content, canvas element, meta tags |
| `src/styles/main.css` | Typography, layout, a11y, fallback gradient |
| `src/main.ts` | Entry: WASM init, input listeners, rAF loop |
| `src/input.ts` | Raw cursor/scroll/touch state normalized 0–1 |
| `src/webgl/shaders.ts` | GLSL source strings |
| `src/webgl/uniforms.ts` | Uniform location cache + upload |
| `src/webgl/renderer.ts` | WebGL2 context, program compile, draw |
| `wasm/Cargo.toml` | Rust crate config |
| `wasm/src/lib.rs` | Smoothing + uniform computation |
| `public/favicon.svg` | Simple aurora-colored favicon |

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/main.ts` (stub)
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "gussi-is",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "npm run build:wasm && vite",
    "build:wasm": "wasm-pack build wasm --target web --out-dir src/wasm/pkg",
    "build": "npm run build:wasm && tsc && vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "vite-plugin-wasm": "^3.3.0",
    "vite-plugin-top-level-await": "^1.4.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  server: { port: 5173 },
  build: { target: "esnext" },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create stub `src/main.ts`**

```typescript
console.log("gussi.is");
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
dist/
src/wasm/pkg/
target/
.DS_Store
```

- [ ] **Step 6: Install dependencies**

Run: `cd /home/gussi/code/gussi-is && npm install`

Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Commit**

```bash
git init
git add package.json vite.config.ts tsconfig.json src/main.ts .gitignore
git commit -m "chore: scaffold Vite + TypeScript project"
```

---

### Task 2: HTML content overlay and CSS

**Files:**
- Create: `index.html`
- Create: `src/styles/main.css`
- Modify: `src/main.ts`

- [ ] **Step 1: Create `index.html`**

Replace placeholder URLs with real GitHub, LinkedIn, and X URLs. Replace age and occupation with real values.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Gussi — personal site" />
    <title>Gussi</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/src/styles/main.css" />
  </head>
  <body>
    <canvas id="aurora" aria-hidden="true"></canvas>
    <main class="content">
      <h1 class="name">Gussi</h1>
      <p class="bio">
        <span class="age">28</span> · <span class="occupation">Software engineer</span>
      </p>
      <nav class="links" aria-label="Social links">
        <a href="https://github.com/gussi" rel="me">GitHub</a>
        <span class="sep" aria-hidden="true">·</span>
        <a href="https://linkedin.com/in/gussi" rel="me">LinkedIn</a>
        <span class="sep" aria-hidden="true">·</span>
        <a href="https://x.com/gussi" rel="me">X</a>
      </nav>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Create `src/styles/main.css`**

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  height: 200vh; /* enables subtle scroll parallax */
}

body {
  font-family: "Cormorant Garamond", Georgia, serif;
  background: linear-gradient(180deg, #0a0e14 0%, #0d1520 50%, #0a0e14 100%);
  color: #e8e6e3;
  min-height: 100vh;
  overflow-x: hidden;
}

#aurora {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 0;
}

.content {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  pointer-events: none;
  max-width: 400px;
  margin: 0 auto;
}

.name {
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: 300;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-shadow: 0 0 40px rgba(232, 230, 227, 0.3);
  margin-bottom: 0.75rem;
}

.bio {
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 300;
  color: #9ca3af;
  letter-spacing: 0.05em;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
}

.links {
  font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  font-weight: 300;
  letter-spacing: 0.1em;
  pointer-events: auto;
}

.links a {
  color: #e8e6e3;
  text-decoration: none;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.links a:hover {
  opacity: 1;
}

.links a:focus-visible {
  outline: 2px solid #e8e6e3;
  outline-offset: 4px;
  opacity: 1;
}

.sep {
  margin: 0 0.5em;
  opacity: 0.4;
}

@media (prefers-reduced-motion: reduce) {
  html {
    height: 100vh;
  }
}

.no-webgl body {
  background: linear-gradient(
    180deg,
    #0a0e14 0%,
    #0f2838 30%,
    #1a3a2a 60%,
    #2a1a3a 80%,
    #0a0e14 100%
  );
}
```

- [ ] **Step 3: Update `src/main.ts` to import CSS**

```typescript
import "./styles/main.css";
```

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`

Open: `http://localhost:5173`

Expected: Dark gradient background, centered typography, links visible. No canvas rendering yet.

- [ ] **Step 5: Commit**

```bash
git add index.html src/styles/main.css src/main.ts
git commit -m "feat: add HTML content overlay and film-credit typography"
```

---

### Task 3: Rust WASM crate

**Files:**
- Create: `wasm/Cargo.toml`
- Create: `wasm/src/lib.rs`

- [ ] **Step 1: Create `wasm/Cargo.toml`**

```toml
[package]
name = "gussi-aurora"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

- [ ] **Step 2: Create `wasm/src/lib.rs`**

```rust
use wasm_bindgen::prelude::*;

struct State {
    smooth_cursor_x: f32,
    smooth_cursor_y: f32,
    smooth_scroll: f32,
    smooth_color_temp: f32,
    flow_bias_x: f32,
    flow_bias_y: f32,
}

static mut STATE: Option<State> = None;

const CURSOR_SMOOTH: f32 = 3.0;
const SCROLL_SMOOTH: f32 = 2.0;
const COLOR_SMOOTH: f32 = 2.5;
const INFLUENCE_RADIUS: f32 = 0.25;

#[wasm_bindgen]
pub fn init(_seed: f32) {
    unsafe {
        STATE = Some(State {
            smooth_cursor_x: 0.5,
            smooth_cursor_y: 0.5,
            smooth_scroll: 0.0,
            smooth_color_temp: 0.0,
            flow_bias_x: 0.0,
            flow_bias_y: 0.0,
        });
    }
}

fn lerp_exp(current: f32, target: f32, rate: f32, dt: f32) -> f32 {
    let t = 1.0 - (-rate * dt).exp();
    current + (target - current) * t
}

/// Returns 8 floats: time, cursor_x, cursor_y, scroll, color_temp, flow_x, flow_y, layer_count
#[wasm_bindgen]
pub fn tick(
    dt: f32,
    cursor_x: f32,
    cursor_y: f32,
    scroll_y: f32,
    time: f32,
    is_mobile: bool,
) -> Vec<f32> {
    unsafe {
        let state = STATE.as_mut().expect("call init() first");

        state.smooth_cursor_x = lerp_exp(state.smooth_cursor_x, cursor_x, CURSOR_SMOOTH, dt);
        state.smooth_cursor_y = lerp_exp(state.smooth_cursor_y, cursor_y, CURSOR_SMOOTH, dt);
        state.smooth_scroll = lerp_exp(state.smooth_scroll, scroll_y, SCROLL_SMOOTH, dt);

        let dx = cursor_x - 0.5;
        let dy = cursor_y - 0.5;
        let dist = (dx * dx + dy * dy).sqrt();
        let influence = (1.0 - (dist / INFLUENCE_RADIUS).min(1.0)).max(0.0);
        let target_color_temp = influence * 0.6;
        state.smooth_color_temp =
            lerp_exp(state.smooth_color_temp, target_color_temp, COLOR_SMOOTH, dt);

        let target_flow_x = dx * influence * 0.08;
        let target_flow_y = dy * influence * 0.05;
        state.flow_bias_x = lerp_exp(state.flow_bias_x, target_flow_x, CURSOR_SMOOTH, dt);
        state.flow_bias_y = lerp_exp(state.flow_bias_y, target_flow_y, CURSOR_SMOOTH, dt);

        let layer_count = if is_mobile { 2.0 } else { 4.0 };

        vec![
            time,
            state.smooth_cursor_x,
            state.smooth_cursor_y,
            state.smooth_scroll,
            state.smooth_color_temp,
            state.flow_bias_x,
            state.flow_bias_y,
            layer_count,
        ]
    }
}
```

- [ ] **Step 3: Build WASM**

Run: `npm run build:wasm`

Expected: `src/wasm/pkg/` created with `gussi_aurora.js`, `gussi_aurora_bg.wasm`, and type definitions. No compile errors.

Prerequisite: `wasm-pack` installed (`cargo install wasm-pack` if missing).

- [ ] **Step 4: Commit**

```bash
git add wasm/
git commit -m "feat: add Rust WASM input smoothing crate"
```

---

### Task 4: WebGL shaders

**Files:**
- Create: `src/webgl/shaders.ts`

- [ ] **Step 1: Create `src/webgl/shaders.ts`**

```typescript
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
  vec2 p = uv;
  p.x += u_flow_bias.x;
  p.y += u_flow_bias.y + u_scroll * depth * 0.3;

  float curtain = smoothstep(0.1, 0.9, uv.y + yOffset);
  curtain *= smoothstep(1.0, 0.3, uv.y + yOffset);

  float n = fbm(vec2(p.x * 2.0 + t * 0.05, p.y * 3.0 - t * 0.03));
  float n2 = fbm(vec2(p.x * 1.5 - t * 0.04, p.y * 2.5 + n));

  float ribbon = smoothstep(0.2, 0.8, n * 0.5 + 0.5 + n2 * 0.3);
  ribbon *= curtain;

  vec3 coolColor = vec3(0.18, 0.83, 0.66);
  vec3 warmColor = vec3(0.96, 0.45, 0.71);
  vec3 edgeColor = vec3(0.49, 0.23, 0.93);

  vec3 baseColor = mix(coolColor, edgeColor, n2 * 0.5 + 0.5);
  baseColor = mix(baseColor, warmColor, u_color_temp * ribbon);

  return baseColor * ribbon * 0.35;
}

void main() {
  vec2 uv = v_uv;
  uv.y = 1.0 - uv.y;

  vec3 sky = mix(vec3(0.04, 0.055, 0.08), vec3(0.05, 0.08, 0.12), uv.y);

  vec3 color = sky;

  if (u_layer_count >= 1.0) color += auroraLayer(uv, 0.3, 0.0, 0.2);
  if (u_layer_count >= 2.0) color += auroraLayer(uv, 0.5, 0.1, 0.4);
  if (u_layer_count >= 3.0) color += auroraLayer(uv, 0.7, -0.05, 0.6);
  if (u_layer_count >= 4.0) color += auroraLayer(uv, 1.0, 0.15, 0.8);

  color = color / (color + vec3(1.0));

  fragColor = vec4(color, 1.0);
}
`;
```

- [ ] **Step 2: Commit**

```bash
git add src/webgl/shaders.ts
git commit -m "feat: add aurora vertex and fragment shaders"
```

---

### Task 5: WebGL renderer and uniforms

**Files:**
- Create: `src/webgl/uniforms.ts`
- Create: `src/webgl/renderer.ts`

- [ ] **Step 1: Create `src/webgl/uniforms.ts`**

```typescript
export interface AuroraUniforms {
  time: number;
  cursorX: number;
  cursorY: number;
  scroll: number;
  colorTemp: number;
  flowX: number;
  flowY: number;
  layerCount: number;
  resolutionX: number;
  resolutionY: number;
}

export class UniformUploader {
  private locations: Record<string, WebGLUniformLocation | null>;

  constructor(
    private gl: WebGL2RenderingContext,
    program: WebGLProgram,
  ) {
    this.locations = {
      u_time: gl.getUniformLocation(program, "u_time"),
      u_cursor: gl.getUniformLocation(program, "u_cursor"),
      u_scroll: gl.getUniformLocation(program, "u_scroll"),
      u_color_temp: gl.getUniformLocation(program, "u_color_temp"),
      u_flow_bias: gl.getUniformLocation(program, "u_flow_bias"),
      u_resolution: gl.getUniformLocation(program, "u_resolution"),
      u_layer_count: gl.getUniformLocation(program, "u_layer_count"),
    };
  }

  upload(u: AuroraUniforms): void {
    const { gl } = this;
    gl.uniform1f(this.locations.u_time, u.time);
    gl.uniform2f(this.locations.u_cursor, u.cursorX, u.cursorY);
    gl.uniform1f(this.locations.u_scroll, u.scroll);
    gl.uniform1f(this.locations.u_color_temp, u.colorTemp);
    gl.uniform2f(this.locations.u_flow_bias, u.flowX, u.flowY);
    gl.uniform2f(this.locations.u_resolution, u.resolutionX, u.resolutionY);
    gl.uniform1f(this.locations.u_layer_count, u.layerCount);
  }
}
```

- [ ] **Step 2: Create `src/webgl/renderer.ts`**

```typescript
import { VERTEX_SHADER, FRAGMENT_SHADER } from "./shaders";
import { AuroraUniforms, UniformUploader } from "./uniforms";

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string,
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    throw new Error(`Program link error: ${log}`);
  }
  return program;
}

export class AuroraRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private uniforms: UniformUploader;
  private width = 0;
  private height = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;
    this.program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    this.uniforms = new UniformUploader(gl, this.program);
    this.resize();
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    this.width = Math.floor(this.canvas.clientWidth * dpr);
    this.height = Math.floor(this.canvas.clientHeight * dpr);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.gl.viewport(0, 0, this.width, this.height);
  }

  draw(u: AuroraUniforms): void {
    const { gl } = this;
    gl.useProgram(this.program);
    this.uniforms.upload({
      ...u,
      resolutionX: this.width,
      resolutionY: this.height,
    });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy(): void {
    this.gl.deleteProgram(this.program);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/webgl/uniforms.ts src/webgl/renderer.ts
git commit -m "feat: add WebGL2 aurora renderer"
```

---

### Task 6: Input handling

**Files:**
- Create: `src/input.ts`

- [ ] **Step 1: Create `src/input.ts`**

```typescript
export interface InputState {
  cursorX: number;
  cursorY: number;
  scrollY: number;
}

export function createInputState(): InputState {
  return { cursorX: 0.5, cursorY: 0.5, scrollY: 0 };
}

export function attachInputListeners(
  state: InputState,
  onUpdate: () => void,
): () => void {
  const onMouseMove = (e: MouseEvent) => {
    state.cursorX = e.clientX / window.innerWidth;
    state.cursorY = e.clientY / window.innerHeight;
    onUpdate();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      state.cursorX = e.touches[0].clientX / window.innerWidth;
      state.cursorY = e.touches[0].clientY / window.innerHeight;
      onUpdate();
    }
  };

  const onScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    state.scrollY = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    onUpdate();
  };

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });

  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("scroll", onScroll);
  };
}

export function isMobile(): boolean {
  return window.matchMedia("(max-width: 768px)").matches;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/input.ts
git commit -m "feat: add normalized input state for cursor and scroll"
```

---

### Task 7: Main loop — wire WASM, WebGL, and input

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Replace `src/main.ts` with full integration**

```typescript
import "./styles/main.css";
import initWasm, { init, tick } from "./wasm/pkg/gussi_aurora";
import { AuroraRenderer } from "./webgl/renderer";
import {
  attachInputListeners,
  createInputState,
  isMobile,
} from "./input";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

async function main(): Promise<void> {
  const canvas = document.getElementById("aurora") as HTMLCanvasElement | null;
  if (!canvas) return;

  let renderer: AuroraRenderer | null = null;
  try {
    renderer = new AuroraRenderer(canvas);
  } catch {
    document.body.classList.add("no-webgl");
    return;
  }

  await initWasm();
  init(Math.random());

  const input = createInputState();
  let elapsed = 0;
  let lastTime = performance.now();
  let running = true;

  const onResize = () => renderer?.resize();
  window.addEventListener("resize", onResize);

  const detachInput = attachInputListeners(input, () => {});

  function frame(now: number): void {
    if (!running || !renderer) return;

    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    elapsed += dt;

    const uniforms = tick(
      dt,
      input.cursorX,
      input.cursorY,
      input.scrollY,
      elapsed,
      isMobile(),
    );

    renderer.draw({
      time: uniforms[0],
      cursorX: uniforms[1],
      cursorY: uniforms[2],
      scroll: uniforms[3],
      colorTemp: uniforms[4],
      flowX: uniforms[5],
      flowY: uniforms[6],
      layerCount: uniforms[7],
      resolutionX: 0,
      resolutionY: 0,
    });

    if (!prefersReducedMotion) {
      requestAnimationFrame(frame);
    }
  }

  if (prefersReducedMotion) {
    frame(performance.now());
  } else {
    requestAnimationFrame(frame);
  }

  window.addEventListener("beforeunload", () => {
    running = false;
    detachInput();
    window.removeEventListener("resize", onResize);
    renderer?.destroy();
  });
}

main();
```

- [ ] **Step 2: Verify aurora renders**

Run: `npm run dev`

Open: `http://localhost:5173`

Expected:
- Green/violet aurora curtains drift on dark sky
- Typography remains fixed and readable on top
- Moving cursor subtly shifts aurora color near center
- Scrolling shifts aurora parallax; text stays fixed

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: wire WASM smoothing, WebGL renderer, and input loop"
```

---

### Task 8: Favicon and production build

**Files:**
- Create: `public/favicon.svg`

- [ ] **Step 1: Create `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#0a0e14"/>
  <ellipse cx="16" cy="20" rx="12" ry="6" fill="#2dd4a8" opacity="0.6"/>
  <ellipse cx="14" cy="18" rx="8" ry="4" fill="#7c3aed" opacity="0.4"/>
</svg>
```

- [ ] **Step 2: Production build**

Run: `npm run build`

Expected: `dist/` folder with `index.html`, bundled JS, WASM, CSS. No build errors.

- [ ] **Step 3: Preview production build**

Run: `npm run preview`

Open: `http://localhost:4173`

Expected: Same aurora experience as dev mode.

- [ ] **Step 4: Commit**

```bash
git add public/favicon.svg
git commit -m "chore: add favicon and verify production build"
```

---

### Task 9: Final verification

**Files:** None (manual checks)

- [ ] **Step 1: WASM loads**

Run dev server, open DevTools console.

Expected: No WASM load errors; `tick` returns 8-element array (inspect via temporary `console.log` if needed, then remove).

- [ ] **Step 2: Cursor influence**

Move cursor to center of viewport slowly.

Expected: Subtle warm tint and flow shift within ~200px effective radius; easy to miss if not looking for it.

- [ ] **Step 3: Scroll parallax**

Scroll down the page.

Expected: Aurora layers shift vertically; `.content` text stays fixed in viewport.

- [ ] **Step 4: Reduced motion**

Enable "reduce motion" in OS settings, reload page.

Expected: Single static aurora frame rendered; no animation loop; content fully readable.

- [ ] **Step 5: WebGL fallback**

In DevTools → Rendering → disable WebGL, reload.

Expected: `no-webgl` class on body; CSS gradient background; content and links work.

- [ ] **Step 6: Keyboard navigation**

Press Tab repeatedly.

Expected: Focus ring visible on GitHub, LinkedIn, X links.

- [ ] **Step 7: Mobile viewport**

DevTools → responsive mode at 375px width.

Expected: 2 aurora layers (less intense); touch drag influences aurora; text readable.

- [ ] **Step 8: Performance**

DevTools Performance panel, record 5 seconds at 1080p desktop.

Expected: Steady 60fps; no long main-thread blocks.

---

## Spec Coverage Checklist

| Spec requirement | Task |
|------------------|------|
| Full-screen aurora WebGL2 | Task 4, 5, 7 |
| Film-credit HTML overlay | Task 2 |
| Rust/WASM input smoothing | Task 3, 7 |
| Subtle cursor influence | Task 3 (WASM), Task 4 (shader) |
| Scroll parallax | Task 2 (`height: 200vh`), Task 6, Task 4 |
| Reduced motion | Task 2 (CSS), Task 7 |
| Mobile layer reduction | Task 3 (`layer_count`), Task 5 (DPR cap) |
| WebGL fallback | Task 2 (CSS), Task 7 |
| Accessibility (aria, focus) | Task 2 |
| Static deploy | Task 8 |
| SEO meta tags | Task 2 |

---

## Deploy Notes

Upload contents of `dist/` to static host for gussi.is. No server runtime required.

```bash
npm run build
# deploy dist/ to your host (Cloudflare Pages, Netlify, nginx, etc.)
```
