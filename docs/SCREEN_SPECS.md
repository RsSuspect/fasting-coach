# Fitness Coach Screen Specifications

## Purpose

This document defines the content, hierarchy, primary actions, and expected behaviour of each major screen in Fitness Coach.

It should be read together with:

- `PRODUCT_BLUEPRINT.md`
- `UI_GUIDELINES.md`
- `DATA_MODEL.md`
- `DEVELOPMENT_RULES.md`
- `ROADMAP.md`
- `CODEX_INSTRUCTIONS.md`

These specifications describe the intended user experience. They do not require every future feature to exist immediately.

---

# 1. Global Application Structure

## Primary Navigation

The application should use no more than five primary tabs:

1. Today
2. Food
3. Planner
4. Progress
5. Settings

Each tab should include:

- a clear text label
- an understandable icon where appropriate
- an accessible name
- a minimum 44px touch target

The current tab should be visually distinct without relying on colour alone.

## Global Behaviour

All screens should:

- be mobile-first
- avoid horizontal overflow
- support Light, Dark, and System themes
- use consistent cards, spacing, typography, and controls
- preserve keyboard and screen-reader accessibility
- keep the most important information near the top
- provide one obvious primary action
- remain usable offline where appropriate

## Empty States

Empty states should explain:

- what is missing
- why it matters
- what the user should do next

Avoid empty screens or vague messages such as “No data.”

Prefer messages such as:

> No food has been logged today.

Followed by:

> Add your first meal to begin tracking today’s calories and protein.

## Loading and Errors

The current app is local-first, so loading states should be rare.

When errors occur:

- explain the problem clearly
- preserve user-entered data where possible
- provide a useful recovery action
- avoid technical error messages unless shown in developer diagnostics

---

# 2. Today Screen

## Purpose

The Today screen is the main dashboard.

## Current Presentation Structure

The implemented Today dashboard uses this visual hierarchy while preserving the existing feature set:

1. Compact product header and settings action
2. Daily nutrition summary as the primary action card
3. Current weight and goal progress as a supporting card
4. Today's schedule
5. Daily checklist
6. Water tracking

On phones the summary cards stack. At wider widths they share a row, with nutrition receiving greater width and elevation. The Add Meal control is the dominant action. Every progress visual retains nearby visible text and an accessible progress value.

### Refined Today Presentation

The calorie summary is the hero and includes a circular completion ring, consumed calories, target, remaining calories or overage, percentage, and Add Meal. The ring caps at full circumference when over target while text reports the actual percentage and overage.

Within the refined hero, the ring contains only consumed calories, `kcal`, and percentage. Remaining calories and target appear immediately below the ring on phones, or in a balanced adjacent summary on sufficiently wide desktop cards. Consumed calories remain the dominant metric. Macros and meal totals are visually separated and secondary.

Hero states are:

- Incomplete: preserve consumed calories, replace percentage with an unavailable mark, omit contradictory remaining/target progress, and show concise profile guidance.
- Under target: show actual percentage, remaining calories, and target.
- At target: show 100%, zero remaining, and target.
- Over target: cap the ring visually, report the actual percentage, show the overage and target, and retain calm warning language.

The live timeline marker keeps its calculated line and rail dot at the exact time position. When the time badge approaches an event centre, the badge alone moves above or below the line, away from the nearby event. This collision treatment applies to Today and today's expanded Weekly Calendar timeline without hiding event labels or the current-time value.

Weight is a compact supporting card with current weight, goal, amount remaining, and the latest measured change when multiple records exist. A small point-to-point sparkline appears only with sufficient stored data. Water is a compact utility card with eight visual steps and retained readable totals and controls.

### Weight and Header Empty States

The header constructs its summary from available values without empty separators:

- Neither weight: omit weight text and retain nutrition/fasting status.
- Current only: show the current weight without an arrow or invented goal.
- Goal only: show `Goal` and the configured goal without an invented current value.
- Both: show current weight, arrow, and goal using the preferred unit.

