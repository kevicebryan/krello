import { Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardShell userEmail={user.email ?? "?"}>
      <Stack gap="xs">
        <Title order={2}>Dashboard</Title>
        <Text c="dimmed">
          Pilih board di sidebar, atau buat board baru untuk mulai.
        </Text>
      </Stack>
    </DashboardShell>
  );
}
