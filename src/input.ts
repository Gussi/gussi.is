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
