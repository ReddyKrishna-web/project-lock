import { requireUser } from "@/lib/auth/actions";
import { chatHistoryForView, getOrCreateConversation } from "@/lib/services/chat";
import { ChatView } from "@/components/app/chat-view";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await requireUser();
  const conversationId = await getOrCreateConversation(user.id);
  const history = await chatHistoryForView(conversationId);

  return (
    <div>
      <ChatView
        userName={user.name}
        initialMessages={history.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          meta: m.meta as MsgMeta,
        }))}
      />
    </div>
  );
}

type MsgMeta = {
  actions?: { label: string; href: string }[];
  suggested?: string[];
} | null;