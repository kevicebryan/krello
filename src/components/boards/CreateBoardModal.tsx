"use client";

import { Button, Modal, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createBoard } from "@/lib/boards/api";
import {
  DEFAULT_BOARD_LISTS,
  DEFAULT_STARTER_CARD_TITLE,
} from "@/lib/boards/constants";
import { boardKeys } from "@/lib/boards/keys";
import { createBoardSchema } from "@/lib/boards/schemas";
import { fieldError } from "@/lib/form-errors";

type CreateBoardModalProps = {
  opened: boolean;
  onClose: () => void;
};

export function CreateBoardModal({ opened, onClose }: CreateBoardModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      title: "",
    },
    validators: {
      onSubmit: createBoardSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const boardId = await createBoard(value.title.trim());
        await queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
        notifications.show({
          color: "teal",
          title: "Board dibuat",
          message: `Kanban siap: ${DEFAULT_BOARD_LISTS.map((l) => l.title).join(", ")} + kartu "${DEFAULT_STARTER_CARD_TITLE}".`,
        });
        form.reset();
        onClose();
        router.push(`/boards/${boardId}`);
      } catch (error) {
        notifications.show({
          color: "red",
          title: "Gagal membuat board",
          message: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
      }
    },
  });

  function handleClose() {
    if (form.state.isSubmitting) return;
    form.reset();
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Board baru" centered>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Stack gap="md">
          <form.Field name="title">
            {(field) => (
              <TextInput
                label="Judul"
                placeholder="Mis. Project Management"
                data-autofocus
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" fullWidth loading={isSubmitting}>
                Buat board
              </Button>
            )}
          </form.Subscribe>
        </Stack>
      </form>
    </Modal>
  );
}
