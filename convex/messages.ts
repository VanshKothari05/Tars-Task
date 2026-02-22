import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      content: args.content,
      createdAt: Date.now(),      // 🔥 REQUIRED
      isDeleted: false,
      reactions: [],
    });

    // update last message time for sidebar
    await ctx.db.patch(args.conversationId, {
      lastMessageTime: Date.now(),
    });

    return messageId;
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message || message.senderId !== args.userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.messageId, { isDeleted: true });
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    userId: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const existingIndex = message.reactions.findIndex(
      (r) => r.userId === args.userId && r.emoji === args.emoji
    );

    let newReactions;
    if (existingIndex >= 0) {
      // Remove the reaction
      newReactions = message.reactions.filter((_, i) => i !== existingIndex);
    } else {
      // Add reaction, removing any other emoji from same user first
      const filtered = message.reactions.filter(
        (r) => !(r.userId === args.userId && r.emoji === args.emoji)
      );
      newReactions = [...filtered, { userId: args.userId, emoji: args.emoji }];
    }

    await ctx.db.patch(args.messageId, { reactions: newReactions });
  },
});

// Count unread messages per conversation for a user
export const getUnreadCount = query({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const receipt = await ctx.db
      .query("readReceipts")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();

    const lastReadTime = receipt?.lastReadTime ?? 0;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return messages.filter(
      (m) =>
        m.senderId !== args.userId &&
        m._creationTime > lastReadTime &&
        !m.isDeleted
    ).length;
  },
});

// Bulk unread counts for all conversations of a user
export const getAllUnreadCounts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const receipts = await ctx.db
      .query("readReceipts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const receiptMap = new Map(receipts.map((r) => [r.conversationId, r.lastReadTime]));

    const allMessages = await ctx.db.query("messages").collect();

    const counts: Record<string, number> = {};
    for (const msg of allMessages) {
      if (msg.senderId === args.userId || msg.isDeleted) continue;
      const lastRead = receiptMap.get(msg.conversationId) ?? 0;
      if (msg._creationTime > lastRead) {
        const key = msg.conversationId as string;
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }
    return counts;
  },
});

// Get last message for each conversation (for sidebar previews)
export const getLastMessages = query({
  args: { conversationIds: v.array(v.id("conversations")) },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.conversationIds.map(async (id) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", id))
          .order("desc")
          .take(1);
        return messages[0] ?? null;
      })
    );
    return results.filter(Boolean);
  },
});

export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("readReceipts")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastReadTime: Date.now() });
    } else {
      await ctx.db.insert("readReceipts", {
        conversationId: args.conversationId,
        userId: args.userId,
        lastReadTime: Date.now(),
      });
    }
  },
});
