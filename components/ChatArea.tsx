"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronDown, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import OnlineIndicator from "./OnlineIndicator";
import { cn } from "@/lib/utils";

export default function ChatArea({
  conversationId,
}: {
  conversationId: Id<"conversations">;
}) {
  const { user } = useUser();
  const router = useRouter();

  const allConversations = useQuery(
    api.conversations.getUserConversations,
    user ? { userId: user.id } : "skip"
  );

  const conversation =
    allConversations?.find((c) => c._id === conversationId) ?? null;

  const conversationsLoaded = allConversations !== undefined;
  const isGroup = conversation?.isGroup ?? false;

  const messages = useQuery(
    api.messages.getMessages,
    conversationId ? { conversationId } : "skip"
  );

  const typingUsers = useQuery(
    api.typing.getTypingUsers,
    user && conversationId
      ? { conversationId, currentUserId: user.id }
      : "skip"
  );

  const markAsRead = useMutation(api.messages.markAsRead);
  const sendMessage = useMutation(api.messages.sendMessage);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const otherParticipantIds =
    conversation?.participants.filter((p) => p !== user?.id) ?? [];

  const otherUsersData = useQuery(
    api.users.getMultipleUsers,
    otherParticipantIds.length > 0
      ? { clerkIds: otherParticipantIds }
      : "skip"
  );

  const otherUsers =
    (otherUsersData ?? []).filter(
      (u): u is NonNullable<typeof u> => u != null
    );

  const otherUser = otherUsers[0] ?? null;
  const userMap = new Map(otherUsers.map((u) => [u.clerkId, u]));

  const userNames = new Map(otherUsers.map((u) => [u.clerkId, u.name]));
  if (user) {
    userNames.set(user.id, user.fullName ?? user.username ?? "You");
  }

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
    if (user && conversationId) {
      markAsRead({ conversationId, userId: user.id });
    }
  }, [conversationId, user, markAsRead]);

  useEffect(() => {
    if (user && messages && isAtBottom) {
      markAsRead({ conversationId, userId: user.id });
    }
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

    if (isNew && isAtBottom) {
      scrollToBottom();
    } else if (isNew) {
      setShowScrollButton(true);
    }
  }, [messages?.length]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowScrollButton(false);
  };

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;

    setIsAtBottom(atBottom);

    if (atBottom) {
      setShowScrollButton(false);
    }
  }, []);

  async function handleSend(content: string) {
    if (!user) return;
    await sendMessage({
      conversationId,
      senderId: user.id,
      content,
    });
  }

  if (!conversationsLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        <p className="text-sm text-gray-400">
          Loading conversation...
        </p>
      </div>
    );
  }

  if (conversation === null) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">
          Conversation not found.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shadow-sm">
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden flex-shrink-0 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative flex-shrink-0">
          {isGroup ? (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold tracking-wide">
                {(conversation.groupName ?? "G")
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </div>
          ) : otherUser?.imageUrl ? (
            <Image
              src={otherUser.imageUrl}
              alt={otherUser.name}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-base">
              {otherUser?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          {!isGroup && (
            <OnlineIndicator isOnline={otherUser?.isOnline} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">
            {isGroup
              ? conversation.groupName ?? "Group Chat"
              : otherUser?.name ??
                (otherUsersData === undefined
                  ? "Loading..."
                  : "Unknown User")}
          </h2>
          <p className="text-xs mt-0.5">
            {isGroup ? (
              <span className="text-gray-400">
                {conversation.participants.length} members
              </span>
            ) : otherUser?.isOnline ? (
              <span className="text-green-500 font-medium">
                ● Online
              </span>
            ) : otherUser ? (
              <span className="text-gray-400">
                ● Offline
              </span>
            ) : null}
          </p>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-3 bg-gray-50 space-y-1"
      >
        {messages === undefined ? (
          <div className="space-y-4 pt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2 animate-pulse",
                  i % 2 === 0
                    ? "justify-start"
                    : "justify-end"
                )}
              >
                {i % 2 === 0 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 self-end flex-shrink-0" />
                )}
                <div
                  className={cn(
                    "h-10 rounded-2xl bg-gray-200",
                    i % 2 === 0 ? "w-48" : "w-32"
                  )}
                />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div className="bg-white rounded-full p-5 shadow-sm">
              {isGroup ? (
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
                  <UsersRound className="w-8 h-8 text-indigo-400" />
                </div>
              ) : otherUser?.imageUrl ? (
                <Image
                  src={otherUser.imageUrl}
                  alt={otherUser.name}
                  width={56}
                  height={56}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-2xl font-bold">
                  {otherUser?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <div>
              {isGroup ? (
                <>
                  <p className="text-gray-800 font-semibold text-lg">
                    Welcome to {conversation.groupName ?? "the group"}! 👋
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {conversation.participants.length} members · Say hello!
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-800 font-semibold text-lg">
                    Say hello to {otherUser?.name ?? "them"}! 👋
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    This is the very start of your conversation
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isOwn = msg.senderId === user?.id;
              const prevMsg = messages[idx - 1];
              const showAvatar =
                !isOwn &&
                (!prevMsg ||
                  prevMsg.senderId !== msg.senderId);

              const senderInfo = isGroup
                ? userMap.get(msg.senderId)
                : otherUser;

              const msgDate = new Date(
                msg.createdAt
              ).toDateString();

              const prevDate = prevMsg
                ? new Date(
                    prevMsg.createdAt
                  ).toDateString()
                : null;

              const showDateSeparator =
                msgDate !== prevDate;

              const today =
                new Date().toDateString();

              const yesterday = new Date(
                Date.now() - 86400000
              ).toDateString();

              const dateLabel =
                msgDate === today
                  ? "Today"
                  : msgDate === yesterday
                  ? "Yesterday"
                  : new Date(
                      msg.createdAt
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

              return (
                <div key={msg._id}>
                  {showDateSeparator && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium px-2">
                        {dateLabel}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}

                  <MessageBubble
                    message={msg}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    senderImage={
                      isOwn
                        ? undefined
                        : senderInfo?.imageUrl
                    }
                    senderName={
                      isOwn
                        ? undefined
                        : senderInfo?.name
                    }
                    currentUserId={
                      user?.id ?? ""
                    }
                    onDelete={() =>
                      deleteMessage({
                        messageId: msg._id,
                        userId:
                          user?.id ?? "",
                      })
                    }
                    onReact={(emoji) =>
                      toggleReaction({
                        messageId: msg._id,
                        userId:
                          user?.id ?? "",
                        emoji,
                      })
                    }
                    userNames={userNames}
                  />
                </div>
              );
            })}

            <TypingIndicator
              typingUsers={typingUsers ?? []}
              userMap={userMap}
            />
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

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