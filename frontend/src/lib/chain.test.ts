/**
 * Tests for VeriddChain — 0G Chain Integration
 *
 * Covers:
 *   - Constructor initialization
 *   - Error handling for missing wallet
 *   - Input validation for createAgent
 *   - Input validation for submitReview
 *
 * Note: Full integration tests require a running testnet or Hardhat node.
 * These unit tests focus on validation and error path coverage.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ethers before importing chain module
vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: vi.fn(),
    Contract: vi.fn(),
    JsonRpcProvider: vi.fn(),
  },
}));

// Dynamic import after mocks are set up
const { VeriddChain } = await import('./chain');

describe('VeriddChain', () => {
  let chain: VeriddChain;

  beforeEach(() => {
    chain = new VeriddChain('0x2F00a196a5E9A74C7eaf471AA0D6f9614686DF88');
  });

  describe('constructor', () => {
    it('should store the contract address', () => {
      expect(chain).toBeDefined();
    });
  });

  describe('connect()', () => {
    it('should throw when no wallet is installed', async () => {
      // Clear window.ethereum
      delete (window as any).ethereum;

      await expect(chain.connect()).rejects.toThrow(/No wallet found/);
    });
  });

  describe('input validation', () => {
    describe('createAgent', () => {
      it('should reject empty name', async () => {
        await expect(chain.createAgent('', 'desc', 'uri')).rejects.toThrow(
          /Agent name is required/,
        );
      });

      it('should reject name over 64 characters', async () => {
        const longName = 'a'.repeat(65);
        await expect(chain.createAgent(longName, 'desc', 'uri')).rejects.toThrow(
          /max 64 characters/,
        );
      });

      it('should reject description over 500 characters', async () => {
        const longDesc = 'a'.repeat(501);
        await expect(chain.createAgent('name', longDesc, 'uri')).rejects.toThrow(
          /max 500 characters/,
        );
      });
    });

    describe('submitReview', () => {
      it('should reject score below 1', async () => {
        await expect(
          (chain as any).submitReview(1, 0, 'root', 'root', 'summary'),
        ).rejects.toThrow(/Score must be between 1 and 5/);
      });

      it('should reject score above 5', async () => {
        await expect(
          (chain as any).submitReview(1, 6, 'root', 'root', 'summary'),
        ).rejects.toThrow(/Score must be between 1 and 5/);
      });

      it('should reject empty action root', async () => {
        await expect(
          (chain as any).submitReview(1, 3, '', 'root', 'summary'),
        ).rejects.toThrow(/Missing storage proofs/);
      });
    });
  });
});
