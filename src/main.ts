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
