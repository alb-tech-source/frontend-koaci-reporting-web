@AGENTS.md

# Koaci Reporting App — Admin Frontend

Admin "Reporting Console" for PT Koaci Sinergi Indonesia's sharia investment reporting system. Admins manage users, investors, companies, projects, investments and project reports. The UI copy is **Indonesian**: write new labels, toasts and error messages in Indonesian, matching the existing ones. Code comments are also mostly in Indonesian.

Sibling repos in `../`: `Backend/` (the REST API, Prisma; see `Backend/prisma/seeds/permission.config.ts` for permission keys and role defaults) and `Frontend-Investor/`. `../frontend-upload-guide.md` documents the upload contract.

## Commands

```bash
npm run dev        # next dev on port 3001 (not 3000)
npm run build
npm run lint       # eslint (flat config, next core-web-vitals + typescript)
npx tsc --noEmit   # type-check; there is no test suite
```

Both `package-lock.json` and `pnpm-lock.yaml` are present. Use npm unless told otherwise.

Env: `.env.local` needs `NEXT_PUBLIC_API_BASE_URL` (the backend base URL). All API calls go to it directly from the browser, with cookies.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS v4 (CSS-first config in `src/app/globals.css`, no `tailwind.config`) · shadcn/ui ("new-york", Radix) · TanStack Query v5 · Zustand · axios · sonner · recharts · lucide-react. Path alias: `@/*` → `src/*`.

## Layout

```
src/
  app/                     routes (almost all "use client")
    page.tsx               login (/)
    lupa-password/, reset-password/, unauthorized/
    admin/layout.tsx       wraps every /admin page in AdminShell
    admin/<section>/page.tsx   dashboard, users, investor, company, proyek,
                               investasi, laporan, settlement, activity-log, settings
  components/layout/AdminShell.tsx   sidebar, header, logout; nav config + role filtering
  features/<domain>/       one folder per domain
    api.ts                 axios calls + mapping of raw API rows → UI types
    types.ts               UI-facing types (camelCase)
    utils.ts               label maps, badge variants, option lists
    *Dialog.tsx / *Sheet.tsx / *Panel.tsx   domain components used by the page
  shared/
    components/ui/         shadcn primitives + custom feedback.tsx, stat-card, list-item-card
    components/ClientGuard.tsx, KoaciLogo.tsx
    hooks/                 use-hydrated, use-pagination (client-side), use-mobile
    lib/axios.ts           api instance, 401 refresh, getErrorMessage
    lib/auth.ts            getCurrentRole, hasPermission, logout
    lib/upload.ts          presigned upload helper
    lib/format.ts          formatIDR, formatDateID, formatRelativeTime (id-ID locale)
    store/authStore.ts     Zustand auth store, persisted to localStorage
  middleware.ts            route protection via the user_role cookie
```

Route folder names are Indonesian (`proyek` = projects, `investasi` = investments, `laporan` = reports), and the matching feature folders are English (`project-management`, `investment-management`, `project-reporting`). `settlement` (project completion: profit split + approval, with investor results as the final portfolio) lives in `features/settlement/`; it follows `../Backend/frontend-settlement-guide.md`.

### Settlement module specifics

- All calculations happen in the backend. The form only sends input fields as decimal **strings**, and computed values are only displayed. Live preview: `useSettlementPreview` in `features/settlement/queries.ts` debounces `POST /project-settlements/preview`, with the payload as the query key so stale responses are ignored.
- Values stay as strings in the UI types (`DecimalString`). Format them with `formatRupiah` / `formatPct` from `features/settlement/utils.ts`, which allow cents and negatives, instead of `formatIDR`.
- On edit, `investors` replaces every compensation, so the payload always sends the full list of current project investors.
- Investor "Portofolio Akhir" letter: `features/settlement/portfolioPdf.ts` (jsPDF, loaded via dynamic `import()` from `PortfolioPdfDialog`). It is only available for `approved` settlements. Letterhead text lives in its `LETTER` constant, and `public/logo.png` is used as the logo if present. The final amount is principal + `total_profit`, added in cents with BigInt. Letter amounts are rounded to whole rupiah to match the paper format.
- The Proyek page links to `/admin/settlement?project=<id>`. The settlement page reads that param through `useSearchParams` (inside `<Suspense>`) and opens either the existing settlement or a create form with the project preselected.

## Auth model

- The backend sets **HttpOnly auth cookies**. Every request uses `withCredentials: true`. The frontend never handles tokens.
- On login (`src/app/page.tsx`): `POST /auth/login` → `GET /auth/me` → `useAuthStore.setAuth(user)` → set a **non-HttpOnly `user_role` "shadow cookie"**. `middleware.ts` only checks that this cookie exists, to redirect `/` ↔ `/admin/*`. It is a UX gate, not a security boundary.
- `lib/axios.ts`: on a 401 it calls `POST /auth/refresh` once, queues concurrent requests, and retries. If the refresh fails it clears the store and hard-redirects to `/`.
- Roles: `superadmin`, `admin`, `bod`, `investor`, `user`. Permission keys look like `<resource>:<action>:<scope>`, for example `investors:read:any` and `projects:delete:any`. `hasPermission()` always returns true for `superadmin`.
- Page access: wrap the page body in `<ClientGuard requirePermission="..." | requireRole="...">`. It renders the fallback until hydrated, because the auth store lives in localStorage, and shows `AccessDenied` if access is not allowed. Action buttons are gated inline with `hasPermission("x:create:any")`, etc.
- The sidebar has its own filtering in `AdminShell` (Activity Log is shown only to `bod`, Users only to those who can read users). When adding a route, update `defaultAdminNav` and the filter there.

