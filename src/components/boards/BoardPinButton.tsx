"use client";

import { ActionIcon } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import { useState, type MouseEvent } from "react";
import { fetchBoards, setBoardPinned } from "@/lib/boards/api";
import { boardKeys } from "@/lib/boards/keys";
import type { Board, BoardDetail } from "@/lib/boards/types";

type BoardPinButtonProps = {
  boardId: string;
  /** Fallback when boards list cache belum siap (mis. SSR detail). */
  pinned?: boolean;
  size?: "sm" | "md" | "lg";
  iconSize?: number;
};

const PINNED_YELLOW = "var(--mantine-color-yellow-5)";
const UNPINNED_GRAY = "var(--mantine-color-gray-5)";

function sortBoardsPinnedFirst(boards: Board[]): Board[] {
  return [...boards].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function BoardPinButton({
  boardId,
  pinned: pinnedProp = false,
  size = "sm",
  iconSize = 14,
}: BoardPinButtonProps) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  // Sidebar list = source of truth supaya title page & nav selalu sync
  const { data: boards } = useQuery({
    queryKey: boardKeys.lists(),
    queryFn: fetchBoards,
  });

  const pinnedFromList = boards?.find((board) => board.id === boardId)?.pinned;
  const pinned = pinnedFromList ?? pinnedProp;

  async function toggle(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const next = !pinned;
    setPending(true);

    queryClient.setQueryData<Board[]>(boardKeys.lists(), (prev) => {
      if (!prev) return prev;
      return sortBoardsPinnedFirst(
        prev.map((board) =>
          board.id === boardId ? { ...board, pinned: next } : board,
        ),
      );
    });

    queryClient.setQueryData<BoardDetail>(boardKeys.detail(boardId), (prev) => {
      if (!prev) return prev;
      return { ...prev, pinned: next };
    });

    try {
      await setBoardPinned(boardId, next);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
      ]);
    } catch (error) {
      await queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
      await queryClient.invalidateQueries({
        queryKey: boardKeys.detail(boardId),
      });
      notifications.show({
        color: "red",
        title: "Gagal pin board",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setPending(false);
    }
  }

  const iconColor = pinned ? PINNED_YELLOW : UNPINNED_GRAY;

  return (
    <ActionIcon
      component="div"
      variant="transparent"
      size={size}
      loading={pending}
      aria-label={pinned ? "Unpin board" : "Pin board"}
      aria-pressed={pinned}
      onClick={(e) => void toggle(e)}
      style={{ color: iconColor }}
    >
      {pinned ? (
        <IconStarFilled size={iconSize} color={iconColor} />
      ) : (
        <IconStar size={iconSize} color={iconColor} />
      )}
    </ActionIcon>
  );
}
