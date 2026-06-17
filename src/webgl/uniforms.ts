export interface AuroraVisualSeed {
  phaseX: number;
  phaseY: number;
  hueShift: number;
  layerY: [number, number, number, number];
}

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
  phaseX: number;
  phaseY: number;
  hueShift: number;
  layerY: [number, number, number, number];
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
      u_phase: gl.getUniformLocation(program, "u_phase"),
      u_hue_shift: gl.getUniformLocation(program, "u_hue_shift"),
      u_layer_y: gl.getUniformLocation(program, "u_layer_y"),
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
    gl.uniform2f(this.locations.u_phase, u.phaseX, u.phaseY);
    gl.uniform1f(this.locations.u_hue_shift, u.hueShift);
    gl.uniform4f(
      this.locations.u_layer_y,
      u.layerY[0],
      u.layerY[1],
      u.layerY[2],
      u.layerY[3],
    );
  }
}
