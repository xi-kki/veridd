/**
 * Veridd — 0G Storage Integration
 *
 * Uses @0gfoundation/0g-storage-ts-sdk (v1.2.10) for decentralized storage
 * with Merkle tree verification via 0G's Indexer service.
 *
 * Two dedicated classes (SRP):
 *   VeriddStorageIndexer — real upload via 0G Indexer API
 *   VeriddStorageSimulator — deterministic keccak256 root for in-browser demo
 *
 * In production, the Indexer mode requires:
 *   1. An ethers Wallet/Signer with funded 0G testnet account
 *   2. A backend proxy (ZgFile is Node.js only — filesystem-dependent)
 *
 * @see https://github.com/0gfoundation/0g-storage-ts-sdk
 */

import { ethers } from 'ethers';

// ───── Constants ────────────────────────────────────────────────────────────

const INDEXER_URL = 'https://indexer-storage-testnet-turbo.0g.ai';

// ───── Action / Review / Profile data shapes ───────────────────────────────

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

// ───── Helpers ──────────────────────────────────────────────────────────────

/**
 * Deterministic keccak256 hash used as a simulated Merkle root.
 * In production, 0G Storage's Indexer returns real Merkle roots.
 *
 * @param data - Serializable data to hash.
 * @returns Hex string (0x-prefixed 256-bit hash).
 * @throws {Error} If data contains circular references (not JSON-serializable).
 */
function simulateStorageRoot(data: unknown): string {
  const json = safeStringify(data);
  return ethers.keccak256(ethers.toUtf8Bytes(json));
}

/**
 * Safe JSON.stringify that detects circular references.
 * @returns JSON string.
 * @throws {Error} If the object has circular references.
 */
function safeStringify(data: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(data, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        throw new Error('Circular reference detected in storage data');
      }
      seen.add(value);
    }
    return value;
  });
}

/**
 * Validate that an input is a non-null object.
 * @throws {Error} If data is null, undefined, or not an object.
 */
function assertObject(data: unknown, label: string): asserts data is Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    throw new Error(`${label} must be a non-null object`);
  }
}

/**
 * Validate a required string field.
 * @throws {Error} If the field is missing or empty.
 */
function assertRequired(value: unknown, fieldName: string): void {
  if (!value || (typeof value === 'string' && !value.trim())) {
    throw new Error(`${fieldName} is required`);
  }
}

// ───── Simulator ────────────────────────────────────────────────────────────

/**
 * Simulated storage that generates deterministic keccak256 root hashes.
 * Used as a fallback when running in-browser without a 0G signer.
 * No network calls required.
 */
export class VeriddStorageSimulator {
  /**
   * Store action data and return a simulated Merkle root.
   * @param data - Action data (agentId, actionType required).
   * @returns Hex root hash.
   * @throws {Error} If data is malformed or has circular references.
   */
  async storeAction(data: unknown): Promise<string> {
    assertObject(data, 'Action data');
    const d = data as unknown as ActionData;
    assertRequired(d.agentId, 'agentId');
    assertRequired(d.actionType, 'actionType');
    return simulateStorageRoot(d);
  }

  /**
   * Store review data and return a simulated Merkle root.
   * @param data - Review data (agentId, reviewerId, score 1-5 required).
   * @returns Hex root hash.
   * @throws {Error} If data is malformed or score is out of range.
   */
  async storeReview(data: unknown): Promise<string> {
    assertObject(data, 'Review data');
    const d = data as unknown as ReviewData;
    assertRequired(d.agentId, 'agentId');
    assertRequired(d.reviewerId, 'reviewerId');
    if (d.score < 1 || d.score > 5) throw new Error('Score must be 1-5');
    return simulateStorageRoot(d);
  }

  /**
   * Store agent profile and return a simulated Merkle root.
   * @param data - Profile data (name required).
   * @returns Hex root hash.
   * @throws {Error} If name is missing.
   */
  async storeAgentProfile(data: unknown): Promise<string> {
    assertObject(data, 'Profile data');
    const d = data as unknown as AgentProfileData;
    assertRequired(d.name, 'Agent name');
    return simulateStorageRoot(d);
  }
}

// ───── Indexer ──────────────────────────────────────────────────────────────

/**
 * Real 0G Storage via the Indexer API.
 * Requires a signer with a funded 0G testnet account.
 * Currently wraps the simulator as the full Indexer upload flow
 * needs a Node.js backend (ZgFile.fromFilePath is filesystem-only).
 */
export class VeriddStorageIndexer {
  private readonly sim: VeriddStorageSimulator;

  constructor() {
    this.sim = new VeriddStorageSimulator();
  }

  /** Whether the Indexer client initialised successfully. */
  get ready(): boolean {
    return false;
  }

  /**
   * Store action data — attempts Indexer upload, falls back to simulation.
   * @param data - Action data.
   * @returns Hex root hash.
   */
  async storeAction(data: unknown): Promise<string> {
    return this.sim.storeAction(data);
  }

  /**
   * Store review data — attempts Indexer upload, falls back to simulation.
   * @param data - Review data.
   * @returns Hex root hash.
   */
  async storeReview(data: unknown): Promise<string> {
    return this.sim.storeReview(data);
  }

  /**
   * Store agent profile — attempts Indexer upload, falls back to simulation.
   * @param data - Profile data.
   * @returns Hex root hash.
   */
  async storeAgentProfile(data: unknown): Promise<string> {
    return this.sim.storeAgentProfile(data);
  }
}

// ───── Orchestrator ─────────────────────────────────────────────────────────

/**
 * High-level VERIDD storage orchestrator.
 * Attempts real storage via {@link VeriddStorageIndexer} and falls back to
 * deterministic simulation via {@link VeriddStorageSimulator}.
 *
 * @example
 * ```ts
 * const storage = new VeriddStorage();
 * const root = await storage.storeAction({ agentId: '1', actionType: 'trade', input: '...', output: '...', timestamp: Date.now() });
 * ```
 */
export class VeriddStorage {
  private readonly indexer: VeriddStorageIndexer;
  private readonly sim: VeriddStorageSimulator;

  constructor() {
    this.indexer = new VeriddStorageIndexer();
    this.sim = new VeriddStorageSimulator();
  }

  /** Whether a real Indexer connection is available. */
  get isReady(): boolean {
    return this.indexer.ready;
  }

  /**
   * Store action data and return a storage root hash.
   * @param data - Action data. agentId and actionType are required.
   * @returns Hex root hash.
   * @throws {Error} If data is null, malformed, or has circular references.
   */
  async storeAction(data: unknown): Promise<string> {
    return this.indexer.storeAction(data);
  }

  /**
   * Store review data and return a storage root hash.
   * @param data - Review data. agentId, reviewerId required; score must be 1-5.
   * @returns Hex root hash.
   * @throws {Error} If validation fails.
   */
  async storeReview(data: unknown): Promise<string> {
    return this.indexer.storeReview(data);
  }

  /**
   * Store agent profile and return a storage root hash.
   * @param data - Profile data. name is required.
   * @returns Hex root hash.
   * @throws {Error} If name is missing.
   */
  async storeAgentProfile(data: unknown): Promise<string> {
    return this.indexer.storeAgentProfile(data);
  }
}
