/**
 * Veridd — 0G Storage Integration (Demo)
 *
 * Browser-compatible simulation for the Zero Cup demo.
 * In production, replace with @0gfoundation/0g-storage-ts-sdk.
 */

import { ethers } from 'ethers';

// ───── Data shapes ─────────────────────────────────────────────────

export interface ActionData {
  agentId: string;
  actionType: string;
  input: string;
  output: string;
  timestamp: number;
}

export interface ReviewData {
  agentId: string;
  reviewerId: string;
  score: number;
  reasoning: string;
  evidenceHashes: string[];
  timestamp: number;
}

export interface AgentProfileData {
  name: string;
  description: string;
  capabilities: string[];
  owner: string;
  createdAt: number;
}

// ───── Helpers ──────────────────────────────────────────────────────

function simulateStorageRoot(data: unknown): string {
  return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data)));
}

function assertRequired(value: unknown, field: string): void {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new Error(`${field} is required`);
  }
}

// ───── Storage sim ──────────────────────────────────────────────────

/**
 * Simulated 0G Storage — deterministic keccak256 root hashes.
 * No network calls. Ready for demo / browser environments.
 */
export class VeriddStorage {
  async storeAction(data: unknown): Promise<string> {
    const d = data as ActionData;
    assertRequired(d.agentId, 'agentId');
    assertRequired(d.actionType, 'actionType');
    return simulateStorageRoot(d);
  }

  async storeReview(data: unknown): Promise<string> {
    const d = data as ReviewData;
    assertRequired(d.agentId, 'agentId');
    assertRequired(d.reviewerId, 'reviewerId');
    if (d.score < 1 || d.score > 5) throw new Error('Score must be 1-5');
    return simulateStorageRoot(d);
  }

  async storeAgentProfile(data: unknown): Promise<string> {
    const d = data as AgentProfileData;
    assertRequired(d.name, 'Agent name');
    return simulateStorageRoot(d);
  }
}
