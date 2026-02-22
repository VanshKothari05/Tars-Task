import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();

    if (args.isTyping) {
      if (existing) {
        await ctx.db.patch(existing._id, { lastTyped: Date.now() });
      } else {
        await ctx.db.insert("typingIndicators", {
          conversationId: args.conversationId,
          userId: args.userId,
          lastTyped: Date.now(),
        });
      }
    } else {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }
  },
});

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
    currentUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const TWO_SECONDS = 2000;
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversationId", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    const now = Date.now();
    return indicators.filter(
      (i) =>
        i.userId !== args.currentUserId &&
        now - i.lastTyped < TWO_SECONDS
    );
  },
});
