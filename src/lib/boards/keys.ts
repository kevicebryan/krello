export const boardKeys = {
  all: ["boards"] as const,
  lists: () => [...boardKeys.all, "list"] as const,
  detail: (boardId: string) => [...boardKeys.all, "detail", boardId] as const,
};
