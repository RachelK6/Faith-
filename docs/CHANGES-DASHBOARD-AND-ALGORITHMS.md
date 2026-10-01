# Dashboards + three algorithms — what changed

## Setup (run once)
```
cd backend
pip install -r requirements.txt            # adds pandas, numpy, scikit-learn==1.8.0, xgboost, shap, joblib
python manage.py migrate                   # no new tables; existing PerformanceSnapshot is reused
python manage.py compute_snapshots         # (existing command) fills weekly data the risk model reads
cd ../frontend && npm install && npm run dev
```

## 1. Student — Adaptive Sequencing Engine  (`backend/apps/sequencing`)
`GET /api/sequencing/me/` — mastery-based (rule engine, deliberately not ML): scores each module
from activity/submission/quiz results, classifies pace **reinforce / steady / accelerate**, and returns
a next step with a plain-English reason. Shown as "Recommended for you" + skill radar.

## 2. Instructor — Early Warning Risk Classifier  (`backend/apps/risk` + `backend/risk_engine`)
Wires the existing XGBoost + SHAP `risk-engine` into Django. `GET /api/risk/cohort/` and
`GET /api/risk/student/<id>/course/<id>/` (instructor/admin only). Students with < 3 weeks of
snapshots are reported as "insufficient history", never guessed. Returns risk level, health score,
SHAP-derived top factors and a recommended action.
**Caveat:** the shipped model was trained on synthetic labels — treat as a prompt to look closer,
retrain on real outcomes before using for academic decisions.

## 3. Admin — Course & Resource Allocation Optimizer  (`backend/apps/allocation`)
`GET /api/allocation/recommendations/` (admin only). Weighted load score per instructor
(enrolment + 2.5 × ungraded submissions), flags overload (>1.35× avg), single-course overload
(>40 students), grading backlog, and names a concrete rebalance target. Every recommendation carries its numbers.

## Frontend
- Rebuilt Student / Instructor / Admin dashboards on real API fields (no hardcoded numbers), loading / error / empty states.
- New: `components/charts.jsx`, `hooks/useDashboardFx.js`, `GradeModal` (replaces `window.prompt`), full `dashboard-tokens.css`.
- Removed fake features with no backend: messaging, fake "system health", fake "add user".
  Admin gets an honest "Open Django admin" button (staff accounts are intentionally not creatable via API).
- Sidebar now shows a real progress bar (`weeklyGoal` was computed but never rendered).
- Dead decorative role tabs in the header replaced with a role badge.

## Small fixes elsewhere
- Broken lucide icon names (`CheckCircle2`, `AlertTriangle`, `XCircle`) → current names across 8 files (incl. Landing.jsx — import names only).
- `index.html` loaded unused Public Sans; now loads JetBrains Mono, which `--font-mono` uses.
- InstructorContent / InstructorStudents: cascading-select resets moved from effects into handlers.
- `npm run lint`: 0 errors / 0 warnings. `vite build`: passes. Backend: 10 new tests pass, no regressions.

## Motion layer (frontend/src/components/fx.jsx + end of dashboard-tokens.css)
Word-by-word headline reveal, staggered card/KPI/row/nav entrances, count-up numbers, chart draw-ins,
animated aurora background, scroll-progress bar, page-transition on route change, cursor-follow card glow,
button sheen + click ripple, chart hover tooltips, pulsing high-risk badge. All disabled under
`prefers-reduced-motion`. Known gap: the header theme toggle is still a non-functional button (dark mode
would need the Tailwind-coloured layout converted to the theme tokens first).
