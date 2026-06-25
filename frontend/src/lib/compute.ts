/**
 * Veridd — 0G Compute Integration
 *
 * This layer provides AI-powered peer review for agent actions.
 * It is provider-agnostic by design — swap the backend without
 * changing the rest of the pipeline.
 *
 * 🟢 MVP: Rule-based heuristics (fast, no API key needed)
 * 🟡 NOW: Groq API (optional — set VITE_GROQ_KEY in .env)
 * 🟠 ROADMAP: 0G Compute Router (decentralized inference)
 * 🔵 FUTURE: 0G Compute ZK/TEE (verifiable inference)
 *
 * Edge cases handled:
 *   - Empty output (less than 30 chars) → minimum score 2
 *   - Error keywords in output → score 1 with flag
 *   - Structured data ([, {) + input match → score 5
 *   - Very long output with data but no input match → score 4
 *   - Fallthrough/default → score 3 (met expectations)
 *   - Groq API unreachable → falls back to rule-based
 *   - Invalid JSON from Groq → falls back to rule-based
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
 * VERIDD Compute Engine
 *
 * 🟢 Rule-based mode (default) — scores by heuristics, no API key needed.
 * 🟡 Groq API mode (optional) — uses Groq if VITE_GROQ_KEY is set.
 * 🟠 0G Compute Router — planned for fully decentralized inference.
 */
export class VeriddCompute {
  private groqKey: string | undefined;
  private useRules: boolean;

  constructor(groqKey?: string) {
    this.groqKey = groqKey || import.meta.env.VITE_GROQ_KEY;
    this.useRules = !this.groqKey;
  }

  /**
   * Score an agent action 1–5.
   * Uses Groq API if key is available, otherwise falls back to rule-based heuristics.
   */
  async reviewAction(action: {
    agentName: string;
    actionType: string;
    input: string;
    output: string;
  }): Promise<ReviewResult> {
    if (this.groqKey) {
      try {
        return await this.groqReview(action);
      } catch {
        this.useRules = true;
      }
    }
    return this.ruleReview(action);
  }

  /**
   * 🟡 0G Compute (via Groq API — llama3-70b)
   */
  private async groqReview(action: {
    agentName: string;
    actionType: string;
    input: string;
    output: string;
  }): Promise<ReviewResult> {
    const body = JSON.stringify({
      model: 'llama3-70b-8192',
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content:
            'You are a VERIDD peer reviewer. Score the agent action 1-5 and explain. Respond with JSON only.',
        },
        {
          role: 'user',
          content: `Agent "${action.agentName}" performed "${action.actionType}".\nInput: ${action.input}\nOutput: ${action.output}\nScore?`,
        },
      ],
    });

    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.groqKey}`,
      },
      body,
    });

    if (!res.ok) {
      throw new Error(`Groq API: ${res.status}`);
    }

    const json = await res.json();
    const text = json.choices?.[0]?.message?.content;
    if (!text) throw new Error('Groq: empty response');

    const match = text.match(/\{[^{}]*"score"[^{}]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        score: Math.max(1, Math.min(5, parsed.score || 3)),
        reasoning: parsed.reasoning || 'Reviewed via 0G Compute (Groq).',
        confidence: 0.85,
      };
    }

    return {
      score: 3,
      reasoning: text.slice(0, 200),
      confidence: 0.7,
    };
  }

  /**
   * 🟢 Rule-based heuristics (fallback — no API key needed)
   */
  private ruleReview(action: {
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

    return Promise.resolve({
      score,
      reasoning,
      confidence: 0.75,
      flags: hasError ? ['Action produced errors'] : undefined,
    });
  }
}
