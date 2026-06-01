---
name: My Media Tracker
description: A clean, friendly PWA for tracking personal media collections — games, anime, manga, and movies.
colors:
  primary: "#2563EB"
  secondary: "#10B981"
  bg-light: "#F4F6F8"
  bg-dark: "#0F172A"
  container-light: "#FFFFFF"
  container-dark: "#1E293B"
  item-light: "#E2E8F0"
  item-dark: "#334155"
  accent-highlight: "#F59E0B"
  danger: "#DC2626"
  success: "#28A745"
  text-primary-light: "#1F2937"
  text-primary-dark: "#F1F5F9"
  text-secondary-light: "#6B7280"
  text-secondary-dark: "#94A3B8"
typography:
  body:
    fontFamily: "Prompt, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  headline:
    fontFamily: "Prompt, sans-serif"
    fontSize: "clamp(1.25rem, 3vw, 1.75rem)"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "Prompt, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  label:
    fontFamily: "Prompt, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "50px"
components:
  button-primary:
    backgroundColor: "#2563EB"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "#1D4ED8"
  button-success:
    backgroundColor: "#28A745"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
  button-danger:
    backgroundColor: "#DC2626"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "#2563EB"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  input-field:
    backgroundColor: "#F9FAFB"
    textColor: "#1F2937"
    rounded: "{rounded.lg}"
    padding: "14px"
  input-field-dark:
    backgroundColor: "#1F2937"
    textColor: "#F1F5F9"
    rounded: "{rounded.lg}"
    padding: "14px"
  card-container:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.xl}"
    padding: "20px"
  card-container-dark:
    backgroundColor: "#1E293B"
    rounded: "{rounded.xl}"
    padding: "20px"
  stat-card:
    backgroundColor: "#F4F6F8"
    rounded: "{rounded.md}"
    padding: "15px"
---

# Design System: My Media Tracker

## 1. Overview

**Creative North Star: "The Media Shelf"**

A clean, organized personal library — everything in its place, easy to browse, and satisfying to add to. My Media Tracker feels like a well-designed media shelf in your living room: warm but structured, friendly but capable. The interface balances data richness (charts, stats, progress bars) with visual breathing room, so users never feel buried by their own collection.

