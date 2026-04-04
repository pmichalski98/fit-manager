"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SearchIcon, SparklesIcon, Loader2Icon, ClockIcon, BrainIcon, SendIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFoodSearch } from "../hooks/use-food-search";
import { addMealEntry, getRecentlyUsedProducts } from "@/modules/meal/actions";
import { MEAL_TYPE_LABELS, type MealType } from "@/modules/meal/schemas";
import type { FoodProduct } from "@/server/db/schema";
import { MUTATING_TOOLS, type AgentStreamEvent } from "@/modules/food-agent/types";
import { ToolStatus } from "@/modules/food-agent/ui/tool-status";
import type { ResponseInputItem } from "openai/resources/responses/responses";

type Props = {
  open: boolean;
  onOpenChange: () => void;
  date: string;
  mealType: MealType;
  onMutate?: () => void;
};

type AgentToolCall = {
  callId: string;
  name: string;
  status: "running" | "success" | "error";
};

type DisplayMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; tools: AgentToolCall[] };

type AgentState = {
  isRunning: boolean;
  isThinking: boolean;
  tools: AgentToolCall[];
  response: string | null;
  history: ResponseInputItem[];
  messages: DisplayMessage[];
};

const INITIAL_AGENT_STATE: AgentState = {
  isRunning: false,
  isThinking: false,
  tools: [],
  response: null,
  history: [],
  messages: [],
};