The Today weight card always retains its title. With neither value, it announces “Current weight not set,” hides the goal and progress presentation, and prompts the user to log a first weight. With current weight only, it shows that weight and prompts for a goal without calculating remaining weight. With goal only, it shows the goal badge, leaves current weight unset, and prompts for a first weigh-in. With both current and goal it shows remaining weight; goal progress appears only when the historical starting weight is also available. Trend text and charts use stored weigh-ins only.

The weight card sizes to its content and does not stretch to match the calorie hero on wider screens. With zero or one recorded measurement it reserves no sparkline space; with multiple measurements it shows only the real point-to-point history.

Today's schedule is a concise overview containing every existing schedule entry with compact static rows. For the current local date, it shows a live current-time line positioned from actual schedule times, slightly mutes elapsed events, identifies the active interval, and marks the next event without implying completion. The time context refreshes at least once per minute and whenever the page becomes visible again.

It should answer these questions within five seconds:

- How many calories do I have today?
- Am I currently fasting?
- How is my weight progressing?
- How much protein and water do I still need?
- What should I do next?

## Content Order

The recommended order is:

1. Screen header
2. Calorie card
3. Fasting card
4. Weight card
5. Protein card
6. Water card
7. Coach card
8. Primary action

## 2.1 Screen Header

Display:

- app or screen title
- current date
- optional short greeting

Keep the header compact.

Do not place multiple actions in the header unless necessary.

## 2.2 Calorie Card

### When Nutrition Profile Is Complete

Display:

- daily calorie target
- calories consumed
- calories remaining
- visual progress bar
- meals per day
- approximate calories per meal

Recommended hierarchy:

Today’s Calories

820 / 2,050 kcal

1,230 kcal remaining

The remaining value should receive strong visual emphasis.

### When No Food Has Been Logged

Show:

- target calories
- zero consumed
- full remaining amount
- encouraging empty-state text

### When Nutrition Profile Is Incomplete

Display:

Complete your nutrition profile to calculate a daily calorie target.

Primary action:

Complete Nutrition Profile

The action should open Settings and move focus to the Nutrition Profile section.

### When Above Target

Do not use shame-based language.

Prefer:

You are 180 kcal above today’s target. Your weekly average matters more than a single day.

## 2.3 Fasting Card

Display:

- current fasting duration
- fasting state
- next milestone
- time remaining to the milestone
- selected fasting protocol where available

Example:

Current Fast

18h 42m

Next milestone: 24 hours

5h 18m remaining

Primary action depends on state:

- Start Fast
- End Fast
- Continue Fast

The fasting card should preserve existing functionality.

## 2.4 Weight Card

Display:

- latest weight
- goal weight
- progress toward goal
- recent trend where enough data exists

Example:

Weight

132.4 kg

Goal: 100 kg

Down 0.7 kg this week

If no weight exists:

Add your first weigh-in to begin tracking progress.

Action:

Log Weight

## 2.5 Protein Card

Display:

- protein consumed
- protein target
- protein remaining
- visual progress

Example:

Protein

72 / 170 g

98 g remaining

If food logging does not yet exist, the card may display only the target or remain hidden until that phase is implemented.

## 2.6 Water Card

Display:

- water consumed
- water goal
- remaining amount
- quick-add actions

Example quick-add controls:

- +250 mL
- +500 mL

Preserve existing water tracking behaviour.

## 2.7 Coach Card

Show exactly one recommendation.

The card should include:

- short heading
- one clear message
- optional single action

Examples:

- A high-protein dinner of around 800 kcal would keep you close to target.
- You are 500 mL away from your water goal.
- Your requested weight-loss pace may be aggressive. Review your target date.

The coaching priority should be:

1. Safety
2. Calorie guidance
3. Protein
4. Hydration
5. Fasting milestone
6. Encouragement

Do not show multiple competing recommendations.

