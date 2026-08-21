"use client";

import { notifications } from "@mantine/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { renameBoard } from "@/lib/boards/api";
import { boardKeys } from "@/lib/boards/keys";
import { boardTitleSchema } from "@/lib/boards/schemas";

export function useRenameBoard(boardId: string, currentTitle: string) {
  const queryClient = useQueryClient();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(currentTitle);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function start() {
    setDraft(currentTitle);
    setError(undefined);
    setRenaming(true);
  }

  function cancel() {
    setRenaming(false);
    setDraft(currentTitle);
    setError(undefined);
  }

  function setDraftValue(value: string) {
    setDraft(value);
    setError(undefined);
  }

  async function save() {
    const parsed = boardTitleSchema.safeParse({ title: draft });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Judul tidak valid");
      return false;
    }

    const nextTitle = parsed.data.title;
    if (nextTitle === currentTitle) {
      setRenaming(false);
      return true;
    }

    setSaving(true);
    try {
      await renameBoard(boardId, nextTitle);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) }),
      ]);
      notifications.show({
        color: "teal",
        title: "Board diubah",
        message: `Nama diganti jadi "${nextTitle}".`,
      });
      setRenaming(false);
      return true;
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Gagal rename",
        message: err instanceof Error ? err.message : "Terjadi kesalahan",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    renaming,
    draft,
    error,
    saving,
    start,
    cancel,
    save,
    setDraftValue,
  };
}
