# Product Requirements Document (PRD): Krello

## 1. Ringkasan Proyek (Project Overview)
**Krello** adalah sebuah aplikasi web manajemen tugas (Trello clone) berwujud *kanban board* yang dirancang untuk meningkatkan produktivitas melalui pendekatan gamifikasi. Selain menyediakan fitur inti manajemen tugas (daftar status, kartu tugas, dan kategori), Krello mengintegrasikan sistem *streak* dan poin yang dapat ditukar (*redeem*) dengan hadiah dunia nyata seperti waktu istirahat atau secangkir kopi.

## 2. Tujuan & Sasaran
- Menyediakan platform *task management* yang intuitif dengan antarmuka visual modern.
- Meningkatkan motivasi penyelesaian tugas sehari-hari melalui sistem *reward* (gamifikasi).
- Membantu pengguna memisahkan dan memprioritaskan tugas (pekerjaan, hobi, dll.) dengan sistem kategorisasi yang rapi.

## 3. Fitur Utama (Core Features)

### 3.1. Kanban Board & Lists
- **Board View:** Tampilan utama berupa papan *kanban*.
- **Default Lists:** Pengguna dapat membuat daftar (*lists*) berdasarkan status pekerjaan. Status standar meliputi:
  - Todo
  - On Progress
  - Under Review
  - Done

### 3.2. Manajemen Kartu (Cards)
- **Create & Edit:** Pengguna dapat membuat kartu *todo* baru dan memberikan nama/judul tugas.
- **Kategorisasi (Labels/Tags):** Setiap kartu dapat dimasukkan ke dalam kategori tertentu (contoh: *Hobby*, *Kerjaan*, dll).
- **Kategori CRUD & Color-Coding:** Pengguna dapat membuat (Create), membaca (Read), mengubah (Update), dan menghapus (Delete) kategori. Setiap kategori memiliki *color-code* unik untuk identifikasi visual cepat.

### 3.3. Gamifikasi: Sistem Poin & Streak
- **Aturan Waktu:** Poin hanya bisa didapatkan pada hari kerja (**Senin - Jumat**).
- **Aturan Perolehan Poin (Berdasarkan perubahan status/progres):**
  - **1 Point:** Jika kartu dipindahkan ke *On Progress*.
  - **2 Points:** Jika kartu dipindahkan ke *Under Review*.
  - **3 Points:** Jika kartu dipindahkan ke *Done!*.
- **Streak:** Sistem mendeteksi rutinitas harian; progres yang konsisten mempertahankan *streak* pengguna.

### 3.4. Sistem Redeem (Rewards)
Poin yang dikumpulkan dapat ditukarkan (*redeem*) dengan hadiah *self-reward*:
- **50 Points:** *Free time* (Bisa digunakan untuk istirahat, main game, dll).
- **100 Points:** *Coffee* (Menikmati secangkir *specialty coffee* atau *matcha* favorit sebagai penghargaan atas kerja keras).

### 3.5. Kustomisasi Tema (Theming)
- **Light & Dark Mode:** Pengguna dapat beralih antara tema terang dan gelap sesuai preferensi dan kenyamanan mata.

## 4. Sistem Desain (Design System)
Berdasarkan referensi (`image_11bf7a.jpg`), Krello akan menggunakan bahasa desain berikut:
- **Style:** *Glassmorphism* dengan perpaduan *pastel gradients*. 
- **Warna Utama (Primary Color):** *Light Blue* (Biru Muda) untuk elemen aksi utama (tombol CTA, indikator aktif).
- **Card & Backgrounds:** Latar belakang menggunakan gradien pastel yang lembut (seperti campuran ungu muda, biru, dan persik). Kartu (*Cards*) memiliki rona warna solid pastel (sesuai kategori) dengan *opacity* atau bayangan lembut (*soft shadows*) untuk memisahkan kartu dari latar belakang.
- **Bentuk (Shapes):** Sudut membulat (*rounded corners*) pada setiap kartu, tombol, dan kontainer utama untuk memberikan kesan ramah dan modern.
- **Tipografi:** Bersih, *sans-serif*, dengan hierarki visual yang jelas antara judul kartu dan tag kategori.