## 2.8 Primary Action

The long-term primary action is:

Add Food

Before food logging exists, preserve the current most useful primary action.

---

# 3. Food Screen

## Purpose

The Food screen records what the user has eaten today.

It should make repeat logging quick and reduce typing.

## Content Order

1. Screen header
2. Daily totals
3. Meal sections
4. Primary Add Food action

## 3.1 Daily Totals

Display:

- calories consumed
- calorie target
- protein consumed
- protein target
- optional carbs, fat, and fibre

Keep calories and protein most prominent.

## 3.2 Meal Sections

Recommended sections:

- Breakfast
- Lunch
- Dinner
- Snacks

Each section should show:

- food name
- serving
- calories
- protein
- meal total

Each logged item should support:

- edit
- duplicate
- move to another meal
- delete

The implemented meal sections use compact rows. Empty meals show zero calories, a short `No entries` state, and an Add control without reserving excess vertical space. Logged entries remain touch-friendly and do not become separate cards.

Existing Meal ideas are secondary to daily logging and are collapsed by default in a native expandable section. Sunday meal preparation remains a secondary card.

Destructive actions should require confirmation or an undo mechanism.

## 3.3 Empty Meal State

Example:

Nothing logged for lunch.

Action:

Add Lunch

## 3.4 Add Food Flow

Priority order:

1. Recent foods
2. Favourite foods
3. Saved meals
4. Recipes
5. Custom foods
6. Search

The user should not need to search for frequently used foods repeatedly.

## 3.5 Primary Action

Add Food

This should be fixed or easily reachable on mobile.

---

# 4. Add Food Screen or Sheet

## Purpose

Allow the user to find and log food with minimal effort.

## Content Order

1. Search field
2. Recent foods
3. Favourites
4. Recipes
5. Custom Food action

## Search

The search field should:

- receive focus when appropriate
- support clear text
- show useful empty results
- avoid searching until enough text is entered if performance requires it

## Food Result Row

Display:

- food name
- serving reference
- calories
- protein

Example:

Chicken Breast

165 kcal · 31 g protein per 100 g

## Primary Action

Selecting a food opens Food Details.

---

# 5. Food Details Screen or Sheet

## Purpose

Allow serving adjustment before logging.

## Display

- food name
- serving quantity
- serving unit
- calories
- protein
- carbohydrates
- fat
- fibre where available
- meal destination

Nutrition values should update live as serving size changes.

## Controls

Include:

- quantity field or stepper
- unit selector where applicable
- meal selector
- Add action

## Primary Action

Add to Today

After saving:

- update daily totals
- return to the Food screen or previous context
- provide brief confirmation

---

# 6. Planner Screen

## Purpose

Help the user decide what to eat next.

The Planner should recommend, not overwhelm.

## Content Order

1. Remaining daily targets
2. Suggested next meal
3. Alternative suggestions
4. Planned meals
5. Shopping list entry point

## 6.1 Remaining Targets

Display:

- calories remaining
- protein remaining
- meals remaining

Example:

You have approximately:

950 kcal remaining

65 g protein remaining

1 meal left

## 6.2 Suggested Next Meal

Show one primary recommendation.

Display:

- recipe name
- calories
- protein
- preparation time
- why it fits

Example:

High in protein and fits your remaining calories.

Actions:

- View Recipe
- Add to Today

## 6.3 Alternative Meals

Show a small number of alternatives, ideally three or fewer.

Avoid presenting an endless recipe feed.

## 6.4 Weekly Planning

Future weekly planning should allow:

- assigning meals to days
- changing servings
- reusing meals
- generating a shopping list

---

# 7. Recipe Screen

## Purpose

Show everything needed to prepare and log a recipe.

## Content Order

1. Recipe title and summary
2. Nutrition
3. Serving control
4. Ingredients
5. Method
6. Actions

## Recipe Summary

Display:

- name
- description
- preparation time
- cooking time
- servings
- dietary tags

