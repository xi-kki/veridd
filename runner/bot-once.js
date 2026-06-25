#!/usr/bin/env node
/**
 * VERIDD Agent Bot — Single Cycle (for GitHub Actions / cron)
 *
 * Runs ONE bot cycle: create/get agent → submit action → review actions.
 * Designed for scheduled runs (cron every 30 min) where the infinite loop
 * is handled by the scheduler, not the script.
 *
 * Environment variables (same as agent-bot.js):
 *   PRIVATE_KEY  - Wallet private key (required)
 *   GROQ_KEY     - Groq API key for AI generation
 *   NAME         - Bot agent name
 *   CONTRACT     - VeriddReputation contract address
 *   RPC_URL      - 0G RPC endpoint
 */

const { ethers } = require('ethers');
const https = require('https');

// ───── Config ───────────────────────────────────────────────────────

const RPC = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
const CONTRACT = process.env.CONTRACT || '0x70c88e1A57917409fdA2935F16A38deb4aEF5Bfa';
const STORAGE_INDEXER = 'https://indexer-storage-testnet-turbo.0g.ai';

const CONTRACT_ABI = [
  'function createAgent(string name, string description, string metadataURI) returns (uint256)',
  'function submitAction(string actionType, string actionStorageRoot) returns (uint256)',
  'function submitReview(uint256 agentId, uint256 score, string actionRoot, string reviewRoot, string summary)',
  'function getAgent(uint256 agentId) view returns (tuple(string name, string metadataURI, string description, uint256 totalReviews, uint256 totalScore, uint256 createdAt, bool exists))',
  'function getAction(uint256 actionId) view returns (tuple(address agent, string actionStorageRoot, string actionType, uint256 timestamp, bool reviewed))',
  'function getReputation(uint256 agentId) view returns (uint256 averageScore, uint256 totalReviews)',
  'function getAgentsByOwner(address owner) view returns (uint256[])',
  'function nextActionId() view returns (uint256)',
  'function nextAgentId() view returns (uint256)',
  'function agents(uint256) view returns (string name, string metadataURI, string description, uint256 totalReviews, uint256 totalScore, uint256 createdAt, bool exists)',
  'event ActionSubmitted(uint256 indexed agentId, uint256 indexed actionId, string actionType, string storageRoot, address indexed agent, uint256 timestamp)',
  'event AgentCreated(uint256 indexed agentId, string name, address indexed owner, uint256 timestamp)',
];

// ───── Logging ──────────────────────────────────────────────────────

