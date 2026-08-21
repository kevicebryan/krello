"use client";

import { Button, PasswordInput, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { resetPasswordSchema } from "@/lib/auth/schemas";
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

export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionMissing, setSessionMissing] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setSessionMissing(true);
        notifications.show({
          color: "red",
          title: "Link tidak valid",
          message:
            "Link reset sudah kedaluwarsa atau tidak valid. Minta link baru dari halaman login.",
        });
      }
      setReady(true);
    });
  }, []);

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: value.password,
      });

      if (error) {
        notifications.show({
          color: "red",
          title: "Gagal reset password",
          message: error.message,
        });
        return;
      }

      notifications.show({
        color: "teal",
        title: "Berhasil",
        message: "Password baru sudah disimpan.",
      });
      router.replace("/");
      router.refresh();
    },
  });

  if (!ready) {
    return null;
  }

  if (sessionMissing) {
    return (
      <Stack gap="md">
        <Text c="dimmed" size="sm" ta="center">
          Link reset tidak bisa dipakai. Minta link baru dari halaman login.
        </Text>
        <Button component={Link} href="/login" fullWidth>
          Kembali ke login
        </Button>
      </Stack>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <Stack gap="md">
        <form.Field name="password">
          {(field) => (
            <PasswordInput
              label="Password baru"
              placeholder="Minimal 6 karakter"
              autoComplete="new-password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <PasswordInput
              label="Confirm password"
              placeholder="Ulangi password baru"
              autoComplete="new-password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.currentTarget.value)}
              error={fieldError(field.state.meta.errors)}
            />
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" fullWidth loading={isSubmitting} mt="xs">
              Simpan password baru
            </Button>
          )}
        </form.Subscribe>
      </Stack>
    </form>
  );
}
