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
  "goalWeight": 100,
  "nutrition": {}
}
```

The nutrition object will grow over time without breaking older backups.

Current settings use schema version 3. They retain `profile`, `fasting`, `appearance`, and `nutrition`, and add the following objects without introducing new localStorage keys:

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

`profile.goalWeightKg` is the authoritative goal weight. Current weight is the latest entry in `weights`; the legacy nutrition weight properties remain readable and are synchronised when settings or a weigh-in are saved for backward compatibility.

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
