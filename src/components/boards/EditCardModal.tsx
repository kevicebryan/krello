"use client";

import { Button, Modal, Stack, Textarea, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { IconCalendar } from "@tabler/icons-react";
import { updateCard } from "@/lib/boards/api";
import { boardKeys } from "@/lib/boards/keys";
import { updateCardSchema } from "@/lib/boards/schemas";
import type { Card } from "@/lib/boards/types";
import { fieldError } from "@/lib/form-errors";

type EditCardModalProps = {
  opened: boolean;
  onClose: () => void;
  boardId: string;
  card: Card;
};

export function EditCardModal({
  opened,
  onClose,
  boardId,
  card,
}: EditCardModalProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      title: card.title,
      description: card.description ?? "",
      deadline: card.deadline,
    },
    validators: {
      onSubmit: updateCardSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const title = value.title.trim();
        const description = value.description.trim();
        await updateCard(card.id, {
          title,
          description: description.length > 0 ? description : undefined,
          deadline: value.deadline,
        });
        await queryClient.invalidateQueries({
          queryKey: boardKeys.detail(boardId),
        });
        notifications.show({
          color: "teal",
          title: "Tiket diupdate",
          message: `"${title}" sudah disimpan.`,
        });
        onClose();
      } catch (error) {
        notifications.show({
          color: "red",
          title: "Gagal mengedit tiket",
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
    <Modal opened={opened} onClose={handleClose} title="Edit tiket" centered>
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
                placeholder="Mis. Selesaikan laporan"
                data-autofocus
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Textarea
                label="Deskripsi"
                placeholder="Opsional"
                minRows={3}
                autosize
                maxRows={6}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>

          <form.Field name="deadline">
            {(field) => (
              <DatePickerInput
                label="Deadline"
                placeholder="Opsional"
                clearable
                value={field.state.value}
                onChange={(value) =>
                  field.handleChange(typeof value === "string" ? value : null)
                }
                leftSection={<IconCalendar size={16} />}
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
