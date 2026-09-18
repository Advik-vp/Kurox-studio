# 06 — UI Design System

**Brand:** KUROX  
**Voice:** Precise, calm, production-literate. Short labels. No playful copy in finance.

---

## 1. Logo & wordmark

- Wordmark: **KUROX** in uppercase, tracking wide, font **Syne** (or fallback Outfit).
- Mark (optional): aperture / “K” cut by a film-frame corner — use sparingly in app chrome.
- Tagline (marketing only): *Studio Operations. CRM. Production. Growth.*

---

## 2. Color (CSS tokens)

Dark is default. Light is a first-class theme.

```css
:root[data-theme="dark"] {
  --kx-bg: #0B0C0E;
  --kx-bg-elevated: #12141A;
  --kx-bg-surface: #181B22;
  --kx-bg-hover: #1F232C;
  --kx-border: #2A2F3A;
  --kx-text: #F4F1EA;
  --kx-text-muted: #9B968A;
  --kx-text-subtle: #6E6A62;
  --kx-accent: #D4A017;          /* tungsten gold */
  --kx-accent-fg: #1A1403;
  --kx-accent-muted: #3A2F12;
  --kx-info: #6B8CFF;
  --kx-success: #3DDC97;
  --kx-warning: #E8B931;
  --kx-danger: #E5484D;
  --kx-lead: #8B7CFF;
  --kx-shoot: #FF7A45;
  --kx-finance: #3DDC97;
  --kx-seo: #5AD0E8;
  --kx-mkt: #FF5C8A;
}

:root[data-theme="light"] {
  --kx-bg: #F6F4EF;
  --kx-bg-elevated: #FFFFFF;
  --kx-bg-surface: #FFFFFF;
  --kx-bg-hover: #EFEBE3;
  --kx-border: #E2DCD0;
  --kx-text: #16181D;
  --kx-text-muted: #5C5850;
  --kx-text-subtle: #8A8478;
  --kx-accent: #B8860B;
  --kx-accent-fg: #FFFFFF;
  --kx-accent-muted: #F3E6C2;
}
```

Do not use gold for error. Do not use red for “In Progress”.

---

## 3. Typography

- UI: **DM Sans** (400/500/600)
- Numbers/KPI: **DM Sans tabular-nums**
- Brand: **Syne** 700
- Mono (IDs, JSON): **IBM Plex Mono**

Scale: 12 / 14 / 16 / 20 / 24 / 32 / 40. Body 14, compact tables 13.

---

## 4. Elevation & radius

- Radius: 8px controls, 12px cards, 16px modals, full pill badges.
- Shadow: dark theme uses 1px border more than drop shadow; light uses soft `0 8px 24px rgba(20,16,10,.06)`.
- Hairline separators, not heavy rules.

---

## 5. Components (shadcn-based)

Build on shadcn/ui primitives with Kurox tokens:

Button (primary gold, secondary ghost, destructive, outline), Input, Select, Combobox, Textarea, Checkbox, Switch, Tabs, Dialog, Sheet/Drawer, Dropdown, Popover, Tooltip, Command, Table, Badge, Avatar, Calendar, DatePicker, Form (RHF+Zod), Toast/Sonner, Skeleton, Empty, Alert, Accordion, ScrollArea, Separator, Progress, Chart (Recharts wrappers).

**Kurox-specific:**

| Component | Use |
|-----------|-----|
| `StatusBadge` | Entity status + icon + label |
| `LifecycleStepper` | Project / shoot / asset / quote |
| `EntityHeader` | Title, meta, actions |
| `KpiCard` | Dashboard |
| `ActivityFeed` | Timelines |
| `Money` | Currency minor-units formatter |
| `UserChip` | Assignee |
| `ShotRow` | Shot list |
| `CallSheet` | Shoot header |
| `MediaThumb` | Asset grid |
| `CommandPalette` | Global search |
| `EmptyState` | Title, hint, CTA |
| `PageGuard` | Role + loading |

---

## 6. Status badges (text + icon)

| Domain | Values | Icon family |
|--------|--------|-------------|
| Lead | new, contacted, qualified, proposal, negotiation, won, lost | circle-dot |
| Project | planning … completed | stepper |
| Shoot | planning … cancelled | clapper |
| Shot | planned, ready, shot, retake, approved | frame |
| Task | todo, in_progress, review, completed | check |
| Quote | draft … expired | file |
| Invoice | draft … cancelled | receipt |
| Asset | uploaded … archived | film |

---

## 7. Iconography

Lucide icons. Stroke 1.75. No mixed icon sets.

---

## 8. Motion

150–200ms ease-out for drawers. Kanban drag uses library defaults. Honor reduced motion.

---

## 9. Content guidelines

- Buttons: verb + noun (“Create shoot”, not “Submit”).
- Destructive: name the object (“Cancel invoice INV-2026-004”).
- Empty: one sentence + one action.
- Implemented vs mock: if a panel uses mock data, show a `Preview data` badge. If not implemented, `Coming in Phase 3` — never a fake live metric.
