"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessageInput({
  conversationId,
  onSend,
  currentUserId,
}: {
  conversationId: Id<"conversations">;
  onSend: (content: string) => Promise<void>;
  currentUserId: string;
}) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const setTyping = useMutation(api.typing.setTyping);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stopTyping = useCallback(() => {
    if (currentUserId) {
      setTyping({ conversationId, userId: currentUserId, isTyping: false });
    }
  }, [conversationId, currentUserId, setTyping]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContent(val);
    setSendError(null);


    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }

    // Typing indicator
    if (currentUserId) {
      setTyping({ conversationId, userId: currentUserId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(stopTyping, 2000);
    }
  }

  async function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    setSendError(null);
    stopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      await onSend(trimmed);
      setContent("");

      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {
      setSendError("Failed to send. Tap to retry.");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = content.trim().length > 0 && !isSending;

  return (
    <div className="bg-white px-3 py-3">
 
      {sendError && (
        <div className="mb-2 flex items-center gap-2 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-1.5">
          <span>⚠️ {sendError}</span>
          <button onClick={handleSend} className="underline font-medium hover:no-underline">
            Retry
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className={cn(
            "flex-1 text-[#1a1a1a] resize-none bg-gray-100 rounded-2xl px-4 py-2.5 text-sm",
            "outline-none focus:ring-2 focus:ring-indigo-300 transition-all",
            "placeholder:text-gray-400 leading-relaxed",
            "min-h-[42px] max-h-[120px] overflow-y-auto",
            sendError && "ring-2 ring-red-200 bg-red-50"
          )}
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all",
            canSend
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md active:scale-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      <p className="text-[10px] text-gray-400 mt-1.5 px-1 select-none">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
