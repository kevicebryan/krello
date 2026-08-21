import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { createClient } from "@/lib/supabase/server";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <DashboardShell
      userEmail={user.email ?? "?"}
      avatarUrl={profile?.avatar_url}
    >
      {children}
    </DashboardShell>
  );
}
