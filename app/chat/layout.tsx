"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);
  const setOnlineStatus = useMutation(api.users.setOnlineStatus);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const params = useParams();
  const hasConversation = !!params?.conversationId;

  useEffect(() => {
    if (!user || !isLoaded) return;
    upsertUser({
      clerkId: user.id,
      name: user.fullName ?? user.username ?? "Anonymous",
      email: user.emailAddresses[0]?.emailAddress ?? "",
      imageUrl: user.imageUrl,
    });
    setOnlineStatus({ clerkId: user.id, isOnline: true });
    heartbeatRef.current = setInterval(() => {
      setOnlineStatus({ clerkId: user.id, isOnline: true });
    }, 30000);
    const handleVisibility = () => {
      setOnlineStatus({ clerkId: user.id, isOnline: document.visibilityState !== "hidden" });
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      setOnlineStatus({ clerkId: user.id, isOnline: false });
    };
  }, [user, isLoaded, upsertUser, setOnlineStatus]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-50" style={{ height: "100dvh" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden flex bg-white" style={{ height: "100dvh" }}>
      {/* Sidebar: full width on mobile (when no convo), 320px on desktop */}
      <div className={[
        "flex-shrink-0 border-r border-gray-100 flex flex-col",
        "w-full md:w-80",
        hasConversation ? "hidden md:flex" : "flex",
      ].join(" ")}>
        <Sidebar />
      </div>

      {/* Chat area: hidden on mobile when no convo selected */}
      <div className={[
        "flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden",
        hasConversation ? "flex" : "hidden md:flex",
      ].join(" ")}>
        {children}
      </div>
    </div>
  );
}