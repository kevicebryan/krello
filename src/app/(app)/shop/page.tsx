import { Stack, Text, Title } from "@mantine/core";
import { PointShop } from "@/components/shop/PointShop";

export default function PointShopPage() {
  return (
    <Stack gap="md">
      <div>
        <Title order={2}>Point Shop</Title>
        <Text c="dimmed" size="sm">
          Tukar poin dengan hadiah — free time, coffee, matcha, dan lainnya.
        </Text>
      </div>
      <PointShop />
    </Stack>
  );
}
