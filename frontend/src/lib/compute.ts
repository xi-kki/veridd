/**
 * Veridd — 0G Compute Integration
 *
 * Browser-compatible AI inference for peer review scoring.
 * Two modes:
 *   Router mode — Calls 0G Compute Router API (needs API key)
 *   Simulation mode — Deterministic scoring fallback for demo
 */

export interface ReviewResult {
  score: number;
  reasoning: string;
  confidence: number;
  flags?: string[];
}

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
   * Attempt inference via 0G Compute — uses the Router API if an API key is set.
   * Returns null if no API key is configured, falling back to simulation.
   */
  private async tryBrokerReview(action: {
    agentName: string;
    actionType: string;
    input: string;
    output: string;
  }): Promise<ReviewResult | null> {
    if (!this.apiKey) return null;
    try {
      const response = await fetch('https://compute.0g.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3-70b',
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