function log(emoji, msg) {
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[${time}] ${emoji} ${msg}`);
}

// ───── Groq AI ──────────────────────────────────────────────────────

async function agentThink(prompt) {
  const apiKey = process.env.GROQ_KEY;
  if (!apiKey) {
    return fallbackResponse(prompt);
  }

  const data = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 500,
    messages: [
      {
        role: 'system',
        content: 'You are an AI agent on the VERIDD reputation network. Generate realistic, data-rich responses for on-chain agent actions. Be specific with numbers, trends, and analysis.',
      },
      { role: 'user', content: prompt },
    ],
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.choices && json.choices[0]?.message?.content) {
              resolve(json.choices[0].message.content.trim());
            } else {
              console.warn(`[Groq] API error: ${JSON.stringify(json).slice(0, 200)}`);
              resolve(fallbackResponse(prompt));
            }
          } catch (e) {
            console.warn(`[Groq] Parse error, using fallback: ${body.slice(0, 100)}`);
            resolve(fallbackResponse(prompt));
          }
        });
      },
    );
    req.on('error', (err) => {
      console.warn(`[Groq] Network error, using fallback: ${err.message}`);
      resolve(fallbackResponse(prompt));
    });
    req.write(data);
    req.end();
  });
}

function fallbackResponse(prompt) {
  const types = ['market_analysis', 'data_analysis', 'risk_assessment', 'portfolio_optimization'];
  const type = types[Math.floor(Math.random() * types.length)];
  return JSON.stringify({
    actionType: type,
    output: `Standard ${type} completed. Cycle ${Math.floor(Date.now() / 30000)}. No anomalies detected.`,
  });
}

// ───── 0G Storage ──────────────────────────────────────────────────

function storeOn0G(data, fileName) {
  const json = JSON.stringify(data, null, 2);
  return new Promise((resolve) => {
    const boundary = `----FormBoundary${Math.random().toString(36).slice(2)}`;
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="' + fileName + '"',
      'Content-Type: application/json',
      '',
      json,
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const req = https.request(
      {
        hostname: 'indexer-storage-testnet-turbo.0g.ai',
        path: '/api/v1/file',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let responseBody = '';
        res.on('data', (chunk) => (responseBody += chunk));
        res.on('end', () => {
          try {
            const result = JSON.parse(responseBody);
            if (result.root) {
              console.log(`  ✅ 0G Storage: real Merkle root → ${result.root.slice(0, 16)}...`);
              resolve({ root: result.root, real: true, data });
            } else {
              resolve({ root: ethers.keccak256(ethers.toUtf8Bytes(json)), real: false, data });
            }
          } catch {
            resolve({ root: ethers.keccak256(ethers.toUtf8Bytes(json)), real: false, data });
          }
        });
      },
    );
    req.on('error', () => {
      resolve({ root: ethers.keccak256(ethers.toUtf8Bytes(json)), real: false, data });
    });
    req.write(body);
    req.end();
  });
}

// ───── Main (single cycle) ──────────────────────────────────────────

async function main() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) {
    console.error('❌ Set PRIVATE_KEY environment variable');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(pk, provider);
  const contract = new ethers.Contract(CONTRACT, CONTRACT_ABI, wallet);

  const balance = await provider.getBalance(wallet.address);
  log('🚀', 'VERIDD Bot — Single Cycle');
  log('👤', `Name: ${process.env.NAME || 'Unnamed'}`);
  log('🔑', `Wallet: ${wallet.address}`);
  log('💰', `Balance: ${ethers.formatEther(balance)} 0G`);

  if (balance === 0n) {
    log('❌', 'Zero balance! Fund wallet from faucet.0g.ai');
    process.exit(1);
  }

  // Get or create agent
  let agentId;
  try {
    const ids = await contract.getAgentsByOwner(wallet.address);
    if (ids.length > 0) {
      agentId = Number(ids[0]);
      const agent = await contract.getAgent(agentId);
      log('🤖', `Reusing agent #${agentId}: ${agent.name}`);
    }
  } catch {}

  if (!agentId) {
    const name = process.env.NAME || `Bot-${Math.random().toString(36).slice(2, 6)}`;
    log('🆕', `Creating agent: ${name}...`);

    let description = `${name} — AI agent for on-chain reputation.`;
    try {
      const groqDesc = await agentThink(`Write a one-sentence description for an AI agent named "${name}". Keep it under 120 chars.`);
      description = groqDesc.replace(/["']/g, '').slice(0, 120);
    } catch {}

    const profileData = { name, description, capabilities: ['market_analysis', 'data_analysis'], owner: wallet.address, createdAt: Date.now() };
    const storageResult = await storeOn0G(profileData, `profile_${name.toLowerCase().replace(/\s+/g, '_')}.json`);
    const metadataURI = storageResult.real ? `0g://${storageResult.root}` : `veridd://agents/${name.toLowerCase().replace(/\s+/g, '-')}`;

    const tx = await contract.createAgent(name, description, metadataURI, {
      gasLimit: 300000
    });
    const receipt = await tx.wait();
    for (const logEntry of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(logEntry);
        if (parsed?.name === 'AgentCreated') {
          agentId = Number(parsed.args.agentId);
          log('✅', `Agent #${agentId} created | tx: ${tx.hash.slice(0, 18)}...`);
          break;
        }
      } catch {}
    }
  }

  if (!agentId) {
    log('❌', 'Could not create/find agent');
    process.exit(1);
  }

  // Submit action
  const actionTypes = ['market_analysis', 'trade_execution', 'data_analysis', 'risk_assessment'];
  const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
  log('🤖', `Agent #${agentId} submitting ${actionType}...`);

  let actionOutput = '';
  try {
    const groqResult = await agentThink(`You are an AI agent performing "${actionType}". Generate a realistic result with specific data. Respond with JSON: {"output": "your detailed analysis"}`);
    const parsed = JSON.parse(groqResult);
    actionOutput = parsed.output || `${actionType} completed.`;
  } catch {
    actionOutput = `${actionType} completed. Cycle ${Math.floor(Date.now() / 30000)}. No anomalies.`;
  }

  const actionData = { agentId: String(agentId), agentWallet: wallet.address, actionType, output: actionOutput, model: 'llama-3.3-70b-versatile', infrastructure: '0G-powered agent', timestamp: Date.now() };
  const actionStorage = await storeOn0G(actionData, `action_${agentId}_${Date.now()}.json`);

  if (!actionStorage || !actionStorage.root) {
    log('❌', 'Storage root missing, aborting submit');
    return;
  }

  log('⛓️', `Submitting to 0G Chain (root: ${actionStorage.root.slice(0, 16)}...)`);
  const tx = await contract.submitAction(actionType, actionStorage.root, {
    gasLimit: 300000
  });
  log('⏳', `Tx sent: ${tx.hash.slice(0, 18)}..., waiting for receipt...`);
  const receipt = await tx.wait();
  log('✅', `Action submitted | tx: ${tx.hash.slice(0, 18)}... | gas: ${receipt.gasUsed.toString()}`);

  // Review actions from other agents
  try {
    const nextId = await contract.nextActionId();
    for (let aid = 0; aid < Number(nextId); aid++) {
      const actionData2 = await contract.getAction(aid);
      if (!actionData2 || actionData2.reviewed) continue;

      log('👁️', `Reviewing action #${aid}: ${actionData2.actionType}`);
      let score = 3;
      let reasoning = 'Auto-reviewed by peer agent.';

      try {
        const groqResult = await agentThink(`Score this AI agent action 1-5.\nType: ${actionData2.actionType}\nProof: ${(actionData2.actionStorageRoot || '').slice(0, 20)}...\nRespond JSON: {"score": <1-5>, "reasoning": "..."}`);
        const parsed = JSON.parse(groqResult);
        score = Math.max(1, Math.min(5, parsed.score || 3));
        reasoning = parsed.reasoning || reasoning;
      } catch {}

      const reviewData = { actionId: aid, score, reasoning, model: 'llama3-70b-8192', infrastructure: '0G-powered agent', timestamp: Date.now() };
      const reviewStorage = await storeOn0G(reviewData, `review_${aid}_${Date.now()}.json`);

      await contract.submitReview(agentId, score, actionData2.actionStorageRoot, reviewStorage.root, reasoning.slice(0, 100), {
        gasLimit: 300000
      });
      log('✅', `Review #${aid}: ${score}/5`);
    }
  } catch (err) {
    log('⚠️', `Review scan: ${err.message.slice(0, 80)}`);
  }

  log('✅', 'Cycle complete');
}

main().catch((err) => {
  console.error('💥 Fatal:', err);
  process.exit(1);
});
