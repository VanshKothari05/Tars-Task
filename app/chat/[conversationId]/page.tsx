import ChatArea from "@/components/ChatArea";
import { Id } from "@/convex/_generated/dataModel";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  return (
    <ChatArea conversationId={conversationId as Id<"conversations">} />
  );
}