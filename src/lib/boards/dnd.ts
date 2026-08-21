export type DragType = "list" | "card";

export function listDragId(listId: string): string {
  return `list:${listId}`;
}

export function listDropId(listId: string): string {
  return `list-drop:${listId}`;
}

export function cardDragId(cardId: string): string {
  return `card:${cardId}`;
}

export function parseListDragId(id: string): string | null {
  return id.startsWith("list:") && !id.startsWith("list-drop:")
    ? id.slice(5)
    : null;
}

export function parseListDropId(id: string): string | null {
  return id.startsWith("list-drop:") ? id.slice(10) : null;
}

export function parseCardDragId(id: string): string | null {
  return id.startsWith("card:") ? id.slice(5) : null;
}

export function cardPlacementsFromLists(
  lists: { id: string; cards: { id: string }[] }[],
): { cardId: string; listId: string; position: number }[] {
  return lists.flatMap((list) =>
    list.cards.map((card, position) => ({
      cardId: card.id,
      listId: list.id,
      position,
    })),
  );
}
