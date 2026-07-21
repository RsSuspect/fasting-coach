# UI Guidelines

## Purpose

These guidelines define the visual language and interaction principles for Fitness Coach.

Every screen should feel like part of the same application.

---

# Design Philosophy

The interface should feel:

- calm
- clean
- encouraging
- lightweight
- modern

The design should reduce stress rather than create it.

Users should understand the current screen within a few seconds.

---

# Mobile First

The app is designed primarily for phones.

Layouts should be designed for widths between 320px and 430px first.

Tablet and desktop support is secondary.

---

# Screen Layout

Each screen should generally follow this structure:

Header

↓

Primary information

↓

Supporting information

↓

Primary action

↓

Secondary actions

Avoid placing important information near the very bottom.

---

# Cards

Use rounded cards throughout the app.

Cards should group related information.

Examples:

- Calories
- Fasting
- Weight
- Water
- Protein
- Coach

Cards should have:

- generous padding
- clear headings
- consistent spacing

---

# Typography

Large numbers should receive visual priority.

Example:

2050 kcal

should stand out more than surrounding labels.

Use:

- large headings
- medium section titles
- readable body text
- smaller helper text

Avoid tiny fonts.

---

# Colours

Colours should communicate status without overwhelming the user.

Recommended use:

Green

Progress

Blue

Information

Amber

Warnings

Red

Only for genuinely important issues.

Avoid using colour alone to communicate meaning.

---

# Spacing

Prefer generous spacing.

Avoid crowded layouts.

Maintain consistent margins throughout the app.

Users should never feel visually overwhelmed.

---

# Buttons

Every screen should have one obvious primary button.

Examples:

Add Food

Save Settings

Log Weight

Secondary actions should be visually less prominent.

---

# Forms

Forms should:

- be divided into logical sections
- use labels above controls
- provide inline validation
- avoid unnecessary fields

Large forms should be broken into sections.

---

# Icons

Icons should support understanding.

Never rely on icons without text.

Examples:

🔥 Calories

⏱ Fasting

⚖ Weight

💧 Water

💪 Protein

---

# Dashboard

The Today screen should present information in this order:

1. Calories
2. Fasting
3. Weight
4. Protein
5. Water
6. Coach
7. Primary action

---

# Coach Card

Only one coaching card should appear.

It should always recommend one action.

Examples:

"Drink another 500 mL of water."

"You have 900 kcal remaining."

"Today's protein intake is lower than usual."

---

# Navigation

Maximum:

Five bottom tabs.

Labels should always accompany icons.

---

# Animations

Animations should be subtle.

Never delay the user.

Respect reduced-motion preferences.

---

# Accessibility

Minimum touch targets:

44 × 44 px

Support:

- keyboard navigation
- screen readers
- visible focus
- high contrast
- scalable text

Accessibility is required.

---

# Themes

Support:

- Light
- Dark
- System

Every new feature must work correctly in all three themes.

---

# Consistency

New screens should reuse existing:

- colours
- spacing
- typography
- buttons
- cards
- interaction patterns

Avoid inventing new styles unless there is a clear benefit.

---

# Version 2.1 Visual System

## Product Character

The current interface uses a quiet, premium fitness-dashboard aesthetic. It should feel focused and technical without feeling clinical: cool neutral surfaces, restrained cyan and violet atmosphere, strong numeric hierarchy, and minimal decoration.

This direction is original to Fitness Coach. Do not reproduce another product's layout, artwork, copy, or proprietary visual identity.

## Design Tokens

All visual values are defined as CSS custom properties in `styles.css`.

- Backgrounds: `--bg` and `--bg-deep`
- Surfaces: `--card`, `--card-solid`, and `--control`
- Text: `--ink` and `--muted`
- Structure: `--line` and `--line-strong`
- Brand accents: `--accent`, `--cyan`, and `--violet`
- Status: `--good`, `--warn`, and `--danger`
- Radius scale: `--radius-sm`, `--radius-md`, `--radius-lg`, and `--radius-xl`
- Spacing scale: `--space-1` through `--space-8`
- Elevation: `--shadow-sm` and `--shadow-md`

Light, Dark, and System themes must redefine the same semantic tokens. Feature styles should consume tokens instead of hard-coded theme colours.

## Type and Data Hierarchy

Use the native system font stack. Numeric progress values use a bold weight, compact line height, negative letter spacing, and tabular numerals. Supporting labels are smaller and muted but remain readable. Section headings are concise and use sentence case.

## Surfaces and Layout

Cards use a subtle border, soft elevation, and restrained translucent surface. The page background may use faint radial colour atmosphere, but content contrast must not depend on it. The content column is fluid from 320px and capped at 920px.

The Today screen places current weight beside the stronger daily nutrition card on wider screens and stacks them on phones. Supporting schedule, checklist, and water cards remain visually quieter than the primary nutrition action.

## Navigation

Primary navigation is a floating, safe-area-aware bottom bar with five icon-and-text actions. Icons must be inline SVG, decorative to assistive technology, and paired with visible text. The active destination uses both a shaped background and an accent colour.

## Progress and Feedback