## Page / data patterns

Follow the existing list pages (for example `src/app/admin/investor/page.tsx`):

- Module-level `queryOptions({ queryKey: ["admin", "<resource>"], queryFn })` + `useSuspenseQuery` inside the guarded inner component.
- Fetch the full list (some `api.ts` functions loop over every page with `limit=100`). Then search, filter, sort and paginate on the client with `usePaginatedList(filtered, PAGE_SIZE)`.
- Mutations: `useMutation`, then `onSuccess` → `queryClient.invalidateQueries({ queryKey: ["admin", ...] })`, `toast.success(...)`, close the dialog. `onError` → `toast.error(getErrorMessage(err, "..."))`.
- Query keys use the `["admin", <resource>, ...]` prefix. Exceptions: `["investor-documents", id]` and `["permissions", ...]`. Invalidate related resources too (for example, creating an investor also invalidates `linkable-users`).
- Create and edit share one `*FormDialog` with `mode` / `initial*` props. Forms use controlled `useState`, not react-hook-form. `shared/components/ui/form.tsx` exists but nothing uses it. Validation is done by hand inside the dialog.
- Shared UI feedback lives in `shared/components/ui/feedback.tsx`: `AccessDenied`, `PageSkeleton`, `TableSkeleton`, `EmptyStateGeneral`, `DeleteConfirmDialog`.

### API layer conventions (`features/*/api.ts`)

- The backend wraps responses as `{ success, message, data }`. List data may come back as `data.items` with `data.meta.totalPages`, as a bare array, or unwrapped. Existing code reads it defensively: `data?.data?.items ?? data?.data ?? data ?? []`.
- Raw row interfaces (`ApiXxxRow`) list both snake_case and camelCase variants of each field. The mappers pick the first one present and turn it into the camelCase UI type. Outgoing payloads are converted back to snake_case. Keep this mapping inside `api.ts` so pages only ever see the `types.ts` shapes.
- Money values can arrive as strings. Convert them with `Number(...)`.

### File uploads

Use `uploadFile(presignUrl, confirmUrl, presignPayload, confirmPayload, file)` from `shared/lib/upload.ts`. It runs presign (via axios) → `PUT` straight to R2 with `fetch`, no credentials, `Content-Type` must match → confirm (via axios). Allowed types: PDF/JPEG/PNG/DOC/DOCX, and for media also MP4/MOV/AVI/WebM. Downloads call a `/.../:id/download` endpoint, read `downloadUrl` from the response and pass it to `window.open`.

## Styling

- Brand tokens are defined in `globals.css` and exposed as Tailwind colors: `brand`, `brand-2`, `accent-teal`, `success`, `warning`, `danger`, plus the standard shadcn tokens. Use the utilities `bg-gradient-brand`, `shadow-card` and `shadow-elevated`. Prefer these tokens over raw Tailwind palette colors.
- Use `cn()` from `@/shared/lib/utils`. Besides the standard variants, Badge has the status variants `active`, `pending`, `cancelled` and `info`; `features/*/utils.ts` maps each domain's status values to them.
- `components.json` aliases point to `@/shared/components` and `@/shared/components/ui`. Its `tailwind.css` value (`src/styles.css`) is stale, since the real file is `src/app/globals.css`. Fix that before running `shadcn add`.

## Known quirks / gotchas

- **`middleware.ts` is deprecated in Next 16** (renamed to `proxy.ts`, see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). It still works. Migrate it only when asked.
- `app/providers.tsx` creates its own `new QueryClient()`, so the defaults in `shared/lib/queryClient.ts` (staleTime 60s, no refetch on focus, retry 1) are **not** applied.
- Pages use `useSuspenseQuery`, but there is no `<Suspense>` boundary or `loading.tsx` under `/admin`.
- The dashboard (`features/admin-dashboard/api.ts`) still returns **hard-coded dummy data**.
- `/admin/settings` is the logged-in user's own account page (profile via `PUT /users/:id`, password via `POST /auth/change-password`). The backend rejects self password changes through `PUT /users/:id`. After a profile save, refresh the auth store with `GET /auth/me`.
- `AdminShell` renders a blank shell until hydrated, to avoid hydration mismatches from the persisted store. Use `useHydrated()`, not a `useEffect` + `setMounted` pattern.
- `CLAUDE.md`, `AGENTS.md` and `.claude/` are listed in `.gitignore` but are already tracked.
