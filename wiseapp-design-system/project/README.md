# wiseApp / BizFocus — Design System

> Управленческая аналитическая платформа для ресторанного бизнеса (с фокусом на сети кофеен и кафе).

This design system captures the visual + interaction language of **wiseApp** (codename: BizFocus) — a Russian-first analytics dashboard for restaurant operators. It powers KPI dashboards, demand heatmaps, cohort analysis, ABC/XYZ matrices, fraud detection, P&L reporting, and an Action Center driven by an LLM agent.

---

## Sources

| Source | Path / URL | Notes |
|---|---|---|
| Codebase | `github.com/TheKasymov/bizfocus` (`main`) | Monorepo: `frontend/` (React+Vite+TS+Tailwind), `go-core/` (Go API), `python/` (FastAPI ML) |
| Design tokens | `frontend/tailwind.config.js` | `brand.*` (amber 50–900) and `dark.*` (slate 50–950) palettes |
| Global CSS | `frontend/src/index.css` | Inter font import, scrollbar, fade-in, recharts tooltip |
| Components | `frontend/src/components/ui/` | `Card`, `Badge`, `StatCard`, `Modal`, `EmptyState`, `PageHeader` |
| Pages | `frontend/src/pages/` | 30+ analytics pages (Dashboard, ManagerCockpit, ABCXYZ, Login…) |
| Logo wordmark | `frontend/src/components/Sidebar.tsx` | "wiseApp" + `lucide-react` `TrendingUp` icon in brand-500 tile |

> No Figma was provided. All decisions in this system are derived directly from the codebase (the most fidelity-true source).

---

## Product context

**wiseApp** превращает операционные данные ресторана (iikoCloud POS, импорт CSV/Excel, ручной ввод) в ежедневные решения для владельца и управляющего.

**Ключевые поверхности продукта:**

- **Dashboard** — выручка, средний чек, активные дни, топ товаров, тренд по дням
- **Manager Cockpit** — «что произошло, что не так и что сделать сегодня»
- **Action Center** — рекомендации от AI-агента (Ollama llama3.2) с lifecycle (created → seen → accepted/done/dismissed)
- **Heatmap спроса** — спрос по дням × часам
- **Когортный анализ** — retention / RFM / churn risk / LTV
- **ABC / XYZ** — матрица 3×3 категоризации товаров
- **Финансы** — P&L, кассовые разрывы, food cost, бенчмаркинг
- **Безопасность** — аномалии, фрод-детектор, Trust Score сотрудников
- **Импорт** — мастер CSV/Excel в три шага
- **Login / Register / Reset Password** — публичные страницы

**Роли:** `admin`, `network_manager`, `point_manager` (определяют доступ к страницам).

---

## Index — what's in this folder

| File / folder | Purpose |
|---|---|
| `README.md` | Brand context, content + visual foundations, iconography |
| `colors_and_type.css` | All CSS custom properties (brand, semantic, type, spacing, radii, shadows) + semantic type roles |
| `SKILL.md` | Cross-compatible Agent Skill manifest |
| `assets/` | Logos, icon notes, sample illustration placeholders |
| `preview/` | HTML cards rendered into the Design System tab |
| `ui_kits/wiseapp/` | UI kit recreation: dashboard, cockpit, login, components |

---

## CONTENT FUNDAMENTALS

**Language.** Russian-first. English is reserved for technical jargon that has no clean Russian equivalent or is industry standard (e.g. *Dashboard*, *Cockpit*, *Heatmap*, *ABC/XYZ*, *Food Cost*, *Trust Score*, *RFM*, *LTV*, *Churn Risk*). Page titles freely mix: «**Cockpit менеджера**», «**Heatmap спроса**», «**P&L Отчёт**».

**Tone.** Operational, terse, factual. The product is a tool for a manager who is busy — copy answers «что произошло, что не так, что сделать сегодня». Never marketing-y, never cheerful. No exclamation marks in production strings.

