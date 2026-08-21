"use client";

import {
  ActionIcon,
  Button,
  Group,
  Menu,
  Modal,
  NavLink,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconCheck,
  IconDots,
  IconLayoutKanban,
  IconPencil,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { deleteBoard, fetchBoards } from "@/lib/boards/api";
import { boardKeys } from "@/lib/boards/keys";
import type { Board } from "@/lib/boards/types";
import { useRenameBoard } from "@/lib/boards/useRenameBoard";
import { BoardPinButton } from "@/components/boards/BoardPinButton";

type BoardsNavProps = {
  onNavigate?: () => void;
};

type BoardNavItemProps = {
  board: Board;
  active: boolean;
  onNavigate?: () => void;
};

function BoardNavItem({ board, active, onNavigate }: BoardNavItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const {
    renaming,
    draft,
    error: titleError,
    saving,
    start: startRename,
    cancel: cancelRename,
    save: saveRename,
    setDraftValue,
  } = useRenameBoard(board.id, board.title);
  const [deleteOpened, setDeleteOpened] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const href = `/boards/${board.id}`;

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteBoard(board.id);
      await queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
      queryClient.removeQueries({ queryKey: boardKeys.detail(board.id) });
      notifications.show({
        color: "teal",
        title: "Board dihapus",
        message: `"${board.title}" sudah dihapus.`,
      });
      setDeleteOpened(false);
      if (pathname === href) {
        router.replace("/");
      }
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Gagal menghapus",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setDeleting(false);
    }
  }

  if (renaming) {
    return (
      <Group gap={4} wrap="nowrap" px={4} py={2}>
        <TextInput
          size="xs"
          value={draft}
          onChange={(e) => setDraftValue(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void saveRename();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancelRename();
            }
          }}
          error={titleError}
          disabled={saving}
          autoFocus
          style={{ flex: 1 }}
          aria-label="Nama board"
        />
        <ActionIcon
          variant="subtle"
          color="teal"
          size="sm"
          loading={saving}
          onClick={() => void saveRename()}
          aria-label="Simpan nama"
        >
          <IconCheck size={14} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          disabled={saving}
          onClick={cancelRename}
          aria-label="Batal rename"
        >
          <IconX size={14} />
        </ActionIcon>
      </Group>
    );
  }

  return (
    <>
      <NavLink
        component={Link}
        href={href}
        label={board.title}
        leftSection={<IconLayoutKanban size={16} />}
        active={active}
        onClick={onNavigate}
        rightSection={
          <Group gap={2} wrap="nowrap" onClick={(e) => e.preventDefault()}>
            <BoardPinButton boardId={board.id} pinned={board.pinned} />
            <Menu shadow="md" width={160} position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon
                  component="div"
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={`Aksi board ${board.title}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <IconDots size={14} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconPencil size={14} />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startRename();
                  }}
                >
                  Rename
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteOpened(true);
                  }}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        }
      />

      <Modal
        opened={deleteOpened}
        onClose={() => {
          if (!deleting) setDeleteOpened(false);
        }}
        title="Hapus board?"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Hapus <Text span fw={600}>{`"${board.title}"`}</Text>? Semua list
            dan kartu di dalamnya ikut terhapus. Aksi ini tidak bisa dibatalkan.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              disabled={deleting}
              onClick={() => setDeleteOpened(false)}
            >
              Batal
            </Button>
            <Button
              color="red"
              loading={deleting}
              onClick={() => void confirmDelete()}
            >
              Hapus
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

export function BoardsNav({ onNavigate }: BoardsNavProps) {
  const pathname = usePathname();
  const { data: boards = [], isLoading, isError } = useQuery({
    queryKey: boardKeys.lists(),
    queryFn: fetchBoards,
  });

  if (isLoading) {
    return (
      <Text size="sm" c="dimmed">
        Memuat boards…
      </Text>
    );
  }

  if (isError) {
    return (
      <Text size="sm" c="red">
        Gagal memuat boards.
      </Text>
    );
  }

  if (boards.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Belum ada board.
      </Text>
    );
  }

  return (
    <Stack gap={4}>
      {boards.map((board) => (
        <BoardNavItem
          key={board.id}
          board={board}
          active={pathname === `/boards/${board.id}`}
          onNavigate={onNavigate}
        />
      ))}
    </Stack>
  );
}
