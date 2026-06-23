/**
 * Veridd — Pixel Art Agent Avatar Generator
 *
 * Generates unique 8-bit style pixel art DPs from agent ID + name.
 * Same input always produces the same output (seeded, deterministic).
 * 16x16 grid with horizontal mirror symmetry for that classic retro look.
 *
 * Output: SVG data URI (no network needed, instant).
 */

// ───── Colour palettes ──────────────────────────────────────────────────────

const PIXEL_PALETTES = [
  // Cyber Violet
  { bg: '#1a1025', colors: ['#a855f7', '#7c3aed', '#c084fc', '#8b5cf6', '#6d28d9', '#4c1d95'] },
  // Matrix Green
  { bg: '#0a1a0a', colors: ['#34d399', '#10b981', '#6ee7b7', '#059669', '#047857', '#22c55e'] },
  // Deep Cyan
  { bg: '#0a1419', colors: ['#22d3ee', '#06b6d4', '#67e8f9', '#0891b2', '#0e7490', '#38bdf8'] },
  // Hot Pink
  { bg: '#1a0a14', colors: ['#f472b6', '#ec4899', '#f9a8d4', '#db2777', '#be185d', '#e879f9'] },
  // Sunset Orange
  { bg: '#1a0f0a', colors: ['#fb923c', '#f97316', '#fdba74', '#ea580c', '#c2410c', '#f59e0b'] },
  // Neon Fuchsia
  { bg: '#150a1a', colors: ['#e879f9', '#d946ef', '#f0abfc', '#c026d3', '#a21caf', '#a855f7'] },
  // Gold
  { bg: '#14100a', colors: ['#facc15', '#eab308', '#fde047', '#ca8a04', '#a16207', '#fbbf24'] },
  // Ice Indigo
  { bg: '#0a0a1a', colors: ['#818cf8', '#6366f1', '#a5b4fc', '#4f46e5', '#4338ca', '#6366f1'] },
  // Toxic Acid
  { bg: '#0a140a', colors: ['#a3e635', '#84cc16', '#bef264', '#65a30d', '#4d7c0f', '#22c55e'] },
  // Blood Red
  { bg: '#1a0a0a', colors: ['#f87171', '#ef4444', '#fca5a5', '#dc2626', '#b91c1c', '#fb7185'] },
];

// ───── Seeded RNG (Mulberry32) ──────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(id: number, name: string): number {
  let h = 0;
  const s = `${id}:${name}`;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ───── Pixel art generator ──────────────────────────────────────────────────

const GRID = 16; // 16x16 grid
const HALF = Math.floor(GRID / 2); // mirror halfway

/**
 * Generate a unique 8-bit pixel art SVG data URI for an agent.
 *
 * @param agentId — On-chain agent ID.
 * @param name — Agent name (used as seed alongside ID).
 * @param size — Output square size in pixels (default 100).
 * @returns A data URI string usable in `<img src="..." />`.
 *
 * @example
 * ```tsx
 * <img src={generatePixelAvatar(1, "MyAgent")} alt="Agent DP" className="w-12 h-12" />
 * ```
 */
export function generatePixelAvatar(agentId: number, name: string, size = 100): string {
  const seed = hashId(agentId, name);
  const rng = mulberry32(seed);
  const palette = PIXEL_PALETTES[Math.floor(rng() * PIXEL_PALETTES.length)];

  // Generate pixels (only left half, mirrored)
  const pixelGrid: string[][] = [];
  for (let y = 0; y < GRID; y++) {
    const row: string[] = [];
    for (let x = 0; x < HALF; x++) {
      // 60% chance to fill a pixel, 40% chance empty (background)
      const fill = rng() < 0.6;
      if (fill) {
        const colorIndex = Math.floor(rng() * palette.colors.length);
        row.push(palette.colors[colorIndex]);
      } else {
        row.push('transparent');
      }
    }
    pixelGrid.push(row);
  }

  // Build SVG: each pixel as a rect, mirrored horizontally
  const pixelSize = size / GRID;
  const halfPixelSize = size / GRID;

  let svgContent = '';
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < HALF; x++) {
      const color = pixelGrid[y][x];
      if (color === 'transparent') continue;

      // Left pixel
      const x1 = x * pixelSize;
      svgContent += `<rect x="${x1}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;

      // Mirrored right pixel (unless it's the center column on odd-width grids)
      const mirroredX = (GRID - 1 - x) * pixelSize;
      if (mirroredX !== x1 || x !== HALF - 1) {
        svgContent += `<rect x="${mirroredX}" y="${y * pixelSize}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
      }
    }
  }

  // Add a subtle glow ring around the avatar
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.12}" fill="${palette.bg}"/>
    ${svgContent}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
