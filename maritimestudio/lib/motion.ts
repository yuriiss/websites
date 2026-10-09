// Shared motion helpers. "Calm mode" is a site-level reduced-motion switch
// stored per browser; it adds .reduce-motion to <html>.
export const CALM_KEY = 'ms-calm';
export const CALM_EVENT = 'ms:calm-change';

export function prefersReduced(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('reduce-motion')
  );
}

export function finePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function tween(duration: number, step: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const frame = (now: number) => {
      const t = clamp((now - start) / duration, 0, 1);
      step(t);
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

// Runs before first paint (inlined in <head>) so Calm mode never flashes motion.
export const CALM_BOOT_SCRIPT = `try{if(localStorage.getItem('${CALM_KEY}')==='1')document.documentElement.classList.add('reduce-motion')}catch(e){}document.documentElement.classList.add('js');`;
