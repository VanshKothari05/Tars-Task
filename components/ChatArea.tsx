"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import OnlineIndicator from "./OnlineIndicator";
import { cn } from "@/lib/utils";

export default function ChatArea({ conversationId }: { conversationId: Id<"conversations"> }) {
  const { user } = useUser();
  const router = useRouter();

  const allConversations = useQuery(
    api.conversations.getUserConversations,
    user ? { userId: user.id } : "skip"
  );
  const conversation = allConversations?.find(c => c._id === conversationId) ?? null;
  const conversationsLoaded = allConversations !== undefined;

  const messages = useQuery(api.messages.getMessages, conversationId ? { conversationId } : "skip");
  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    user && conversationId ? { conversationId, currentUserId: user.id } : "skip"
  );

  const markAsRead = useMutation(api.messages.markAsRead);
  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const otherParticipantIds = conversation?.participants.filter(p => p !== user?.id) ?? [];
  const otherUsersRaw = useQuery(
    api.users.getMultipleUsers,
    otherParticipantIds.length > 0 ? { clerkIds: otherParticipantIds } : "skip"
  );
  const otherUsers = (otherUsersRaw ?? []).filter((u): u is NonNullable<typeof u> => u != null);
  const otherUser = otherUsers[0] ?? null;
  const userMap = new Map(otherUsers.map(u => [u.clerkId, u]));
  // For reaction tooltips: clerkId → display name
  const userNames = new Map(otherUsers.map(u => [u.clerkId, u.name]));
  if (user) userNames.set(user.id, user.fullName ?? user.username ?? "You");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMsgCount = useRef(0);
  const initialScrollDone = useRef(false);

  useEffect(() => {
    initialScrollDone.current = false;
    prevMsgCount.current = 0;
    setShowScrollButton(false);
    setIsAtBottom(true);
  }, [conversationId]);

  useEffect(() => {
    if (user && conversationId) markAsRead({ conversationId, userId: user.id });
  }, [conversationId, user, markAsRead]);

  useEffect(() => {
    if (user && messages && isAtBottom) markAsRead({ conversationId, userId: user.id });
  }, [messages?.length, isAtBottom, user, conversationId, markAsRead]);

  useEffect(() => {
    if (messages && messages.length > 0 && !initialScrollDone.current) {
      initialScrollDone.current = true;
      setTimeout(() => scrollToBottom("instant"), 30);
    }
  }, [messages]);

  useEffect(() => {
    if (!messages || !initialScrollDone.current) return;
    const isNew = messages.length > prevMsgCount.current;
    prevMsgCount.current = messages.length;
    if (isNew && isAtBottom) scrollToBottom();
    else if (isNew) setShowScrollButton(true);
  }, [messages?.length]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollButton(false);
  };

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setIsAtBottom(atBottom);
    if (atBottom) setShowScrollButton(false);
  }, []);

  async function handleSend(content: string) {
    if (!user) return;
    await sendMessage({ conversationId, senderId: user.id, content });
  }

  if (!conversationsLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        <p className="text-sm text-gray-400">Loading conversation...</p>
      </div>
    );
  }

  if (conversation === null) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Conversation not found.</p>
      </div>
    );
  }

  return (
    /*
     * CRITICAL: h-full + flex flex-col + overflow-hidden
     * This makes header and input FIXED, only messages scroll.
     * Works on both desktop and mobile without input disappearing.
     */
    <div className="h-full flex flex-col overflow-hidden bg-white">

      {/* ── HEADER (flex-shrink-0 = never squishes) ── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shadow-sm">
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden flex-shrink-0 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative flex-shrink-0">
          {otherUser?.imageUrl ? (
            <Image src={otherUser.imageUrl} alt={otherUser.name} width={40} height={40} className="rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base">
              {otherUser?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <OnlineIndicator isOnline={otherUser?.isOnline} />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">
            {otherUser?.name ?? (otherUsersRaw === undefined ? "Loading..." : "Unknown User")}
          </h2>
          <p className="text-xs mt-0.5">
            {otherUser?.isOnline
              ? <span className="text-green-500 font-medium">● Online</span>
              : otherUser ? <span className="text-gray-400">● Offline</span> : null}
          </p>
        </div>
      </div>

      {/* ── MESSAGES (flex-1 = takes all remaining space, scrolls internally) ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 bg-gray-50 space-y-1"
      >
        {messages === undefined ? (
          <div className="space-y-4 pt-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn("flex gap-2 animate-pulse", i % 2 === 0 ? "justify-start" : "justify-end")}>
                {i % 2 === 0 && <div className="w-8 h-8 rounded-full bg-gray-200 self-end flex-shrink-0" />}
                <div className={cn("h-10 rounded-2xl bg-gray-200", i % 2 === 0 ? "w-48" : "w-32")} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div className="bg-white rounded-full p-5 shadow-sm">
              {otherUser?.imageUrl ? (
                <Image src={otherUser.imageUrl} alt={otherUser.name} width={56} height={56} className="rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                  {otherUser?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <div>
              <p className="text-gray-800 font-semibold text-lg">Say hello to {otherUser?.name ?? "them"}! 👋</p>
              <p className="text-gray-400 text-sm mt-1">This is the very start of your conversation</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isOwn = msg.senderId === user?.id;
              const prevMsg = messages[idx - 1];
              const showAvatar = !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId);
              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  senderImage={isOwn ? undefined : otherUser?.imageUrl}
                  senderName={isOwn ? undefined : otherUser?.name}
                  currentUserId={user?.id ?? ""}
                  onDelete={() => deleteMessage({ messageId: msg._id, userId: user?.id ?? "" })}
                  onReact={emoji => toggleReaction({ messageId: msg._id, userId: user?.id ?? "", emoji })}
                  userNames={userNames}
                />
              );
            })}
            <TypingIndicator typingUsers={typingUsers ?? []} userMap={userMap} />
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── NEW MESSAGES BUTTON ── */}
      {showScrollButton && (
        <div className="flex-shrink-0 flex justify-center py-1 bg-gray-50">
          <button
            onClick={() => scrollToBottom()}
            className="bg-indigo-600 text-white rounded-full px-4 py-1.5 text-sm shadow-lg flex items-center gap-1.5 hover:bg-indigo-700 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            New messages
          </button>
        </div>
      )}

      {/* ── INPUT (flex-shrink-0 = ALWAYS visible, never pushed off screen) ── */}
      <div className="flex-shrink-0 border-t border-gray-100">
        <MessageInput
          conversationId={conversationId}
          onSend={handleSend}
          currentUserId={user?.id ?? ""}
        />
      </div>
    </div>
  );
}