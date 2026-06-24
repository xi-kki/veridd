/**
 * VERIDD — Type Declarations
 *
 * Shared interfaces for the VERIDD reputation system.
 */

/** Agent chain data interface (partial — full struct from contract). */
interface AgentData {
  name: string;
  metadataURI: string;
  description: string;
  totalReviews: bigint;
  totalScore: bigint;
  createdAt: bigint;
  exists: boolean;
}

/** Reputation summary for an agent. */
interface ReputationData {
  average: number;
  total: number;
}

/** Core chain interface — used across components and lib. */
interface VeriddChain {
  connect(): Promise<string>;
  createAgent(name: string, description: string, metadataURI: string): Promise<bigint>;
  getAgent(agentId: number | bigint): Promise<AgentData | null>;
  getAgentsByOwner(owner: string): Promise<bigint[]>;
  getReputation(agentId: number | bigint): Promise<ReputationData>;
  submitReview(
    agentId: number | bigint,
    score: number,
    actionRoot: string,
    reviewRoot: string,
    summary: string,
  ): Promise<any>;
  getReviews(agentId: number | bigint): Promise<any[]>;
  getMyAgents(): Promise<bigint[]>;
  readonly address: string | null;
}

/** Global ethereum provider injected by wallets (MetaMask, OKX). */
interface Window {
  ethereum?: import('ethers').Eip1193Provider & {
    isMetaMask?: boolean;
    isOKXWallet?: boolean;
    selectedAddress?: string;
  };
}
