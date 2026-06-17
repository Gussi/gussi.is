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
