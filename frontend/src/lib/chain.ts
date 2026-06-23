/**
 * Veridd — 0G Chain Integration
 * Agentic ID (ERC-721) + reputation state on 0G Galileo Testnet
 * 
 * Edge cases handled:
 *   - No wallet installed / SSR guard
 *   - User rejects network switch (code 4001)
 *   - Chain not added (code 4902)
 *   - Transaction timeouts
 *   - Null agent data from chain
 *   - Input validation before sending tx
 */
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ABI = [
  'function createAgent(string name, string description, string metadataURI) returns (uint256)',
  'function getAgent(uint256 agentId) view returns (tuple(string name, string metadataURI, string description, uint256 totalReviews, uint256 totalScore, uint256 createdAt, bool exists))',
  'function getAgentsByOwner(address owner) view returns (uint256[])',
  'function submitReview(uint256 agentId, uint256 score, string actionStorageRoot, string reviewStorageRoot, string summary)',
  'function getReputation(uint256 agentId) view returns (uint256 averageScore, uint256 totalReviews)',
  'function getReviews(uint256 agentId) view returns (tuple(address reviewer, uint256 score, string actionStorageRoot, string reviewStorageRoot, string summary, uint256 timestamp)[])',
  'function getReviewCount(uint256 agentId) view returns (uint256)',
  'function verifyActionProof(uint256 agentId, uint256 reviewIndex, string claimedStorageRoot) view returns (bool)',
  'event AgentCreated(uint256 indexed agentId, string name, address indexed owner, uint256 timestamp)',
  'event ReviewSubmitted(uint256 indexed agentId, uint256 score, address indexed reviewer, string actionRoot, uint256 timestamp)'
];

const ZG_NETWORK = {
  chainId: '0x40DA',
  chainName: '0G Galileo Testnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: ['https://evmrpc-testnet.0g.ai'],
  blockExplorerUrls: ['https://chainscan-galileo.0g.ai']
};

const TX_TIMEOUT = 120_000; // 2 minutes

export class VeriddChain {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private _address: string | null = null;

  constructor(private contractAddress: string) {}

  get address() { return this._address; }

  /** Connect wallet with MetaMask / OKX Wallet */
  async connect(): Promise<string> {
    // SSR guard
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No wallet found. Install MetaMask or OKX Wallet to continue.');
    }

    // Try to switch to 0G Galileo. If it fails, warn but still try to connect.
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ZG_NETWORK.chainId }]
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        // Chain not added yet — try to add it
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ZG_NETWORK]
          });
        } catch (addError: any) {
          console.warn('Could not add network:', addError.message);
          throw new Error('Please add 0G Galileo Testnet to MetaMask manually.\nNetwork: 0G Galileo Testnet\nRPC: https://evmrpc-testnet.0g.ai\nChain ID: 16602\nSymbol: 0G');
        }
      } else if (switchError.code === 4001) {
        console.warn('Network switch rejected, proceeding with current network...');
        // Don't throw — let the user switch manually
      } else {
        // Network may already exist but switch failed — try connecting anyway
        console.warn('Network switch failed, attempting connection on current network:', switchError.message);
      }
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.contract = new ethers.Contract(this.contractAddress, CONTRACT_ABI, this.signer);
      this._address = await this.signer.getAddress();
      return this._address;
    } catch (err: any) {
      if (err.code === 4001) {
        throw new Error('Connection cancelled. Please connect your wallet to continue.');
      }
      throw new Error('Failed to connect: ' + err.message);
    }
  }

  /** Mint an Agentic ID + create agent profile */
  async createAgent(name: string, description: string, metadataURI: string): Promise<bigint> {
    if (!this.contract) throw new Error('Not connected. Connect your wallet first.');
    if (!name.trim()) throw new Error('Agent name is required');
    if (name.length > 64) throw new Error('Agent name too long (max 64 characters)');
    if (description.length > 500) throw new Error('Description too long (max 500 characters)');

    const tx = await this.contract.createAgent(name, description, metadataURI);
    
    // Wait with timeout
    const receipt = await Promise.race([
      tx.wait(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timed out. Check the explorer.')), TX_TIMEOUT)
      )
    ]);

    // Parse the AgentCreated event
    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        if (parsed?.name === 'AgentCreated') {
          return parsed.args.agentId;
        }
      } catch { /* skip unrelated logs */ }
    }
    throw new Error('Agent created but could not read the ID. Check the explorer.');
  }

  /** Get agent details (returns null if doesn't exist) */
  async getAgent(agentId: number | bigint) {
    if (!this.contract) throw new Error('Not connected');
    try {
      const agent = await this.contract.getAgent(agentId);
      if (!agent.exists) return null;
      return agent;
    } catch {
      return null; // Graceful fallback
    }
  }

  /** Get an agent's VERIDD score */
  async getReputation(agentId: number | bigint): Promise<{ average: number; total: number }> {
    if (!this.contract) throw new Error('Not connected');
    try {
      const [avg, total] = await this.contract.getReputation(agentId);
      return { average: Number(avg), total: Number(total) };
    } catch {
      return { average: 0, total: 0 }; // Graceful fallback
    }
  }

  /** Submit a peer review onchain */
  async submitReview(agentId: number | bigint, score: number, actionRoot: string, reviewRoot: string, summary: string) {
    if (!this.contract) throw new Error('Not connected');
    if (!actionRoot || !reviewRoot) throw new Error('Missing storage proofs');
    if (score < 1 || score > 5) throw new Error('Score must be between 1 and 5');

    const tx = await this.contract.submitReview(agentId, score, actionRoot, reviewRoot, summary);
    return Promise.race([
      tx.wait(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Transaction timed out. Check the explorer.')), TX_TIMEOUT)
      )
    ]);
  }

  /** Get all reviews for an agent */
  async getReviews(agentId: number | bigint) {
    if (!this.contract) throw new Error('Not connected');
    try { return await this.contract.getReviews(agentId); }
    catch { return []; }
  }

  /** Get agent IDs owned by current user */
  async getMyAgents(): Promise<bigint[]> {
    if (!this.contract || !this._address) throw new Error('Not connected');
    try { return await this.contract.getAgentsByOwner(this._address); }
    catch { return []; }
  }

  /** Get agent IDs by owner address (alias for the contract call) */
  async getAgentsByOwner(owner: string): Promise<bigint[]> {
    if (!this.contract) throw new Error('Not connected');
    try { return await this.contract.getAgentsByOwner(owner); }
    catch { return []; }
  }
}
