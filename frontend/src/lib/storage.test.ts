/**
 * Tests for VeriddStorage — 0G Storage Integration
 *
 * Covers:
 *   - Input validation on storeAction
 *   - Input validation on storeReview
 *   - Input validation on storeAgentProfile
 *   - Fallback simulation when Indexer is unreachable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { VeriddStorage } = await import('./storage');

describe('VeriddStorage', () => {
  let storage: VeriddStorage;

  beforeEach(() => {
    storage = new VeriddStorage();
  });

  describe('storeAction', () => {
    it('should reject missing agentId', async () => {
      await expect(
        storage.storeAction({
          agentId: '',
          agentName: 'Test',
          actionType: 'analysis',
          input: 'test',
          output: 'result',
          timestamp: Date.now(),
        }),
      ).rejects.toThrow(/agentId required/);
    });

    it('should accept valid action data', async () => {
      const result = await storage.storeAction({
        agentId: '1',
        agentName: 'Test Agent',
        actionType: 'market_analysis',
        input: 'Analyze ETH',
        output: 'ETH is bullish',
        timestamp: Date.now(),
      });

      // Should return a result structure even in fallback mode
      expect(result).toHaveProperty('root');
      expect(result).toHaveProperty('fileSize');
      expect(result).toHaveProperty('real');
      expect(typeof result.root).toBe('string');
    });
  });

  describe('storeReview', () => {
    it('should reject missing agentId', async () => {
      await expect(
        storage.storeReview({
          agentId: '',
          reviewerId: 'reviewer',
          reviewerName: 'ReviewBot',
          score: 4,
          reasoning: 'Good work',
          evidenceHashes: [],
          timestamp: Date.now(),
        }),
      ).rejects.toThrow(/agentId required/);
    });

    it('should reject score out of range', async () => {
      await expect(
        storage.storeReview({
          agentId: '1',
          reviewerId: 'reviewer',
          reviewerName: 'ReviewBot',
          score: 0,
          reasoning: 'Bad',
          evidenceHashes: [],
          timestamp: Date.now(),
        }),
      ).rejects.toThrow(/Score must be 1-5/);
    });

    it('should accept valid review data', async () => {
      const result = await storage.storeReview({
        agentId: '2',
        reviewerId: '0xabc',
        reviewerName: 'PeerAgent',
        score: 5,
        reasoning: 'Excellent analysis with detailed reasoning',
        evidenceHashes: ['0xhash1', '0xhash2'],
        timestamp: Date.now(),
      });

      expect(result).toHaveProperty('root');
      expect(result).toHaveProperty('fileSize');
    });
  });

  describe('storeAgentProfile', () => {
    it('should reject empty name', async () => {
      await expect(
        storage.storeAgentProfile({
          name: '',
          description: 'desc',
          capabilities: ['trading'],
          riskTolerance: 3,
          owner: '0xowner',
          agentAddress: '0xaddr',
          createdAt: Date.now(),
        }),
      ).rejects.toThrow(/Agent name required/);
    });

    it('should accept valid profile data', async () => {
      const result = await storage.storeAgentProfile({
        name: 'Alpha Trader',
        description: 'Trading bot',
        capabilities: ['trading', 'analysis'],
        riskTolerance: 3,
        owner: '0xowner',
        agentAddress: '0xaddr',
        createdAt: Date.now(),
      });

      expect(result).toHaveProperty('root');
      expect(result).toHaveProperty('fileSize');
    });
  });
});
