export type UserPoints = {
  user_id: string;
  total_points: number;
  current_streak: number;
  last_activity_at: string | null;
  updated_at: string;
};

export type Reward = {
  id: string;
  key: string;
  name: string;
  description: string;
  cost_points: number;
  is_active: boolean;
  position: number;
  created_at: string;
};
