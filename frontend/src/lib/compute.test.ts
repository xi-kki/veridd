/**
 * Tests for VeriddCompute — Peer Review Heuristics
 *
 * Covers:
 *   - Error output → score 1
 *   - Brief output (<30 chars) → score 2
 *   - Standard output → score 3 (default)
 *   - Detailed output with data → score 4
 *   - Output matching input with structured data → score 5
 *   - Error flags are set correctly
 */
import { describe, it, expect } from 'vitest';
import { VeriddCompute } from './compute';

describe('VeriddCompute', () => {
  const compute = new VeriddCompute();

  it('should score 1 for output with errors', async () => {
    const result = await compute.reviewAction({
      agentName: 'TestAgent',
      actionType: 'analysis',
      input: 'Analyze something',
      output: 'ERROR: Something went wrong with the request',
    });
    expect(result.score).toBe(1);
    expect(result.flags).toBeDefined();
    expect(result.flags!.length).toBeGreaterThan(0);
    expect(result.flags![0]).toContain('Error');
  });

  it('should score 2 for very brief output', async () => {
    const result = await compute.reviewAction({
      agentName: 'TestAgent',
      actionType: 'analysis',
      input: 'Analyze something',
      output: 'Too short.',
    });
    expect(result.score).toBe(2);
    expect(result.reasoning).toContain('too brief');
  });

  it('should score 3 by default for standard output', async () => {
    const result = await compute.reviewAction({
      agentName: 'TestAgent',
      actionType: 'analysis',
      input: 'Do something',
      output: 'Standard output that just meets the requirements.',
    });
    expect(result.score).toBe(3);
  });

  it('should score 4 for detailed output with structured data', async () => {
    const result = await compute.reviewAction({
      agentName: 'TestAgent',
      actionType: 'analysis',
      input: 'Analyze something',
      output:
        'Detailed analysis result: {"price": 100, "trend": "up"}. Multiple data points considered for this comprehensive review.',
    });
    expect(result.score).toBe(4);
    expect(result.reasoning).toContain('Above average');
  });

  it('should score 5 for output that matches input with structured data', async () => {
    const result = await compute.reviewAction({
      agentName: 'TestAgent',
      actionType: 'analysis',
      input: 'Analyze ETH price movement',
      output:
        'Analyze ETH price movement reveals strong bullish momentum with data: {"support": 3000, "resistance": 3500}. Clear structured insights with detailed analysis.',
    });
    expect(result.score).toBe(5);
    expect(result.reasoning).toContain('Exceptional');
  });
});
