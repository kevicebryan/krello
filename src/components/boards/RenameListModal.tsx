"use client";

import { Button, Modal, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { renameList } from "@/lib/boards/api";
import { boardKeys } from "@/lib/boards/keys";
import { listTitleSchema } from "@/lib/boards/schemas";
import { fieldError } from "@/lib/form-errors";

type RenameListModalProps = {
  opened: boolean;
  onClose: () => void;
  boardId: string;
  listId: string;
  currentTitle: string;
};

export function RenameListModal({
  opened,
  onClose,
  boardId,
  listId,
  currentTitle,
}: RenameListModalProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      title: currentTitle,
    },
    validators: {
      onSubmit: listTitleSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const nextTitle = value.title.trim();
        if (nextTitle === currentTitle) {
          onClose();
          return;
        }

        await renameList(listId, nextTitle);
        await queryClient.invalidateQueries({
          queryKey: boardKeys.detail(boardId),
        });
        notifications.show({
          color: "teal",
          title: "Kolom diubah",
          message: `Nama diganti jadi "${nextTitle}".`,
        });
        onClose();
      } catch (error) {
        notifications.show({
          color: "red",
          title: "Gagal rename",
          message: error instanceof Error ? error.message : "Terjadi kesalahan",
        });
      }
    },
  });

  function handleClose() {
    if (form.state.isSubmitting) return;
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Rename kolom" centered>
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
                label="Nama kolom"
                placeholder="Mis. Under Review"
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
                Simpan
              </Button>
            )}
          </form.Subscribe>
        </Stack>
      </form>
    </Modal>
  );
}