Dark mode is a first-class citizen, not an afterthought. Both themes are equally polished — the dark theme uses deep slate tones (#0F172A → #334155) rather than pure blacks, reducing eye strain during long evening tracking sessions. The light theme breathes with soft gray whites (#F4F6F8 → #FFFFFF). Blue (#2563EB) and green (#10B981) accents work as a confident-but-warm pair: blue for actions and navigation, green for progress and completion.

This system explicitly rejects generic Bootstrap aesthetics (cookie-cutter buttons, default blue, no personality) and cluttered/dense layouts (information-overloaded tables, spreadsheet-style UIs). Every surface prioritizes scannability.

**Key Characteristics:**
- Warm, approachable feel with rounded corners (16–20px) and soft shadows
- Dark/light themes equally polished — dark mode uses tonal slate ladder, not pure black
- Blue/green accent pair: blue = action, green = progress/completion
- Mobile-first layout with touch-friendly targets (min 48px)
- Progressive disclosure: common actions upfront, complexity on demand
- Small delights (emoji, micro-animations) without sacrificing clarity

## 2. Colors

A restrained, friendly palette built on tonal neutrals with two complementary accents. The 60/30/10 distribution keeps surfaces calm while color appears with purpose.

### Primary
- **Confident Blue** (#2563EB): The primary action color. Used for add buttons, active states, filter highlights, submit buttons, and interactive elements in light mode. Evokes trust and clarity without corporate stiffness.

### Secondary
- **Fresh Green** (#10B981): The progress and completion accent. Dark-mode primary accent, finished-count text, gradient endpoints, and success states. Pairs with blue to create a "both modes feel native" effect. Also used for the install button gradient.

### Tertiary
- **Warm Amber** (#F59E0B): Rating stars and edit buttons. Sparingly used — only where a warm, attention-drawing signal is needed without the urgency of red.

### Neutral
- **Cloud White** (#F4F6F8): Light-mode page background. Soft, not stark.
- **Surface White** (#FFFFFF): Light-mode card and container background.
- **Mist Gray** (#E2E8F0): Light-mode item backgrounds, dividers, and subtle surfaces.
- **Deep Slate** (#0F172A): Dark-mode page background. Rich, not pure black.
- **Slate Panel** (#1E293B): Dark-mode card and container background. Primary surface in dark theme.
- **Slate Item** (#334155): Dark-mode item backgrounds and borders.
- **Text Primary** (#1F2937 / #F1F5F9): Body text, light and dark respectively.
- **Text Secondary** (#6B7280 / #94A3B8): Captions, placeholders, muted labels.
- **Danger Red** (#DC2626): Delete buttons, logout, destructive actions.
- **Bootstrap Green** (#28A745): Export button, register button — a slightly deeper green for standalone actions.

### Named Rules

**The 60/30/10 Rule.** Neutral backgrounds dominate (60%), containers and secondary surfaces provide structure (30%), and accent colors appear with intention (10%). If blue or green covers more than 10% of a screen, pull back.

**The Two-Tone Accent Rule.** In light mode, blue leads and green supports. In dark mode, green leads and blue supports. This swap keeps both themes feeling native rather than simply inverted.

## 3. Typography

**Display Font:** Prompt (with sans-serif fallback)
**Body Font:** Prompt (with sans-serif fallback)

**Character:** A single-typeface system using Prompt — a friendly, rounded Thai/Latin sans-serif that gives the app its approachable personality. Weights range from 300 (airy headings) to 700 (bold actions), creating hierarchy through weight and size variation within one family.

### Hierarchy
- **Display** (700, clamp(1.5rem, 4vw, 2.25rem), 1.3): Page titles ("Media Tracker"), modal headers. Rare and prominent.
- **Headline** (700, clamp(1.25rem, 3vw, 1.75rem), 1.3): Section headings, stat numbers, card titles. The workhorse heading.
- **Title** (600, 1.1rem, 1.4): Item titles within list cards, category headers. Semibold for quick scanning.
- **Body** (400, 1rem, 1.6): Reviews, descriptions, form labels. Comfortable reading length at 65–75ch max.
- **Label** (600, 0.85rem, 1.4, tracked 0.02em): Stat labels, filter buttons, badge text. Small, uppercase feel without actually uppercasing.

### Named Rules

**The One-Family Rule.** Prompt does all the work. No serif pairings, no display gimmicks. Hierarchy is achieved through weight (300/400/600/700) and scale, keeping the visual system unified and the font payload small.

**The Thai-First Rule.** Prompt was chosen for its Thai script support. Thai UI text is primary; English labels are secondary. Line-height (1.6) accommodates both scripts comfortably.

## 4. Elevation

A soft-shadow system that provides gentle depth without heaviness. Shadows are used to lift interactive surfaces (modals, floating buttons, multiselect bar) off the background, not to create a layered z-axis throughout.

### Shadow Vocabulary
- **Modal Shadow** (`box-shadow: 0 20px 60px rgba(0,0,0,0.45)`): Full-screen overlay modals — login, item editor. Creates strong separation from the page.
- **Soft Shadow** (`box-shadow: 0 8px 30px rgba(0,0,0,0.12)`): Container cards in light mode. Gentle lift.
- **Button Shadow** (`box-shadow: 0 4px 15px rgba(0,0,0,0.2)`): Floating action buttons and the export/import toolbar. Keeps them visually anchored while floating.

### Named Rules

**The Resting Flat Rule.** Item cards, inputs, and stat boxes are flat at rest with only a thin border (`border: 1px solid`). Shadows appear only on hover (via `hover:shadow-lg`) or on floating surfaces (FABs, multiselect bar).

**The Frosted Glass Rule.** The multi-select controls bar uses `backdrop-blur-md` with 95% opacity, creating a frosted glass effect that lets content show through while keeping controls readable.

## 5. Components

### Buttons
- **Shape:** Softly rounded edges (12–16px radius)
- **Primary (Add/Submit):** Blue (#2563EB) to green (#10B981) gradient background, white text, 700 weight, `padding: 14px 24px`, full border-radius curve. Includes an `opacity: 0.9` hover transition.
- **Success (Export/Register):** Solid Bootstrap green (#28A745), white text. Standalone non-gradient actions.
- **Danger (Delete):** Solid red (#DC2626), white text. Used for delete-selected and logout.
- **Icon Buttons:** Compact (padding: 8px 12px), yellow for edit (#F59E0B), red for delete. Small and row-aligned.
- **Theme Toggle:** Circular (50px), bordered ring in accent color, sun/emoji icon.

### Cards / Containers
- **Corner Style:** Generously rounded (16–20px radius)
- **Background:** White (#FFFFFF) in light mode, Slate Panel (#1E293B) in dark mode.
- **Shadow Strategy:** Flat at rest with `border: 1px solid` in Mist Gray / Slate Item. Shadow only on modal containers.
- **Internal Padding:** 20–30px, responsive (less on mobile).
- **Item Cards:** Contained within category lists, each with subtle `hover:scale-[1.01] hover:shadow-lg` transitions for tactile feedback.

### Inputs / Fields
- **Style:** `modal-input` class — full width, 14px padding, 12px border-radius, light gray background (#F9FBF) in light mode / dark zinc (#1F2937) in dark mode, 1px border.
- **Focus:** Border shifts to accent blue (#2563EB), ring glow (2px, 20% opacity).
- **Error:** Red border (#DC2626), red ring glow, shake animation.
- **Selects:** Same styling as inputs via `modal-select` class for consistency.

### Stat Cards
- **Style:** Compact grid (3 columns desktop, 1 mobile), Mist Gray / Slate Item background, 12px border-radius, centered text. Label (0.85em, 70% opacity) above value (1.6em, bold).

### Filter Pills
- **Style:** Transparent background, semibold text, 60% opacity at rest. Active state: 100% opacity + accent-colored bottom border (3px) + accent text color. Horizontal scroll on mobile.

### Progress Bars
- **Style:** 8px tall, full-width, rounded capsule, 10% black/white background overlay. Fill uses accent color. Animated width transition (500ms ease-in-out).

### Navigation
- Top bar is a flex row with title (left), userInfo + installBtn + themeToggle (right). No side navigation — single-column layout. The export/import toolbar floats bottom-right. Mobile: all stacks vertically.

### Toast Notifications
- **Style:** Fixed top-right, slides in from right with spring easing (`cubic-bezier(0.68, -0.55, 0.265, 1.55)`), fades out with scale-down. Stacked vertically with 12px gap.

### Modal System
- **Style:** Full-screen overlay (80% black), centered container with 20px border-radius, 18ms pop animation (`scale + fade`). Max-width 760px (item modal), 400px (login). Overflow scroll on body with custom scrollbar.

### Multiselect Bar
- **Style:** Fixed-bottom centered bar, frosted glass background (backdrop-blur + 95% opacity), accent-tinted border (30% opacity), 16px border-radius, high z-index (2000). Contains select-all checkbox + delete-selected button. Hidden by default, slides in when items are selected.

## 6. Do's and Don'ts

### Do:
- **Do** use the blue-to-green gradient for primary actions — it's the signature CTA treatment.
- **Do** keep surface colors tonal (slate grays, not pure black/white) for both themes.
- **Do** use `hover:scale-[1.01]` micro-interactions on list items — they add tactile life.
- **Do** maintain the 60/30/10 color ratio — neutrals dominate, accents accent.
- **Do** use Prompt at weights 300/400/600/700 to create hierarchy within one family.
- **Do** design mobile-first: touch targets ≥48px, readable text at 16px+, vertical stacking on small screens.
- **Do** use frosting (backdrop-blur + high-opacity overlay) for floating controls like the multiselect bar.

### Don't:
- **Don't** use generic Bootstrap aesthetics — no default blue buttons with no personality, no cookie-corner `rounded-sm` everywhere, no stock component feel.
- **Don't** use cluttered/dense layouts — avoid information-dense tables like old MyAnimeList or spreadsheet-style UIs. Keep it breathable with clear visual hierarchy and adequate padding.
- **Don't** use more than two accent colors on a single screen (blue + green). Amber is for stars and edit only.
- **Don't** use shadows on resting item cards — flat at rest, shadows only on hover or floating elements.
- **Don't** use a second typeface — Prompt handles Thai, Latin, display, and body. Adding another font adds payload without personality gain.
- **Don't** use pure black (#000000) in dark mode — stick to the Deep Slate (#0F172A) → Slate Item (#334155) ramp for reduced eye strain.
- **Don't** make modals full-screen on desktop — keep them centered with max-width and air on all sides.