**Person.** Imperative + impersonal third-person. The system tells the user what to do («Выберите ресторан в фильтре сверху», «Обновить»), describes state factually («Идет первичная синхронизация: часть данных пока заполняется»), and never says «I» or «we». The user is addressed indirectly.

**Casing.**
- Page H1: Sentence case with optional trailing English term — «**ABC/XYZ Анализ**», «**Cockpit менеджера**»
- Card titles: Sentence case — «Ключевые риски», «Источники заказов», «Открытые действия»
- Sidebar section caps: ALL CAPS, with emoji prefix — «📊 ОБЗОР», «📈 АНАЛИТИКА», «💰 ФИНАНСЫ», «🛡️ БЕЗОПАСНОСТЬ»
- Buttons: Sentence case — «Войти», «Обновить», «Принять», «Выполнено», «Отклонить»
- Status pills: lowercase English — `high` / `medium` / `low`, `good` / `degraded`, `ok` / `attention` / `critical`

**Numbers + currency.** Always `ru-RU` locale (`123 456 ₸`). Tenge (`₸`) is the default unit. Percentages prefixed with sign on deltas («+12%», «−4.3%»). One decimal max for trend percentages.

**Empty + error states.** Quiet, explanatory, never apologetic.
- «Нет новых уведомлений»
- «Рекомендации появятся, когда накопится больше данных по заказам и складу.»
- «За выбранный период в iiko Delivery API заказов нет. Это нормальная ситуация, а не ошибка подключения.»
- «Выберите ресторан в фильтре сверху»

**Diagnostic copy.** Distinguishes *coverage limit* (amber warning) from *first-time sync warmup* (blue info) from *true error* (rose). E.g. «Данные ограничены по правам iiko API» vs «Идет первичная синхронизация: часть данных пока заполняется».

**Emoji.** Used **only** as section-cap glyphs in the sidebar (📊 📈 💰 🛡️ 👥 💬). Never in body copy, button labels, or headings inside pages.

**Vibe.** «Ressy panel for a sober operator at 8am» — the design helps you act, not feel. No celebratory micro-copy, no animations beyond a 0.3s fade-in.

---

## VISUAL FOUNDATIONS

**Theme.** Light. Application shell is `#f9fafb` (gray-50). Sidebar is one shade cooler: `#f1f5f9` (slate-100). Cards are pure white. (The legacy `glass-card` dark utilities in `index.css` are deprecated — modern pages always use white surfaces.)

**Brand palette.** Amber (`brand.50` → `brand.900`, primary `#f59e0b` = brand-500). The brand color is used *sparingly* — as the logo tile fill, as the active-state indicator on sidebar links (brand-100 bg + brand-800 text + brand-200 ring), as the primary CTA, and as the leading line in the revenue chart. Most surfaces are neutral; brand acts as accent.

**Neutral palette.** Tailwind slate (`slate.50` → `slate.950`), aliased `dark.*` in the source config. `slate-900` for headings, `slate-800` for body, `slate-500` for labels, `slate-400` for placeholders/captions.

**Semantic palette.**
- emerald — KPI up, "good" sync, success states (`text-emerald-500/600/700`, `bg-emerald-50`)
- rose — destructive, churn risk, critical health (`text-rose-500/600`, `bg-rose-50`)
- amber — warning, coverage limits, medium priority (`bg-amber-50`, `text-amber-700`)
- sky / blue — informational, sync warmup, info banners
- indigo — feature accent in Cockpit (`text-indigo-600`)
- violet / pink — chart series only

**Typography.** Inter, weights 300/400/500/600/700/800. Loaded from Google Fonts. Body is 15px (`text-[15px]` is the de-facto base in this app). Headings use `tracking-tight` (`-0.02em`). Sidebar caps use `tracking-wider` + `uppercase`.

