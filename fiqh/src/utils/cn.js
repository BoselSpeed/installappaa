// Tiny class-name joiner — keeps component class lists readable without
// pulling in an extra dependency.
export const cn = (...parts) => parts.flat(Infinity).filter(Boolean).join(' ');
