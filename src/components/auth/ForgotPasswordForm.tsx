"use client";

import { Button, Stack, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useForm } from "@tanstack/react-form";
import { forgotPasswordSchema } from "@/lib/auth/schemas";
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

type ForgotPasswordFormProps = {
  onBackToLogin: () => void;
};

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", "/reset-password");

      const { error } = await supabase.auth.resetPasswordForEmail(
        value.email.trim(),
        { redirectTo: redirectTo.toString() },
      );

      if (error) {
        notifications.show({
          color: "red",
          title: "Gagal kirim link",
          message: error.message,
        });
        return;
      }

      notifications.show({
        color: "teal",
        title: "Cek email kamu",
        message:
          "Jika email terdaftar, kami kirim link reset password. Cek inbox atau folder spam.",
      });
      form.reset();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <Stack gap="md">
        <form.Field name="email">
          {(field) => (
            <TextInput
              label="Email"
              placeholder="kamu@email.com"
              type="email"
              autoComplete="email"
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
              Kirim link reset
            </Button>
          )}
        </form.Subscribe>

        <Button
          type="button"
          variant="transparent"
          color="gray"
          fullWidth
          onClick={onBackToLogin}
        >
          Kembali ke login
        </Button>
      </Stack>
    </form>
  );
}
