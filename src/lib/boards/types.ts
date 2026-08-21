export type Board = {
  id: string;
  user_id: string;
  title: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type List = {
  id: string;
  board_id: string;
  created_by: string;
  title: string;
  key: string;
  /** At most one list per board may be the Done column (+3 pts on move-in). */
  is_done: boolean;
  position: number;
  created_at: string;
};

export type Card = {
  id: string;
  list_id: string;
  created_by: string;
  category_id: string | null;
  title: string;
  description: string | null;
  deadline: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ListWithCards = List & {
  cards: Card[];
};

export type BoardDetail = Board & {
  lists: ListWithCards[];
};
