import { Box, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle";

export default function ResetPasswordPage() {
  return (
    <Box
      component="main"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background:
          "light-dark(linear-gradient(160deg, #e7f5ff 0%, #f8f9fa 45%, #fff4e6 100%), linear-gradient(160deg, #0b1220 0%, #1a1b1e 50%, #162032 100%))",
      }}
    >
      <Group justify="flex-end" p="md">
        <ColorSchemeToggle />
      </Group>

      <Box
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          paddingBottom: "4rem",
        }}
      >
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
                Reset password
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Masukkan password baru untuk akun kamu
              </Text>
            </Stack>

            <ResetPasswordForm />
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
