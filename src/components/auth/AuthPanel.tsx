"use client";

import { Paper, SegmentedControl, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";

type AuthMode = "login" | "signup";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <Paper
      p={{ base: "lg", sm: "xl" }}
      radius="lg"
      withBorder
      style={{
        width: "100%",
        maxWidth: 420,
        background:
          "light-dark(rgba(255, 255, 255, 0.82), rgba(26, 27, 30, 0.78))",
        backdropFilter: "blur(12px)",
      }}
    >
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={2} ta="center">
            Krello
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            {mode === "login"
              ? "Masuk untuk lanjut ke board kamu"
              : "Buat akun baru untuk mulai"}
          </Text>
        </Stack>

        <SegmentedControl
          fullWidth
          value={mode}
          onChange={(value) => setMode(value as AuthMode)}
          data={[
            { label: "Login", value: "login" },
            { label: "Sign up", value: "signup" },
          ]}
        />

        {mode === "login" ? <LoginForm /> : <SignupForm />}
      </Stack>
    </Paper>
  );
}
