import { useEffect, useRef, useCallback } from 'react';

export interface MouseState {
  x: number;
  y: number;
  isHovering: boolean; // hovering over [data-hover], button, or a
}

type Listener = (state: MouseState) => void;

/**
 * Singleton shared mouse state — avoids multiple mousemove listeners.
 * Components subscribe via useMousePosition().
 */
const state: MouseState = { x: -999, y: -999, isHovering: false };
const listeners = new Set<Listener>();

let initialized = false;

function isInteractive(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'button' ||
    tag === 'a' ||
    (el as HTMLElement).dataset.hover !== undefined ||
    el.getAttribute('role') === 'button'
  );
}

function init() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('mousemove', (e) => {
    state.x = e.clientX;
    state.y = e.clientY;
    state.isHovering = isInteractive(e.target as Element);
    listeners.forEach((fn) => fn({ ...state }));
  });

  window.addEventListener('mouseover', (e) => {
    const hovering = isInteractive(e.target as Element);
    if (hovering !== state.isHovering) {
      state.isHovering = hovering;
      listeners.forEach((fn) => fn({ ...state }));
    }
  });
}

export function useMousePosition(onUpdate: Listener) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  const stable = useCallback((s: MouseState) => cbRef.current(s), []);

  useEffect(() => {
    init();
    listeners.add(stable);
    return () => { listeners.delete(stable); };
  }, [stable]);
}
