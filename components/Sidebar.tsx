"use client";

import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Search, Users, MessageSquarePlus, X, Check, UsersRound, Plus, UserSearch } from "lucide-react";
import { cn, formatConversationTime } from "@/lib/utils";
import OnlineIndicator from "./OnlineIndicator";
import Image from "next/image";

export default function Sidebar() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const activeId = params?.conversationId as string | undefined;

  const [query, setQuery] = useState("");
  const [showUsers, setShowUsers] = useState(false);

  // Group creation state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const conversations = useQuery(
    api.conversations.getUserConversations,
    user ? { userId: user.id } : "skip"
  );

  const allUsers = useQuery(
    api.users.getAllUsers,
    user ? { currentClerkId: user.id } : "skip"
  );

  const getOrCreate = useMutation(api.conversations.getOrCreateConversation);
  const createGroup = useMutation(api.conversations.createGroupConversation);

  // Build user map for conversation previews
  const participantIds = conversations?.flatMap(c =>
    c.participants.filter(p => p !== user?.id)
  ) ?? [];
  const otherUsersRaw = useQuery(
    api.users.getMultipleUsers,
    participantIds.length > 0 ? { clerkIds: participantIds } : "skip"
  );
  const userMap = new Map(
    (otherUsersRaw ?? [])
      .filter((u): u is NonNullable<typeof u> => u != null)
      .map(u => [u.clerkId, u])
  );

  // Unread counts
  const unreadCounts = useQuery(
    api.messages.getAllUnreadCounts,
    user ? { userId: user.id } : "skip"
  );

  // Last messages for preview
  const lastMessages = useQuery(
    api.messages.getLastMessages,
    conversations?.length ? { conversationIds: conversations.map(c => c._id) } : "skip"
  );
  const lastMsgMap = new Map(
    (lastMessages ?? [])
      .filter((m): m is NonNullable<typeof m> => m != null)
      .map(m => [m.conversationId as string, m])
  );

  const filteredConversations = (conversations ?? []).filter(c => {
    if (!query) return true;
    if (c.isGroup) {
      return c.groupName?.toLowerCase().includes(query.toLowerCase());
    }
    const otherId = c.participants.find(p => p !== user?.id);
    const name = userMap.get(otherId ?? "")?.name ?? "";
    return name.toLowerCase().includes(query.toLowerCase());
  });

  const filteredUsers = (allUsers ?? []).filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  async function openConversation(otherUserId: string) {
    if (!user) return;
    const id = await getOrCreate({ currentUserId: user.id, otherUserId });
    setShowUsers(false);
    setQuery("");
    router.push(`/chat/${id}`);
  }

  function toggleMember(clerkId: string) {
    setSelectedMembers(prev =>
      prev.includes(clerkId) ? prev.filter(id => id !== clerkId) : [...prev, clerkId]
    );
  }

  async function handleCreateGroup() {
    if (!user || !groupName.trim() || selectedMembers.length < 1) return;
    setCreatingGroup(true);
    try {
      const id = await createGroup({
        currentUserId: user.id,
        memberIds: selectedMembers,
        groupName: groupName.trim(),
      });
      setShowGroupModal(false);
      setGroupName("");
      setSelectedMembers([]);
      router.push(`/chat/${id}`);
    } finally {
      setCreatingGroup(false);
    }
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-indigo-600 tracking-tight">Tars Chat</h1>
            <div className="flex items-center gap-2">
              {/* New Group button */}
{/* New Group button */}
<button
  onClick={() => { setShowGroupModal(true); setQuery(""); }}
  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold transition-colors"
  title="Create group chat"
>
  <Plus className="w-3.5 h-3.5" />
  Group
</button>
{/* Find people button */}
<button
  onClick={() => { setShowUsers(v => !v); setQuery(""); }}
  className={cn(
    "p-2 rounded-full transition-colors",
    showUsers
      ? "bg-indigo-100 text-indigo-600"
      : "hover:bg-gray-100 text-gray-500"
  )}
  title={showUsers ? "Show conversations" : "Find people"}
>
  <UserSearch className="w-5 h-5" />
</button>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={showUsers ? "Search users..." : "Search conversations..."}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {showUsers ? (
            <div>
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                All Users
              </p>
              {allUsers === undefined ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-11 h-11 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Users className="w-8 h-8 text-gray-300 mb-2" />
                  <p className="text-gray-500 font-medium">No users found</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {query ? "Try a different search" : "No other users registered yet"}
                  </p>
                </div>
              ) : (
                filteredUsers.map(u => (
                  <button
                    key={u._id}
                    onClick={() => openConversation(u.clerkId)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      {u.imageUrl ? (
                        <Image src={u.imageUrl} alt={u.name} width={44} height={44} className="rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                          {u.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <OnlineIndicator isOnline={u.isOnline} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{u.name}</p>
                      <p className="text-sm text-gray-400 truncate">{u.email}</p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
                      u.isOnline ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                    )}>
                      {u.isOnline ? "Online" : "Offline"}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div>
              {conversations === undefined ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                  <div className="bg-indigo-50 rounded-full p-5">
                    <MessageSquarePlus className="w-9 h-9 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-gray-700 font-semibold">
                      {query ? "No conversations match" : "No conversations yet"}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {query
                        ? "Try a different search"
                        : <>Tap the <span className="font-semibold text-indigo-500">👥 icon</span> above to find people</>}
                    </p>
                  </div>
                  {!query && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed text-left">
                      <strong>💡 To test:</strong> Open this app in an incognito window and sign up with a second account — then they'll appear here!
                    </div>
                  )}
                </div>
              ) : (
                filteredConversations.map(convo => {
                  const isGroup = convo.isGroup;
                  const lastMsg = lastMsgMap.get(convo._id as string);
                  const unread = (unreadCounts ?? {})[convo._id as string] ?? 0;
                  const isActive = convo._id === activeId;

                  // Group conversation
                  if (isGroup) {
                    const memberCount = convo.participants.length;
                    return (
                      <button
                        key={convo._id}
                        onClick={() => router.push(`/chat/${convo._id}`)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
                          isActive
                            ? "bg-indigo-50 border-r-2 border-indigo-600"
                            : "hover:bg-gray-50 active:bg-gray-100"
                        )}
                      >
                
{/* Group avatar — initials + colored ring to distinguish from DMs */}
<div className="relative flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm ring-2 ring-indigo-100">
  <span className="text-white text-sm font-bold tracking-wide">
    {(convo.groupName ?? "G").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
  </span>
</div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              "text-gray-900 truncate",
                              unread > 0 ? "font-bold" : "font-medium"
                            )}>
                              {convo.groupName ?? "Group"}
                            </span>
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {convo.lastMessageTime ? formatConversationTime(convo.lastMessageTime) : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={cn(
                              "text-sm truncate",
                              unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"
                            )}>
                              {memberCount} members
                            </p>
                            {unread > 0 && (
                              <span className="flex-shrink-0 bg-indigo-600 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                {unread > 99 ? "99+" : unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  }

                  // DM conversation
                  const otherId = convo.participants.find(p => p !== user?.id);
                  const other = userMap.get(otherId ?? "");

                  return (
                    <button
                      key={convo._id}
                      onClick={() => router.push(`/chat/${convo._id}`)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
                        isActive
                          ? "bg-indigo-50 border-r-2 border-indigo-600"
                          : "hover:bg-gray-50 active:bg-gray-100"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        {other?.imageUrl ? (
                          <Image src={other.imageUrl} alt={other.name} width={48} height={48} className="rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                            {other?.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        <OnlineIndicator isOnline={other?.isOnline} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn(
                            "text-gray-900 truncate",
                            unread > 0 ? "font-bold" : "font-medium"
                          )}>
                            {other?.name ?? "Unknown"}
                          </span>
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {convo.lastMessageTime ? formatConversationTime(convo.lastMessageTime) : ""}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={cn(
                            "text-sm truncate",
                            unread > 0 ? "text-gray-700 font-medium" : "text-gray-400"
                          )}>
                            {lastMsg?.isDeleted
                              ? "Message deleted"
                              : lastMsg?.content ?? "No messages yet"}
                          </p>
                          {unread > 0 && (
                            <span className="flex-shrink-0 bg-indigo-600 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Group Creation Modal ── */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UsersRound className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-semibold text-gray-900">New Group Chat</h2>
              </div>
              <button
                onClick={() => { setShowGroupModal(false); setGroupName(""); setSelectedMembers([]); }}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Group name input */}
            <div className="px-5 pt-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Group Name
              </label>
              <input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. Project Team, Friends..."
                className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 transition placeholder:text-gray-400"
              />
            </div>

            {/* Members selection */}
            <div className="px-5 pt-4 pb-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Add Members {selectedMembers.length > 0 && <span className="text-indigo-500">({selectedMembers.length} selected)</span>}
              </label>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {(allUsers ?? []).length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No users available</p>
              ) : (
                (allUsers ?? []).map(u => {
                  const isSelected = selectedMembers.includes(u.clerkId);
                  return (
                    <button
                      key={u._id}
                      onClick={() => toggleMember(u.clerkId)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors text-left",
                        isSelected ? "bg-indigo-50" : "hover:bg-gray-50"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        {u.imageUrl ? (
                          <Image src={u.imageUrl} alt={u.name} width={40} height={40} className="rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                            {u.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <OnlineIndicator isOnline={u.isOnline} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Create button */}
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedMembers.length < 1 || creatingGroup}
                className={cn(
                  "w-full py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  groupName.trim() && selectedMembers.length >= 1 && !creatingGroup
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {creatingGroup ? "Creating..." : `Create Group${selectedMembers.length > 0 ? ` (${selectedMembers.length + 1} members)` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}