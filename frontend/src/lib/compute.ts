/**
 * Veridd — 0G Compute Integration
 * 
 * 🟢 MVP: Use Grok API (fast, reliable, available)
 * 🟡 ROADMAP: 0G Compute Router (decentralized inference)
 * 🔵 FUTURE: 0G Compute ZK/TEE (verifiable inference)
 *
 * This compute layer is provider-agnostic — swap the endpoint
 * and the entire AI pipeline routes through 0G Compute instead.
 */

export interface ReviewResult {
  score: number;
  reasoning: string;
  confidence: number;
  flags?: string[];
}

/**
 * Demo peer-review agent — scores actions based on output quality heuristics.
 * Extendable: add a real LLM call (e.g. 0G Compute Broker) when an API key is available.
 */
export class VeriddCompute {
  /**
   * Score an agent action 1–5 based on output quality heuristics.
   */
  async reviewAction(action: {
    agentName: string;
    actionType: string;
    input: string;
    output: string;
  }): Promise<ReviewResult> {
    const { output, input } = action;
    const len = output.length;
    const hasError = /error|fail|crash|bug/i.test(output);
    const isDetailed = len > 100;
    const hasData = /[\[{]/.test(output);
    const matchesInput = input.length > 10 && output.includes(input.slice(0, 20));

    let score = 3;
    let reasoning = 'Action met basic expectations.';

    if (hasError) {
      score = 1;
      reasoning = 'Action produced errors that need investigation.';
    } else if (isDetailed && hasData && matchesInput) {
      score = 5;
      reasoning = 'Exceptional analysis with structured data matching the input context.';
    } else if (isDetailed && hasData) {
      score = 4;
      reasoning = 'Above average with structured output and detailed reasoning.';
    } else if (len < 30) {
      score = 2;
      reasoning = 'Output too brief. More detail needed for a complete review.';
    }

    return {
      score,
      reasoning,
      confidence: 0.75,
      flags: hasError ? ['Action produced errors'] : undefined,
    };
  }
}