Progress bars use a thick rounded track, numeric or textual status nearby, and a cyan-accented fill. Colour never replaces the accessible progress label or visible value. Warning language remains calm and non-judgmental.

## Dialogs and Settings

Settings is a full-height trailing panel with grouped surfaces. Food entry is a centred dialog on larger screens and an iPhone-style bottom sheet on smaller screens. Existing focus trapping, close controls, cancellation, field validation, and focus restoration remain required.

## Responsive Behaviour

- 320–420px: single-column cards, compact horizontal padding, no horizontal overflow.
- 430–620px: single-column dashboard with comfortable card spacing.
- 768px and above: two-column Today summary where content permits.
- Large desktop: centre the application at the defined maximum width rather than stretching cards excessively.

## Motion

View changes may use a brief opacity and vertical-position transition. Progress changes may animate briefly. All transitions must be functionally unnecessary and disabled through `prefers-reduced-motion: reduce`.

## Refined Dashboard Hierarchy

Today uses three deliberate levels:

1. A single calorie hero with the primary Add Meal action
2. Supporting weight, schedule, and checklist cards
3. Compact water and secondary nutrition details

The calorie hero uses an accessible circular progress ring. The ring caps visually at 100%, while nearby text reports the true percentage and any overage. It must always expose a readable progress value and a non-colour status message.

## Reduced-Border Principle

Prefer spacing, surface tone, restrained shadow, and typography over outlines. Borders remain appropriate for form controls, focus, destructive confirmation, and meaningful state separation. Avoid placing a border around every metric or row.

## Nutrition Details

Protein and fibre may show compact progress tracks only when the user has supplied those targets. Carbohydrates and fat remain quieter totals because the app has no targets for them. Macro values use tabular numerals and soft grouping rather than four equally weighted boxes.

## Compact Utilities

Water uses eight capsule indicators plus the visible `x / 8 glasses` text. Filled and unfilled steps differ through both fill and outline. Utility actions remain secondary to Add Meal.

## Food Density

Meal sections are compact rows. Empty sections show the meal name, zero calories, a concise empty label, and a touch-friendly Add control. Logged foods retain name, calories, available macros, Edit, and Delete without becoming individual cards. Meal ideas are collapsed by default and remain keyboard-operable through native `details` and `summary` elements.

## Chart Styling

Weight charts use subtle gridlines, a clear accent line, outlined points, readable axis labels, and no fabricated intermediate values. One entry appears as a centred point with guidance to add another weigh-in. The Today sparkline appears only when at least two stored measurements exist.

## Compact Dashboard Cards

Dashboard cards size to their content. A compact supporting card must not inherit the height of a larger hero card merely because the cards share a grid row. Use start alignment, content-sized rows, and a small purposeful minimum height. The Today weight summary keeps its current value, goal, remaining amount, and latest measured change together; its sparkline occupies no space until at least two real measurements exist.

## Timeline Time Context

Timelines for the current local date show a thin horizontal current-time marker crossing the timeline rail, a distinct circular marker, and a compact time label. Its position is interpolated between the rendered centres of neighbouring events using their actual time difference. Before the first event it sits at the top boundary; after the last event it sits at the bottom boundary. Past and current-day context must never imply that an activity was completed.

Current-day events use semantic visual states:

- `timeline-event--past` is slightly muted.
- `timeline-event--current` identifies the active interval with shape, weight, and surface treatment.
- `timeline-event--next` receives a restrained text badge.
- `timeline-event--future` remains visually neutral.

Only a timeline representing today receives the marker or time-based states. Calendar timelines recalculate after expansion, tab navigation, viewport changes, and visibility restoration. At phone widths, the marker label stays clear of event labels and the marker remains aligned to the rail. The marker has no continuous animation and all optional transitions respect reduced-motion preferences.

## Calorie Hero Information Hierarchy

The Today nutrition hero presents information in this order: consumed calories, completion percentage, remaining calories, calorie target, protein and fibre progress, quieter carbohydrate/fat and meal totals, then Add Meal. Consumed calories are always the largest numeric value. Remaining calories must not visually compete with the consumed value.

The circular ring contains only the consumed calorie number, `kcal`, and the completion percentage. Its text is centred, uses tabular numerals, and does not wrap. Target, remaining calories, profile guidance, and explanatory status copy sit outside the ring. The ring caps visually at 100%, while visible and assistive text retain the real percentage and overage.

On wide desktop cards the ring and compact summary may share two balanced columns. Tablet and phone layouts stack them and centre the primary progress area so the summary never becomes a narrow text column. Remaining and target values should remain on one line at supported widths when practical.

Macros are separated from the primary progress area by spacing and a subtle divider. Protein and fibre retain progress indicators only when targets exist. Carbohydrates and fat remain quieter values. Meal totals use aligned labels and non-wrapping kcal values, switching between one and two columns only when space permits.

When the current-time line is within the collision threshold of an event centre, only its badge shifts above or below the accurate line. The badge moves away from the nearest event and respects top and bottom boundaries; the marker line, rail dot, scheduled event, and calculated time position never move or disappear.
