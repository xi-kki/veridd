/**
 * VERID — 0G Compute Integration
 * Peer review agents that analyze actions and assign VERID scores
 * 
 * Edge cases handled:
 *   - API key missing (falls back to simulation)
 *   - API errors (network, rate limit)
 *   - Malformed responses
 *   - Extreme input lengths
 *   - Empty outputs
 */
export interface ReviewResult {
  score: number;
  reasoning: string;
  confidence: number;
  flags?: string[];
}

const COMPUTE_API = 'https://compute.0g.ai/v1';

const SYSTEM_PROMPT = `You are a VERID reviewer scoring AI agent actions 1-5.
Score based on: correctness, quality, safety, efficiency.
1=Harmful 2=Below expectations 3=Met expectations 4=Above expectations 5=Exceptional
Respond with JSON: {score, reasoning, confidence, flags}`;

export class VeridCompute {
  constructor(private apiKey?: string) {}

  /** Review an agent action and return a score */
  async reviewAction(action: {
    agentName: string; actionType: string; input: string; output: string;
  }): Promise<ReviewResult> {
    if (!action.agentName) action.agentName = 'Unknown Agent';
    if (!action.actionType) action.actionType = 'general';
    if (!action.input) action.input = 'No input provided';
    if (!action.output) action.output = 'No output provided';

    // Truncate extreme inputs to prevent token overflow
    const safeAction = {
      ...action,
      input: action.input.slice(0, 2000),
      output: action.output.slice(0, 2000)
    };

    if (this.apiKey) {
      try {
        return await this.reviewViaRouter(safeAction);
      } catch (err) {
        console.warn('0G Compute API error, falling back to simulation:', err);
        return this.simulateReview(safeAction);
      }
    }
    return this.simulateReview(safeAction);
  }

  private async reviewViaRouter(action: any): Promise<ReviewResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(`${COMPUTE_API}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3-70b',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: JSON.stringify(action) }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from compute API');

      const r = JSON.parse(content);
      return {
        score: Math.max(1, Math.min(5, Number(r.score) || 3)),
        reasoning: r.reasoning || 'No detailed reasoning provided.',
        confidence: Math.min(1, Math.max(0, Number(r.confidence) || 0.7)),
        flags: Array.isArray(r.flags) ? r.flags : undefined
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private simulateReview(action: any): ReviewResult {
    const len = action.output.length;
    const hasError = /error|fail|crash|bug/i.test(action.output);
    const isDetailed = len > 100;
    const hasData = /[\[{]/.test(action.output);

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
      flags: hasError ? ['Action produced errors'] : undefined
    };
  }
}
