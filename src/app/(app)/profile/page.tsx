import { Stack, Text, Title } from "@mantine/core";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Profil</Title>
        <Text c="dimmed" size="sm">
          Ubah nama tampilan dan avatar akun kamu.
        </Text>
      </div>
      <ProfileForm
        userId={user.id}
        userEmail={user.email ?? ""}
        initialProfile={profile}
      />
    </Stack>
  );
}
