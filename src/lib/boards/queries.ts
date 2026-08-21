import type { SupabaseClient } from "@supabase/supabase-js";
import type { Board, BoardDetail, Card, List } from "@/lib/boards/types";

export async function listBoards(supabase: SupabaseClient): Promise<Board[]> {
  const { data, error } = await supabase
    .from("boards")
    .select("id, user_id, title, pinned, created_at, updated_at")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Board[];
}

export async function getBoardDetail(
  supabase: SupabaseClient,
  boardId: string,
): Promise<BoardDetail | null> {
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id, user_id, title, pinned, created_at, updated_at")
    .eq("id", boardId)
    .maybeSingle();

  if (boardError) throw boardError;
  if (!board) return null;

  const { data: lists, error: listsError } = await supabase
    .from("lists")
    .select("id, board_id, created_by, title, key, position, created_at")
    .eq("board_id", boardId)
    .order("position", { ascending: true });

  if (listsError) throw listsError;

  const listRows = (lists ?? []) as List[];
  const listIds = listRows.map((list) => list.id);

  let cards: Card[] = [];
  if (listIds.length > 0) {
    const { data: cardRows, error: cardsError } = await supabase
      .from("cards")
      .select(
        "id, list_id, created_by, category_id, title, description, deadline, position, created_at, updated_at",
      )
      .in("list_id", listIds)
      .order("position", { ascending: true });

    if (cardsError) throw cardsError;
    cards = (cardRows ?? []) as Card[];
  }

  const cardsByList = new Map<string, Card[]>();
  for (const card of cards) {
    const bucket = cardsByList.get(card.list_id) ?? [];
    bucket.push(card);
    cardsByList.set(card.list_id, bucket);
  }

  return {
    ...(board as Board),
    lists: listRows.map((list) => ({
      ...list,
      cards: cardsByList.get(list.id) ?? [],
    })),
  };
}
