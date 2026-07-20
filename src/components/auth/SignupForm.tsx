"use client";

import { Alert, Button, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signupSchema } from "@/lib/auth/schemas";
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

export function SignupForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validators: {
      onSubmit: signupSchema,
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      setInfo(null);

      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: value.email.trim(),
        password: value.password,
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      if (data.user && !data.session) {
        setInfo(
          "Akun dibuat. Cek email kamu untuk konfirmasi sebelum masuk.",
        );
        form.reset();
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
          <Alert color="red" variant="light" title="Gagal daftar">
            {formError}
          </Alert>
        ) : null}

        {info ? (
          <Alert color="teal" variant="light" title="Berhasil">
            {info}
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
              placeholder="Ulangi password"
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
              Daftar
            </Button>
          )}
        </form.Subscribe>
      </Stack>
    </form>
  );
}
