import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import classNames from "classnames";
//import { makeStyles } from "@mui/styles";
import { FaPaperPlane } from "react-icons/fa";
import { BsTrash } from "react-icons/bs";

// ChatBox (theme-aware)
// - Accepts `theme` prop: "dark" | "light" (optional)
// - Falls back to checking document.documentElement.classList.contains('dark') if no prop
// - Keeps all chat state in-memory (session-only)



export default function ChatBox({ theme }) {
  // derive isDark from prop or document class
  const isDark = (typeof theme === "string")
  ? theme === "dark"
  : (typeof document !== "undefined" && document.documentElement.classList.contains("dark"));


  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const scrollRef = useRef(null);

  // scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  function addMessage(msg) {
    setMessages((cur) => [...cur, msg]);
  }

/*   function formatSources(sources) {
    if (!sources) return null;
    if (!Array.isArray(sources)) return null;
    return sources.map((s, i) => {
      if (!s) return null;
      if (typeof s === "string") return { key: `${i}`, title: s, url: null };
      return { key: `${i}`, title: title || url || JSON.stringify(s), url };
    });
  } */

  async function sendChatRequest(messageText) {
    // abort previous
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {}
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const resp = await axios.post(
        "http://127.0.0.1:8000/api/chat",
        { message: messageText },
        {
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          timeout: 100000,
        }
      );

      const data = resp.data || {};
      const answer = data.answer ?? "(no answer)";
      //const sources = formatSources(data.sources ?? []);

      addMessage({ id: Date.now() + Math.random(), role: "bot", text: answer });
    } catch (err) {
      if (err.name === "CancelledError" || err.name === "AbortError") {
        // aborted
        return;
      }
      console.error("Chat API error:", err);
      setError(err?.response?.data?.message || err.message || "Failed to get response");
      addMessage({ id: Date.now() + Math.random(), role: "bot", text: "Error: failed to fetch response" });
    } finally {
      setLoading(false);
    }
  }

  // run when user clicks Send or presses Enter
  async function handleSend() {
    const trimmed = (prompt || "").trim();
    if (!trimmed) return;

    // add user message immediately
    const userMsg = { id: Date.now(), role: "user", text: trimmed };
    addMessage(userMsg);

    // clear input
    setPrompt("");

    // send request
    await sendChatRequest(trimmed);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) handleSend();
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {}
    }
  }

  // helper classes depending on theme
  const containerClasses = classNames(
    "w-full rounded-md shadow-sm overflow-hidden flex flex-col",
    isDark ? "bg-neutral-950 border border-neutral-800 text-white" : "bg-white border border-gray-200 text-gray-900"
  );

  const headerTextClass = isDark ? "text-white" : "text-gray-900";
  const subHeaderTextClass = isDark ? "text-neutral-400" : "text-gray-500";

  const messagesAreaClass = classNames(
    "flex-1 overflow-auto p-4",
    isDark ? "bg-gradient-to-b from-neutral-900 to-neutral-950" : "bg-gradient-to-b from-white to-sky-50"
  );

  const inputBg = isDark ? "bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-400" : "bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400";

  const userBubbleClass = (isDark) ? "bg-neutral-800 border border-neutral-700 text-white" : "bg-white border border-gray-200 text-gray-900";
  const botBubbleLightAlt = (index) => (index % 2 === 0 ? "bg-blue-50" : "bg-blue-100");
  const botBubbleDarkAlt = (index) => (index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-800");

  return (
    <div className={containerClasses} style={{ height: "640px" }}>
      {/* Header */}
      <div className={"px-4 py-3 border-b flex items-center justify-between " + (isDark ? "border-neutral-800" : "border-gray-100")}>
        <div className="flex items-center gap-3">
          <div className={classNames("w-10 h-10 rounded-full flex items-center justify-center font-semibold", isDark ? "bg-neutral-800 text-neutral-200" : "bg-blue-100 text-blue-700")}>AI</div>
          <div>
            <div className={"font-medium " + headerTextClass}>Policy Chat</div>
            <div className={"text-xs " + subHeaderTextClass}>Ask about company policy, procedures, etc.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            className={classNames("text-sm flex items-center gap-2", isDark ? "text-red-400 hover:text-red-300" : "text-red-600 hover:text-red-800")}
            title="Clear chat"
          >
            <BsTrash /> Clear
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className={messagesAreaClass}>
        {messages.length === 0 && (
          <div className={"text-center text-sm " + (isDark ? "text-neutral-400 mt-8" : "text-gray-500 mt-8")}>No messages yet. Type a prompt below and press Enter or click Send.</div>
        )}

        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          const bubbleBase = "max-w-[85%] px-4 py-2 rounded-lg break-words whitespace-pre-line";

          const bubbleClass = isUser
            ? userBubbleClass
            : (isDark ? botBubbleDarkAlt(idx) + " text-white" : botBubbleLightAlt(idx) + " text-gray-900");

          return (
            <div key={m.id} className={classNames("flex", { "justify-end": isUser, "justify-start": !isUser })}>
              <div
                className={classNames(bubbleBase, bubbleClass)}
                style={{ borderRadius: isUser ? "12px 12px 8px 12px" : "12px 12px 12px 8px" }}
              >
                <div className="text-sm leading-relaxed">{m.text}</div>

                {/* render sources if present and this is a bot message */}
                {/* {!isUser && m.sources && m.sources.length > 0 && (
                  <div className={"mt-2 text-sm leading-relaxed " + (isDark ? "text-neutral-300" : "text-gray-600")}>
                    <div className={"font-medium mb-1 " + (isDark ? "text-neutral-200" : "text-gray-700")}>Sources:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {m.sources.map((s) => (
                        <li key={s.key}>
                          {s.url ? (
                            <a href={s.url} target="_blank" rel="noreferrer" className={classNames("underline", isDark ? "text-blue-300" : "text-blue-600")}>{s.title}</a>
                          ) : (
                            <span className={isDark ? "text-neutral-300" : "text-gray-600"}>{s.title}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )} */}
              </div>
            </div>
          );
        })}

        {/* loading indicator as a bot typing bubble */}
        {loading && (
          <div className="flex justify-start">
            <div className={classNames("max-w-[65%] px-4 py-2 rounded-lg", isDark ? "bg-neutral-900 text-neutral-300" : "bg-blue-50 text-gray-600")}>Generating response…</div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className={"px-4 py-3 border-t " + (isDark ? "border-neutral-800" : "border-gray-100") + " " + (isDark ? "bg-neutral-950" : "bg-white") }>
        <div className="flex items-end gap-3">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question here. Shift+Enter for newline."
            className={classNames("flex-1 resize-none rounded-md p-3 text-sm outline-none", inputBg)}
          />

          <div className="flex flex-col items-end gap-2">
            {error && <div className="text-xs text-red-500">{error}</div>}

            <div className="flex items-center gap-2">
              <button
                onClick={handleSend}
                disabled={loading || !prompt.trim()}
                className={classNames("flex items-center gap-2 px-4 py-2 rounded-md", isDark ? "bg-violet-600 text-white disabled:opacity-60" : "bg-[#5336FD] text-white disabled:opacity-60")}
                title="Send"
              >
                <FaPaperPlane />
                <span className="text-sm">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
