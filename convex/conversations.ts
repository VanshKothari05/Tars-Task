import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getOrCreateConversation = mutation({
  args: {
    currentUserId: v.string(),
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
 
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
export const createGroupConversation = mutation({
  args: {
    currentUserId: v.string(),
    memberIds: v.array(v.string()), 
    groupName: v.string(),
  },
  handler: async (ctx, args) => {
    const participants = [args.currentUserId, ...args.memberIds];
    return await ctx.db.insert("conversations", {
      participants,
      isGroup: true,
      groupName: args.groupName,
      lastMessageTime: Date.now(),
    });
  },
});
