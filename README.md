# Krello

Kanban board dengan gamifikasi (poin & streak), dibangun dengan Next.js, MantineUI, TanStack Query/Form, Zod, dan Supabase.

## Setup

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local` dengan Project URL dan Publishable Key dari Supabase Dashboard (Project Settings → API). File `.env.local` di-ignore oleh git dan tidak boleh di-commit.

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).
