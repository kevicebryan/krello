import { createClient } from "@/lib/supabase/client";
import { getBoardDetail, listBoards } from "@/lib/boards/queries";
import type { Board, BoardDetail, Card } from "@/lib/boards/types";

export async function fetchBoards(): Promise<Board[]> {
  return listBoards(createClient());
}

export async function createBoard(title: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_board_with_defaults", {
    p_title: title,
  });

  if (error) throw error;
  if (typeof data !== "string") {
    throw new Error("Board id tidak valid dari server");
  }
  return data;
}

export async function fetchBoardDetail(boardId: string): Promise<BoardDetail> {
  const board = await getBoardDetail(createClient(), boardId);
  if (!board) {
    throw new Error("Board tidak ditemukan");
  }
  return board;
}

export async function renameBoard(
  boardId: string,
  title: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("boards")
    .update({ title })
    .eq("id", boardId);

  if (error) throw error;
}

export async function deleteBoard(boardId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("boards").delete().eq("id", boardId);

  if (error) throw error;
}

export async function setBoardPinned(
  boardId: string,
  pinned: boolean,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("boards")
    .update({ pinned })
    .eq("id", boardId);

  if (error) throw error;
}

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) throw new Error("Belum login");
  return user.id;
}

function toDateOnly(deadline: Date): string {
  const year = deadline.getFullYear();
  const month = String(deadline.getMonth() + 1).padStart(2, "0");
  const day = String(deadline.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDeadline(
  deadline?: Date | string | null,
): string | null {
  if (!deadline) return null;
  if (typeof deadline === "string") {
    return deadline.slice(0, 10);
  }
  return toDateOnly(deadline);
}

export async function createCard(input: {
  listId: string;
  title: string;
  description?: string;
  deadline?: Date | string | null;
}): Promise<Card> {
  const supabase = createClient();
  const userId = await requireUserId();

  const { data: existing, error: positionError } = await supabase
    .from("cards")
    .select("position")
    .eq("list_id", input.listId)
    .order("position", { ascending: false })
    .limit(1);

  if (positionError) throw positionError;

  const nextPosition =
    existing && existing.length > 0 ? (existing[0].position as number) + 1 : 0;

  const { data, error } = await supabase
    .from("cards")
    .insert({
      list_id: input.listId,
      created_by: userId,
      title: input.title,
      description: input.description ?? null,
      deadline: normalizeDeadline(input.deadline),
      position: nextPosition,
    })
    .select(
      "id, list_id, created_by, category_id, title, description, deadline, position, created_at, updated_at",
    )
    .single();

  if (error) throw error;
  return data as Card;
}

export async function updateCard(
  cardId: string,
  input: {
    title: string;
    description?: string;
    deadline?: Date | string | null;
  },
): Promise<Card> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cards")
    .update({
      title: input.title,
      description: input.description ?? null,
      deadline: normalizeDeadline(input.deadline),
    })
    .eq("id", cardId)
    .select(
      "id, list_id, created_by, category_id, title, description, deadline, position, created_at, updated_at",
    )
    .single();

  if (error) throw error;
  return data as Card;
}

export async function renameCard(
  cardId: string,
  title: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("cards")
    .update({ title })
    .eq("id", cardId);

  if (error) throw error;
}

export async function deleteCard(cardId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("cards").delete().eq("id", cardId);

  if (error) throw error;
}

export async function renameList(
  listId: string,
  title: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("lists")
    .update({ title })
    .eq("id", listId);

  if (error) throw error;
}

export async function updateList(
  listId: string,
  input: { title: string; isDone: boolean },
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("lists")
    .update({ title: input.title, is_done: input.isDone })
    .eq("id", listId);

  if (error) throw error;
}

/** Points awarded when a card enters an is_done list (DB trigger). */
export const DONE_LIST_POINTS = 3;

export async function deleteList(listId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("lists").delete().eq("id", listId);

  if (error) throw error;
}

/** Persist column order after list drag-and-drop. */
export async function syncListPositions(
  orderedListIds: string[],
): Promise<void> {
  const supabase = createClient();
  const results = await Promise.all(
    orderedListIds.map((id, position) =>
      supabase.from("lists").update({ position }).eq("id", id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}

/** Persist card list + order after card drag-and-drop. */
export async function syncCardPlacements(
  placements: { cardId: string; listId: string; position: number }[],
): Promise<void> {
  if (placements.length === 0) return;

  const supabase = createClient();
  const results = await Promise.all(
    placements.map(({ cardId, listId, position }) =>
      supabase
        .from("cards")
        .update({ list_id: listId, position })
        .eq("id", cardId)
        .select("id")
        .maybeSingle(),
    ),
  );

  for (const result of results) {
    if (result.error) throw result.error;
    if (!result.data) {
      throw new Error(
        "Gagal menyimpan posisi tiket (RLS menolak atau tiket tidak ditemukan)",
      );
    }
  }
}