## Nutrition

Display per serving:

- calories
- protein
- carbohydrates
- fat
- fibre

## Ingredients

Ingredients should include:

- quantity
- unit
- ingredient name

## Method

Use numbered steps with comfortable spacing.

## Actions

Primary:

Add to Today

Secondary:

- Add to Planner
- Add to Shopping List
- Save Recipe

---

# 8. Progress Screen

## Purpose

Show useful trends without overwhelming the user.

## Content Order

1. Time-range selector
2. Weight trend
3. Calorie trend
4. Protein trend
5. Water trend
6. Fasting trend
7. Consistency summary

## Time Ranges

Recommended options:

- 7 days
- 30 days
- 90 days
- All time

## Weight Trend

Display:

- chart
- starting weight
- latest weight
- total change
- weekly rate
- projected goal date where appropriate

## Nutrition Trends

Display weekly averages rather than overemphasising individual days.

## Consistency

A consistency score should be understandable and explain what contributes to it.

Avoid opaque scores with no explanation.

## Empty State

When insufficient data exists:

Keep logging for a few more days to unlock meaningful trends.

For the implemented weight history, a single entry is rendered as one clearly visible centred point with a short prompt explaining that another weigh-in will reveal a trend. Multiple entries use straight point-to-point segments so the chart does not imply measurements between recorded dates.

---

# 9. Settings Screen

## Purpose

Allow the user to manage preferences, targets, appearance, and data.

## Content Order

1. Profile
2. Nutrition Profile
3. Fasting
4. Appearance
5. Data
6. Privacy
7. About
8. Save action

Use clear section headings and avoid presenting the page as one uninterrupted form.

---

# 10. Nutrition Profile Section

## Purpose

Collect the minimum information needed to estimate daily calorie and nutrition targets.

The section should feel simple and supportive, not clinical.

## 10.1 Personal Details

Fields:

- Age
- Sex used for calorie estimation
- Height
- Current weight
- Goal weight

Sex options:

- Female
- Male
- Prefer not to say / manual target

Height display:

- centimetres when metric is selected
- feet and inches when imperial is selected

Current weight should reuse the latest recorded weight where possible.

Goal weight should reuse the existing goal setting.

## 10.2 Lifestyle

Field:

- Activity level

Options:

- Sedentary
- Lightly active
- Moderately active
- Very active
- Extra active

Each option should have a short plain-language explanation.

Example:

Lightly active — light exercise or regular walking one to three days per week.

## 10.3 Goal

Fields:

- Target date
- Calorie target mode
- Manual calorie target

Calorie target modes:

- Automatically calculated
- Manual

Show the manual target field only when Manual is selected.

If Prefer not to say is selected for sex, require Manual mode.

## 10.4 Diet Preferences

Fields:

- Meals per day
- Dietary preference
- Optional protein target
- Optional fibre target

Meals per day:

- 1
- 2
- 3
- 4
- 5

Dietary preferences:

- No preference
- Vegetarian
- Vegan
- Mediterranean
- Low carbohydrate
- Keto

## 10.5 Live Nutrition Summary

Display beneath the fields:

- estimated resting calories
- estimated maintenance calories
- suggested calorie target
- estimated daily deficit
- requested weekly weight-loss rate
- days until target date
- approximate calories per meal

The summary should update as values change.

It should not persist changes until the user activates Save Settings.

## 10.6 Validation

Validation should be inline and specific.

Examples:

- Enter an age between 18 and 120.
- Choose a target date in the future.
- Goal weight must be below current weight for weight-loss mode.
- This target requires a faster rate of loss than generally recommended.

Do not clear valid fields when one field has an error.

## 10.7 Safety Notice

Display concise guidance explaining that:

- calculations are estimates
- outcomes are not guaranteed
- professional guidance may be needed

Highlight professional guidance for:

- users under 18
- pregnancy
- breastfeeding
- eating disorders
- significant medical conditions
- medications affecting weight or appetite

