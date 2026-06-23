/**
 * VERIDD — Peer Review Agent (runs on 0G Compute)
 * Scores agent actions and returns a VERIDD score 1-5
 *
 * Usage: npx ts-node scripts/review-agent.ts --agent-id=1
 */
import { Router } from '@0gfoundation/0g-compute-ts-sdk';

interface ReviewInput {
  agentId: string;
  agentName: string;
  actionType: string;
  input: string;
  output: string;
}

interface ReviewOutput {
  score: number;
  reasoning: string;
  confidence: number;
  flags: string[];
  reviewedAt: number;
}

const PROMPT = `You are a VERIDD reviewer scoring AI agent actions 1-5.
Score based on: correctness, quality, safety, efficiency.
1=Harmful 2=Below 3=Met expectations 4=Above 5=Exceptional
Respond JSON: {score, reasoning, confidence, flags}`;

async function run(input: ReviewInput): Promise<ReviewOutput> {
  if (process.env.ZG_COMPUTE_API_KEY) {
    const router = new Router({ apiKey: process.env.ZG_COMPUTE_API_KEY });
    const res = await router.chat({
      model: 'llama-3-70b',
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: JSON.stringify(input) },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    const r = JSON.parse(res.choices[0].message.content);
    return {
      score: Math.max(1, Math.min(5, Number(r.score) || 3)),
      reasoning: r.reasoning || '',
      confidence: r.confidence || 0.7,
      flags: r.flags || [],
      reviewedAt: Date.now(),
    };
  }

  // Simulated fallback (no API key)
  const err = /error|fail/i.test(input.output);
  return {
    score: err ? 1 : 4,
    reasoning: err ? 'Action errors detected' : 'Well-structured analysis',
    confidence: 0.75,
    flags: err ? ['Errors detected'] : [],
    reviewedAt: Date.now(),
  };
}

const agentId = process.argv.find((a) => a.startsWith('--agent-id='))?.split('=')[1];
if (!agentId) {
  console.error('Usage: --agent-id=N');
  process.exit(1);
}

run({
  agentId,
  agentName: `Agent #${agentId}`,
  actionType: 'general',
  input: 'N/A',
  output: 'Processing...',
}).then((r) => console.log(JSON.stringify(r, null, 2)));
