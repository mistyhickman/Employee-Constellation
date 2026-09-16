export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const AVATAR_HUES = [217, 262, 291, 330, 12, 27, 47, 158, 173, 199];

/** Deterministic, pleasant hue for a person's avatar background, derived from their id. */
export function avatarHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_HUES[Math.abs(hash) % AVATAR_HUES.length];
}
