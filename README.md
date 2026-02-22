# Tars Chat — Real-time Messaging App

Built with **Next.js 15**, **TypeScript**, **Convex**, and **Clerk**.

## Features

- ✅ Authentication (Clerk — email + social login)
- ✅ User list & search (find other registered users)
- ✅ One-on-one direct messages (real-time via Convex)
- ✅ Message timestamps (smart formatting)
- ✅ Empty states (no conversations, no messages, no results)
- ✅ Responsive layout (mobile sidebar → full-screen chat)
- ✅ Online/Offline status (live green indicator)
- ✅ Typing indicator ("Alex is typing...")
- ✅ Unread message count badge (per conversation)
- ✅ Smart auto-scroll ("↓ New messages" button)
- ✅ Delete own messages (soft delete, shows "This message was deleted")
- ✅ Message reactions (👍 ❤️ 😂 😮 😢)
- ✅ Loading & error states (skeleton loaders, retry on send failure)

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Convex** — backend, database, real-time subscriptions
- **Clerk** — authentication
- **Tailwind CSS** — styling

---

## Setup Guide

### 1. Clone & Install

```bash
git clone https://github.com/your-username/tars-chat.git
cd tars-chat
npm install
```

### 2. Set up Clerk

1. Go to [clerk.com](https://clerk.com) → Create a new application
2. Enable Email + any social providers you want
3. Copy your keys from the Clerk dashboard

### 3. Set up Convex

```bash
npx convex dev
```

This will:
- Ask you to log in / create an account at convex.dev
- Create a new project
- Generate the `NEXT_PUBLIC_CONVEX_URL`
- Auto-generate types in `convex/_generated/`

### 4. Environment Variables

Create a `.env.local` file (copy from `.env.local.example`):

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/chat
```

### 5. Configure Clerk + Convex JWT

In the Clerk dashboard:
1. Go to **JWT Templates** → New template → Select **Convex**
2. Copy the issuer URL (looks like `https://xxx.clerk.accounts.dev`)

In Convex dashboard (or `convex/auth.config.ts`):
```ts
export default {
  providers: [
    {
      domain: "https://xxx.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
```

Or create `convex/auth.config.ts` with your Clerk frontend API URL.

### 6. Run Locally

Two terminals:

```bash
# Terminal 1 — Convex backend
npx convex dev

# Terminal 2 — Next.js frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com)
3. Add all env vars from `.env.local` in Vercel's Environment Variables settings
4. Deploy!

For Convex production:
```bash
npx convex deploy
```

---

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout (Clerk + Convex providers)
│   ├── page.tsx                # Redirect to /chat or /sign-in
│   ├── sign-in/                # Clerk sign-in page
│   ├── sign-up/                # Clerk sign-up page
│   └── chat/
│       ├── layout.tsx          # Chat layout (user sync, online status)
│       ├── page.tsx            # Empty state when no convo selected
│       └── [conversationId]/   # Individual conversation view
├── components/
│   ├── ConvexClientProvider.tsx # Convex + Clerk auth bridge
│   ├── Sidebar.tsx             # Left panel: conversation list + user search
│   ├── ChatArea.tsx            # Right panel: messages + header
│   ├── MessageBubble.tsx       # Individual message with reactions + delete
│   ├── MessageInput.tsx        # Text input with typing indicator + error retry
│   ├── TypingIndicator.tsx     # Animated dots + "X is typing..."
│   └── OnlineIndicator.tsx     # Green/grey dot
├── convex/
│   ├── schema.ts               # Database tables definition
│   ├── users.ts                # User CRUD + online status
│   ├── conversations.ts        # Get/create conversations
│   ├── messages.ts             # Send, delete, react, unread counts
│   └── typing.ts               # Typing indicator mutations/queries
└── lib/
    └── utils.ts                # cn() helper, timestamp formatters
```

## Schema Design

```
users          — clerkId, name, email, imageUrl, isOnline, lastSeen
conversations  — participants[], isGroup, lastMessageTime
messages       — conversationId, senderId, content, isDeleted, reactions[]
typingIndicators — conversationId, userId, lastTyped
readReceipts   — conversationId, userId, lastReadTime
```

All tables have appropriate indexes for fast queries.
