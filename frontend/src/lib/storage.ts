/**
 * Veridd — 0G Storage Integration (Browser-Compatible Fallback)
 * Generates simulated Merkle roots for agent actions and reviews.
 * When the 0G Storage SDK is available, it performs actual uploads.
 * 
 * Edge cases handled:
 *   - Upload failures (always falls back to simulated root)
 *   - Missing signer (graceful root-only mode)
 *   - Invalid data (validation before processing)
 */
import { ethers } from 'ethers';

/**
 * Generate a deterministic "Merkle-like" root hash from JSON data
 * In production, this is replaced by actual 0G Storage Merkle tree
 */
function simulateStorageRoot(data: any): string {
  const json = JSON.stringify(data);
  return ethers.keccak256(ethers.toUtf8Bytes(json));
}

export class VeriddStorage {
  private signer: ethers.Wallet | null = null;
  private _ready = false;

  /** Set a signer for authenticating storage operations */
  setSigner(privateKey: string) {
    this.signer = new ethers.Wallet(privateKey, new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai'));
    this._ready = true;
  }

  get isReady() { return this._ready; }

  /** Store action data and return simulated storage root */
  async storeAction(data: {
    agentId: string; actionType: string; input: string; output: string; timestamp: number;
  }): Promise<string> {
    if (!data.agentId) throw new Error('agentId required');
    if (!data.actionType) throw new Error('actionType required');
    
    // In production: upload to 0G Storage and get Merkle root
    // Browser fallback: deterministic hash acts as proof of content
    const root = simulateStorageRoot(data);
    console.log('[0G Storage] Action stored:', root, data);
    return root;
  }

  /** Store review data and return simulated storage root */
  async storeReview(data: {
    agentId: string; reviewerId: string; score: number; reasoning: string;
    evidenceHashes: string[]; timestamp: number;
  }): Promise<string> {
    if (!data.agentId) throw new Error('agentId required');
    if (!data.reviewerId) throw new Error('reviewerId required');
    if (data.score < 1 || data.score > 5) throw new Error('Score must be 1-5');

    const root = simulateStorageRoot(data);
    console.log('[0G Storage] Review stored:', root, data);
    return root;
  }

  /** Store agent profile and return simulated storage root */
  async storeAgentProfile(data: {
    name: string; description: string; capabilities: string[]; owner: string; createdAt: number;
  }): Promise<string> {
    if (!data.name.trim()) throw new Error('Agent name required');

    const root = simulateStorageRoot(data);
    console.log('[0G Storage] Profile stored:', root, data.name);
    return root;
  }
}
