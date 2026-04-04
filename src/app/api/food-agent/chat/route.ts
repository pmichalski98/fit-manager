import { headers } from "next/headers";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import { auth } from "@/lib/auth";
import { runFoodAgent } from "@/modules/food-agent/service";
import type { AgentChatRequest, AgentStreamEvent } from "@/modules/food-agent/types";

/** Allow valid conversation items through from the client (text messages, tool calls, tool results). */
function sanitizeHistory(raw: unknown): ResponseInputItem[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter((item): item is ResponseInputItem => {
    if (typeof item !== "object" || item === null) return false;
    const obj = item as Record<string, unknown>;

    // User/assistant text messages
    if (
      (obj.role === "user" || obj.role === "assistant") &&
      typeof obj.content === "string"
    )
      return true;

    // Assistant output items (contains tool calls)
    if (obj.type === "function_call" && typeof obj.call_id === "string")
      return true;

    // Tool call results
    if (obj.type === "function_call_output" && typeof obj.call_id === "string")
      return true;

    return false;
  });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json()) as AgentChatRequest;
  if (!body.message || typeof body.message !== "string") {
    return new Response("Missing message", { status: 400 });
  }

  const history = sanitizeHistory(body.history);

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  let streamClosed = false;

  const sendEvent = async (event: AgentStreamEvent) => {
    if (streamClosed) return;
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      streamClosed = true;
    }
  };

  // Run agent in background, streaming events as they happen
  void (async () => {
    try {
      const result = await runFoodAgent({
        message: body.message,
        history,
        userId,
        callbacks: {
          onThinking: () => void sendEvent({ type: "thinking" }),
          onToolCall: (name, callId) =>
            void sendEvent({ type: "tool_call", name, callId }),
          onToolResult: (name, callId, success) =>
            void sendEvent({ type: "tool_result", name, callId, success }),
        },
      });

      await sendEvent({ type: "text", content: result.response });
      await sendEvent({ type: "done", history: result.history });
    } catch (error) {
      console.error("[food-agent] Agent error:", error);
      const message = error instanceof Error ? error.message : "Agent error";
      await sendEvent({ type: "text", content: `Błąd: ${message}` });
      await sendEvent({ type: "done", history });
    } finally {
      if (!streamClosed) {
        try {
          await writer.close();
        } catch {
          // Client already disconnected
        }
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
