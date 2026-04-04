import type { ResponseInputItem } from "openai/resources/responses/responses";

/** Simplified message type for client ↔ API communication */
export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

/** SSE events streamed from the API route to the client */
export type AgentStreamEvent =
  | { type: "thinking" }
  | { type: "tool_call"; name: string; callId: string }
  | { type: "tool_result"; name: string; callId: string; success: boolean }
  | { type: "text"; content: string }
  | { type: "done"; history: ResponseInputItem[] };

/** Request body for POST /api/food-agent/chat */
export type AgentChatRequest = {
  message: string;
  history: ResponseInputItem[];
};

/** Tool names that mutate data — used to decide whether to refresh the UI after agent completes. */
export const MUTATING_TOOLS = new Set(["add_meal_entry", "create_product", "delete_meal_entry"]);
