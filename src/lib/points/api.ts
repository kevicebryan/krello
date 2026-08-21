import { createClient } from "@/lib/supabase/client";
import type { Reward, UserPoints } from "@/lib/points/types";

export async function fetchMyPoints(): Promise<UserPoints> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Belum login");

  const { data, error } = await supabase
    .from("user_points")
    .select(
      "user_id, total_points, current_streak, last_activity_at, updated_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      user_id: user.id,
      total_points: 0,
      current_streak: 0,
      last_activity_at: null,
      updated_at: new Date().toISOString(),
    };
  }

  return data as UserPoints;
}

export async function fetchActiveRewards(): Promise<Reward[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rewards")
    .select(
      "id, key, name, description, cost_points, is_active, position, created_at",
    )
    .eq("is_active", true)
    .order("position", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Reward[];
}

export async function redeemReward(rewardId: string): Promise<UserPoints> {
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Belum login");

  const { data: reward, error: rewardError } = await supabase
    .from("rewards")
    .select("id, cost_points, is_active, name")
    .eq("id", rewardId)
    .maybeSingle();

  if (rewardError) throw rewardError;
  if (!reward || !reward.is_active) {
    throw new Error("Hadiah tidak ditemukan");
  }

  const cost = reward.cost_points as number;

  const { data: current, error: pointsError } = await supabase
    .from("user_points")
    .select("total_points")
    .eq("user_id", user.id)
    .maybeSingle();

  if (pointsError) throw pointsError;

  const balance = current?.total_points ?? 0;
  if (balance < cost) {
    throw new Error("Poin tidak cukup");
  }

  const { data: updated, error: updateError } = await supabase
    .from("user_points")
    .update({ total_points: balance - cost })
    .eq("user_id", user.id)
    .gte("total_points", cost)
    .select(
      "user_id, total_points, current_streak, last_activity_at, updated_at",
    )
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) {
    throw new Error("Poin tidak cukup");
  }

  return updated as UserPoints;
}
