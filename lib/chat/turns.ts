import { MAX_CHAT_TURNS } from "@/lib/constants";

export type ChatTurn = {
  role: "user" | "assistant";
  text: string;
};

const turnsByDocument = new Map<string, ChatTurn[]>();

export function getChatTurns(documentId: string): ChatTurn[] {
  return [...(turnsByDocument.get(documentId) ?? [])];
}

export function appendChatTurns(documentId: string, turns: ChatTurn[]): void {
  const next = [...getChatTurns(documentId), ...turns];
  while (next.length > MAX_CHAT_TURNS) {
    next.shift();
  }
  turnsByDocument.set(documentId, next);
}

export function resetChatTurnsForTests(): void {
  turnsByDocument.clear();
}