## 5. Tumpukan Teknologi (Tech Stack)
- **Frontend / Framework:** Next.js
- **UI Component Library:** MantineUI (Sangat mendukung *dark/light mode* dan kustomisasi desain *glassmorphism*).
- **Database & Backend as a Service (BaaS):** Supabase
- **State Management & Data Fetching:** TanStack Query (React Query)
- **Form & Validation:** TanStack Form dikombinasikan dengan Zod.
- **Drag-and-Drop (Opsional/Rekomendasi):** `@hello-pangea/dnd` atau `dnd-kit` untuk interaksi *kanban board*.

---

## 6. Checklist Langkah Pengembangan (Step-by-Step Implementation)

### Fase 1: Inisiasi Proyek & Setup
- [ ] Inisialisasi proyek Next.js.
- [ ] Instalasi dependensi: MantineUI, TanStack Query, TanStack Form, Zod, dan *library drag-and-drop*.
- [ ] Setup MantineUI *Provider* dan konfigurasi *Light/Dark Mode toggle*.
- [ ] Setup koneksi Supabase (Project URL & Anon Key).

### Fase 2: Skema Database (Supabase)
- [ ] Buat tabel `users` atau gunakan *Supabase Auth* jika butuh multi-user.
- [ ] Buat tabel `boards` dan `lists`.
- [ ] Buat tabel `categories` dengan kolom: `id`, `name`, `color_code`.
- [ ] Buat tabel `cards` dengan relasi ke `lists` dan `categories`.
- [ ] Buat tabel `user_points` untuk melacak total poin dan *streak* (beserta *timestamp* aktivitas).

### Fase 3: Desain Sistem & UI Komponen Dasar
- [ ] Implementasi *Glassmorphic background* dengan gradien pastel (terinspirasi dari `image_11bf7a.jpg`).
- [ ] Buat komponen atomik Mantine: *Button (Light Blue)*, *Inputs*, *Modal*.
- [ ] Buat komponen `CategoryBadge` dengan warna kustom.

### Fase 4: Core Features (Manajemen Tugas)
- [ ] Implementasi API (via Supabase) dan *data fetching* (via TanStack Query) untuk `lists` dan `cards`.
- [ ] Buat UI Kanban Board.
- [ ] Integrasikan *Drag-and-Drop* agar kartu bisa dipindah antar *list* (Todo -> Progress -> Review -> Done).
- [ ] Implementasi form pembuatan/edit kartu dengan TanStack Form & Zod.
- [ ] Implementasi halaman/modal CRUD untuk *Categories*.

### Fase 5: Gamifikasi (Points, Streak, & Redeem)
- [ ] Buat logika *database trigger* atau *backend function* (Edge Functions/Client logic) untuk mengecek hari (Senin-Jumat).
- [ ] Tambahkan logika penambahan poin:
  - +1 saat kartu masuk ke "On Progress".
  - +2 saat kartu masuk ke "Under Review".
  - +3 saat kartu masuk ke "Done".
- [ ] Buat komponen UI "User Stats" untuk menampilkan *Streak* dan jumlah poin saat ini.
- [ ] Buat UI "Redeem Store" yang memiliki opsi:
  - Tombol Redeem "Free Time" (Kurangi 50 poin).
  - Tombol Redeem "Coffee" (Kurangi 100 poin).

### Fase 6: Polishing, Testing & Deployment
- [ ] Uji coba transisi *Light/Dark mode* untuk memastikan keterbacaan tetap terjaga (kontras warna *glassmorphism*).
- [ ] Uji coba sistem poin di hari selain Senin-Jumat (pastikan tidak bertambah).
- [ ] *Deployment* ke Vercel.