**Spacing.** Tailwind defaults. Layouts breathe — `gap-4` between KPI cards, `gap-6` between major sections, `p-5` / `p-6` for cards, `px-3 py-2` for nav items. The dashboard `space-y-6` rhythm is the dominant vertical metronome.

**Backgrounds.** Solid colors only. Two notable gradient touches:
1. Login page has a single decorative `bg-brand-400/10 rounded-full blur-3xl` orb behind the form.
2. Legacy `:root` had a `radial-gradient(circle at top right, #0f172a, #020617)` for the deprecated dark theme — not used in current pages.

No images, no patterns, no textures, no illustrations. The aesthetic is data-dense and chrome-light.

**Animation.** Minimal and functional.
- `animate-fade-in` (0.3s ease-out, `opacity` + `translateY(10px) → 0`) on page transitions
- `transition-all` / `transition-colors` / `transition-shadow` on every interactive surface (default Tailwind 150ms)
- `shimmer` keyframe (1.5s infinite) on skeleton loaders
- `hover:-translate-y-1` micro-lift on `StatCard`
- `active:scale-[0.98]` on primary buttons
- No bouncy easings, no parallax, no continuous animation.

**Hover states.**
- Nav items: `hover:bg-white hover:text-slate-800` (when on slate-100 sidebar)
- List rows: `hover:bg-slate-50/50` or `hover:bg-gray-100`
- Cards: `hover:shadow-md` (sometimes `hover:-translate-y-1`)
- Brand button: `hover:bg-brand-600`
- Destructive: `hover:bg-rose-50 hover:text-rose-600` (logout button is the canonical example)

**Press states.** `active:scale-[0.98]` on primary CTAs. Icon buttons just darken via the hover state.

**Borders.** Hairline (`1px`) and pale. `border-gray-100` (`#f3f4f6`) is the default card border; `border-gray-200` for inputs; `border-slate-100` / `border-gray-50` as inner dividers. Active sidebar item adds `ring-1 ring-brand-200`.

**Shadow system.** Long-throw, low-opacity, near-flat. The signature value is `shadow-[0_4px_30px_rgba(0,0,0,0.02)]` for cards — almost imperceptible but enough to lift off the gray-50 shell. Hover bumps to `0_8px_30px_rgba(0,0,0,0.04)`. Dropdowns use `0_10px_40px_rgba(0,0,0,0.08)`. Login modal goes `0_8px_40px_rgba(0,0,0,0.04)` with a `rounded-[36px]`. Inset shadows (`inset_0_2px_4px_rgba(0,0,0,0.02)`) appear on the email pill in the header.

**Protection / capsules.** Capsules dominate. Status badges, role chips, period selectors, search pills — all `rounded-full` or `rounded-2xl` with `bg-{semantic}-50` + `text-{semantic}-700` + `border-{semantic}-100/200`. There are no protection gradients; semantics are achieved via tinted background + tinted border + tinted text.

