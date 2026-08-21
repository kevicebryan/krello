"use client";

import {
  Avatar,
  Button,
  FileButton,
  Group,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconCamera } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { profileKeys } from "@/lib/profile/keys";
import {
  AVATAR_ACCEPT,
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  profileSchema,
} from "@/lib/profile/schemas";
import { createClient } from "@/lib/supabase/client";

function fieldError(errors: unknown[]): string | undefined {
  const first = errors[0];
  if (!first) return undefined;
  if (typeof first === "string") return first;
  if (typeof first === "object" && first !== null && "message" in first) {
    return String((first as { message: string }).message);
  }
  return undefined;
}

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

type ProfileFormProps = {
  userId: string;
  userEmail: string;
  initialProfile: ProfileRow | null;
};

export function ProfileForm({
  userId,
  userEmail,
  initialProfile,
}: ProfileFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
    initialData: initialProfile ?? undefined,
  });

  const saveName = useMutation({
    mutationFn: async (name: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ name })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: profileKeys.detail(userId),
      });
      notifications.show({
        color: "teal",
        title: "Tersimpan",
        message: "Nama profil diperbarui.",
      });
      router.refresh();
    },
    onError: (error: Error) => {
      notifications.show({
        color: "red",
        title: "Gagal menyimpan",
        message: error.message,
      });
    },
  });

  const form = useForm({
    defaultValues: {
      name: profile?.name ?? "",
    },
    validators: {
      onSubmit: profileSchema,
    },
    onSubmit: async ({ value }) => {
      await saveName.mutateAsync(value.name.trim());
    },
  });

  async function handleAvatarChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notifications.show({
        color: "red",
        title: "File tidak valid",
        message: "Pilih gambar (JPEG, PNG, WebP, atau GIF).",
      });
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      notifications.show({
        color: "red",
        title: "File terlalu besar",
        message: "Ukuran maksimal 2 MB.",
      });
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `avatars/${userId}/avatar`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

      // Bust CDN cache after upsert
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      await queryClient.invalidateQueries({
        queryKey: profileKeys.detail(userId),
      });
      notifications.show({
        color: "teal",
        title: "Avatar diperbarui",
        message: "Foto profil berhasil diunggah.",
      });
      router.refresh();
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Gagal upload",
        message: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setUploading(false);
    }
  }

  const displayName = profile?.name ?? userEmail;
  const avatarUrl = profile?.avatar_url;

  return (
    <Stack gap="lg" maw={420}>
      <Group gap="md" align="flex-end">
        <Avatar src={avatarUrl || undefined} color="blue" radius="xl" size={88}>
          {displayName.charAt(0).toUpperCase()}
        </Avatar>
        <FileButton
          onChange={handleAvatarChange}
          accept={AVATAR_ACCEPT}
          disabled={uploading}
        >
          {(props) => (
            <Button
              {...props}
              variant="light"
              leftSection={<IconCamera size={16} />}
              loading={uploading}
            >
              Ganti avatar
            </Button>
          )}
        </FileButton>
      </Group>
      <Text size="xs" c="dimmed">
        JPEG, PNG, WebP, atau GIF — maksimal 2 MB.
      </Text>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <Stack gap="md">
          <TextInput
            label="Email"
            value={profile?.email ?? userEmail}
            disabled
            description="Email tidak bisa diubah dari sini."
          />

          <form.Field name="name">
            {(field) => (
              <TextInput
                label="Nama"
                placeholder="Nama tampilan"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.currentTarget.value)}
                error={fieldError(field.state.meta.errors)}
              />
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" loading={isSubmitting || saveName.isPending}>
                Simpan profil
              </Button>
            )}
          </form.Subscribe>
        </Stack>
      </form>
    </Stack>
  );
}
