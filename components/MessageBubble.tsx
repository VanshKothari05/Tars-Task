"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Trash2, Smile } from "lucide-react";
import { cn, formatMessageTime } from "@/lib/utils";

type Message = {
  _id: any;
  _creationTime: number;
  senderId: string;
  content: string;
  isDeleted: boolean;
  reactions: { userId: string; emoji: string }[];
};

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢"];

// ── Who reacted tooltip ───────────────────────────────────────────────────────
function ReactionTooltip({
  emoji,
  userIds,
  currentUserId,
  userNames,
}: {
  emoji: string;
  userIds: string[];
  currentUserId: string;
  userNames: Map<string, string>;
}) {
  const names = userIds.map(id =>
    id === currentUserId ? "You" : (userNames.get(id) ?? "Someone")
  );

  return (
    // Rendered ABOVE the reaction badge, centered, non-interactive
    <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div
        className="bg-gray-800 text-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ minWidth: 120, maxWidth: 200 }}
      >
        {/* Emoji header */}
        <div className="bg-gray-700 px-4 py-2 flex items-center justify-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span className="text-white font-bold text-sm">{userIds.length}</span>
        </div>
        {/* Names list */}
        <div className="px-3 py-2 space-y-1">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
              <span className="text-xs text-gray-200 truncate">{name}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Arrow pointing down */}
      <div className="flex justify-center">
        <div className="w-3 h-3 bg-gray-800 rotate-45 -mt-1.5" />
      </div>
    </div>
  );
}

// ── Floating action toolbar (appears above message on hover) ──────────────────
function ActionBar({
  isOwn,
  onEmojiClick,
  onDelete,
  emojiButtonRef,
}: {
  isOwn: boolean;
  onEmojiClick: () => void;
  onDelete: () => void;
  emojiButtonRef: React.RefObject<HTMLButtonElement>;
}) {
  return (
    <div
      className={cn(
        "absolute -top-9 flex items-center gap-1 bg-white rounded-xl shadow-lg border border-gray-100 px-1.5 py-1",
        // Position toolbar on the correct side based on message owner
        isOwn ? "right-0" : "left-0"
      )}
    >
      <button
        ref={emojiButtonRef}
        onClick={onEmojiClick}
        className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 transition-all"
        title="React"
      >
        <Smile className="w-4 h-4" />
      </button>
      {isOwn && (
        <>
          <div className="w-px h-4 bg-gray-200" />
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Emoji picker panel ────────────────────────────────────────────────────────
function EmojiPicker({
  isOwn,
  onSelect,
  pickerRef,
}: {
  isOwn: boolean;
  onSelect: (e: string) => void;
  pickerRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div
      ref={pickerRef}
      onClick={e => e.stopPropagation()}
      className={cn(
        // Render BELOW the action bar so it never goes off-screen upward
        "absolute top-[-2px] z-[200] bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex gap-1",
        isOwn ? "right-0" : "left-0"
      )}
      style={{ top: "calc(100% + 4px)" }}
    >
      {EMOJI_LIST.map(emoji => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-indigo-50 hover:scale-110 transition-all"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MessageBubble({
  message, isOwn, showAvatar, senderImage, senderName,
  currentUserId, onDelete, onReact, userNames,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  senderImage?: string;
  senderName?: string;
  currentUserId: string;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  emojis?: string[]; // kept for backwards compat, we use the constant above
  userNames?: Map<string, string>;
}) {
  const [hovered, setHovered] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const namesMap = userNames ?? new Map<string, string>();

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    function handle(e: MouseEvent) {
      if (
        pickerRef.current?.contains(e.target as Node) ||
        emojiButtonRef.current?.contains(e.target as Node)
      ) return;
      setShowPicker(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showPicker]);

  const reactionGroups = message.reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = [];
    acc[r.emoji].push(r.userId);
    return acc;
  }, {} as Record<string, string[]>);

  const hasReactions = Object.keys(reactionGroups).length > 0;

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
        showAvatar ? "mt-4" : "mt-0.5"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
    >
      {/* ── Avatar ── */}
      <div className="flex-shrink-0 w-7">
        {!isOwn && showAvatar ? (
          senderImage ? (
            <Image
              src={senderImage} alt={senderName ?? ""}
              width={28} height={28}
              className="rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
              {senderName?.[0]?.toUpperCase() ?? "?"}
            </div>
          )
        ) : null}
      </div>

      {/* ── Content column ── */}
      <div className={cn(
        "flex flex-col gap-1",
        "max-w-[72%] sm:max-w-[60%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender name for received messages */}
        {!isOwn && showAvatar && senderName && (
          <span className="text-[11px] font-semibold text-indigo-500 px-1">
            {senderName}
          </span>
        )}

        {/* ── Bubble + hover toolbar wrapper ── */}
        <div className="relative">
          {/* Floating action bar — appears above the bubble on hover */}
          {hovered && !message.isDeleted && (
            <ActionBar
              isOwn={isOwn}
              onEmojiClick={() => setShowPicker(v => !v)}
              onDelete={() => { onDelete(); setHovered(false); }}
              emojiButtonRef={emojiButtonRef as React.RefObject<HTMLButtonElement>}
            />
          )}

          {/* Emoji picker — appears below the action bar */}
          {showPicker && (
            <EmojiPicker
              isOwn={isOwn}
              onSelect={emoji => { onReact(emoji); setShowPicker(false); }}
              pickerRef={pickerRef as React.RefObject<HTMLDivElement>}
            />
          )}

          {/* The actual message bubble */}
          {message.isDeleted ? (
            <div className={cn(
              "px-4 py-2.5 rounded-2xl text-sm italic text-gray-400 border border-dashed",
              isOwn
                ? "bg-gray-50 border-gray-200 rounded-br-md"
                : "bg-white border-gray-200 rounded-bl-md"
            )}>
              🚫 This message was deleted
            </div>
          ) : (
            <div className={cn(
              "px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
              isOwn
                ? "bg-indigo-600 text-white rounded-br-md shadow-indigo-100 shadow-md"
                : "bg-white text-gray-800 rounded-bl-md shadow-sm"
            )}>
              {message.content}
            </div>
          )}
        </div>

        {/* ── Reaction badges ── */}
        {hasReactions && (
          <div className={cn(
            "flex flex-wrap gap-1 px-1",
            isOwn ? "justify-end" : "justify-start"
          )}>
            {Object.entries(reactionGroups).map(([emoji, userIds]) => {
              const iReacted = userIds.includes(currentUserId);
              return (
                <div
                  key={emoji}
                  className="relative"
                  onMouseEnter={() => setHoveredReaction(emoji)}
                  onMouseLeave={() => setHoveredReaction(null)}
                >
                  {/* Tooltip */}
                  {hoveredReaction === emoji && (
                    <ReactionTooltip
                      emoji={emoji}
                      userIds={userIds}
                      currentUserId={currentUserId}
                      userNames={namesMap}
                    />
                  )}

                  {/* Badge */}
                  <button
                    onClick={() => onReact(emoji)}
                    className={cn(
                      "flex items-center gap-1 rounded-full text-xs px-2.5 py-1 font-medium transition-all border",
                      iReacted
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50"
                    )}
                  >
                    <span className="text-sm leading-none">{emoji}</span>
                    <span>{userIds.length}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Timestamp ── */}
        <span className={cn(
          "text-[10px] text-gray-400 px-1 select-none",
          isOwn ? "text-right" : "text-left"
        )}>
          {formatMessageTime(message._creationTime)}
        </span>
      </div>
    </div>
  );
}