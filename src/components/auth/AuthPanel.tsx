"use client";

import { Paper, SegmentedControl, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";

type AuthMode = "login" | "signup" | "forgot";

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("login");

  const showTabs = mode !== "forgot";

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
          <Title order={2} ta="center" c="bright">
            Krello
          </Title>
          <Text c="dimmed" size="sm" ta="center">
            {mode === "login"
              ? "Masuk untuk lanjut ke board kamu"
              : mode === "signup"
                ? "Buat akun baru untuk mulai"
                : "Masukkan email untuk reset password"}
          </Text>
        </Stack>

        {showTabs ? (
          <SegmentedControl
            fullWidth
            value={mode}
            onChange={(value) => setMode(value as AuthMode)}
            data={[
              { label: "Login", value: "login" },
              { label: "Sign up", value: "signup" },
            ]}
          />
        ) : null}

        {mode === "login" ? (
          <LoginForm onForgotPassword={() => setMode("forgot")} />
        ) : null}
        {mode === "signup" ? (
          <SignupForm onForgotPassword={() => setMode("forgot")} />
        ) : null}
        {mode === "forgot" ? (
          <ForgotPasswordForm onBackToLogin={() => setMode("login")} />
        ) : null}
      </Stack>
    </Paper>
  );
}
