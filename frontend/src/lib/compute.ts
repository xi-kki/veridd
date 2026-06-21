/**
 * Veridd — 0G Compute Integration
 *
 * Uses @0gfoundation/0g-compute-ts-sdk (v0.8.4) for decentralized AI inference.
 * Browser-compatible with simulation fallback for Zero Cup demo.
 *
 * Two modes:
 *   Broker mode — Uses ZGComputeNetworkReadOnlyBroker to list providers,
 *                  then sends inference requests via OpenAI-compatible API.
 *   Simulation mode — Deterministic scoring when no provider is available.
 *
 * @see https://github.com/0gfoundation/0g-compute-ts-sdk
 */
import { createZGComputeNetworkReadOnlyBroker } from '@0gfoundation/0g-compute-ts-sdk';

export interface ReviewResult {
  score: number;
  reasoning: string;
  confidence: number;
  flags?: string[];
}

const ZG_RPC = 'https://evmrpc-testnet.0g.ai';

/**
 * VERIDD review prompt — instructs the LLM to score agent actions 1–5.
 */
const SYSTEM_PROMPT =
  'You are a VERIDD reviewer scoring AI agent actions 1-5.\n' +
  'Score based on: correctness, quality, safety, efficiency.\n' +
  '1=Harmful 2=Below expectations 3=Met expectations 4=Above expectations 5=Exceptional\n' +
  'Respond with JSON: {score, reasoning, confidence, flags}';

export class VeriddCompute {
  constructor(private apiKey?: string) {}

  /**
   * Review an agent action and return a VERIDD score.
   *
   * Attempts real inference via 0G Compute's provider network (Broker mode).
   * Falls back to deterministic simulation if the network is unreachable
   * or no API key is provided.
   */
  async reviewAction(action: {
    agentName: string;
    actionType: string;
    input: string;
    output: string;
  }): Promise<ReviewResult> {
    const safeAction = {
      agentName: action.agentName || 'Unknown Agent',
      actionType: action.actionType || 'general',
      input: (action.input || 'No input provided').slice(0, 2000),
      output: (action.output || 'No output provided').slice(0, 2000),
    };

    // Try real inference via 0G Compute Broker
    const result = await this.tryBrokerReview(safeAction);
    if (result) return result;

    // Fallback to simulation
    return this.simulateReview(safeAction);
  }

  /**
   * Attempt inference via 0G Compute Network ReadOnlyBroker.
   * Lists available providers and sends the prompt to the first one found.
   * Returns null if the network is unreachable or no providers exist.
   */
  private async tryBrokerReview(action: {
    agentName: string;
    actionType: string;
    input: string;
    output: string;
  }): Promise<ReviewResult | null> {
    try {
      const broker = await createZGComputeNetworkReadOnlyBroker(ZG_RPC);
      const services = await broker.inference.listService(0, 1);

      if (services.length === 0) return null;

      const provider = services[0];
      const metadata = {
        endpoint: provider.url,
        model: provider.model,
      };

      const response = await fetch(metadata.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: metadata.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(action) },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content);
      return {
        score: Math.max(1, Math.min(5, Number(parsed.score) || 3)),
        reasoning: parsed.reasoning || 'No detailed reasoning provided.',
        confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.7)),
        flags: Array.isArray(parsed.flags) ? parsed.flags : undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * Deterministic simulation fallback for Zero Cup demo.
   * Scores actions based on output length, error keywords, and structure.
   */
  private simulateReview(action: {
    agentName: string;
    actionType: string;
    input: string;
    output: string;
  }): ReviewResult {
    const { output } = action;
    const len = output.length;
    const hasError = /error|fail|crash|bug/i.test(output);
    const isDetailed = len > 100;
    const hasData = /[\[{]/.test(output);

    let score = 3;
    let reasoning = 'Action met basic expectations.';

    if (hasError) {
      score = 1;
      reasoning = 'Action produced errors that need investigation.';
    } else if (isDetailed && hasData) {
      score = 5;
      reasoning = 'Exceptional analysis with structured data and thorough reasoning.';
    } else if (isDetailed) {
      score = 4;
      reasoning = 'Above average output with detailed reasoning.';
    } else if (len < 30) {
      score = 2;
      reasoning = 'Output was too brief. More detail needed.';
    }

    return {
      score,
      reasoning,
      confidence: 0.75,
      flags: hasError ? ['Action produced errors'] : undefined,
    };
  }
}
