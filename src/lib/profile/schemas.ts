import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi")
    .max(80, "Nama maksimal 80 karakter"),
});

export type ProfileValues = z.infer<typeof profileSchema>;

export const AVATAR_BUCKET = "images";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
