/**
 * Tests for Pixel Avatar Generator
 *
 * Covers:
 *   - Deterministic output (same input → same output)
 *   - Different inputs produce different outputs
 *   - Output is a valid SVG data URI
 *   - Custom size parameter
 *   - Edge cases: agentId = 0, empty name
 */
import { describe, it, expect } from 'vitest';
import { generatePixelAvatar } from './pixel-avatar';

describe('generatePixelAvatar', () => {
  it('should produce a deterministic output for the same inputs', () => {
    const result1 = generatePixelAvatar(1, 'Alpha', 48);
    const result2 = generatePixelAvatar(1, 'Alpha', 48);
    expect(result1).toBe(result2);
  });

  it('should produce different outputs for different names', () => {
    const result1 = generatePixelAvatar(1, 'Alpha', 48);
    const result2 = generatePixelAvatar(1, 'Beta', 48);
    expect(result1).not.toBe(result2);
  });

  it('should produce different outputs for different IDs', () => {
    const result1 = generatePixelAvatar(1, 'Alpha', 48);
    const result2 = generatePixelAvatar(2, 'Alpha', 48);
    expect(result1).not.toBe(result2);
  });

  it('should return a valid SVG data URI', () => {
    const result = generatePixelAvatar(42, 'TestAgent', 64);
    expect(result).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
    expect(result).toContain('<svg');
    expect(result).toContain('</svg>');
  });

  it('should handle agentId of 0', () => {
    const result = generatePixelAvatar(0, 'Zero', 100);
    expect(result).toMatch(/^data:image\/svg\+xml/);
  });

  it('should handle empty name', () => {
    const result = generatePixelAvatar(5, '', 48);
    expect(result).toMatch(/^data:image\/svg\+xml/);
  });

  it('should use the size parameter correctly', () => {
    const result = generatePixelAvatar(1, 'SizeTest', 200);
    expect(result).toContain('width="200"');
    expect(result).toContain('height="200"');
  });
});
