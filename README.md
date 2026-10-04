# Koaci Reporting App — Admin Frontend

Konsol admin ("Reporting Console") untuk sistem pelaporan investasi syariah PT Koaci Sinergi Indonesia. Dibangun dengan Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 dan TanStack Query.

## Menjalankan secara lokal

Proyek ini memakai **npm** (hanya `package-lock.json` yang di-commit — jangan menambahkan lockfile pnpm/yarn, karena Vercel memilih package manager dari lockfile yang ada).

```bash
cp .env.example .env.local   # lalu sesuaikan NEXT_PUBLIC_API_BASE_URL
npm install
npm run dev                  # http://localhost:3001
```

## Perintah

```bash
npm run dev        # server pengembangan di port 3001
npm run build      # build produksi
npm run start      # menjalankan hasil build
npm run lint       # eslint
npx tsc --noEmit   # type-check
```

## Environment variable

| Nama                       | Keterangan                                                        |
| -------------------------- | ----------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | URL dasar REST API backend, termasuk prefix `/api`, tanpa `/` di akhir |

Nilainya ditanam ke bundle saat build, jadi setelah mengubahnya perlu build/deploy ulang.

## Deploy ke Vercel

1. Isi `NEXT_PUBLIC_API_BASE_URL` di **Project Settings → Environment Variables** (Production dan Preview).
2. Biarkan Install Command dan Build Command pada nilai bawaan (`npm install`, `next build`).
3. Backend harus mengizinkan origin domain Vercel ini di konfigurasi CORS-nya dan berjalan di HTTPS, karena autentikasi memakai cookie HttpOnly lintas domain (`SameSite=None; Secure`).
