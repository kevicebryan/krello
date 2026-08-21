"use client";

import { Group, Paper, Skeleton, Text, ThemeIcon } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { IconCoin } from "@tabler/icons-react";
import { fetchMyPoints } from "@/lib/points/api";
import { pointsKeys } from "@/lib/points/keys";

export function UserPointsCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: pointsKeys.me(),
    queryFn: fetchMyPoints,
  });

  return (
    <Paper withBorder radius="md" p="sm" bg="var(--mantine-color-body)">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon variant="light" color="yellow" radius="md" size="lg">
          <IconCoin size={18} />
        </ThemeIcon>
        <div style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            Poin
          </Text>
          {isLoading ? (
            <Skeleton height={18} width={48} mt={2} />
          ) : isError ? (
            <Text size="sm" c="red" fw={600}>
              —
            </Text>
          ) : (
            <Text size="lg" fw={700} lh={1.2}>
              {data?.total_points ?? 0}
            </Text>
          )}
        </div>
      </Group>
    </Paper>
  );
}
