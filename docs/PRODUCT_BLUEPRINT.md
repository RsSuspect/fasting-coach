# Fasting Coach Product Blueprint

## 1. Executive Summary

Fasting Coach is a mobile-first personal weight-loss and fasting companion.

It combines:

- fasting guidance
- calorie targets
- food logging
- nutrition tracking
- weight tracking
- water tracking
- meal planning
- recipe recommendations
- progress insights
- simple coaching

The app should not feel like a spreadsheet or a complicated calorie database.

Its purpose is to help the user answer one question:

> What should I do next?

The app should reduce decision-making, encourage consistency, and make daily progress easy to understand.

---

## 2. Product Vision

Fasting Coach should feel like a calm, supportive personal coach.

It should:

- explain today’s priorities clearly
- help the user stay within a realistic calorie target
- make fasting progress easy to understand
- recommend meals that fit the user’s remaining calories and protein needs
- show long-term progress without overwhelming the user
- encourage consistency rather than perfection

The app should guide the user, not judge them.

---

## 3. Product Goals

The app should help users:

1. Understand today’s calorie and fasting goals quickly.
2. Log food with as few taps as possible.
3. Know how many calories and nutrients remain.
4. Choose meals that fit their goals.
5. Track weight, fasting, water, and nutrition trends.
6. Receive one useful coaching suggestion at a time.
7. Build sustainable habits over weeks and months.

---

## 4. Core Product Principles

### 4.1 Simplicity First

Every screen should have a clear purpose.

The most important information should be visible immediately.

Avoid:

- crowded layouts
- unnecessary controls
- excessive numbers
- long forms
- too many actions on one screen

### 4.2 Encourage, Never Shame

The app must not use guilt-based language.

Avoid messages such as:

- “You failed.”
- “Bad day.”
- “You exceeded your limit.”

Prefer messages such as:

- “You were slightly above target today.”
- “Your weekly average is still within reach.”
- “Tomorrow is a fresh opportunity.”
- “One day does not define your progress.”

### 4.3 Reduce Decisions

The app should calculate and suggest wherever possible.

Instead of asking the user to decide everything manually, it should help answer:

- How many calories should I eat?
- How much protein do I need?
- What meal fits my remaining calories?
- What should I eat next?
- Am I on track?
- When is my next fasting milestone?

### 4.4 One Primary Action Per Screen

Each screen should have one obvious main action.

Examples:

- Today: Add Food
- Food: Log Food
- Planner: Choose a Meal
- Progress: Review Trends
- Settings: Save Settings

### 4.5 Adherence Over Perfection

The product should focus on sustainable consistency.

Weekly averages and long-term trends are more important than isolated daily results.

---

## 5. Target User

The primary user is someone who:

- wants to lose weight
- uses intermittent fasting or extended fasting
- wants nutrition guidance
- prefers a simple app
- does not want a complicated food diary
- values encouragement and practical recommendations
- wants personal data to remain private

The app should also support users who want maintenance rather than weight loss in future versions.

---

## 6. Core User Journey

### Morning

1. Open the app.
2. See today’s calorie target.
3. See fasting progress.
4. See weight and hydration status.
5. Read one coaching recommendation.
6. Continue fasting or plan the first meal.

### During the Day

1. Tap Add Food.
2. Select a recent food, saved food, or recipe.
3. Adjust the serving.
4. Add it to today.
5. See calories and nutrients update.
6. Receive revised guidance.

### Evening

1. Review remaining calories.
2. Choose a suggested dinner if needed.
3. Complete water and checklist goals.
4. Review the day without judgment.
5. Prepare for tomorrow.

---

## 7. Navigation

The app should use no more than five primary tabs.

Recommended bottom navigation:

1. Today
2. Food
3. Planner
4. Progress
5. Settings

The navigation should remain visible and easy to reach on mobile devices.

---

## 8. Screen Specifications

## 8.1 Today

The Today screen is the main dashboard.

It should communicate the user’s status within five seconds.

Recommended content order:

1. Calories
2. Fasting
3. Weight
4. Protein
5. Water
6. Coach
7. Primary action

### Calories Card

Display:

- daily calorie target
- calories consumed
- calories remaining
- visual progress
- meals remaining where relevant

### Fasting Card

Display:

- current fasting duration
- next milestone
- selected fasting protocol
- time remaining to the next milestone

### Weight Card

Display:

- latest weight
- goal weight
- total progress
- recent weekly trend

### Protein Card

Display:

- protein consumed
- daily protein target
- protein remaining
- visual progress

### Water Card

Display:

- water consumed
- daily water target
- quick-add controls

### Coach Card

Show exactly one recommendation.

Examples:

- “You have about 850 kcal remaining.”
- “A high-protein dinner would keep you on track.”
- “You are close to your water target.”
- “Your weekly calorie average is on target.”
- “Your current goal date may be aggressive.”

### Primary Action

The primary action should be:

> Add Food

---

## 8.2 Food

The Food screen should be simple and fast.

Recommended sections:

- Breakfast
- Lunch
- Dinner
- Snacks

Each section should show logged items and meal totals.

Priority order for adding food:

1. Recent foods
2. Favourite foods
3. Saved meals
4. Recipes
5. Custom foods
6. Search

The user should rarely need to type the same food twice.

---

## 8.3 Planner

The Planner should help the user decide what to eat next.

It should use:

- remaining calories
- remaining protein
- dietary preferences
- meals remaining
- saved recipes
- planned meals

