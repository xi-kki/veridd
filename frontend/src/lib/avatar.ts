/**
 * Veridd — Deterministic Agent Avatar Generator
 *
 * Generates unique SVG profile pictures from agent ID + name.
 * Same input always produces the same output (no network needed).
 * Inspired by Jazzicon / Bored Ape geometric style.
 */

// ───── Colour palette ───────────────────────────────────────────────────────

const PALETTES = [
  ['#a855f7', '#7c3aed', '#6366f1', '#c084fc', '#8b5cf6'], // Violet
  ['#34d399', '#10b981', '#059669', '#6ee7b7', '#047857'], // Emerald
  ['#22d3ee', '#06b6d4', '#0891b2', '#67e8f9', '#0e7490'], // Cyan
  ['#f472b6', '#ec4899', '#db2777', '#f9a8d4', '#be185d'], // Pink
  ['#fb923c', '#f97316', '#ea580c', '#fdba74', '#c2410c'], // Orange
  ['#e879f9', '#d946ef', '#c026d3', '#f0abfc', '#a21caf'], // Fuchsia
  ['#facc15', '#eab308', '#ca8a04', '#fde047', '#a16207'], // Yellow
  ['#818cf8', '#6366f1', '#4f46e5', '#a5b4fc', '#4338ca'], // Indigo
];

// ───── Seeded RNG (Mulberry32) ──────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashId(id: number, name: string): number {
  let h = 0;
  const s = `${id}:${name}`;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ───── SVG generators ───────────────────────────────────────────────────────

function circle(rng: () => number, palette: string[], size: number): string[] {
  const shapes: string[] = [];
  const n = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < n; i++) {
    const cx = rng() * size;
    const cy = rng() * size;
    const r = 8 + rng() * (size * 0.25);
    const fill = palette[Math.floor(rng() * palette.length)];
    const opacity = 0.6 + rng() * 0.3;
    shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`);
  }
  return shapes;
}

function polygon(rng: () => number, palette: string[], size: number): string[] {
  const shapes: string[] = [];
  const n = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < n; i++) {
    const sides = 4 + Math.floor(rng() * 5);
    const cx = rng() * size;
    const cy = rng() * size;
    const rad = 12 + rng() * (size * 0.22);
    const rot = rng() * 360;
    const pts: string[] = [];
    for (let s = 0; s < sides; s++) {
      const a = (rot + (360 / sides) * s) * (Math.PI / 180);
      pts.push(`${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`);
    }
    const fill = palette[Math.floor(rng() * palette.length)];
    const opacity = 0.4 + rng() * 0.3;
    shapes.push(`<polygon points="${pts.join(' ')}" fill="${fill}" opacity="${opacity}"/>`);
  }
  return shapes;
}

function dots(rng: () => number, palette: string[], size: number): string[] {
  const shapes: string[] = [];
  const n = 4 + Math.floor(rng() * 8);
  for (let i = 0; i < n; i++) {
    const x = rng() * size;
    const y = rng() * size;
    const r = 2 + rng() * 6;
    const fill = palette[Math.floor(rng() * palette.length)];
    shapes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="0.8"/>`);
  }
  return shapes;
}

// ───── Main function ────────────────────────────────────────────────────────

/**
 * Generate a unique SVG avatar data URI for an agent.
 *
 * @param agentId — On-chain agent ID.
 * @param name — Agent name (used as seed alongside ID).
 * @param size — Output square size in pixels (default 100).
 * @returns A data URI string usable in `<img src="..." />`.
 *
 * @example
 * ```tsx
 * <img src={generateAgentAvatar(1, "MyAgent")} alt="Agent avatar" />
 * ```
 */
export function generateAgentAvatar(agentId: number, name: string, size = 100): string {
  const seed = hashId(agentId, name);
  const rng = mulberry32(seed);
  const palette = PALETTES[Math.floor(rng() * PALETTES.length)];

  const bg = palette[Math.floor(rng() * palette.length)];
  const elements = [
    ...circle(rng, palette, size),
    ...polygon(rng, palette, size),
    ...dots(rng, palette, size),
  ].sort(() => rng() - 0.5);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="${bg}" opacity="0.15"/>
    ${elements.join('\n    ')}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
