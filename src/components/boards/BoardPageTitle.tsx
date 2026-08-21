"use client";

import { ActionIcon, Group, TextInput, Title } from "@mantine/core";
import { IconCheck, IconPencil, IconX } from "@tabler/icons-react";
import { BoardPinButton } from "@/components/boards/BoardPinButton";
import { useRenameBoard } from "@/lib/boards/useRenameBoard";

type BoardPageTitleProps = {
  boardId: string;
  title: string;
  pinned: boolean;
};

export function BoardPageTitle({
  boardId,
  title,
  pinned,
}: BoardPageTitleProps) {
  const {
    renaming,
    draft,
    error,
    saving,
    start,
    cancel,
    save,
    setDraftValue,
  } = useRenameBoard(boardId, title);

  if (renaming) {
    return (
      <Group gap="xs" wrap="nowrap" align="flex-start" maw={560}>
        <TextInput
          value={draft}
          onChange={(e) => setDraftValue(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void save();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          error={error}
          disabled={saving}
          autoFocus
          size="md"
          style={{ flex: 1 }}
          aria-label="Nama board"
        />
        <ActionIcon
          variant="subtle"
          color="teal"
          size="lg"
          loading={saving}
          onClick={() => void save()}
          aria-label="Simpan nama"
          mt={2}
        >
          <IconCheck size={18} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          disabled={saving}
          onClick={cancel}
          aria-label="Batal rename"
          mt={2}
        >
          <IconX size={18} />
        </ActionIcon>
      </Group>
    );
  }

  return (
    <Group gap="xs" wrap="nowrap" align="center">
      <BoardPinButton
        boardId={boardId}
        pinned={pinned}
        size="md"
        iconSize={20}
      />
      <Title order={2}>{title}</Title>
      <ActionIcon
        variant="transparent"
        color="gray"
        size="md"
        onClick={start}
        aria-label="Rename board"
      >
        <IconPencil size={18} />
      </ActionIcon>
    </Group>
  );
}
