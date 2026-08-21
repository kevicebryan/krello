"use client";

import { Button, Modal, Stack, Textarea, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { IconCalendar } from "@tabler/icons-react";
import { createCard } from "@/lib/boards/api";
import { boardKeys } from "@/lib/boards/keys";
import { createCardSchema } from "@/lib/boards/schemas";
import { fieldError } from "@/lib/form-errors";

type CreateCardModalProps = {
  opened: boolean;
  onClose: () => void;
  boardId: string;
  listId: string;
  listTitle: string;
};

export function CreateCardModal({
  opened,
  onClose,
  boardId,
  listId,
  listTitle,
}: CreateCardModalProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      deadline: null as string | null,
    },
    validators: {
      onSubmit: createCardSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const title = value.title.trim();
        const description = value.description.trim();
        await createCard({
          listId,
          title,
          description: description.length > 0 ? description : undefined,
          deadline: value.deadline,
        });
        await queryClient.invalidateQueries({
          queryKey: boardKeys.detail(boardId),
        });
        notifications.show({
          color: "teal",
          title: "Tiket dibuat",
          message: `"${title}" ditambahkan ke ${listTitle}.`,
        });
        form.reset();
        onClose();
      } catch (error) {
        notifications.show({
          color: "red",
          title: "Gagal membuat tiket",
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
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Tiket baru · ${listTitle}`}
      centered
    >
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
                  field.handleChange(
                    typeof value === "string" ? value : null,
                  )
                }
                leftSection={<IconCalendar size={16} />}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" fullWidth loading={isSubmitting}>
                Buat tiket
              </Button>
            )}
          </form.Subscribe>
        </Stack>
      </form>
    </Modal>
  );
}
