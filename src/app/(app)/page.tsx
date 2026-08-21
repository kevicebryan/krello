import { Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { listBoards } from "@/lib/boards/queries";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const boards = await listBoards(supabase);

  if (boards[0]) {
    redirect(`/boards/${boards[0].id}`);
  }

  return (
    <Stack gap="xs">
      <Title order={2}>Dashboard</Title>
      <Text c="dimmed">
        Belum ada board. Klik &quot;Board baru&quot; di sidebar untuk mulai —
        kanban akan terisi Todo, In Progress, Done, plus kartu &quot;Get
        homework done&quot;.
      </Text>
    </Stack>
  );
}
