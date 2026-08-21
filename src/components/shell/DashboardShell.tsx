"use client";

import {
  AppShell,
  Avatar,
  Burger,
  Button,
  Group,
  Menu,
  Stack,
  Text,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconLogout,
  IconMoon,
  IconPlus,
  IconSun,
  IconUser,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BoardsNav } from "@/components/boards/BoardsNav";
import { CreateBoardModal } from "@/components/boards/CreateBoardModal";
import { createClient } from "@/lib/supabase/client";

type DashboardShellProps = {
  userEmail: string;
  avatarUrl?: string | null;
  children: ReactNode;
};

export function DashboardShell({
  userEmail,
  avatarUrl,
  children,
}: DashboardShellProps) {
  const [opened, { toggle, close: closeNavbar }] = useDisclosure();
  const [createOpened, { open: openCreate, close: closeCreate }] =
    useDisclosure();
  const router = useRouter();
  const { setColorScheme } = useMantineColorScheme();
  const isDark =
    useComputedColorScheme("light", { getInitialValueInEffect: true }) ===
    "dark";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3} c="blue">
              Krello
            </Title>
          </Group>

          <Menu shadow="md" width={260} position="bottom-end">
            <Menu.Target>
              <Avatar
                src={avatarUrl || undefined}
                color="blue"
                radius="xl"
                component="button"
                style={{ cursor: "pointer", border: "none" }}
                aria-label="Menu akun"
              >
                {userEmail.charAt(0).toUpperCase()}
              </Avatar>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>
                <Text size="xs" truncate="end" title={userEmail}>
                  {userEmail}
                </Text>
              </Menu.Label>
              <Menu.Item
                leftSection={<IconUser size={16} />}
                onClick={() => router.push("/profile")}
              >
                Profil
              </Menu.Item>
              <Menu.Item
                leftSection={
                  isDark ? <IconSun size={16} /> : <IconMoon size={16} />
                }
                onClick={() => setColorScheme(isDark ? "light" : "dark")}
                closeMenuOnClick={false}
              >
                {isDark ? "Mode terang" : "Mode gelap"}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={16} />}
                onClick={handleLogout}
              >
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <Stack gap="xs">
            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
              Boards
            </Text>
            <BoardsNav onNavigate={closeNavbar} />
          </Stack>
        </AppShell.Section>
        <AppShell.Section>
          <Button
            fullWidth
            variant="light"
            leftSection={<IconPlus size={16} />}
            onClick={openCreate}
          >
            Board baru
          </Button>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>

      <CreateBoardModal opened={createOpened} onClose={closeCreate} />
    </AppShell>
  );
}
