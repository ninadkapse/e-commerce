"use client";

import { useState, useRef, useEffect, useCallback, FormEvent } from "react";
import { useStore } from "@/lib/store";
import { ChatMessage, AgentType, Order } from "@/lib/types";
import AgentBadge from "./AgentBadge";

// Detect intent from user message
function detectIntent(text: string): "consumer" | "ops" | null {
  const lower = text.toLowerCase();
  if (
    lower.includes("refund") || lower.includes("angry") ||
    lower.includes("frustrated") || lower.includes("terrible") ||
    lower.includes("worst") || lower.includes("discount") ||
    lower.includes("complain") || lower.includes("cancel") ||
    lower.includes("unhappy") || lower.includes("disappointed")
  ) return "consumer";
  if (
    lower.includes("track") || lower.includes("ship") ||
    lower.includes("deliver") || lower.includes("where") ||
    lower.includes("status") || lower.includes("order") ||
    lower.includes("replace") || lower.includes("lost") ||
    lower.includes("damaged") || lower.includes("when")
  ) return "ops";
  return null;
}

// Extract order ID from text
function extractOrderId(text: string): string | null {
  const match = text.match(/ORD-\d+/i);
  return match ? match[0].toUpperCase() : null;
}

export default function ChatSidebar() {
  const { state, dispatch, addMessage } = useStore();
  const { messages, activeAgent, isChatOpen } = state;
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendBotMessage = useCallback(
    (content: string, agent: AgentType) => {
      dispatch({ type: "SET_ACTIVE_AGENT", agent });
      addMessage({
        id: `msg-${Date.now()}`,
        role: "assistant",
        content,
        agent,
        timestamp: new Date().toISOString(),
      });
    },
    [dispatch, addMessage]
  );

  const handleLocalAgent = useCallback(
    async (userText: string) => {
      const intent = detectIntent(userText);
      const orderId = extractOrderId(userText) || currentOrderId;

      // If no intent detected, show help
      if (!intent && !orderId) {
        sendBotMessage(
          "Hello! 👋 I'm the **Contoso E-Commerce Assistant**. I can help you with:\n\n" +
          "📦 **Track your order** — Just say \"Track ORD-1001\" or \"Where is my order?\"\n" +
          "🛟 **Complaints & Refunds** — Say \"I want a refund\" or \"I'm unhappy with my order\"\n" +
          "🔄 **Replacements** — Say \"I need a replacement for ORD-1001\"\n\n" +
          "Include your **order ID** (e.g., ORD-1001) so I can look it up!",
          "router"
        );
        return;
      }

      // If we have an order ID, fetch it
      if (orderId) {
        setCurrentOrderId(orderId);
        try {
          const res = await fetch(`/api/orders/${orderId}`);
          if (!res.ok) {
            sendBotMessage(
              `❌ I couldn't find order **${orderId}**. Please double-check your order ID and try again.\n\nYou can find your order ID in your confirmation email.`,
              "consumer"
            );
            return;
          }
          const order: Order = await res.json();

          // Consumer Agent — Complaint/Refund flow
          if (intent === "consumer") {
            dispatch({ type: "SET_ACTIVE_AGENT", agent: "consumer" });

            // Apply 20% discount via API
            const discountRes = await fetch("/api/simulate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "apply-discount", orderId: order.id, percentage: 20 }),
            });
            const discount = await discountRes.json();

            sendBotMessage(
              `🛟 **Consumer Agent** here, ${order.customerName}.\n\n` +
              `I sincerely apologize for the inconvenience with your order **${order.id}** (${order.items.map(i => i.name).join(", ")}).\n\n` +
              `Current status: **${order.status.replace(/_/g, " ")}**\n\n` +
              `As a gesture of goodwill, I've generated a **20% discount code** for your next purchase:\n\n` +
              `🎟️ **${discount.code}**\n\n` +
              `Please use this code at checkout. Is there anything else I can help with?`,
              "consumer"
            );
            return;
          }

          // Ops Agent — Track / Replace flow
          if (intent === "ops" || !intent) {
            dispatch({ type: "SET_ACTIVE_AGENT", agent: "ops" });

            const isReplacementRequest =
              userText.toLowerCase().includes("replace") ||
              userText.toLowerCase().includes("lost") ||
              userText.toLowerCase().includes("damaged");

            if (isReplacementRequest) {
              // Trigger replacement via API
              await fetch(`/api/orders/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  status: "replacement_sent",
                  location: "Contoso Warehouse",
                  description: "Replacement order initiated",
                }),
              });
              const updatedRes = await fetch(`/api/orders/${order.id}`);
              const updated: Order = await updatedRes.json();

              sendBotMessage(
                `📦 **Ops Agent** here, ${order.customerName}.\n\n` +
                `I've initiated a **replacement order** for **${order.id}**.\n\n` +
                `🔄 New tracking number: **${updated.trackingNumber}**\n\n` +
                `You'll receive tracking updates via email. Is there anything else I can help with?`,
                "ops"
              );
            } else {
              // Show tracking info
              const lastEvent = order.trackingEvents[order.trackingEvents.length - 1];
              let trackingInfo =
                `📦 **Ops Agent** here, ${order.customerName}.\n\n` +
                `**Order ${order.id}** — ${order.items.map(i => i.name).join(", ")}\n\n` +
                `📊 Status: **${order.status.replace(/_/g, " ")}**\n`;

              if (order.trackingNumber) {
                trackingInfo += `📋 Tracking: **${order.trackingNumber}**\n`;
              }
              if (lastEvent) {
                trackingInfo += `📍 Last update: ${lastEvent.description} (${lastEvent.location})\n`;
              }

              trackingInfo += `\n💡 You can view the full delivery timeline on your [order page](/orders/${order.id}).`;

              if (order.status !== "delivered") {
                trackingInfo += "\n\nWould you like me to **initiate a replacement** if there's an issue?";
              }

              sendBotMessage(trackingInfo, "ops");
            }
            return;
          }
        } catch {
          sendBotMessage(
            "⚠️ I'm having trouble connecting to our systems right now. Please try again in a moment.",
            "router"
          );
          return;
        }
      }

      // Intent but no order ID
      sendBotMessage(
        `I'd be happy to help! Could you please provide your **order ID**? (e.g., ORD-1001)\n\nYou can find it in your order confirmation email or on the [My Orders](/orders) page.`,
        intent === "consumer" ? "consumer" : "ops"
      );
    },
    [currentOrderId, dispatch, sendBotMessage]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);
    setInput("");
    setIsLoading(true);

    try {
      // Try Copilot Studio via Direct Line first
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", text: userMsg.content }),
      });

      if (res.ok) {
        const pollRes = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "poll" }),
        });
        if (pollRes.ok) {
          const data = await pollRes.json();
          const botActivities = data.activities?.filter(
            (a: { type: string; from: { id: string } }) =>
              a.type === "message" && a.from.id !== "contoso-user"
          );
          if (botActivities?.length) {
            for (const activity of botActivities) {
              const agent: AgentType = activity.channelData?.activeAgent || "router";
              dispatch({ type: "SET_ACTIVE_AGENT", agent });
              addMessage({
                id: activity.id || `msg-${Date.now()}`,
                role: "assistant",
                content: activity.text || "",
                agent,
                timestamp: activity.timestamp || new Date().toISOString(),
              });
            }
            setIsLoading(false);
            return;
          }
        }
      }
      // Fallback to local agent
      await handleLocalAgent(userMsg.content);
    } catch {
      await handleLocalAgent(userMsg.content);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => dispatch({ type: "TOGGLE_CHAT" })}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Toggle chat"
      >
        {isChatOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-40 flex h-[520px] w-96 flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200/80 transition-all duration-300 ${
          isChatOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Contoso Assistant</h3>
            <div className="mt-1">
              <AgentBadge agent={activeAgent} />
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: "SET_CHAT_OPEN", open: false })}
            className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <p className="text-3xl mb-2">🤖</p>
                <p className="text-sm font-medium text-neutral-600">Contoso E-Commerce Assistant</p>
                <p className="mt-1 text-xs text-neutral-400">Track orders, get refunds, or request replacements</p>
                <div className="mt-4 space-y-2">
                  {["Track ORD-1001", "I want a refund for ORD-1002", "Where is my order ORD-1003?"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="block w-full rounded-lg bg-neutral-50 px-3 py-2 text-left text-xs text-neutral-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      &quot;{q}&quot;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-800"
              }`}>
                {msg.agent && msg.role === "assistant" && (
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    {msg.agent === "consumer" ? "🛟 Consumer Agent" : msg.agent === "ops" ? "📦 Ops Agent" : "🔀 Router"}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-neutral-100 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-neutral-100 px-4 py-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Track orders, refunds, complaints…"
            className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}
