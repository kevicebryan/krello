"use client";

import {
  Button,
  Group,
  Paper,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconCoffee,
  IconCoin,
  IconHourglass,
  IconLeaf,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import {
  fetchActiveRewards,
  fetchMyPoints,
  redeemReward,
} from "@/lib/points/api";
import { pointsKeys, rewardKeys } from "@/lib/points/keys";
import type { Reward } from "@/lib/points/types";

function rewardIcon(key: string): ReactNode {
  if (key === "coffee") return <IconCoffee size={18} />;
  if (key === "free_time") return <IconHourglass size={18} />;
  if (key === "matcha_break") return <IconLeaf size={18} />;
  return <IconCoin size={18} />;
}

function RewardRow({
  reward,
  balance,
  redeemingId,
  onRedeem,
}: {
  reward: Reward;
  balance: number;
  redeemingId: string | null;
  onRedeem: (id: string) => void;
}) {
  const canAfford = balance >= reward.cost_points;
  const isRedeeming = redeemingId === reward.id;

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" align="flex-start">
          <ThemeIcon
            variant="light"
            color="lightBlue"
            radius="md"
            size="lg"
            style={{ flexShrink: 0 }}
          >
            {rewardIcon(reward.key)}
          </ThemeIcon>
          <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
            <Text fw={600} size="sm">
              {reward.name}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={3}>
              {reward.description}
            </Text>
          </Stack>
        </Group>

        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
            <IconCoin size={16} color="var(--mantine-color-yellow-6)" />
            <Text size="sm" fw={600}>
              {reward.cost_points} poin
            </Text>
          </Group>
          <Button
            size="sm"
            px="md"
            style={{ flexShrink: 0 }}
            disabled={!canAfford || redeemingId !== null}
            loading={isRedeeming}
            onClick={() => onRedeem(reward.id)}
          >
            Redeem
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

export function PointShop() {
  const queryClient = useQueryClient();

  const pointsQuery = useQuery({
    queryKey: pointsKeys.me(),
    queryFn: fetchMyPoints,
  });

  const rewardsQuery = useQuery({
    queryKey: rewardKeys.list(),
    queryFn: fetchActiveRewards,
  });

  const redeemMutation = useMutation({
    mutationFn: redeemReward,
    onSuccess: (updated, rewardId) => {
      queryClient.setQueryData(pointsKeys.me(), updated);
      const reward = rewardsQuery.data?.find((item) => item.id === rewardId);
      notifications.show({
        color: "teal",
        title: "Redeem berhasil",
        message: reward
          ? `Kamu menukar ${reward.name}. Sisa poin: ${updated.total_points}.`
          : `Sisa poin: ${updated.total_points}.`,
      });
    },
    onError: (error) => {
      notifications.show({
        color: "red",
        title: "Redeem gagal",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    },
  });

  const balance = pointsQuery.data?.total_points ?? 0;
  const loading = pointsQuery.isLoading || rewardsQuery.isLoading;

  return (
    <Stack gap="lg" maw={560}>
      <Paper withBorder radius="md" p="md">
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon variant="light" color="yellow" radius="md" size="lg">
            <IconCoin size={18} />
          </ThemeIcon>
          <div>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              Saldo poin
            </Text>
            {pointsQuery.isLoading ? (
              <Skeleton height={22} width={48} mt={2} />
            ) : (
              <Text size="xl" fw={700} lh={1.2}>
                {balance}
              </Text>
            )}
          </div>
        </Group>
      </Paper>

      {loading ? (
        <Stack gap="sm">
          <Skeleton height={120} radius="md" />
          <Skeleton height={120} radius="md" />
        </Stack>
      ) : rewardsQuery.isError ? (
        <Text size="sm" c="red">
          Gagal memuat katalog hadiah.
        </Text>
      ) : (rewardsQuery.data?.length ?? 0) === 0 ? (
        <Text size="sm" c="dimmed">
          Belum ada hadiah yang bisa ditukar.
        </Text>
      ) : (
        <Stack gap="sm">
          {rewardsQuery.data!.map((reward) => (
            <RewardRow
              key={reward.id}
              reward={reward}
              balance={balance}
              redeemingId={
                redeemMutation.isPending
                  ? (redeemMutation.variables ?? null)
                  : null
              }
              onRedeem={(id) => redeemMutation.mutate(id)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
