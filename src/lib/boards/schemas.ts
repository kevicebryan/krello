import { z } from "zod";

export const boardTitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul board wajib diisi")
    .max(80, "Judul maksimal 80 karakter"),
});

export const createBoardSchema = boardTitleSchema;

export const listTitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Nama kolom wajib diisi")
    .max(80, "Nama maksimal 80 karakter"),
});

export const cardTitleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul tiket wajib diisi")
    .max(120, "Judul maksimal 120 karakter"),
});

export const createCardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul tiket wajib diisi")
    .max(120, "Judul maksimal 120 karakter"),
  description: z
    .string()
    .trim()
    .max(2000, "Deskripsi maksimal 2000 karakter"),
  deadline: z.string().nullable(),
});

export const updateCardSchema = createCardSchema;

export type BoardTitleValues = z.infer<typeof boardTitleSchema>;
export type CreateBoardValues = BoardTitleValues;
export type ListTitleValues = z.infer<typeof listTitleSchema>;
export type CardTitleValues = z.infer<typeof cardTitleSchema>;
export type CreateCardValues = z.infer<typeof createCardSchema>;
export type UpdateCardValues = CreateCardValues;
