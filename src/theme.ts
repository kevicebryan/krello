"use client";

import { createTheme, type MantineColorsTuple } from "@mantine/core";

const lightBlue: MantineColorsTuple = [
  "#e7f5ff",
  "#d0ebff",
  "#a5d8ff",
  "#74c0fc",
  "#4dabf7",
  "#339af0",
  "#228be6",
  "#1c7ed6",
  "#1971c2",
  "#1864ab",
];

export const theme = createTheme({
  primaryColor: "lightBlue",
  colors: {
    lightBlue,
  },
  defaultRadius: "md",
  fontFamily:
    "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
});
