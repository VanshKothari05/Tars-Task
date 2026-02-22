import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
    isOnline: v.boolean(),
    lastSeen: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  conversations: defineTable({
    participants: v.array(v.string()), // clerkIds
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    groupImage: v.optional(v.string()),
    lastMessageTime: v.number(),
  }).index("by_lastMessageTime", ["lastMessageTime"]),

  messages: defineTable({
  conversationId: v.id("conversations"),
  senderId: v.string(), // clerkId
  content: v.string(),
  createdAt: v.number(), // 🔥 required
  isDeleted: v.boolean(),
  reactions: v.array(
    v.object({
      userId: v.string(),
      emoji: v.string(),
    })
  ),
})
  .index("by_conversation", ["conversationId"])
  .index("by_conversation_createdAt", ["conversationId", "createdAt"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(), // clerkId
    lastTyped: v.number(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_userId", ["conversationId", "userId"]),

  readReceipts: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(), // clerkId
    lastReadTime: v.number(),
  })
    .index("by_conversationId_userId", ["conversationId", "userId"])
    .index("by_userId", ["userId"]),
});
