import { Box, Group } from "@mantine/core";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle";

export default function LoginPage() {
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
        <AuthPanel />
      </Box>
    </Box>
  );
}
