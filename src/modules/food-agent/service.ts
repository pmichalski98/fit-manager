import type { ResponseInputItem } from "openai/resources/responses/responses";
import { getOpenAI, toInputItems, extractToolCalls, extractText } from "@/lib/openai";
import { buildSystemPrompt } from "./prompt";
import { TOOL_DEFINITIONS, executeTool } from "./tools";

// ─── Agent Loop ─────────────────────────────────────────────────────────────

const MAX_STEPS = 15;

export type AgentCallbacks = {
  onThinking?: () => void;
  onToolCall?: (name: string, callId: string) => void;
  onToolResult?: (name: string, callId: string, success: boolean) => void;
};

export async function runFoodAgent(params: {
  message: string;
  history: ResponseInputItem[];
  userId: string;
  callbacks?: AgentCallbacks;
}): Promise<{ response: string; history: ResponseInputItem[] }> {
  const { message, userId, callbacks } = params;
  const client = getOpenAI();
  const today = new Date().toISOString().split("T")[0]!;

  const conversation: ResponseInputItem[] = [
    ...params.history,
    { role: "user", content: message },
  ];

  console.log(`[food-agent] ── New request ──────────────────────────`);
  console.log(`[food-agent] User: "${message}"`);
  console.log(`[food-agent] History length: ${params.history.length} items`);

  for (let step = 1; step <= MAX_STEPS; step++) {
    console.log(`[food-agent] ── Step ${step}/${MAX_STEPS} ──`);
    console.log(`[food-agent] Calling LLM (${conversation.length} messages)...`);

    callbacks?.onThinking?.();
    const t0 = Date.now();

    const response = await client.responses.create({
      model: "gpt-4.1",
      instructions: buildSystemPrompt(today),
      tools: TOOL_DEFINITIONS,
      input: conversation,
    });

    const elapsed = Date.now() - t0;
    console.log(`[food-agent] LLM responded in ${elapsed}ms`);

    const toolCalls = extractToolCalls(response.output);

    // No tool calls — model produced a final text response
    if (toolCalls.length === 0) {
      const text = extractText(response.output) ?? "Nie udało mi się przetworzyć zapytania.";
      conversation.push(...toInputItems(response.output));

      console.log(`[food-agent] ── Done (${step} steps) ──`);
      console.log(`[food-agent] Response: "${text.slice(0, 200)}${text.length > 200 ? "..." : ""}"`);

      return { response: text, history: conversation };
    }

    console.log(`[food-agent] Tool calls: ${toolCalls.map((c) => c.name).join(", ")}`);

    // Append model output (tool calls) to conversation
    conversation.push(...toInputItems(response.output));

    // Execute all tool calls in parallel
    const toolResults: ResponseInputItem.FunctionCallOutput[] = await Promise.all(
      toolCalls.map(async (call) => {
        const args = JSON.parse(call.arguments) as Record<string, unknown>;
        console.log(`[food-agent] → ${call.name}(${JSON.stringify(args)})`);

        callbacks?.onToolCall?.(call.name, call.call_id);
        const t1 = Date.now();

        try {
          const { output, success } = await executeTool(call.name, args, userId, today);
          const toolElapsed = Date.now() - t1;

          console.log(
            `[food-agent] ← ${call.name} ${success ? "OK" : "FAIL"} (${toolElapsed}ms): ${output.slice(0, 300)}`,
          );

          callbacks?.onToolResult?.(call.name, call.call_id, success);

          return {
            type: "function_call_output" as const,
            call_id: call.call_id,
            output,
          };
        } catch (error) {
          const toolElapsed = Date.now() - t1;
          console.error(
            `[food-agent] ← ${call.name} ERROR (${toolElapsed}ms):`,
            error,
          );

          callbacks?.onToolResult?.(call.name, call.call_id, false);

          return {
            type: "function_call_output" as const,
            call_id: call.call_id,
            output: JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          };
        }
      }),
    );

    conversation.push(...toolResults);
  }

  console.log(`[food-agent] ── Hit step limit (${MAX_STEPS}) ──`);

  return {
    response: "Osiągnąłem limit kroków. Spróbuj uprościć zapytanie.",
    history: conversation,
  };
}
