import { atom } from "jotai";

export const editingMessageIdsAtom = atom<string[]>([]);

export const setMessageEditingAtom = atom(
  null,
  (get, set, { isEditing, messageId }: { isEditing: boolean; messageId: string }) => {
    const next = new Set(get(editingMessageIdsAtom));

    if (isEditing) {
      next.add(messageId);
    } else {
      next.delete(messageId);
    }

    set(editingMessageIdsAtom, [...next]);
  },
);

export const clearEditingMessagesAtom = atom(null, (_get, set) => {
  set(editingMessageIdsAtom, []);
});
