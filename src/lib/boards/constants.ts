/** Matches private.seed_board in supabase/fase3_board_seed.sql */
export const DEFAULT_BOARD_LISTS = [
  { title: "Todo", key: "todo", position: 0 },
  { title: "In Progress", key: "in_progress", position: 1 },
  { title: "Done", key: "done", position: 2 },
] as const;

export const DEFAULT_STARTER_CARD_TITLE = "Get homework done";
