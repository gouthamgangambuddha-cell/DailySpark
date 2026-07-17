import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import { AppError } from "./AppError";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw AppError.badRequest("AI features are not configured on this server");
  }
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

/** Sends a single-turn prompt to Claude and returns the plain-text response. */
export async function askClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const anthropic = getClient();

  const message = await anthropic.messages.create({
    model: env.AI_MODEL,
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI response contained no text content");
  }
  return textBlock.text;
}

/** Same as askClaude, but instructs Claude to return raw JSON and parses it. */
export async function askClaudeForJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const raw = await askClaude(
    `${systemPrompt}\n\nRespond with ONLY valid JSON. No markdown fences, no preamble, no explanation.`,
    userPrompt
  );
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("AI response was not valid JSON");
  }
}
