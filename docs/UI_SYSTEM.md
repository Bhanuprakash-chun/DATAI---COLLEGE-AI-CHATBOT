# DatAI Universal UI System Specification

## 1. System Vision & Principles

DatAI is built on a **Universal UI System** ensuring 100% visual consistency, deliberate light/dark mode parity, and enforceable design tokens across all views and components.

### Core Tenets
- **ONE PRODUCT**: No fragmented page-specific styles or disconnected visual exceptions.
- **ONE DESIGN SYSTEM**: Explicit CSS variable tokens enforce backgrounds, surfaces, borders, typography, and controls.
- **ONE COMPONENT SYSTEM**: Universal primitives (`Button`, `Input`, `SearchInput`, `Card`, `Badge`, `Dialog`, `EmptyState`, `Skeleton`, `Table`) power every workflow.
- **ONE INTERACTION LANGUAGE**: Standardized hover, active, focus, disabled, and motion states across all controls.
- **100% LIGHT & DARK MODE PARITY**: Both light and dark modes are independently crafted with zero filter inversions or unreadable text.

---

## 2. Design Token System

### 2.1 Color Tokens & Product Identity
The color palette uses the product's signature identity:

| Token Name | Light Mode Value | Dark Mode Value | Usage Role |
| :--- | :--- | :--- | :--- |
| **Saffron (Accent)** | `#F4B942` | `#F4B942` | Intentional identity accent, active states, key CTAs |
| **Dark Saffron (Accent Dark)** | `#D99418` | `#D99418` | Pressed states, high-contrast borders |
| **Silver** | `#C7CBD1` | `#C7CBD1` | Secondary borders, neutral chrome elements |
| **Light Silver** | `#E9ECEF` | `#E9ECEF` | Subtle borders, light-mode pill fills |
| **White** | `#FFFFFF` | `#FFFFFF` | Light surface base, dark text contrast |
| **Black** | `#0B0D0F` | `#0B0D0F` | Dark page base, true black accents |
| **Dark Surface** | `#FFFFFF` | `#14171A` | Main card and panel surface layer |
| **Dark Elevated** | `#F8F9FA` | `#1B1F24` | Elevated dialogs, toolbars, popovers |
| **Primary Text** | `#17191C` | `#F5F7FA` | High-contrast body text, headings |
| **Secondary Text** | `#4B5563` | `#C7CBD1` | Secondary descriptions, subheadings |
| **Muted Text** | `#7C858F` | `#7C858F` | Timestamps, metadata, placeholder text |

### 2.2 Semantic CSS Variables (`client/src/index.css`)

```css
:root {
  --bg-page: #F8F9FA;
  --bg-surface: #FFFFFF;
  --bg-surface-elevated: #F1F3F5;
  --bg-surface-hover: #E9ECEF;
  --text-primary: #17191C;
  --text-secondary: #4B5563;
  --text-muted: #7C858F;
  --border-subtle: #E5E7EB;
  --border-strong: #C7CBD1;
  --accent-saffron: #F4B942;
  --accent-saffron-dark: #D99418;
  --status-danger: #EF4444;
  --status-success: #10B981;
  --status-warning: #F59E0B;
}

.dark {
  --bg-page: #0B0D0F;
  --bg-surface: #14171A;
  --bg-surface-elevated: #1B1F24;
  --bg-surface-hover: #22272E;
  --text-primary: #F5F7FA;
  --text-secondary: #C7CBD1;
  --text-muted: #7C858F;
  --border-subtle: #23272D;
  --border-strong: #333842;
  --accent-saffron: #F4B942;
  --accent-saffron-dark: #D99418;
  --status-danger: #F87171;
  --status-success: #34D399;
  --status-warning: #FBBF24;
}
```

---

## 3. Typography & Spacing Rules

### 3.1 Font Family & Scales
- **Primary Interface**: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
- **Monospace (Data / Code / Citations)**: `'JetBrains Mono', 'Fira Code', monospace`

| Scale Token | Class | Size / Line Height | Usage |
| :--- | :--- | :--- | :--- |
| `display` | `text-4xl sm:text-5xl md:text-6xl font-extrabold` | 36px–60px / 1.12 | Hero headlines |
| `h1` | `text-2xl sm:text-3xl font-bold` | 24px–30px / 1.2 | Page titles |
| `h2` | `text-xl sm:text-2xl font-bold` | 20px–24px / 1.25 | View headers |
| `h3` | `text-base sm:text-lg font-semibold` | 16px–18px / 1.35 | Section headers |
| `body` | `text-sm font-normal` | 14px / 1.5 | Primary message body & descriptions |
| `small` | `text-xs font-medium` | 12px / 1.4 | Controls, button labels, badges |
| `caption` | `text-[11px] font-mono` | 11px / 1.3 | Metadata, row counts, timestamps |
| `micro` | `text-[10px] font-mono` | 10px / 1.2 | Badges, shortcut tags (`⌘K`) |

