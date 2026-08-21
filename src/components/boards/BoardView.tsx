"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { Badge, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { BoardPageTitle } from "@/components/boards/BoardPageTitle";
import {
  KanbanCardPreview,
  SortableKanbanColumn,
} from "@/components/boards/KanbanColumn";
import {
  DONE_LIST_POINTS,
  fetchBoardDetail,
  syncCardPlacements,
  syncListPositions,
} from "@/lib/boards/api";
import {
  cardPlacementsFromLists,
  listDragId,
  parseCardDragId,
  parseListDragId,
  parseListDropId,
} from "@/lib/boards/dnd";
import { boardKeys } from "@/lib/boards/keys";
import type { BoardDetail, Card, ListWithCards } from "@/lib/boards/types";
import { celebrateDone } from "@/lib/celebrate";
import { pointsKeys } from "@/lib/points/keys";
import type { UserPoints } from "@/lib/points/types";

type BoardViewProps = {
  boardId: string;
  initialData?: BoardDetail;
};

function findListIdByCard(
  lists: ListWithCards[],
  cardId: string,
): string | null {
  for (const list of lists) {
    if (list.cards.some((card) => card.id === cardId)) {
      return list.id;
    }
  }
  return null;
}

function resolveOverListId(
  lists: ListWithCards[],
  overId: UniqueIdentifier,
): string | null {
  const asString = String(overId);
  return (
    parseListDropId(asString) ??
    parseListDragId(asString) ??
    (() => {
      const cardId = parseCardDragId(asString);
      return cardId ? findListIdByCard(lists, cardId) : null;
    })()
  );
}

function placementsEqual(
  a: ReturnType<typeof cardPlacementsFromLists>,
  b: ReturnType<typeof cardPlacementsFromLists>,
): boolean {
  if (a.length !== b.length) return false;
  const key = (p: { cardId: string; listId: string; position: number }) =>
    `${p.cardId}:${p.listId}:${p.position}`;
  const bKeys = new Set(b.map(key));
  return a.every((p) => bKeys.has(key(p)));
}

function ListPreview({ list }: { list: ListWithCards }) {
  return (
    <Paper
      p="md"
      radius="md"
      bg={
        list.is_done
          ? "var(--mantine-color-teal-light)"
          : "var(--mantine-color-default-hover)"
      }
      shadow="md"
      style={{ minWidth: 280, maxWidth: 320, opacity: 0.95 }}
    >
      <Group justify="space-between" mb="sm">
        <Text fw={600} size="sm">
          {list.title}
        </Text>
        <Badge size="sm" variant="light" circle>
          {list.cards.length}
        </Badge>
      </Group>
      <Text size="xs" c="dimmed">
        {list.cards.length} tiket
      </Text>
    </Paper>
  );
}

