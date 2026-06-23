/**
 * Veridd — 0G Storage Integration
 *
 * Uploads real files to the 0G Storage Indexer and returns
 * verifiable Merkle roots for on-chain submission.
 *
 * Falls back to simulation only if the Indexer is unreachable
 * (e.g. offline demo environment).
 */

const INDEXER_URL = 'https://indexer-storage-testnet-turbo.0g.ai';

export interface StorageResult {
  root: string;
  fileSize: number;
  real: boolean; // true = Indexer upload, false = simulated
}

/**
 * Upload a JSON object to 0G Storage via the Indexer API.
 * Returns a real Merkle root if the Indexer responds.
 */
async function uploadToIndexer(data: unknown, fileName: string): Promise<StorageResult> {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const file = new File([blob], fileName, { type: 'application/json' });

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${INDEXER_URL}/api/v1/file`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`[0G Storage] Indexer returned ${res.status}: ${text}`);
      return { root: simulateRoot(data), fileSize: blob.size, real: false };
    }

    const result = await res.json();
    if (result.root) {
      console.log(`[0G Storage] ✓ Uploaded ${fileName} — root: ${result.root.slice(0, 10)}... (${blob.size} bytes)`);
      return { root: result.root, fileSize: blob.size, real: true };
    }

    return { root: simulateRoot(data), fileSize: blob.size, real: false };
  } catch (err) {
    console.warn('[0G Storage] Indexer unreachable, using simulated root:', (err as Error).message);
    return { root: simulateRoot(data), fileSize: blob.size, real: false };
  }
}

function simulateRoot(data: unknown): string {
  // Use a simple hash for demo fallback
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
}

// ───── Public API ─────────────────────────────────────────────────

export class VeriddStorage {
  /**
   * Store an agent action — uploads full data to 0G Storage.
   * Returns the Merkle root for on-chain submission.
   */
  async storeAction(data: {
    agentId: string;
    agentName: string;
    actionType: string;
    input: string;
    output: string;
    modelInfo?: string;
    timestamp: number;
  }): Promise<StorageResult> {
    if (!data.agentId) throw new Error('agentId required');
    return uploadToIndexer(data, `action_${data.agentId}_${Date.now()}.json`);
  }

  /**
   * Store a review — full reasoning + evidence on 0G Storage.
   */
  async storeReview(data: {
    agentId: string;
    reviewerId: string;
    reviewerName: string;
    score: number;
    reasoning: string;
    evidenceHashes: string[];
    timestamp: number;
  }): Promise<StorageResult> {
    if (!data.agentId) throw new Error('agentId required');
    if (data.score < 1 || data.score > 5) throw new Error('Score must be 1-5');
    return uploadToIndexer(data, `review_${data.agentId}_${Date.now()}.json`);
  }

  /**
   * Store an agent profile
   */
  async storeAgentProfile(data: {
    name: string;
    description: string;
    capabilities: string[];
    riskTolerance: number;
    owner: string;
    agentAddress: string;
    createdAt: number;
  }): Promise<StorageResult> {
    if (!data.name.trim()) throw new Error('Agent name required');
    return uploadToIndexer(data, `profile_${data.name.replace(/\s+/g, '_')}.json`);
  }

  /**
   * Retrieve data from 0G Storage by its Merkle root.
   * This proves the data is retrievable — a key 0G feature.
   */
  async retrieveData(root: string): Promise<unknown | null> {
    try {
      const res = await fetch(`${INDEXER_URL}/api/v1/file/${root}`);
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  }
}
