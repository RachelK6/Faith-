# Optimum LMS — React dashboard UI kit

Pure UI/UX, built to drop into your existing Vite + React 19 + TypeScript project.
Not a backend — you already have Django REST behind `src/api/client.ts`; this kit only adds
front-end components and calls your existing `apiFetch()` helper the same way your current
`src/api/*.ts` files do.

## What's in here

```
public/
  logo-mark.svg        copy into your project's public/ (or import as an asset)
  favicon.svg
src/
  styles/dashboard-tokens.css   design tokens + every animation, ported 1:1 from the HTML reference
  hooks/
    useDashboardFx.ts   useCountUp, useReveal, useTheme, useRipple, useSpotlight
    useToast.tsx        toast provider + host
    useApiData.ts        generic loading/error/retry wrapper around any api call
  components/
    ui/                 Ring, Sparkline, AreaChart, Donut, Radar, Heatmap, BarChart/BarList,
                         LearningPath, KpiCard, Hero, Pill, ProgressBar, Card, Modal, icons,
                         DataStates (Skeleton/ErrorState/EmptyState)
    DashboardHeader.tsx  logo, command-palette button, theme toggle, notification bell + panel
    DashboardSidebar.tsx collapsible nav sidebar
    CommandPalette.tsx   ⌘K / Ctrl+K palette
    VideoPlayer.tsx      YouTube player + role-specific picker (see below)
    GradeModal.tsx, ComposeModal.tsx, FocusTimer.tsx, QuickCreateFab.tsx, ScrollProgress.tsx
  api/
    instructorDashboard.ts, adminDashboard.ts, modules.ts, messages.ts   -- NEW files
  pages/
    StudentDashboard.tsx, InstructorDashboard.tsx, AdminDashboard.tsx   -- full pages, wired to api/*
  DashboardShell.example.tsx   shows how everything wires together — reference only, don't ship as-is
```

## How to install

1. Copy `public/logo-mark.svg` and `public/favicon.svg` into your project's `public/` folder.
2. Copy `src/styles/dashboard-tokens.css`, `src/hooks/`, `src/components/`, and `src/pages/` into your `src/`.
   None of this touches your existing `src/App.tsx`, `src/index.css`, or the API files you already have
   (`auth.ts`, `client.ts`, `dashboard.ts`, `enrollments.ts`, `gamification.ts`, `analytics.ts`, `risk.ts`,
   `stats.ts`) — it only **adds** `instructorDashboard.ts`, `adminDashboard.ts`, `modules.ts`, `messages.ts`.
3. Add one line to your `src/index.css`:
   ```css
   @import './styles/dashboard-tokens.css';
   ```
4. Wrap your app (or just the dashboard routes) in `<ToastProvider>` from `hooks/useToast.tsx`.
5. Set `data-role="student" | "instructor" | "admin"` on the element that wraps a dashboard — that's what
   switches the accent colour (violet / teal / blue). Drive it from your real auth/route, not a UI toggle.
6. Render `<StudentDashboard studentName={user.name} />` (etc.) wherever that role's home page lives.
7. Look at `DashboardShell.example.tsx` for how the header, sidebar, command palette and pages fit together,
   then copy that pattern into your actual `App.tsx` / router — don't import the example file directly.

This was verified against your real project: dropped into `src/`, `npx tsc --noEmit` passes and
`npx vite build` completes cleanly (55 KB CSS / ~93 KB JS gzipped added).

## Field names — check these against your actual backend

Since you already have the backend, the one thing to check by hand is whether the field names in the
**new** api files match what your Django serializers actually return. I wrote them to look and read the
same way as your existing `dashboard.ts` / `gamification.ts` / etc. (same style, same doc-comment
convention), but I don't have your instructor/admin endpoints in front of me, so:

- `src/api/instructorDashboard.ts` — `GET /dashboard/instructor/`, `POST /submissions/{id}/grade/`
- `src/api/adminDashboard.ts` — `GET /dashboard/admin/`, `POST /users/`
- `src/api/modules.ts` — `GET /courses/current/modules/`, `GET`/`PATCH /lessons/{id}/`
- `src/api/messages.ts` — `POST /messages/`

If your real endpoints return different field names or shapes, edit the `type` at the top of each file to
match — the page components only use the fields the type declares, so a rename in one place is enough.
If an endpoint doesn't exist yet on your backend, the page will show its built-in error state (with Retry)
rather than crash.

## Notes on specific pieces

- **Video player** (`VideoPlayer.tsx`): the picker is role-specific on purpose — students get a read-only
  "Up next" list, instructors get a picker **plus** a paste-a-YouTube-link box that calls
  `updateLessonVideo()`. Don't merge these back into one shared picker.
- **Command palette / theme toggle / notifications**: all pure client-side UI, no backend needed.
- **Focus timer**: entirely client-side (no persistence) — add a backend call in `FocusTimer.tsx` only if
  you want sessions logged.
- **Reduced motion**: every animation in `dashboard-tokens.css` is disabled under
  `prefers-reduced-motion: reduce`, and `useCountUp`/`useReveal` check it in JS too.
- **Role switcher**: there isn't one in these components on purpose — `DashboardHeader`'s
  `showRoleSwitcher` prop defaults to `false`. Only turn it on for an internal design-preview build.