## 10.8 Primary Action

Use the existing Settings action:

Save Settings

After saving:

- confirm success
- update the Today screen
- preserve focus appropriately

---

# 11. Fasting Settings Section

Preserve existing fasting settings.

Fields may include:

- fasting protocol
- target fasting duration
- reminder preferences
- milestone preferences

Changes should not reset an active fast unless explicitly required and confirmed.

## 11.1 Daily and Fasting Schedule Editors

Settings provides a Daily schedule editor for adding, editing, deleting, enabling, and ordering events. Each event has a time, name, optional description, and one or more weekdays. Changes remain in draft state until Save settings is used.

The Fasting schedule editor provides an enabled state and start/end time for every weekday, plus copy/apply shortcuts. Today and Weekly calendar combine enabled user events with generated fasting start/end markers. Overnight fasting starts on the configured day and ends on the following day. Generated markers are omitted when an equivalent user event already exists.

Today shows a planned fasting status only; it must not imply that a fast was actually started or completed. Empty schedules include an Edit schedule action.

---

# 12. Appearance Section

Fields:

- Light
- Dark
- System

Theme changes may preview immediately, but should follow the app’s current save behaviour.

Every new component must support all themes.

---

# 13. Data Section

Include:

- Export Data
- Import Data
- Reset Data, only when deliberately implemented

## Export

Export should include all supported user data.

## Import

Import should:

- validate structure
- support older backups
- reject malformed data safely
- avoid partially corrupting existing data

## Destructive Actions

Any future reset action must:

- explain what will be deleted
- require explicit confirmation
- avoid accidental activation

---

# 14. About and Privacy

Display:

- app name
- version where available
- offline capability
- privacy summary
- storage explanation

Recommended privacy message:

Your personal data stays on this device unless you choose to export it.

---

# 15. Screen Transitions and Focus

When navigating:

- move focus to the screen heading where appropriate
- preserve expected back behaviour
- avoid unexpected scroll jumps

When opening Settings from an incomplete Nutrition Profile card:

- open Settings
- scroll the Nutrition Profile section into view
- move keyboard focus to its heading or first invalid field

---

# 16. Responsive Behaviour

Primary design range:

- 320px to 430px wide

At larger widths:

- keep readable line lengths
- avoid stretching cards excessively
- centre the main content column where appropriate

At all widths:

- no horizontal scrolling
- no clipped controls
- no overlapping navigation

Dashboard grids align unequal cards to the start so compact supporting cards are not stretched to the height of hero content. Timeline rails, current-time dots, labels, and event copy must remain aligned without horizontal overflow from 320px upward.

In Weekly calendar, only today's expanded timeline shows the live current-time marker. Other days retain their normal schedule presentation. Expanding or collapsing a day, returning to Calendar, or resizing the viewport recalculates the marker position; today is not forcibly expanded solely for the marker.

---

# 17. Implementation Order

These screen specifications should be implemented in roadmap order.

## Version 2.0

- Nutrition Profile section
- Nutrition Summary
- Today calorie target summary

## Version 2.1

- Food screen
- Add Food flow
- Food Details
- daily totals

## Version 2.2

- Recipe screen
- saved recipes

## Version 2.3

- Planner
- meal recommendations
- shopping list

## Version 2.4

- Coach card and coaching rules

Do not implement future screens merely because they are described here.

---

# 18. Definition of Done for a Screen

A screen is complete only when:

- its purpose is immediately clear
- the primary action is obvious
- empty states are useful
- invalid states are handled
- existing user data is preserved
- it works on small phones
- it supports all themes
- it is keyboard accessible
- it has visible focus states
- it avoids horizontal overflow
- it produces no console errors
- it works offline where appropriate
- it follows the Product Blueprint and UI Guidelines

---

# Guiding Principle

Every screen should help the user understand their current situation and make the next useful decision with the least possible effort.