**Layout rules.**
- Fixed sidebar (`w-64`) on desktop, slide-in overlay on mobile
- Fixed header (`h-16`) with white bg + bottom border
- Main content `overflow-y-auto`, padded `p-4 md:p-6`
- Page-level layout: `space-y-6` of cards
- KPI strip: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-{4|6} gap-4`
- Two-column data layout: `grid grid-cols-1 lg:grid-cols-2 gap-6`
- Three-column dashboard split: `lg:grid-cols-3` with chart taking `lg:col-span-2`

**Transparency + blur.** Sparingly. Login decorative orb uses `bg-brand-400/10 blur-3xl`. Notifications dropdown has subtle `bg-slate-50/50` header. Hover row backgrounds use `/50` alpha (`bg-rose-50/50`). Global `backdrop-blur` only inside the deprecated `glass-card` utility.

**Color vibe of imagery.** N/A — there is no photography in the product. Every visual surface is type, color tokens, and recharts SVGs.

**Corner radii.** Dialed to be friendly without being soft. Most cards `rounded-2xl` (16px); inner pills/inputs `rounded-xl` (12px); status chips `rounded-full`; KPI cards in some pages step up to `rounded-[28px]`; the login modal goes the furthest at `rounded-[36px]`. Buttons are `rounded-full` for primary CTAs, `rounded-xl` for icon buttons in lists, `rounded-2xl` for compact pill buttons.

**Card anatomy.** `bg-white rounded-2xl border border-gray-100 shadow-sm` is the canonical recipe. Optional internal split between header (`px-6 py-4 border-b border-gray-50`) and body (`px-6 py-5`). KPI cards add a corner icon tile (`p-3 rounded-xl bg-{tint}/10`).

---

## ICONOGRAPHY

**Primary system: `lucide-react`** (`v0.303.0`). Used everywhere — sidebar nav, header, KPI tiles, buttons, status indicators. Consistent stroke-1.5, currentColor, with sized utilities: `h-3.5 w-3.5` (chevrons), `h-4 w-4` (inline status), `h-[18px] w-[18px]` (nav, list), `h-5 w-5` (KPI/section), `h-6 w-6` (logo), `h-8 w-8` (page H1).

The full sidebar uses lucide for every nav target — `LayoutDashboard`, `Flame`, `DollarSign`, `Users`, `Filter`, `UserCheck`, `CloudSun`, `CalendarDays`, `Grid3x3`, `TrendingUp`, `Wallet`, `FileText`, `Target`, `BarChart3`, `AlertTriangle`, `Shield`, `Award`, `CalendarClock`, `FileCheck`, `Heart`, `Star`, `Lightbulb`, `Activity`, `Bell`, `User`, `UsersRound`, `Store`, `Plug`, `LogOut`, `ChevronDown`, `ChevronRight`, `X`, `Menu`.

**On the web (HTML artifacts):** load lucide via CDN — `https://unpkg.com/lucide@latest/dist/umd/lucide.js` then `lucide.createIcons()` after DOM ready, OR per-icon SVG via `https://unpkg.com/lucide-static/icons/{name}.svg`. Both are documented in `assets/iconography.md`.

**Emoji as section glyphs.** The sidebar section captions prefix emoji glyphs (📊 📈 💰 🛡️ 👥 💬) — these are rendered by the OS as full-color, intentionally informal, used only as caption ornaments. Never used inside content or copy.

**Custom SVGs.** None. The product has no proprietary glyphs.

**Logo.** A wordmark «wiseApp» (Inter Extrabold, slate-900, `tracking-tight`) preceded by a `brand-500` rounded tile (`rounded-xl`) containing the lucide `TrendingUp` icon in `slate-800`. See `assets/logo-wiseapp.svg`.

**Unicode chars as icons.** Only one — the right-arrow `→` on hover-targeting list rows («AI Insights» on the dashboard).

---

## How to use this system

1. **Read the foundations first.** Open `colors_and_type.css` — every token is documented and grouped.
2. **Then look at the UI kit.** `ui_kits/wiseapp/index.html` is a working interactive recreation.
3. **For new screens**, mirror the dashboard's layout DNA: page header (H1 + lucide icon + subtitle), KPI strip (`grid-cols-{N}` of `StatCard`), then `space-y-6` content cards.
4. **Russian copy first.** When in doubt, write in Russian; reach for English only for irreducible technical terms.
5. **Stay quiet visually.** White cards, hairline borders, near-flat shadows. Color is reserved for status and brand accent.

---

## Substitutions + caveats

- **Fonts**: Inter is loaded from Google Fonts at runtime — no `.ttf` files needed. If you need offline use, pull `Inter-{300..800}.woff2` into `fonts/`.
- **Icons**: Recreated via lucide CDN (`lucide-static`) for portability — visually identical to `lucide-react` in source.
- **No raster assets** were attached. There is no photography or illustration in the brand.