Recommended outputs:

- suggested next meal
- alternative meals
- daily meal plan
- weekly meal plan
- shopping list

The Planner should recommend meals rather than display an overwhelming recipe library.

---

## 8.4 Progress

The Progress screen should focus on trends.

Recommended metrics:

- weight trend
- calorie average
- protein average
- water average
- average fasting duration
- fasting completion rate
- consistency score
- current streak
- projected goal date

Charts should be easy to understand and should not overload the screen.

---

## 8.5 Settings

Settings should contain:

- profile
- units
- fasting preferences
- nutrition profile
- calorie target mode
- dietary preferences
- meals per day
- protein target
- water target
- appearance
- data export
- data import
- privacy information
- app information

Settings should use clear sections and concise explanations.

---

## 9. Nutrition Engine

The nutrition engine should calculate estimated targets from:

- age
- sex used for calorie estimation
- height
- current weight
- goal weight
- activity level
- target date
- dietary preference
- meals per day

Recommended outputs:

- estimated resting energy
- estimated maintenance calories
- daily calorie target
- estimated daily deficit
- requested weekly loss rate
- protein target
- fat target
- carbohydrate target
- fibre target
- calories per meal
- safety warnings

All results must be described as estimates.

Users must be able to override calculated targets manually.

---

## 10. Food Data

Every food item should support:

- name
- serving size
- serving unit
- calories
- protein
- carbohydrates
- fat
- fibre
- optional notes
- favourite status
- last-used date

Even when the interface displays only calories and protein, the full macro structure should be stored where available.

---

## 11. Recipes

Each recipe should include:

- name
- description
- servings
- calories per serving
- protein per serving
- carbohydrates per serving
- fat per serving
- fibre per serving
- preparation time
- cooking time
- ingredients
- method
- dietary tags
- favourite status

Recipes should be recommended based on the user’s current day, not merely browsed as a large catalogue.

---

## 12. Coaching Engine

The initial coaching engine should be deterministic and rule-based.

It should evaluate:

- calories consumed
- calories remaining
- weekly calorie average
- protein intake
- water intake
- fasting progress
- recent weight trend
- goal pace
- consistency

It should show one useful recommendation at a time.

The coaching hierarchy should prioritise:

1. Safety
2. Calorie target
3. Protein
4. Hydration
5. Fasting milestone
6. Progress encouragement

The coach should explain why a recommendation is being made where appropriate.

---

## 13. Data and Privacy

Personal data should remain on the user’s device by default.

The app should:

- work without creating an account
- avoid advertising
- avoid tracking
- avoid selling personal data
- support user-controlled export
- support user-controlled import
- validate imported data
- preserve backward compatibility

Future cloud sync should be optional.

---

## 14. Design Language

The interface should be:

- mobile-first
- calm
- minimal
- spacious
- card-based
- easy to scan
- comfortable for one-handed use

Recommended characteristics:

- rounded cards
- clear visual hierarchy
- large key numbers
- readable typography
- generous spacing
- restrained use of colour
- strong light and dark themes
- clear progress indicators

The app may be Apple-inspired, but it should retain its own identity.

---

## 15. Accessibility

The app must support:

- minimum 44px touch targets
- keyboard navigation
- visible focus states
- semantic labels
- screen readers
- sufficient contrast
- scalable text
- understandable validation messages
- colour-independent status indicators
- reduced-motion preferences where relevant

Accessibility is a product requirement, not an optional enhancement.

---

## 16. Performance and Offline Behaviour

The app should:

- load quickly
- work offline
- preserve data locally
- avoid unnecessary dependencies
- remain usable on older mobile devices
- avoid horizontal scrolling
- provide stable interactions on small screens

The current technical approach should remain:

- static HTML
- CSS
- classic JavaScript
- service worker
- localStorage
- Cloudflare Pages

No framework or build process should be introduced unless there is a clear future need.

---

## 17. Safety Principles

The app must not present itself as a medical service.

It should:

- describe calorie targets as estimates
- warn about unrealistic rates of weight loss
- avoid silently recommending extremely low calorie targets
- encourage professional guidance where appropriate
- avoid guaranteed outcome claims
- allow manual targets
- avoid aggressive fasting recommendations for vulnerable users

Professional guidance should be recommended for:

- users under 18
- pregnancy
- breastfeeding
- eating disorders
- significant medical conditions
- medications affecting weight or appetite

---

## 18. Roadmap

### Version 2

- nutrition profile
- calorie target calculator
- food logging
- saved foods
- recipes
- dynamic meal planning
- shopping lists
- rule-based coach

### Version 3

- barcode scanning
- optional cloud sync
- health-platform integration
- widgets
- notifications
- improved statistics

### Version 4

- AI-assisted meal planning
- ingredient substitutions
- voice food logging
- photo-assisted food logging
- predictive coaching

Future features must still follow the core principles of simplicity, privacy, and decision reduction.

---

## 19. Definition of Done

A feature is complete only when:

- it supports the product vision
- it is understandable on first use
- it works on small mobile screens
- it supports light and dark themes
- it is keyboard accessible
- it works offline where appropriate
- it preserves existing user data
- it handles invalid input safely
- it introduces no console errors
- it does not add unnecessary complexity
- it has been manually tested

---

## 20. Guiding Principle

When choosing between adding another feature and making the next decision easier for the user, choose the latter.

The goal is not to build the app with the most features.

The goal is to build the app that feels easiest to live with every day.