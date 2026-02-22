import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create a 1-on-1 conversation between two users
export const getOrCreateConversation = mutation({
  args: {
    currentUserId: v.string(),
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Look for an existing DM conversation
    const conversations = await ctx.db.query("conversations").collect();
    const existing = conversations.find(
      (c) =>
        !c.isGroup &&
        c.participants.includes(args.currentUserId) &&
        c.participants.includes(args.otherUserId) &&
        c.participants.length === 2
    );

    if (existing) return existing._id;

    return await ctx.db.insert("conversations", {
      participants: [args.currentUserId, args.otherUserId],
      isGroup: false,
      lastMessageTime: Date.now(),
    });
  },
});

// Get all conversations for a user, sorted by latest message
export const getUserConversations = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_lastMessageTime")
      .order("desc")
      .collect();

    return conversations.filter((c) => c.participants.includes(args.userId));
  },
});

export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});
