"use client";

export default function TypingIndicator({
  typingUsers,
  userMap,
}: {
  typingUsers: { userId: string; lastTyped: number }[];
  userMap: Map<string, any>;
}) {
  if (typingUsers.length === 0) return null;

  const names = typingUsers
    .map((t) => userMap.get(t.userId)?.name ?? "Someone")
    .join(", ");

  return (
    <div className="flex items-center gap-2 px-2 py-1 animate-fade-in">
      <div className="flex gap-0.5">
        <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
        <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
        <span className="typing-dot w-1.5 h-1.5 bg-gray-400 rounded-full inline-block" />
      </div>
      <span className="text-xs text-gray-400">
        {names} {typingUsers.length === 1 ? "is" : "are"} typing...
      </span>
    </div>
  );
}
