import type Lenis from 'lenis';

// One Lenis instance for the whole app; other components reach it here
// (route changes, menus that need to freeze scrolling).
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};
export const getLenis = () => instance;

export function scrollToTarget(target: HTMLElement | number, immediate = true) {
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
  if (instance) {
    instance.scrollTo(target, { immediate, offset: typeof target === 'number' ? 0 : -(header + 24), force: true });
    return;
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: immediate ? 'auto' : 'smooth' });
  else target.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' });
}
