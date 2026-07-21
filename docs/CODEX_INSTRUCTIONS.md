# Codex Instructions

## Purpose

You are contributing to the Fasting Coach project.

Before making any code changes, read the project documentation.

The documentation defines the product vision, user experience, data model, engineering standards, and roadmap.

Do not begin implementation until you understand those documents.

---

# Required Reading

Read these files in order:

1. docs/PRODUCT_BLUEPRINT.md
2. docs/UI_GUIDELINES.md
3. docs/DATA_MODEL.md
4. docs/DEVELOPMENT_RULES.md
5. docs/ROADMAP.md

Follow them unless the current task explicitly overrides them.

---

# Project Overview

Fasting Coach is a mobile-first Progressive Web App.

Technology:

- HTML
- CSS
- Classic JavaScript
- localStorage
- Service Worker
- Cloudflare Pages

No frameworks.

No build tools.

No package managers.

No TypeScript.

No external dependencies unless specifically requested.

---

# Development Philosophy

Every change should support this goal:

Help the user decide what to do next.

The application should feel like a supportive coach rather than a calorie spreadsheet.

Prefer guidance over complexity.

---

# Design Philosophy

Keep the interface:

- calm
- simple
- encouraging
- uncluttered

Reduce decisions whenever possible.

Every screen should have one primary action.

---

# Data Safety

Never delete user data.

Never change storage structures without providing backward compatibility.

Normalise missing properties safely.

Old backups must continue to import successfully.

Existing users should never lose information.

---

# Offline Support

The application is offline-first.

Whenever files are added or renamed:

- update service-worker.js
- update the cache version
- precache new files
- preserve offline behaviour

---

# File Responsibilities

Prefer keeping responsibilities separated.

storage.js

- persistence
- data normalisation
- conversions

settings.js

- settings UI
- validation

app.js

- dashboard
- rendering
- daily summaries

theme.js

- appearance

Only introduce additional files when they clearly improve maintainability.

---

# Coding Standards

Write readable code.

Prefer descriptive variable names.

Prefer small functions.

Avoid duplication.

Avoid clever code that is difficult to understand.

Comments should explain WHY rather than WHAT.

---

# User Interface

Follow:

docs/UI_GUIDELINES.md

Do not introduce inconsistent layouts.

Maintain:

- spacing
- typography
- colours
- card style
- interaction patterns

Support:

- Light Theme
- Dark Theme
- System Theme

---

# Accessibility

Every feature must support:

- keyboard navigation
- screen readers
- visible focus
- minimum 44px touch targets
- understandable validation

Accessibility is a requirement.

---

# Mobile First

Design for phones first.

Avoid:

- horizontal scrolling
- tiny controls
- cramped layouts

The primary target is iPhone Safari.

---

# Performance

Avoid unnecessary DOM updates.

Avoid unnecessary calculations.

Keep startup fast.

Do not introduce heavy dependencies.

---

# Scope Control

Only implement the requested task.

Do not rewrite unrelated files.

Do not refactor unrelated code.

Do not introduce extra features unless they are required to complete the requested work.

---

# Before Finishing

Verify:

✓ Existing functionality still works

✓ Existing storage still loads

✓ Existing backups still import

✓ Settings still save

✓ Offline support still works

✓ No console errors

✓ Mobile layout still fits

✓ Themes still work

---

# Do Not

Do not:

- introduce frameworks
- introduce build tools
- introduce package managers
- introduce TypeScript
- remove offline support
- remove existing features
- remove existing storage keys
- commit changes
- push changes

Leave all changes in the working tree unless explicitly instructed otherwise.

---

# Response Format

When finished, provide:

## Summary

A concise overview of what was implemented.

## Files Changed

List every modified file.

List every new file.

## Storage Changes

Describe every storage modification.

Explain backward compatibility.

## Testing

Describe what was tested.

List any known limitations.

## Manual Testing

Explain exactly how to verify the feature on:

- Windows desktop
- iPhone Safari

## Notes

Mention any assumptions or future improvements.

---

# Guiding Principle

If there are multiple valid implementations, choose the one that is:

- simplest
- easiest to maintain
- easiest to understand
- most consistent with the Product Blueprint