### 3.2 Spacing & Dimension Rules
- **Header Alignment**: Exactly `h-14` (56px) across Sidebar Header, Main Header, and Viewport alignments.
- **Standard Control Heights**:
  - `sm`: `32px` (`h-8`)
  - `md`: `40px` (`h-10`)
  - `lg`: `48px` (`h-12`)
- **Standard Border Radius**:
  - `sm`: `4px` (`rounded-sm`)
  - `md`: `8px` (`rounded-md` / `rounded-lg`)
  - `lg`: `12px` (`rounded-xl`)
  - `xl`: `16px` (`rounded-2xl`)
  - `pill`: `9999px` (`rounded-full`)

---

## 4. Universal Component Library

### 4.1 Buttons (`client/src/components/ui/button.tsx`)
- **Variants**:
  - `primary`: High-contrast solid button (`bg-text-primary text-page hover:opacity-90`)
  - `secondary`: Subtle surface button (`bg-surface-elevated text-text-primary border border-border`)
  - `outline`: Bordered action button (`border border-border bg-transparent hover:bg-surface-hover`)
  - `ghost`: Transparent icon or menu action (`hover:bg-surface-hover text-text-muted hover:text-text-primary`)
  - `accent`: Saffron primary action (`bg-accent text-black font-semibold hover:bg-accent-dark`)
  - `danger`: Destructive actions (`bg-danger text-white hover:bg-danger/90`)
  - `primary-pill`: Full-radius high-contrast button
  - `outline-pill`: Full-radius bordered button
- **Sizes**: `sm` (h-8), `md` (h-10), `lg` (h-12), `icon-sm` (w-8 h-8), `icon` (w-10 h-10)

### 4.2 Inputs & Search (`client/src/components/ui/input.tsx`, `search-input.tsx`)
- Standard control heights (`h-8`, `h-10`).
- Unified focus ring: `focus:border-accent focus:ring-2 focus:ring-accent/30`.
- Integrated search icon, keyboard shortcut badge (`⌘K`), and clear button (`X`).

### 4.3 Cards (`client/src/components/ui/card.tsx`)
- Composite structure: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- Surface background: `bg-surface border border-border shadow-subtle rounded-2xl`.

### 4.4 Badges (`client/src/components/ui/badge.tsx`)
- Variants: `default`, `saffron`, `outline`, `success`, `warning`, `danger`, `ice`, `lavender`.
- Sizes: `sm` (py-0.5 px-2 text-[10px]), `md` (py-1 px-2.5 text-xs).

### 4.5 Modals & Dialogs (`client/src/components/ui/dialog.tsx`)
- High-performance backdrop blur (`bg-black/60 dark:bg-black/80 backdrop-blur-sm`).
- Standard modal sizing: `sm`, `md`, `lg`, `xl`, `2xl`.
- Accessible Escape key listener, click-outside dismissal, and compound header/title/description/footer slots.

### 4.6 Empty States (`client/src/components/ui/empty-state.tsx`)
- Icon container with subtle elevated background, title, description, and action button.

### 4.7 Virtualized Tables (`client/src/components/ui/table.tsx`, `SpreadsheetViewer.tsx`)
- Standard column header styling (`bg-surface-elevated text-text-muted border-b border-border`).
- Alternate row striping and active row highlighting (`bg-accent/15 border-accent`).

---

## 5. Viewport Layout & Screen System

1. **Main Frame**:
   - Sidebar (`w-64`, collapsible to `w-14`, border-r border-border).
   - Top Header (`h-14` / 56px, horizontal alignment, border-b border-border).
   - Main Stage (`h-[calc(100vh-3.5rem)]`).
   - Right Context Panel (`w-80 md:w-96`, border-l border-border).
2. **Chat Workspace**:
   - Refined hero section with DuckDB-WASM, Grounded Citations, and Local Storage feature cards.
   - Floating composer with multi-file attachment chips, dynamic question suggestions, and auto-growing textarea.
3. **File Library**:
   - Unified drag-and-drop zone with instant visual feedback.
   - Real-time indexing progress bar.
   - Integrated search with `<SearchInput />`.
4. **Analytics Studio**:
   - Top tabular overview cards.
   - Quick inquiry suggestions.
   - Responsive multi-type chart renderer (Bar, Line, Pie) with unified Saffron-accented palette.
5. **Privacy Dashboard**:
   - IndexedDB/OPFS quota gauge.
   - Zero-trust architecture verification.
   - Interactive minimal-context audit inspection dialog.
