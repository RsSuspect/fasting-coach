# Data Model

## Purpose

This document defines the persistent data used by Fitness Coach.

The goals are:

- maintain a consistent structure
- preserve backward compatibility
- avoid unnecessary localStorage keys
- make future features predictable
- support export and import

---

# Storage Philosophy

Use as few top-level localStorage keys as practical.

Related settings should be grouped together.

Avoid creating one key for every small setting.

Whenever possible, extend existing objects rather than introducing unrelated keys.

---

# Current Storage

## fastingCoachSettings

Stores user preferences and application configuration.

Example:

```json
{
  "units": "kg",
  "theme": "system",
  "fastingHours": 16,
  "goalWeight": null,
  "nutrition": {}
}
```

The nutrition object will grow over time without breaking older backups.

Current settings use schema version 4. They retain `profile`, `fasting`, `appearance`, and `nutrition`, and add the following objects without introducing new localStorage keys:

```json
{
  "schedule": {
    "version": 1,
    "events": [{
      "id": "stable-id",
      "name": "Walk",
      "time": "18:30",
      "description": "Optional note",
      "enabled": true,
      "days": [1, 3, 5],
      "createdAt": "2026-07-22T10:00:00.000Z",
      "updatedAt": "2026-07-22T10:00:00.000Z"
    }]
  },
  "fastingSchedule": {
    "version": 1,
    "days": {
      "0": { "enabled": true, "startTime": "20:00", "endTime": "12:00" }
    }
  }
}
```

Weekday keys use JavaScript weekday numbers (`0` Sunday through `6` Saturday). An end time at or before its start time is an overnight window ending the next day. Older settings and backups without these objects are migrated to the legacy daily schedule and default fasting window during loading or import.

`profile.goalWeightKg` is the authoritative goal weight. Progress history uses the existing `weights` localStorage key and a flat `{ "date": "YYYY-MM-DD", "weight": 100 }` record, where `weight` is a finite canonical kilogram number. `storage.latestWeightKg()` is the shared authoritative current-weight lookup: it reads `weights`, filters invalid records, orders valid entries by their local-date string, returns the latest canonical kilogram value, and returns `null` when none exists. `profile.startingWeightKg` is historical and is set from the first real weigh-in when absent; it is never substituted for current weight. The legacy nutrition weight properties remain readable for backward compatibility, but current calculations and validation do not use them.

When no valid Progress history exists, Settings enters a dedicated first-weight step. That step saves only `profile.startingWeightKg`, the selected weight unit, and exactly one real Progress entry; incomplete Profile and Nutrition form values are not submitted. Seeding does not depend on input dirty-state events or on the previously stored starting-weight value. `storage.addInitialWeightFromProfile()` rechecks the canonical kilogram bounds, local date key, and actual valid history, then uses the same `storage.upsertWeight()` helper as manual Progress logging. Once history exists, the normal Settings form becomes available and nutrition uses `storage.latestWeightKg()`. Reopening Settings, repeated saves, unit changes, reloads, schema migration, or any existing valid weigh-in prevents another seed. Later starting-weight edits change only the historical Profile value.

Personal weights have no seeded defaults. An unset starting or goal weight is represented by `null`, while missing weight history is represented by an absent `weights` key or an empty array. Zero is not an empty-state substitute and values outside the accepted weight range normalise to `null` in settings or are excluded from runtime weight history.

Fresh initialization and reset do not create a weigh-in or populate personal weight fields. A narrow one-time migration reviews the old `115 kg` starting / `80 kg` goal seed. It clears only `profile.goalWeightKg` when the stored schema is version 4 or earlier, the migration marker is absent, the exact legacy pair remains, there are no valid Progress weigh-ins, and nutrition personal details, target date, nutrition weights, manual target, macro targets, and non-default nutrition choices are all unconfigured. Every reviewed record receives `migrations.legacySeededGoal80Reviewed: true`, whether the goal is cleared or preserved, making the migration idempotent. A valid weigh-in or any configured nutrition evidence preserves a genuine 80 kg goal.

Exports enumerate stored data only and therefore do not synthesize missing weights. Imports accept settings with nullable or missing weight fields and legacy backups with valid real weights. Valid numeric strings continue to normalize to numbers; malformed, non-finite, zero, negative, or out-of-range personal weights are rejected by backup validation or normalized to the documented empty state.

