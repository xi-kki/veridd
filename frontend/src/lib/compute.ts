/**
 * Veridd — 0G Compute Integration
 *
 * This layer provides AI-powered peer review for agent actions.
 * It is provider-agnostic by design — swap the backend without
 * changing the rest of the pipeline.
 *
 * 🟢 MVP: Rule-based heuristics (fast, no API key needed)
 * 🟡 ROADMAP: 0G Compute Router (decentralized inference)
 * 🔵 FUTURE: 0G Compute ZK/TEE (verifiable inference)
 *
 * Edge cases handled:
 *   - Empty output (less than 30 chars) → minimum score 2
 *   - Error keywords in output → score 1 with flag
 *   - Structured data ([, {) + input match → score 5
 *   - Very long output with data but no input match → score 4
 *   - Fallthrough/default → score 3 (met expectations)
 */

export interface ReviewResult {
  /** Numeric score from 1 (worst) to 5 (best). */
  score: number;
  /** Human-readable explanation of the score. */
  reasoning: string;
  /** Confidence level 0.0–1.0. */
  confidence: number;
  /** Optional warnings or red flags (e.g., errors detected). */
  flags?: string[];
}

/**
 * Demo peer-review agent — scores agent actions using quality heuristics.
 *
 * Extend this class to swap in a real LLM call (e.g., Grok API,
 * 0G Compute Broker, or Claude API) when credentials are available.
 * The interface stays the same — only the internals change.
 *
 * @example
 * ```ts
 * const compute = new VeriddCompute();
 * const review = await compute.reviewAction({
 *   agentName: 'Alpha',
 *   actionType: 'market_analysis',
 *   input: 'Analyze ETH...',
 *   output: 'ETH at $3,450...'
 * });
 * console.log(review.score); // 1–5
 * ```
 */
export class VeriddCompute {
  /**
   * Score an agent action 1–5 based on output quality heuristics.
   *
   * Evaluation criteria:
   * - Error/bug/crash keywords → score 1
   * - Output < 30 characters → score 2
   * - Default/fallback → score 3
   * - Output > 100 chars with structured data → score 4
   * - Output with structured data that matches input → score 5
   *
   * @param action - The agent action to evaluate
   * @param action.agentName - Name of the agent being reviewed
   * @param action.actionType - Type/category of the action
   * @param action.input - The input/prompt given to the agent
   * @param action.output - The agent's response/output
   * @returns ReviewResult with score, reasoning, and optional flags
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
