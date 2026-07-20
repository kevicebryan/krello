import { Container, Group, Stack, Text, Title } from "@mantine/core";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle";

export default function Home() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={1}>Krello</Title>
          <ColorSchemeToggle />
        </Group>
        <Text c="dimmed">
          Kanban board dengan gamifikasi. Setup Fase 1 siap — isi{" "}
          <Text span fw={600} inherit>
            .env.local
          </Text>{" "}
          dari{" "}
          <Text span fw={600} inherit>
            .env.example
          </Text>{" "}
          untuk menyambungkan Supabase.
        </Text>
      </Stack>
    </Container>
  );
}
