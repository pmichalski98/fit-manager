import OpenAI from "openai";
import type {
  ResponseFunctionToolCall,
  ResponseInputItem,
  ResponseOutputItem,
  ResponseOutputMessage,
  ResponseReasoningItem,
} from "openai/resources/responses/responses";
import { env } from "@/env";

// ─── Singleton Client ──────────────────────────────────────────────────────

let _openai: OpenAI | null = null;
export function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return _openai;
}

// ─── Response Helpers ──────────────────────────────────────────────────────

const INPUT_PASSTHROUGH_TYPES = new Set(["message", "function_call", "reasoning"]);

/** Filter response output items to only those that can be fed back as input items. */
export function toInputItems(output: ResponseOutputItem[]): ResponseInputItem[] {
  return output.filter(
    (item): item is ResponseOutputMessage | ResponseFunctionToolCall | ResponseReasoningItem =>
      INPUT_PASSTHROUGH_TYPES.has(item.type),
  );
}

/** Extract function_call items from a response output. */
export function extractToolCalls(output: ResponseOutputItem[]): ResponseFunctionToolCall[] {
  return output.filter(
    (item): item is ResponseFunctionToolCall => item.type === "function_call",
  );
}

/** Extract the first text content from a response output. */
export function extractText(output: ResponseOutputItem[]): string | null {
  for (const item of output) {
    if (item.type === "message") {
      for (const content of item.content) {
        if (content.type === "output_text") return content.text;
      }
    }
  }
  return null;
}
