/**
 * VERID — 0G Storage Integration
 * Stores agent actions and review reasoning with Merkle-verifiable proofs
 * 
 * Edge cases handled:
 *   - Upload failures (network, timeout)
 *   - Missing signer (graceful root-only mode)
 *   - Invalid data (validation before upload)
 */
import { Indexer, ZgFile } from '@0gfoundation/0g-storage-ts-sdk';
import { ethers } from 'ethers';

const STORAGE_INDEXER = 'https://indexer-storage-testnet-turbo.0g.ai';
const RPC_URL = 'https://evmrpc-testnet.0g.ai';

export class VeridStorage {
  private indexer: Indexer;
  private signer: ethers.Wallet | null = null;
  private _ready = false;

  constructor() {
    this.indexer = new Indexer(STORAGE_INDEXER);
  }

  /** Set a signer for actual uploads (without it, only Merkle root is returned) */
  setSigner(privateKey: string) {
    this.signer = new ethers.Wallet(privateKey, new ethers.JsonRpcProvider(RPC_URL));
    this._ready = true;
  }

  get isReady() { return this._ready; }

  /** Upload action data to 0G Storage and return Merkle root */
  async storeAction(data: {
    agentId: string; actionType: string; input: string; output: string; timestamp: number;
  }): Promise<string> {
    if (!data.agentId) throw new Error('agentId required');
    if (!data.actionType) throw new Error('actionType required');

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = await ZgFile.fromBlob(blob, `action-${data.agentId}-${Date.now()}.json`);
    
    const [tree, merkleErr] = await file.merkleTree();
    if (merkleErr) { await file.close(); throw new Error(`Merkle error: ${merkleErr}`); }
    
    const root = tree.rootHash();
    
    if (this.signer) {
      try {
        const [, uploadErr] = await this.indexer.upload(file, RPC_URL, this.signer);
        if (uploadErr) console.warn('Storage upload failed (root still valid):', uploadErr);
      } catch (err) {
        console.warn('Storage upload error (root still valid):', err);
      }
    }

    await file.close();
    return root;
  }

  /** Upload review data to 0G Storage and return Merkle root */
  async storeReview(data: {
    agentId: string; reviewerId: string; score: number; reasoning: string;
    evidenceHashes: string[]; timestamp: number;
  }): Promise<string> {
    if (!data.agentId) throw new Error('agentId required');
    if (!data.reviewerId) throw new Error('reviewerId required');
    if (data.score < 1 || data.score > 5) throw new Error('Score must be 1-5');

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = await ZgFile.fromBlob(blob, `review-${data.agentId}-${Date.now()}.json`);
    
    const [tree, merkleErr] = await file.merkleTree();
    if (merkleErr) { await file.close(); throw new Error(`Merkle error: ${merkleErr}`); }
    
    const root = tree.rootHash();
    
    if (this.signer) {
      try {
        const [, uploadErr] = await this.indexer.upload(file, RPC_URL, this.signer);
        if (uploadErr) console.warn('Storage upload failed (root still valid):', uploadErr);
      } catch (err) {
        console.warn('Storage upload error (root still valid):', err);
      }
    }

    await file.close();
    return root;
  }

  /** Upload agent profile to 0G Storage and return Merkle root */
  async storeAgentProfile(data: {
    name: string; description: string; capabilities: string[]; owner: string; createdAt: number;
  }): Promise<string> {
    if (!data.name.trim()) throw new Error('Agent name required');

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = await ZgFile.fromBlob(blob, `agent-${Date.now()}.json`);
    
    const [tree, merkleErr] = await file.merkleTree();
    if (merkleErr) { await file.close(); throw new Error(`Merkle error: ${merkleErr}`); }
    
    const root = tree.rootHash();
    
    if (this.signer) {
      try {
        const [, uploadErr] = await this.indexer.upload(file, RPC_URL, this.signer);
        if (uploadErr) console.warn('Storage upload failed:', uploadErr);
      } catch (err) {
        console.warn('Storage upload error:', err);
      }
    }

    await file.close();
    return root;
  }
}
