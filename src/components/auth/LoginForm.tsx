"use client";

import { Alert, Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginSchema } from "@/lib/auth/schemas";
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

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: value.email.trim(),
        password: value.password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      router.replace("/");
      router.refresh();
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
        {formError ? (
          <Alert color="red" variant="light" title="Gagal masuk">
            {formError}
          </Alert>
        ) : null}

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

        <form.Field name="password">
          {(field) => (
            <PasswordInput
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
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
              Masuk
            </Button>
          )}
        </form.Subscribe>
      </Stack>
    </form>
  );
}
