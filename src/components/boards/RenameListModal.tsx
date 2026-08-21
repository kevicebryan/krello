"use client";

import { Button, Modal, Stack, Switch, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { updateList } from "@/lib/boards/api";
import { boardKeys } from "@/lib/boards/keys";
import { updateListSchema } from "@/lib/boards/schemas";
import { fieldError } from "@/lib/form-errors";

type RenameListModalProps = {
  opened: boolean;
  onClose: () => void;
  boardId: string;
  listId: string;
  currentTitle: string;
  isDone: boolean;
};

export function RenameListModal({
  opened,
  onClose,
  boardId,
  listId,
  currentTitle,
  isDone,
}: RenameListModalProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      title: currentTitle,
      isDone,
    },
    validators: {
      onSubmit: updateListSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const nextTitle = value.title.trim();
        if (nextTitle === currentTitle && value.isDone === isDone) {
          onClose();
          return;
        }

        await updateList(listId, {
          title: nextTitle,
          isDone: value.isDone,
        });
        await queryClient.invalidateQueries({
          queryKey: boardKeys.detail(boardId),
        });
        notifications.show({
          color: "teal",
          title: "Kolom diubah",
          message: value.isDone
            ? `"${nextTitle}" jadi kolom Done (+3 poin saat tiket masuk).`
            : `Nama diganti jadi "${nextTitle}".`,
        });
        onClose();
      } catch (error) {
        notifications.show({
          color: "red",
          title: "Gagal menyimpan kolom",
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
    <Modal opened={opened} onClose={handleClose} title="Edit kolom" centered>
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

          <form.Field name="isDone">
            {(field) => (
              <Stack gap={4}>
                <Switch
                  label="Kolom Done"
                  description="Hanya satu kolom Done per board. Tiket yang masuk ke sini dapat +3 poin."
                  checked={field.state.value}
                  onChange={(e) =>
                    field.handleChange(e.currentTarget.checked)
                  }
                />
                {field.state.value && !isDone ? (
                  <Text size="xs" c="dimmed">
                    Kolom Done sebelumnya (jika ada) akan otomatis dilepas.
                  </Text>
                ) : null}
              </Stack>
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
