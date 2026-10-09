// Shared, mutable state between the DOM side (scroll, pointer, page
// transitions) and the persistent three.js scene. Mutated directly, read in
// useFrame — no React re-renders on every pointer move.
export const experience = {
  pointer: { x: 0, y: 0 }, // -1..1, smoothed in the scene
  splash: 0, // 0..1, raised by page transitions (liquid burst)
  ready: false,
};

export function setSplash(v: number) {
  experience.splash = v;
}
