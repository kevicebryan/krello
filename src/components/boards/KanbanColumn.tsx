"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconCalendar,
  IconCheck,
  IconDots,
  IconGripVertical,
  IconPencil,
  IconPlus,
  IconTrash,
  IconTypography,
  IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState, type CSSProperties } from "react";
import { CreateCardModal } from "@/components/boards/CreateCardModal";
import { EditCardModal } from "@/components/boards/EditCardModal";
import { RenameListModal } from "@/components/boards/RenameListModal";
import { deleteCard, deleteList, renameCard } from "@/lib/boards/api";
import {
  cardDragId,
  listDragId,
  listDropId,
} from "@/lib/boards/dnd";
import { boardKeys } from "@/lib/boards/keys";
import { cardTitleSchema } from "@/lib/boards/schemas";
import type { Card, ListWithCards } from "@/lib/boards/types";

type ColumnDialog = "create" | "rename" | "delete" | null;
type CardDialog = "edit" | "delete" | null;

export function SortableKanbanCard({
  boardId,
  card,
}: {
  boardId: string;
  card: Card;
}) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<CardDialog>(null);
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.title);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: cardDragId(card.id),
    data: { type: "card" as const, card },
    disabled: renaming,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  function startRename() {
    setTitleDraft(card.title);
    setTitleError(undefined);
    setRenaming(true);
  }

  function cancelRename() {
    setRenaming(false);
    setTitleDraft(card.title);
    setTitleError(undefined);
  }

  async function saveRename() {
    const parsed = cardTitleSchema.safeParse({ title: titleDraft });
    if (!parsed.success) {
      setTitleError(parsed.error.issues[0]?.message ?? "Judul tidak valid");
      return;
    }

    const nextTitle = parsed.data.title;
    if (nextTitle === card.title) {
      setRenaming(false);
      return;
    }

    setSaving(true);
    try {
      await renameCard(card.id, nextTitle);
      await queryClient.invalidateQueries({
        queryKey: boardKeys.detail(boardId),
      });
      notifications.show({
        color: "teal",
        title: "Tiket diubah",
        message: `Nama diganti jadi "${nextTitle}".`,
      });
      setRenaming(false);
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Gagal rename",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteCard(card.id);
      await queryClient.invalidateQueries({
        queryKey: boardKeys.detail(boardId),
      });
      notifications.show({
        color: "teal",
        title: "Tiket dihapus",
        message: `"${card.title}" sudah dihapus.`,
      });
      setDialog(null);
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Gagal menghapus tiket",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setDeleting(false);
    }
  }

  if (renaming) {
    return (
      <Paper
        ref={setNodeRef}
        style={style}
        p="sm"
        radius="md"
        withBorder
        shadow="xs"
      >
        <Group gap={4} wrap="nowrap" align="flex-start">
          <TextInput
            size="xs"
            value={titleDraft}
            onChange={(e) => {
              setTitleDraft(e.currentTarget.value);
              setTitleError(undefined);
            }}
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
            aria-label="Nama tiket"
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
      </Paper>
    );
  }

  return (
    <>
      <Paper
        ref={setNodeRef}
        style={style}
        p="sm"
        radius="md"
        withBorder
        shadow="xs"
      >
        <Group align="flex-start" gap={6} wrap="nowrap">
          <Box
            style={{ flex: 1, minWidth: 0, cursor: "grab" }}
            {...attributes}
            {...listeners}
          >
            <Text size="sm" fw={500}>
              {card.title}
            </Text>
            {card.description ? (
              <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
                {card.description}
              </Text>
            ) : null}
            {card.deadline ? (
              <Group gap={4} mt={6}>
                <IconCalendar size={12} />
                <Text size="xs" c="dimmed">
                  {dayjs(card.deadline).format("D MMM YYYY")}
                </Text>
              </Group>
            ) : null}
          </Box>

          <Menu shadow="md" width={160} position="bottom-end" withinPortal>
            <Menu.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label={`Aksi tiket ${card.title}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconTypography size={14} />}
                onClick={startRename}
              >
                Rename
              </Menu.Item>
              <Menu.Item
                leftSection={<IconPencil size={14} />}
                onClick={() => setDialog("edit")}
              >
                Edit
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => setDialog("delete")}
              >
                Delete
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Paper>

      {dialog === "edit" ? (
        <EditCardModal
          opened
          onClose={() => setDialog(null)}
          boardId={boardId}
          card={card}
        />
      ) : null}

      <Modal
        opened={dialog === "delete"}
        onClose={() => {
          if (!deleting) setDialog(null);
        }}
        title="Hapus tiket?"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Hapus <Text span fw={600}>{`"${card.title}"`}</Text>? Aksi ini
            tidak bisa dibatalkan.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              disabled={deleting}
              onClick={() => setDialog(null)}
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

type SortableKanbanColumnProps = {
  boardId: string;
  list: ListWithCards;
};

export function SortableKanbanColumn({
  boardId,
  list,
}: SortableKanbanColumnProps) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<ColumnDialog>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: listDragId(list.id),
    data: { type: "list" as const, list },
  });

  const { setNodeRef: setCardsDropRef, isOver } = useDroppable({
    id: listDropId(list.id),
    data: { type: "list-drop" as const, listId: list.id },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    minWidth: 280,
    maxWidth: 320,
    flex: "0 0 280px",
  };

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteList(list.id);
      await queryClient.invalidateQueries({
        queryKey: boardKeys.detail(boardId),
      });
      notifications.show({
        color: "teal",
        title: "Kolom dihapus",
        message: `"${list.title}" dan semua tiket di dalamnya sudah dihapus.`,
      });
      setDialog(null);
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Gagal menghapus kolom",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Paper
        ref={setNodeRef}
        p="md"
        radius="md"
        bg="var(--mantine-color-default-hover)"
        style={style}
      >
        <Group justify="space-between" mb="sm" wrap="nowrap">
          <Group gap={4} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label={`Geser kolom ${list.title}`}
              style={{ cursor: "grab" }}
              {...attributes}
              {...listeners}
            >
              <IconGripVertical size={14} />
            </ActionIcon>
            <Text fw={600} size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
              {list.title}
            </Text>
          </Group>
          <Group gap={4} wrap="nowrap">
            <Badge size="sm" variant="light" circle>
              {list.cards.length}
            </Badge>
            <Menu shadow="md" width={180} position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label={`Aksi kolom ${list.title}`}
                >
                  <IconDots size={14} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconPlus size={14} />}
                  onClick={() => setDialog("create")}
                >
                  Add a ticket
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconPencil size={14} />}
                  onClick={() => setDialog("rename")}
                >
                  Rename
                </Menu.Item>
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => setDialog("delete")}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        <div
          ref={setCardsDropRef}
          style={{
            borderRadius: 8,
            outline: isOver
              ? "2px solid var(--mantine-color-blue-4)"
              : undefined,
            outlineOffset: 2,
            minHeight: 40,
          }}
        >
          <SortableContext
            items={list.cards.map((card) => cardDragId(card.id))}
            strategy={verticalListSortingStrategy}
          >
            <Stack gap="xs">
              {list.cards.map((card) => (
                <SortableKanbanCard
                  key={card.id}
                  boardId={boardId}
                  card={card}
                />
              ))}
              {list.cards.length === 0 ? (
                <Text size="xs" c="dimmed">
                  Belum ada kartu
                </Text>
              ) : null}
              <Button
                variant="light"
                color="gray"
                size="compact-sm"
                justify="flex-start"
                leftSection={<IconPlus size={14} />}
                onClick={() => setDialog("create")}
                bg="transparent"
              >
                Add ticket
              </Button>
            </Stack>
          </SortableContext>
        </div>
      </Paper>

      {dialog === "create" ? (
        <CreateCardModal
          opened
          onClose={() => setDialog(null)}
          boardId={boardId}
          listId={list.id}
          listTitle={list.title}
        />
      ) : null}

      {dialog === "rename" ? (
        <RenameListModal
          opened
          onClose={() => setDialog(null)}
          boardId={boardId}
          listId={list.id}
          currentTitle={list.title}
        />
      ) : null}

      <Modal
        opened={dialog === "delete"}
        onClose={() => {
          if (!deleting) setDialog(null);
        }}
        title="Hapus kolom?"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Hapus <Text span fw={600}>{`"${list.title}"`}</Text>? Semua tiket di
            kolom ini ikut terhapus. Aksi ini tidak bisa dibatalkan.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              disabled={deleting}
              onClick={() => setDialog(null)}
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

export function KanbanCardPreview({ card }: { card: Card }) {
  return (
    <Paper p="sm" radius="md" withBorder shadow="md" w={260}>
      <Text size="sm" fw={500}>
        {card.title}
      </Text>
      {card.description ? (
        <Text size="xs" c="dimmed" mt={4} lineClamp={2}>
          {card.description}
        </Text>
      ) : null}
      {card.deadline ? (
        <Group gap={4} mt={6}>
          <IconCalendar size={12} />
          <Text size="xs" c="dimmed">
            {dayjs(card.deadline).format("D MMM YYYY")}
          </Text>
        </Group>
      ) : null}
    </Paper>
  );
}