The first Profile-created weigh-in uses the existing weight-history record shape and current local `YYYY-MM-DD` date. Its weight is stored once in canonical kilograms; pounds and stones/pounds are converted before insertion and their display fragments are not stored. Backups export and import the entry exactly like any manual Progress record. Import itself never seeds hidden history: an imported backup with history remains unchanged, while a starting-weight-only backup stays history-free until Settings is explicitly saved. Clear all data removes both Profile weights and history, so a new valid starting-weight submission after reset may seed a new first record. The Settings object and initial weigh-in are written as one recoverable operation: if the seed write or verification fails, both keys are restored to their pre-submit values and the UI reports failure. After a successful seed, Settings verifies `weights`, calls `latestWeightKg()` again, recomputes nutrition readiness from that authoritative result, then rerenders the header, Today, Progress, checklist, and live nutrition summary.

Settings schema version 4 stores unit preferences in `fastingCoachSettings.profile`:

```json
{
  "weightUnit": "kg",
  "heightUnit": "cm"
}
```

Supported weight-unit values are `kg`, `lb`, and `st`; supported height-unit values are `cm` and `ft-in`. Existing `lb` profiles without a height preference migrate to `ft-in`; all other older profiles default to `cm`. Unknown runtime preferences normalize to `kg` and `cm`. New backups validate these enums while older backups without `heightUnit` remain accepted.

Weight direction comparisons use the unrounded canonical kilogram values produced from the active visible unit controls. Inactive controls are disabled and ignored. For the current automatic weight-loss model, direction validation runs only when a valid latest Progress weight and a valid entered goal both exist; the goal must be strictly below current weight. Missing current weight is nutrition-readiness guidance, not a Settings form error. Starting weight is not used for direction validation.

Unit preferences affect input and presentation only. Weight history, starting weight, goal weight, and legacy nutrition weights remain canonical kilograms. Nutrition height remains canonical centimetres. Stones use `kilograms = (stones × 14 + pounds) × 0.45359237`; feet/inches use `centimetres = (feet × 12 + inches) × 2.54`. Derived paired fields are not exported as authoritative data.

---

## Weight History

Stores historical weigh-ins.

Each entry should include:

- date
- weight
- optional notes

Example:

```json
{
  "date": "2026-07-21",
  "weight": 132.4
}
```

---

## Water Log

Each day stores:

- date
- water consumed
- target

---

## Checklist

Each day stores completion status for daily habits.

Example:

- weigh-in
- water goal
- fasting completed

---

# Nutrition Object

The nutrition object belongs inside:

fastingCoachSettings

Example:

```json
{
  "nutrition": {
    "age": 45,
    "sex": "male",
    "heightCm": 180,
    "activityLevel": "light",
    "targetDate": "2027-03-01",
    "calorieMode": "automatic",
    "manualCalorieTarget": null,
    "mealsPerDay": 2,
    "dietaryPreference": "none",
    "proteinTargetGrams": 170,
    "fibreTargetGrams": 30
  }
}
```

---

# Future Food Log

One entry represents one food consumed.

Example:

```json
{
  "id": "...",
  "date": "2026-07-21",
  "meal": "Lunch",
  "foodId": "...",
  "serving": 150,
  "unit": "g",
  "calories": 250,
  "protein": 32,
  "carbs": 8,
  "fat": 10,
  "fibre": 2
}
```

---

# Saved Foods

Each saved food should include:

- id
- name
- serving size
- serving unit
- calories
- protein
- carbs
- fat
- fibre
- favourite
- lastUsed

---

# Recipes

Each recipe should contain:

- id
- name
- description
- servings
- preparation time
- cooking time
- ingredients
- instructions
- calories
- protein
- carbs
- fat
- fibre
- dietary tags

---

# Meal Plans

Future meal plans should reference recipes rather than duplicate recipe data.

Example:

Breakfast

↓

Recipe ID

Lunch

↓

Recipe ID

Dinner

↓

Recipe ID

---

# Statistics

Statistics should be derived from stored data whenever practical.

Avoid storing values that can be recalculated.

Examples:

Average calories

Average protein

Weekly weight change

Consistency score

Projected goal date

---

# Versioning

Older backups must continue to import successfully.

Missing properties should be safely initialised with defaults.

No update should delete user data.

---

# Naming Rules

Property names should:

- use camelCase
- be descriptive
- avoid abbreviations where practical

Example:

currentWeight

Not:

cw

---

# Units

Internally store metric values wherever practical.

Convert for display only.

This simplifies calculations and reduces duplication.

---

# Future Expansion

The model should support:

- maintenance goals
- weight gain goals
- barcode scanning
- cloud synchronisation
- AI coaching
- wearable integration

without requiring major restructuring.

---

# Guiding Principle

Store information once.

Derive everything else.

Avoid duplication wherever possible.
