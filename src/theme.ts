"use client";

// File ini mengatur tema utama (theme) Mantine untuk project Krello.
// - primaryColor: lightBlue — menjadikan warna biru-muda sebagai warna utama aplikasi (misal: tombol, highlight).
// - colors: lightBlue — definisi skema gradasi biru-muda custom untuk branding Krello (lihat array lightBlue).
// - defaultRadius: md — sudut elemen dibuat sedang (medium) untuk nuansa lebih modern & rounded.
// - fontFamily: poppins + fallback system font, untuk tampilan tipografi yang konsisten dan enak dibaca.

import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Definisi gradasi warna biru-muda untuk segala komponen utama (tombol, accent, dsb)
const lightBlue: MantineColorsTuple = [
  "#e7f5ff", // paling terang
  "#d0ebff",
  "#a5d8ff",
  "#74c0fc",
  "#4dabf7",
  "#339af0",
  "#228be6",
  "#1c7ed6",
  "#1971c2",
  "#1864ab", // paling gelap
];

// Ekspor theme utama Mantine
export const theme = createTheme({
  primaryColor: "lightBlue", // warna utama
  colors: {
    lightBlue, // custom warna biru-muda untuk branding
  },
  defaultRadius: "md", // radius sudut sedang
  fontFamily:
    "var(--font-poppins), -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif", // Font utama
});