export function FoodSearchDialog({ open, onOpenChange, date, mealType, onMutate }: Props) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [recentProducts, setRecentProducts] = useState<FoodProduct[]>([]);
  const [agent, setAgent] = useState<AgentState>(INITIAL_AGENT_STATE);
  const [replyInput, setReplyInput] = useState("");
  const replyInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { isSearching, localResults, reset: resetSearch } = useFoodSearch(query);

  // Load recently used products when dialog opens
  useEffect(() => {
    if (open) {
      getRecentlyUsedProducts().then(setRecentProducts);
    }
  }, [open]);

  // Auto-scroll chat and focus reply input when agent finishes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agent.messages.length, agent.response, agent.tools.length]);

  useEffect(() => {
    if (!agent.isRunning && agent.messages.length > 0) {
      setTimeout(() => replyInputRef.current?.focus(), 100);
    }
  }, [agent.isRunning, agent.messages.length]);

  const handleSelectLocal = (product: FoodProduct) => {
    setSelectedProduct(product);
    setAmount(String(product.defaultServingG));
  };

  const sendAgentMessage = useCallback(async (message: string, history: ResponseInputItem[]) => {
    setAgent((prev) => ({
      ...prev,
      isRunning: true,
      isThinking: true,
      tools: [],
      response: null,
      messages: [...prev.messages, { role: "user", content: message }],
    }));

    let currentTools: AgentToolCall[] = [];

    try {
      const res = await fetch("/api/food-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const chunk of lines) {
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          let event: AgentStreamEvent;
          try {
            event = JSON.parse(dataLine.slice(6)) as AgentStreamEvent;
          } catch {
            continue;
          }

          if (event.type === "thinking") {
            setAgent((prev) => ({ ...prev, isThinking: true }));
          }

          if (event.type === "tool_call") {
            const tool: AgentToolCall = {
              callId: event.callId,
              name: event.name,
              status: "running",
            };
            currentTools = [...currentTools, tool];
            setAgent((prev) => ({ ...prev, isThinking: false, tools: [...currentTools] }));
          }

          if (event.type === "tool_result") {
            currentTools = currentTools.map((t) =>
              t.callId === event.callId
                ? { ...t, status: event.success ? "success" : "error" }
                : t,
            );
            setAgent((prev) => ({ ...prev, tools: [...currentTools] }));
          }

          if (event.type === "text") {
            setAgent((prev) => ({ ...prev, response: event.content }));
          }

          if (event.type === "done") {
            setAgent((prev) => ({
              ...prev,
              history: event.history,
              messages: [
                ...prev.messages,
                { role: "assistant", content: prev.response ?? "", tools: [...currentTools] },
              ],
              tools: [],
              response: null,
            }));
            const hadMutation = currentTools.some(
              (t) => MUTATING_TOOLS.has(t.name) && t.status === "success",
            );
            if (hadMutation) {
              onMutate?.();
            }
          }
        }
      }
    } catch (error) {
      console.error("[food-search] Agent error:", error);
      toast.error("Agent error — try again");
    } finally {
      setAgent((prev) => ({ ...prev, isRunning: false, isThinking: false }));
    }
  }, [onMutate]);

  const handleAgentEstimate = useCallback(async () => {
    if (!query.trim()) return;
    const message = `Znajdź dane odżywcze i utwórz produkt: "${query}". Potem dodaj wpis posiłku: data=${date}, mealType=${mealType}. Szacuj standardowe porcje automatycznie.`;
    await sendAgentMessage(message, []);
  }, [query, date, mealType, sendAgentMessage]);

  const handleAgentReply = useCallback(async () => {
    const msg = replyInput.trim();
    if (!msg || agent.isRunning) return;
    setReplyInput("");
    await sendAgentMessage(msg, agent.history);
  }, [replyInput, agent.isRunning, agent.history, sendAgentMessage]);

  const handleAdd = async () => {
    if (!selectedProduct || !amount) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 0.1) {
      toast.error("Enter a valid amount");
      return;
    }

    setIsAdding(true);
    const result = await addMealEntry({
      date,
      mealType,
      foodProductId: selectedProduct.id,
      amountG: numAmount,
      notes: notes || null,
    });

    if (result.ok) {
      toast.success(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
      handleReset();
      onOpenChange();
      onMutate?.();
    } else {
      toast.error(result.error);
    }
    setIsAdding(false);
  };

  const handleReset = () => {
    setQuery("");
    resetSearch();
    setSelectedProduct(null);
    setAmount("");
    setNotes("");
    setReplyInput("");
    setAgent(INITIAL_AGENT_STATE);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange();
  };

  // Computed macros preview
  const previewMacros =
    selectedProduct && amount
      ? {
          kcal: (Number(selectedProduct.kcalPer100g) * Number(amount)) / 100,
          protein: (Number(selectedProduct.proteinPer100g) * Number(amount)) / 100,
          carbs: (Number(selectedProduct.carbsPer100g) * Number(amount)) / 100,
          fat: (Number(selectedProduct.fatPer100g) * Number(amount)) / 100,
        }
      : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Add to {MEAL_TYPE_LABELS[mealType]} — {date}
          </DialogTitle>
        </DialogHeader>

        {/* Agent chat view */}
        {agent.isRunning || agent.messages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {/* Chat history */}
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {agent.messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="space-y-1.5">
                    {msg.tools.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {msg.tools.map((tool) => (
                          <ToolStatus key={tool.callId} name={tool.name} status={tool.status} />
                        ))}
                      </div>
                    )}
                    {msg.content && (
                      <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    )}
                  </div>
                ),
              )}

              {/* Current in-progress turn */}
              {agent.isRunning && (
                <div className="space-y-1.5">
                  {agent.isThinking && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BrainIcon className="h-4 w-4 animate-pulse" />
                      <span>Thinking…</span>
                    </div>
                  )}
                  {agent.tools.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {agent.tools.map((tool) => (
                        <ToolStatus key={tool.callId} name={tool.name} status={tool.status} />
                      ))}
                    </div>
                  )}
                  {agent.response && (
                    <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">
                      {agent.response}
                    </div>
                  )}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Reply input */}
            {!agent.isRunning && (
              <div className="space-y-2">
                <form
                  onSubmit={(e) => { e.preventDefault(); void handleAgentReply(); }}
                  className="flex gap-2"
                >
                  <Input
                    ref={replyInputRef}
                    placeholder="Reply to agent..."
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!replyInput.trim()}>
                    <SendIcon className="h-4 w-4" />
                  </Button>
                </form>
                <Button variant="outline" className="w-full" onClick={handleReset}>
                  Done — close
                </Button>
              </div>
            )}
          </div>
        ) : !selectedProduct ? (
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search food products..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
              {isSearching && (
                <Loader2Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
              )}
            </div>

            {/* Recently used products — shown when query is empty */}
            {query.length < 2 && recentProducts.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                  <ClockIcon className="h-3 w-3" />
                  Recently used
                </p>
                <div className="space-y-1">
                  {recentProducts.map((p) => (
                    <ProductRow
                      key={p.id}
                      name={p.name}
                      brand={p.brand}
                      kcal={Number(p.kcalPer100g)}
                      imageUrl={p.imageUrl}
                      isEstimate={p.source === "ai_estimate" && !p.isVerified}
                      onClick={() => handleSelectLocal(p)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Local results */}
            {localResults.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                  Your products
                </p>
                <div className="space-y-1">
                  {localResults.map((p) => (
                    <ProductRow
                      key={p.id}
                      name={p.name}
                      brand={p.brand}
                      kcal={Number(p.kcalPer100g)}
                      imageUrl={p.imageUrl}
                      isEstimate={p.source === "ai_estimate" && !p.isVerified}
                      onClick={() => handleSelectLocal(p)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI agent button */}
            {query.length >= 2 && !isSearching && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAgentEstimate}
                disabled={agent.isRunning}
              >
                <SparklesIcon className="mr-2 h-4 w-4" />
                Let AI estimate &quot;{query}&quot;
              </Button>
            )}

            {/* Empty state */}
            {query.length >= 2 &&
              !isSearching &&
              localResults.length === 0 && (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  No results found. Try AI estimation above.
                </p>
              )}
          </div>
        ) : (
          /* Amount selection */
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="bg-muted flex h-10 w-10 items-center justify-center overflow-hidden rounded-md">
                {selectedProduct.imageUrl ? (
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg">🍽️</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{selectedProduct.name}</p>
                <p className="text-muted-foreground text-xs">
                  {Number(selectedProduct.kcalPer100g)} kcal / 100g
                  {selectedProduct.source === "ai_estimate" &&
                    !selectedProduct.isVerified && (
                      <span className="ml-1 text-yellow-600">~ estimate</span>
                    )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProduct(null)}
              >
                Change
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium">
                Amount (g)
                {selectedProduct.portionLabel && (
                  <span className="text-muted-foreground ml-2 font-normal">
                    {selectedProduct.portionLabel} = {selectedProduct.defaultServingG}g
                  </span>
                )}
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="1"
                min="0.1"
                autoFocus
              />
            </div>

            {previewMacros && (
              <div className="text-muted-foreground grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {Math.round(previewMacros.kcal)}
                  </p>
                  <p>kcal</p>
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {Math.round(previewMacros.protein)}g
                  </p>
                  <p>protein</p>
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {Math.round(previewMacros.carbs)}g
                  </p>
                  <p>carbs</p>
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {Math.round(previewMacros.fat)}g
                  </p>
                  <p>fat</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Recipe link, cooking tips..."
              />
            </div>

            <Button
              className="w-full"
              onClick={handleAdd}
              disabled={isAdding || !amount}
            >
              {isAdding ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Add to {MEAL_TYPE_LABELS[mealType].toLowerCase()}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductRow({
  name,
  brand,
  kcal,
  imageUrl,
  isEstimate,
  onClick,
}: {
  name: string;
  brand: string | null;
  kcal: number;
  imageUrl?: string | null;
  isEstimate?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-accent flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors"
    >
      <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs">🍽️</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        {brand && (
          <p className="text-muted-foreground truncate text-xs">{brand}</p>
        )}
      </div>
      <div className="text-muted-foreground shrink-0 text-xs">
        {isEstimate && <span className="mr-1 text-yellow-600">~</span>}
        {Math.round(kcal)} kcal
      </div>
    </button>
  );
}