function BoardKanban({
  boardId,
  lists: serverLists,
}: {
  boardId: string;
  lists: ListWithCards[];
}) {
  const queryClient = useQueryClient();
  const [lists, setLists] = useState(serverLists);
  const [prevServerLists, setPrevServerLists] = useState(serverLists);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const listsRef = useRef(lists);
  const cardOriginListIdRef = useRef<string | null>(null);

  // Sync from server when query data changes (avoid setState-in-effect).
  if (serverLists !== prevServerLists) {
    setPrevServerLists(serverLists);
    setLists(serverLists);
  }

  useEffect(() => {
    listsRef.current = lists;
  }, [lists]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const listIds = useMemo(
    () => lists.map((list) => listDragId(list.id)),
    [lists],
  );

  function handleDragStart(event: DragStartEvent) {
    const id = String(event.active.id);
    const listId = parseListDragId(id);
    if (listId) {
      setActiveListId(listId);
      setActiveCard(null);
      cardOriginListIdRef.current = null;
      return;
    }

    const cardId = parseCardDragId(id);
    if (cardId) {
      const originListId = findListIdByCard(listsRef.current, cardId);
      cardOriginListIdRef.current = originListId;
      const list = listsRef.current.find((item) => item.id === originListId);
      setActiveCard(list?.cards.find((item) => item.id === cardId) ?? null);
      setActiveListId(null);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeCardId = parseCardDragId(String(active.id));
    if (!activeCardId) return;

    setLists((prev) => {
      const activeListIdNow = findListIdByCard(prev, activeCardId);
      const overListId = resolveOverListId(prev, over.id);
      if (!activeListIdNow || !overListId || activeListIdNow === overListId) {
        return prev;
      }

      const next = prev.map((list) => ({
        ...list,
        cards: [...list.cards],
      }));

      const fromList = next.find((list) => list.id === activeListIdNow);
      const toList = next.find((list) => list.id === overListId);
      if (!fromList || !toList) return prev;

      const fromIndex = fromList.cards.findIndex(
        (card) => card.id === activeCardId,
      );
      if (fromIndex < 0) return prev;

      const [moved] = fromList.cards.splice(fromIndex, 1);
      const overCardId = parseCardDragId(String(over.id));
      const toIndex = overCardId
        ? toList.cards.findIndex((card) => card.id === overCardId)
        : toList.cards.length;
      const insertAt = toIndex < 0 ? toList.cards.length : toIndex;

      toList.cards.splice(insertAt, 0, { ...moved, list_id: toList.id });
      listsRef.current = next;
      return next;
    });
  }

  async function persistLists(nextLists: ListWithCards[]) {
    setLists(nextLists);
    listsRef.current = nextLists;
    try {
      await syncListPositions(nextLists.map((list) => list.id));
      await queryClient.invalidateQueries({
        queryKey: boardKeys.detail(boardId),
      });
    } catch (error) {
      setLists(serverLists);
      listsRef.current = serverLists;
      notifications.show({
        color: "red",
        title: "Gagal mengurutkan kolom",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  }

  async function persistCards(nextLists: ListWithCards[]) {
    const nextPlacements = cardPlacementsFromLists(nextLists);
    const serverPlacements = cardPlacementsFromLists(serverLists);
    if (placementsEqual(nextPlacements, serverPlacements)) {
      return;
    }

    const serverByCard = new Map(
      serverPlacements.map((p) => [p.cardId, p.listId]),
    );
    const doneListIds = new Set(
      nextLists.filter((list) => list.is_done).map((list) => list.id),
    );
    const cardsMovedToDone = nextPlacements.filter((p) => {
      const fromListId = serverByCard.get(p.cardId);
      if (!fromListId || fromListId === p.listId) return false;
      return doneListIds.has(p.listId) && !doneListIds.has(fromListId);
    }).length;

    setLists(nextLists);
    listsRef.current = nextLists;

    try {
      await syncCardPlacements(nextPlacements);
      await queryClient.invalidateQueries({
        queryKey: boardKeys.detail(boardId),
      });
      if (cardsMovedToDone > 0) {
        const earned = cardsMovedToDone * DONE_LIST_POINTS;
        // Shell poin card shares this cache — bump immediately, then confirm.
        queryClient.setQueryData<UserPoints>(pointsKeys.me(), (prev) =>
          prev
            ? {
                ...prev,
                total_points: prev.total_points + earned,
                last_activity_at: new Date().toISOString(),
              }
            : prev,
        );
        await queryClient.refetchQueries({ queryKey: pointsKeys.me() });
        celebrateDone();
        notifications.show({
          color: "teal",
          title: `+${earned} poin`,
          message:
            cardsMovedToDone === 1
              ? "Tiket masuk kolom Done."
              : `${cardsMovedToDone} tiket masuk kolom Done.`,
        });
      }
    } catch (error) {
      setLists(serverLists);
      listsRef.current = serverLists;
      notifications.show({
        color: "red",
        title: "Gagal memindahkan tiket",
        message: error instanceof Error ? error.message : "Terjadi kesalahan",
      });
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const originListId = cardOriginListIdRef.current;
    setActiveCard(null);
    setActiveListId(null);
    cardOriginListIdRef.current = null;

    if (!over) {
      setLists(serverLists);
      listsRef.current = serverLists;
      return;
    }

    const draggedListId = parseListDragId(String(active.id));
    if (draggedListId) {
      const currentLists = listsRef.current;
      const overListId =
        parseListDragId(String(over.id)) ??
        parseListDropId(String(over.id)) ??
        (() => {
          const cardId = parseCardDragId(String(over.id));
          return cardId ? findListIdByCard(currentLists, cardId) : null;
        })();

      if (!overListId || draggedListId === overListId) return;

      const oldIndex = currentLists.findIndex(
        (list) => list.id === draggedListId,
      );
      const newIndex = currentLists.findIndex((list) => list.id === overListId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

      await persistLists(arrayMove(currentLists, oldIndex, newIndex));
      return;
    }

    const activeCardId = parseCardDragId(String(active.id));
    if (!activeCardId) return;

    let nextLists = listsRef.current.map((list) => ({
      ...list,
      cards: [...list.cards],
    }));

    const overListId = resolveOverListId(nextLists, over.id);
    const currentListId = findListIdByCard(nextLists, activeCardId);

    if (!overListId || !currentListId) {
      setLists(serverLists);
      listsRef.current = serverLists;
      return;
    }

    // Same-column reorder (cross-column already applied in dragOver).
    // Compare against origin from dragStart — after dragOver, currentListId
    // already equals overListId for cross-list moves.
    if (originListId && originListId === overListId) {
      const list = nextLists.find((item) => item.id === overListId);
      if (!list) return;

      const oldIndex = list.cards.findIndex((card) => card.id === activeCardId);
      const overCardId = parseCardDragId(String(over.id));
      const newIndex = overCardId
        ? list.cards.findIndex((card) => card.id === overCardId)
        : list.cards.length - 1;

      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        nextLists = nextLists.map((item) =>
          item.id !== overListId
            ? item
            : { ...item, cards: arrayMove(item.cards, oldIndex, newIndex) },
        );
      }
    }

    await persistCards(nextLists);
  }

  function handleDragCancel() {
    setActiveCard(null);
    setActiveListId(null);
    cardOriginListIdRef.current = null;
    setLists(serverLists);
    listsRef.current = serverLists;
  }

  const activeList = activeListId
    ? lists.find((list) => list.id === activeListId)
    : null;

  return (
    <DndContext
      id={boardId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={(event) => void handleDragEnd(event)}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea type="auto" offsetScrollbars>
        <SortableContext
          items={listIds}
          strategy={horizontalListSortingStrategy}
        >
          <Group align="flex-start" gap="md" wrap="nowrap" pb="md">
            {lists.map((list) => (
              <SortableKanbanColumn
                key={list.id}
                boardId={boardId}
                list={list}
              />
            ))}
          </Group>
        </SortableContext>
      </ScrollArea>

      <DragOverlay dropAnimation={null}>
        {activeCard ? <KanbanCardPreview card={activeCard} /> : null}
        {activeList ? <ListPreview list={activeList} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

export function BoardView({ boardId, initialData }: BoardViewProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => fetchBoardDetail(boardId),
    initialData,
  });

  if (isLoading && !data) {
    return (
      <Text c="dimmed" size="sm">
        Memuat board…
      </Text>
    );
  }

  if (isError || !data) {
    return (
      <Text c="red" size="sm">
        {error instanceof Error ? error.message : "Board tidak ditemukan."}
      </Text>
    );
  }

  return (
    <Stack gap="md" h="100%">
      <BoardPageTitle
        boardId={boardId}
        title={data.title}
        pinned={data.pinned}
      />
      <BoardKanban boardId={boardId} lists={data.lists} />
    </Stack>
  );
}
