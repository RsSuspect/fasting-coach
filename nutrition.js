(function (FC) {
  "use strict";

  const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very: 1.725,
    extra: 1.9
  };
  const CALORIES_PER_KG = 7700;

  function dateAtLocalMidnight(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const [year,month,day] = value.split("-").map(Number);
    const date = new Date(year,month-1,day);
    return date.getFullYear()===year && date.getMonth()===month-1 && date.getDate()===day ? date : null;
  }

  function todayAtLocalMidnight() {
    const now = new Date();
    return new Date(now.getFullYear(),now.getMonth(),now.getDate());
  }

  function calculate(profile) {
    const result = {
      complete: false,
      restingCalories: null,
      maintenanceCalories: null,
      suggestedCalorieTarget: null,
      estimatedDailyDeficit: null,
      requestedWeeklyLossKg: null,
      daysUntilTarget: null,
      caloriesPerMeal: null,
      warnings: [],
      errors: []
    };
    const age = Number(profile.age);
    const heightCm = Number(profile.heightCm);
    const currentWeightKg = Number(profile.currentWeightKg);
    const goalWeightKg = Number(profile.goalWeightKg);
    const targetDate = dateAtLocalMidnight(profile.targetDate);
    const today = todayAtLocalMidnight();
    const mealsPerDay = Number(profile.mealsPerDay);

    if (!Number.isFinite(age) || age<18 || age>120) result.errors.push("Enter an age between 18 and 120.");
    if (!FC.constants.NUTRITION_SEXES.includes(profile.sex)) result.errors.push("Choose the sex used for calorie estimation.");
    if (!Number.isFinite(heightCm) || heightCm<100 || heightCm>250) result.errors.push("Enter a height between 100 and 250 cm.");
    if (!Number.isFinite(currentWeightKg) || currentWeightKg<18 || currentWeightKg>318) result.errors.push("Enter a valid current weight.");
    if (!Number.isFinite(goalWeightKg) || goalWeightKg<18 || goalWeightKg>318) result.errors.push("Enter a valid goal weight.");
    if (Number.isFinite(currentWeightKg) && Number.isFinite(goalWeightKg) && goalWeightKg>=currentWeightKg) result.errors.push("Goal weight must be below current weight for weight-loss mode.");
    if (!FC.constants.ACTIVITY_LEVELS.includes(profile.activityLevel)) result.errors.push("Choose an activity level.");
    if (!targetDate || targetDate<=today) result.errors.push("Choose a target date in the future.");
    if (!Number.isInteger(mealsPerDay) || mealsPerDay<1 || mealsPerDay>5) result.errors.push("Choose between one and five meals per day.");
    if (profile.sex==="preferNotToSay" && profile.calorieMode!=="manual") result.errors.push("Manual calorie mode is required when sex is Prefer not to say.");
    const manualTarget = Number(profile.manualCalorieTarget);
    if (profile.calorieMode==="manual" && (!Number.isFinite(manualTarget) || manualTarget<500 || manualTarget>10000)) result.errors.push("Enter a manual calorie target between 500 and 10,000 kcal.");

    if (targetDate && targetDate>today) {
      result.daysUntilTarget = Math.round((targetDate-today)/86400000);
      if (Number.isFinite(currentWeightKg) && Number.isFinite(goalWeightKg) && goalWeightKg<currentWeightKg) {
        result.requestedWeeklyLossKg = (currentWeightKg-goalWeightKg)/(result.daysUntilTarget/7);
        if (result.requestedWeeklyLossKg>0.9) result.warnings.push("This target requires more than approximately 0.9 kg (2 lb) of loss per week. Consider a later date and seek professional guidance.");
      }
    }

    if (["female","male"].includes(profile.sex) && Number.isFinite(age) && Number.isFinite(heightCm) && Number.isFinite(currentWeightKg)) {
      const sexAdjustment = profile.sex==="male" ? 5 : -161;
      result.restingCalories = Math.round(10*currentWeightKg + 6.25*heightCm - 5*age + sexAdjustment);
      if (ACTIVITY_MULTIPLIERS[profile.activityLevel]) result.maintenanceCalories = Math.round(result.restingCalories*ACTIVITY_MULTIPLIERS[profile.activityLevel]);
    }

    if (profile.calorieMode==="manual" && Number.isFinite(manualTarget) && manualTarget>=500 && manualTarget<=10000) {
      result.suggestedCalorieTarget = Math.round(manualTarget);
    } else if (result.maintenanceCalories!==null && result.requestedWeeklyLossKg!==null) {
      const requestedDailyDeficit = result.requestedWeeklyLossKg*CALORIES_PER_KG/7;
      const minimum = profile.sex==="female" ? 1200 : 1500;
      const calculated = Math.round(result.maintenanceCalories-requestedDailyDeficit);
      result.suggestedCalorieTarget = Math.max(minimum,calculated);
      if (calculated<minimum) result.warnings.push(`The automatic target was limited to ${minimum.toLocaleString()} kcal. Seek professional guidance before using a lower target.`);
    }
    if (result.maintenanceCalories!==null && result.suggestedCalorieTarget!==null) result.estimatedDailyDeficit = Math.round(result.maintenanceCalories-result.suggestedCalorieTarget);
    if (result.suggestedCalorieTarget!==null && Number.isInteger(mealsPerDay) && mealsPerDay>=1 && mealsPerDay<=5) result.caloriesPerMeal = Math.round(result.suggestedCalorieTarget/mealsPerDay);
    if (profile.calorieMode==="manual" && result.suggestedCalorieTarget!==null) {
      const guideline = profile.sex==="female" ? 1200 : profile.sex==="male" ? 1500 : 1200;
      if (result.suggestedCalorieTarget<guideline) result.warnings.push("This manual calorie target is very low. Seek professional guidance before continuing.");
    }
    result.complete = result.errors.length===0 && result.suggestedCalorieTarget!==null;
    return result;
  }

  FC.nutrition = { ACTIVITY_MULTIPLIERS, CALORIES_PER_KG, calculate };
})(window.FastingCoach = window.FastingCoach || {});
