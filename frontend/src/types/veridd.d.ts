interface VeriddChain {
  connect(): Promise<string>;
  createAgent(name: string, description: string, metadataURI: string): Promise<bigint>;
  getAgent(agentId: number | bigint): Promise<any>;
  getAgentsByOwner(owner: string): Promise<bigint[]>;
  getReputation(agentId: number | bigint): Promise<{ average: number; total: number }>;
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
