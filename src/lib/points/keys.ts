export const pointsKeys = {
  all: ["points"] as const,
  me: () => [...pointsKeys.all, "me"] as const,
};

export const rewardKeys = {
  all: ["rewards"] as const,
  list: () => [...rewardKeys.all, "list"] as const,
};
