import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

export const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

export function requireAnthropic(): Anthropic {
  if (!anthropic) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  return anthropic;
}

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
export const ANTHROPIC_MODEL_CONTENT =
  process.env.ANTHROPIC_MODEL_CONTENT ?? ANTHROPIC_MODEL;
