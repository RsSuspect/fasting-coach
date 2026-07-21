# Development Rules

## Purpose

This document defines the engineering standards for Fitness Coach.

Every future feature should follow these rules unless there is a deliberate architectural decision to change them.

---

# Technology Stack

The application uses:

- HTML
- CSS
- Classic JavaScript
- localStorage
- Service Worker
- Cloudflare Pages

No frameworks.

No build tools.

No transpilers.

No package managers.

No TypeScript.

The application must remain deployable as static files.

---

# Offline First

Offline support is a core feature.

Whenever source files change:

- update the service worker cache version
- precache new files
- preserve existing offline behaviour

---

# Backward Compatibility

Existing users must never lose data.

Whenever new settings are introduced:

- normalise missing properties
- provide safe defaults
- preserve old backups
- avoid destructive migrations

Older exported backups should continue to import successfully.

---

# Local Storage

Avoid creating unnecessary storage keys.

Prefer extending existing objects.

Example:

fastingCoachSettings

↓

nutrition

↓

proteinTarget

instead of creating multiple unrelated top-level keys.

---

# File Organisation

Prefer keeping responsibilities separate.

Example:

storage.js

- persistence
- normalisation
- conversions

settings.js

- settings UI
- validation

app.js

- dashboard rendering
- daily summaries

theme.js

- appearance

Only introduce new files when they clearly improve maintainability.

---

# Coding Style

Write readable code.

Prefer descriptive names.

Avoid clever but difficult-to-read solutions.

Comments should explain:

WHY

not

WHAT

---

# Functions

Functions should perform one responsibility.

Prefer smaller functions over large multi-purpose functions.

---

# Error Handling

Never silently ignore errors.

Validate:

- imported data
- user input
- calculated values

Display understandable messages.

Avoid crashing.

---

# Accessibility

Every new feature must support:

- keyboard navigation
- screen readers
- visible focus
- sufficient contrast
- 44px touch targets

Accessibility is not optional.

---

# Mobile First

Every feature should be designed for phones first.

Avoid:

- horizontal scrolling
- tiny controls
- crowded layouts

---

# Performance

Keep startup fast.

Avoid unnecessary calculations.

Avoid repeated DOM updates where practical.

Do not introduce unnecessary dependencies.

---

# User Experience

The interface should always answer:

"What should I do next?"

Avoid adding controls that increase cognitive load.

When possible:

calculate instead of asking.

suggest instead of requiring search.

guide instead of explaining.

---

# Testing Checklist

Before completing any feature, verify:

- existing data still loads
- settings persist
- export/import still works
- offline mode still works
- all themes work
- no console errors
- mobile layout remains correct
- keyboard navigation works

---

# Git Workflow

Work on a clean branch whenever practical.

Before major features:

create a safety branch.

Commit logical units of work.

Write meaningful commit messages.

Examples:

Add nutrition profile

Improve dashboard layout

Fix calorie calculation

Avoid commits such as:

Updates

Changes

Fixes

---

# Pull Requests

When reviewing changes, prioritise:

1. Data safety

2. Backward compatibility

3. Mobile usability

4. Accessibility

5. Performance

6. Code cleanliness

7. Visual consistency

---

# AI Development

When using Codex or other AI assistants:

Always:

- read project documentation first
- preserve existing functionality
- explain architectural decisions
- leave changes uncommitted unless instructed

Never:

- rewrite unrelated files
- delete user data
- introduce frameworks
- change storage formats without migration
- remove offline support

---

# Guiding Principle

Every change should make the application easier to use, easier to maintain, or easier to extend.

If it does none of those things, reconsider the change.
