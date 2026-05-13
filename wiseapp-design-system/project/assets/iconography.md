# Iconography — wiseApp

**System:** [Lucide](https://lucide.dev) (`lucide-react@0.303.0` in source).

**On HTML artifacts**, use either:
1. Inline SVG copied from `https://unpkg.com/lucide-static@latest/icons/{name}.svg`
2. Or via CDN: `<script src="https://unpkg.com/lucide@latest"></script>` then `lucide.createIcons()`

## Stroke & sizing
- Default `stroke-width="2"` (lucide default), color via `currentColor`
- Sizes (matched to source utility classes):
  - `h-3.5 w-3.5` — chevrons in lists
  - `h-4 w-4` — inline status indicators, badges
  - `h-[18px] w-[18px]` — nav items, header buttons, list-row leading icons
  - `h-5 w-5` — KPI value icons, section headers
  - `h-6 w-6` — sidebar logo
  - `h-7 w-7` — page H1 (Manager Cockpit)
  - `h-8 w-8` — page H1 (ABC/XYZ analysis)

## Canonical icons by surface
| Surface | Icon |
|---|---|
| Logo | `trending-up` (in brand-500 tile) |
| Dashboard | `layout-dashboard` |
| Cockpit | `activity` |
| Action Center | `bell` |
| Heatmap | `flame` |
| Финансы / финансовые KPI | `dollar-sign` |
| Сотрудники | `users` |
| Воронка | `filter` |
| Когорты | `user-check` |
| Погода | `cloud-sun` |
| Праздники | `calendar-days` |
| ABC / XYZ | `grid-3x3` |
| Товары | `trending-up` (re-used) |
| Кассовые разрывы | `wallet` |
| P&L | `file-text` |
| Бенчмарки | `target` |
| Food Cost | `bar-chart-3` |
| Аномалии | `alert-triangle` |
| Фрод | `shield` |
| Trust Score | `award` |
| Сменный график | `calendar-clock` |
| Z-отчёты | `file-check` |
| Лояльность | `heart` |
| Отзывы | `star` |
| Рекомендации | `lightbulb` |
| Команда | `users-round` |
| Рестораны | `store` |
| Подключение iiko | `plug` |
| Профиль | `user` |
| Уведомления | `bell` |
| Выход | `log-out` |
| Меню (mobile) | `menu` / `x` |
| Тренд (KPI) | `arrow-up-right` / `arrow-down-right` / `minus` |

## Emoji
Used only in sidebar section captions: 📊 ОБЗОР, 📈 АНАЛИТИКА, 💰 ФИНАНСЫ, 🛡️ БЕЗОПАСНОСТЬ, 👥 ПЕРСОНАЛ, 💬 КЛИЕНТЫ.
**Do not use emoji in body copy, buttons, or page headings.**

## Custom SVGs
None — the product has no proprietary glyphs. The wordmark + a lucide icon in a brand tile is the entire logo system. See `logo-wiseapp.svg`.
