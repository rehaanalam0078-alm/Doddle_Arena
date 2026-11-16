# Design Tokens — Doodle Arena

Derived directly from `doodle_arena/DESIGN.md` (Stitch MCP Resource `projects/16271601477356813138`).

---

## 1. Typography

- **Primary Font Family:** `Plus Jakarta Sans`, sans-serif
- **Font Weights:** `500` (Medium), `600` (SemiBold), `700` (Bold), `800` (ExtraBold), `900` (Black)

### Type Scale

| Token | Font Size | Line Height | Weight | Letter Spacing | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `headline-xl` | 40px | 48px | 800 | `-0.02em` | Hero titles, victory banners |
| `headline-xl-mobile`| 30px | 36px | 800 | `-0.01em` | Mobile hero headings |
| `headline-lg` | 28px | 36px | 800 | `-0.01em` | Section headers, drawer secret words |
| `headline-md` | 22px | 28px | 700 | `0` | Card titles, mode names, word options |
| `body-lg` | 18px | 26px | 600 | `0` | Subtitles, emphasis text |
| `body-md` | 15px | 22px | 500 | `0` | Chat messages, standard descriptions |
| `body-sm` | 13px | 18px | 500 | `0` | Secondary metadata, hints |
| `label-lg` | 14px | 18px | 700 | `+0.02em`| Button text, tab navigation |
| `label-md` | 12px | 16px | 800 | `+0.04em`| Badges, score cards, status chips |
| `label-sm` | 11px | 14px | 700 | `+0.05em`| Uppercase micro-labels, live counter |

---

## 2. Color Palette

### Brand & Core Accents

| Name | Hex Value | Role in Design System |
| :--- | :--- | :--- |
| **Primary Purple** | `#7C3AED` | Primary brand CTA, drawer halo, level progress, host badge |
| **Primary Bevel** | `#5B21B6` | 4px bottom border tactile bevel for primary buttons |
| **Secondary Coral** | `#FF6B6B` | Leave game, timer urgent state (<15s), clear canvas, danger |
| **Secondary Bevel** | `#DC2626` | 4px bottom border tactile bevel for secondary buttons |
| **Tertiary Turquoise** | `#06B6D4` | Guessed checkmark, correct guess banner, active stream badge |
| **Tertiary Dark** | `#0891B2` | Darker cyan border & bevel |
| **Sunshine Gold** | `#F59E0B` | 1st place podium, streak highlight, XP bonuses, coins |
| **Deep Navy Neutral** | `#1E1B4B` | Primary typography, dark tactile bevels, deep contrast |
| **Canvas & BG** | `#FCF8FF` / `#F8F9FD` | Soft eye-strain reducing paper canvas and page background |

### Surface Containers (Material 3 Theme Extension)

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| `surface-container-lowest` | `#FFFFFF` | Cards, drawing canvas, active inputs, chat box |
| `surface-container-low` | `#F6F2FF` | Inset wells, stage containers, sub-panels |
| `surface-container` | `#EFEBFF` | Button utility surfaces, tag pills |
| `surface-container-high` | `#E9E5FF` | Hover states, tab active backgrounds |
| `surface-container-highest`| `#E3DFFF` | Inactive selectors, disabled pills |
| `outline-variant` | `#CCC3D8` | Card borders, tactile ghost button borders, dividers |
| `outline` | `#7B7487` | Secondary text, inactive icon fills |

---

## 3. Spacing, Radii & Shadows

### Spacing Scale
- `space-xs`: `0.25rem` (4px)
- `space-sm`: `0.5rem` (8px)
- `space-md`: `0.75rem` (12px)
- `space-lg`: `1.25rem` (20px)
- `space-xl`: `2.0rem` (32px)
- `gutter`: `1.0rem` (16px)
- `gutter-lg`: `1.5rem` (24px)
- `margin`: `1.0rem` (16px)
- `margin-lg`: `2.0rem` (32px)

### Border Radii
- `rounded-sm`: `0.25rem` (4px)
- `rounded-md`: `0.5rem` (8px)
- `rounded-lg`: `0.75rem` (12px)
- `rounded-xl`: `1.0rem` (16px)
- `rounded-2xl`: `1.25rem` (20px)
- `rounded-3xl`: `1.5rem` (24px)
- `rounded-full`: `9999px`

### Tactile Physical Elevation & Depth
- **Primary 3D Button:**
  ```css
  background-color: #7C3AED;
  border-bottom: 4px solid #5B21B6;
  box-shadow: 0 10px 24px -4px rgba(124, 58, 237, 0.35);
  transition: all 0.1s ease-in-out;
  ```
  *Active/Pressed:* `transform: translateY(2px); border-bottom: 2px solid #5B21B6;`
- **Secondary 3D Button:**
  ```css
  background-color: #FF6B6B;
  border-bottom: 4px solid #DC2626;
  ```
  *Active/Pressed:* `transform: translateY(2px); border-bottom: 2px solid #DC2626;`
- **Ghost 3D Button:**
  ```css
  background-color: #FFFFFF;
  border: 1.5px solid #CCC3D8;
  border-bottom: 3.5px solid #B8ADC5;
  ```
  *Active/Pressed:* `transform: translateY(2px); border-bottom: 1.5px solid #B8ADC5;`
- **Tactile Card:**
  ```css
  border: 2px solid #CCC3D8;
  box-shadow: 0 10px 24px -4px rgba(24, 20, 69, 0.06);
  ```
- **Active Avatar Ring:**
  ```css
  box-shadow: 0 0 0 4px #FCF8FF, 0 0 0 7px #7C3AED;
  ```
