(function (FC) {
  "use strict";

  const SETTINGS_KEY = "fastingCoachSettings";
  const APP_VERSION = "2.1.0";
  const LB_TO_KG = 0.45359237;
  const KG_TO_LB = 1/LB_TO_KG;
  const WEIGHT_UNITS = ["kg","lb","st"];
  const HEIGHT_UNITS = ["cm","ft-in"];
  const FASTING_PROTOCOLS = ["16:8","18:6","20:4","OMAD","24 hours","36 hours","48 hours","72 hours","Custom"];
  const THEMES = ["system","light","dark"];
  const NUTRITION_SEXES = ["female","male","preferNotToSay"];
  const ACTIVITY_LEVELS = ["sedentary","light","moderate","very","extra"];
  const CALORIE_MODES = ["automatic","manual"];
  const DIETARY_PREFERENCES = ["none","vegetarian","vegan","mediterranean","lowCarbohydrate","keto"];
  const DEFAULT_SETTINGS = {
    version: 4,
    profile: { startingWeightKg: null, goalWeightKg: null, weightUnit: "kg", heightUnit: "cm" },
    fasting: { protocol: "16:8", customHours: 16, electrolyteReminders: false },
    appearance: { theme: "system" },
    nutrition: {
      age: null,
      sex: "",
      heightCm: null,
      currentWeightKg: null,
      goalWeightKg: null,
      activityLevel: "",
      targetDate: "",
      calorieMode: "automatic",
      manualCalorieTarget: null,
      mealsPerDay: 2,
      dietaryPreference: "none",
      proteinTargetGrams: null,
      fibreTargetGrams: null
    },
    schedule: FC.schedule.defaultSchedule(),
    fastingSchedule: FC.schedule.defaultFastingSchedule()
  };

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  function normaliseSettings(value) {
    const defaults = cloneDefaults();
    if (!value || typeof value!=="object" || Array.isArray(value)) return defaults;
    const profile = value.profile && typeof value.profile==="object" ? value.profile : {};
    const fasting = value.fasting && typeof value.fasting==="object" ? value.fasting : {};
    const appearance = value.appearance && typeof value.appearance==="object" ? value.appearance : {};
    const nutrition = value.nutrition && typeof value.nutrition==="object" && !Array.isArray(value.nutrition) ? value.nutrition : {};
    const customHours = Number(fasting.customHours);
    const nullableNumber = (candidate,min,max)=>{
      if (candidate===null || candidate==="" || candidate===undefined) return null;
      const number = Number(candidate);
      return Number.isFinite(number) && number>=min && number<=max ? number : null;
    };
    const nutritionSex = NUTRITION_SEXES.includes(nutrition.sex) ? nutrition.sex : defaults.nutrition.sex;
    let calorieMode = CALORIE_MODES.includes(nutrition.calorieMode) ? nutrition.calorieMode : defaults.nutrition.calorieMode;
    if (nutritionSex==="preferNotToSay") calorieMode="manual";
    return {
      ...value,
      version: 4,
      profile: {
        ...profile,
        startingWeightKg: nullableNumber(profile.startingWeightKg,18,318),
        goalWeightKg: nullableNumber(profile.goalWeightKg,18,318),
        weightUnit: WEIGHT_UNITS.includes(profile.weightUnit) ? profile.weightUnit : "kg",
        heightUnit: HEIGHT_UNITS.includes(profile.heightUnit) ? profile.heightUnit : (profile.weightUnit==="lb" ? "ft-in" : "cm")
      },
      fasting: {
        ...fasting,
        protocol: FASTING_PROTOCOLS.includes(fasting.protocol) ? fasting.protocol : defaults.fasting.protocol,
        customHours: Number.isFinite(customHours) && customHours>=1 && customHours<=168 ? customHours : defaults.fasting.customHours,
        electrolyteReminders: fasting.electrolyteReminders===true
      },
      appearance: {
        ...appearance,
        theme: THEMES.includes(appearance.theme) ? appearance.theme : defaults.appearance.theme
      },
      nutrition: {
        ...nutrition,
        age: nullableNumber(nutrition.age,18,120),
        sex: nutritionSex,
        heightCm: nullableNumber(nutrition.heightCm,100,250),
        currentWeightKg: nullableNumber(nutrition.currentWeightKg,18,318),
        goalWeightKg: nullableNumber(nutrition.goalWeightKg,18,318),
        activityLevel: ACTIVITY_LEVELS.includes(nutrition.activityLevel) ? nutrition.activityLevel : defaults.nutrition.activityLevel,
        targetDate: typeof nutrition.targetDate==="string" ? nutrition.targetDate : "",
        calorieMode,
        manualCalorieTarget: nullableNumber(nutrition.manualCalorieTarget,500,10000),
        mealsPerDay: Number.isInteger(Number(nutrition.mealsPerDay)) && Number(nutrition.mealsPerDay)>=1 && Number(nutrition.mealsPerDay)<=5 ? Number(nutrition.mealsPerDay) : defaults.nutrition.mealsPerDay,
        dietaryPreference: DIETARY_PREFERENCES.includes(nutrition.dietaryPreference) ? nutrition.dietaryPreference : defaults.nutrition.dietaryPreference,
        proteinTargetGrams: nullableNumber(nutrition.proteinTargetGrams,1,500),
        fibreTargetGrams: nullableNumber(nutrition.fibreTargetGrams,1,100)
      },
      schedule: FC.schedule.normaliseSchedule(value.schedule),
      fastingSchedule: FC.schedule.normaliseFastingSchedule(value.fastingSchedule,fasting)
    };
  }

  function loadSettings() {
    try {
      const raw=localStorage.getItem(SETTINGS_KEY);
      const parsed=JSON.parse(raw || "null");
      const settings=normaliseSettings(parsed);
      const profile=parsed&&parsed.profile;
      const weightsNormalised=!profile||profile.startingWeightKg!==settings.profile.startingWeightKg||profile.goalWeightKg!==settings.profile.goalWeightKg;
      const unitsNormalised=!profile||profile.weightUnit!==settings.profile.weightUnit||profile.heightUnit!==settings.profile.heightUnit;
      if (raw && (!FC.schedule.isValidSchedule(parsed.schedule) || !FC.schedule.isValidFastingSchedule(parsed.fastingSchedule) || parsed.version!==settings.version || weightsNormalised || unitsNormalised)) saveSettings(settings);
      return settings;
    } catch (error) {
      const settings=cloneDefaults();
      saveSettings(settings);
      return settings;
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  }

  function getWeights() {
    try {
      const weights=JSON.parse(localStorage.getItem("weights") || "[]");
      if (!Array.isArray(weights)) return [];
      return weights.filter(item=>item&&typeof item.date==="string"&&Number.isFinite(Number(item.weight))&&Number(item.weight)>=18&&Number(item.weight)<=318).map(item=>({...item,weight:Number(item.weight)})).sort((a,b)=>a.date.localeCompare(b.date));
    } catch (error) {
      return [];
    }
  }

  function saveWeights(weights) {
    localStorage.setItem("weights",JSON.stringify(weights));
  }

  function getChecklist(dateKey) {
    return JSON.parse(localStorage.getItem("checklist-"+dateKey) || "{}");
  }

  function saveChecklist(dateKey,checklist) {
    localStorage.setItem("checklist-"+dateKey,JSON.stringify(checklist));
  }

  function getWater(dateKey) {
    return Number(localStorage.getItem("water-"+dateKey) || 0);
  }

  function saveWater(dateKey,water) {
    localStorage.setItem("water-"+dateKey,water);
  }

  function getFoodLog() {
    try {
      const value = JSON.parse(localStorage.getItem("foodLog") || "{}");
      return value && typeof value==="object" && !Array.isArray(value) ? value : {};
    } catch (error) {
      return {};
    }
  }

  function saveFoodLog(foodLog) {
    localStorage.setItem("foodLog",JSON.stringify(foodLog));
  }

  function collectBackupData() {
    const data = {};
    for (let i=0;i<localStorage.length;i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    return {
      app: "Fitness Coach",
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data
    };
  }

  function validateBackup(backup) {
    if (!backup || typeof backup!=="object" || Array.isArray(backup) || !["Fitness Coach","Fasting Coach"].includes(backup.app) || !backup.data || typeof backup.data!=="object" || Array.isArray(backup.data)) {
      throw new Error("This is not a valid Fitness Coach backup.");
    }
    Object.entries(backup.data).forEach(([key,value])=>{
      if (typeof key!=="string" || typeof value!=="string") {
        throw new Error("Backup data must contain string keys and values.");
      }
      if (key===SETTINGS_KEY) {
        const parsed = JSON.parse(value);
        const profile = parsed && parsed.profile;
        const fasting = parsed && parsed.fasting;
        const appearance = parsed && parsed.appearance;
        const validOptionalWeight=value=>value===null||value===undefined||value===""||(Number.isFinite(Number(value))&&Number(value)>=18&&Number(value)<=318);
        const startValue=profile&&profile.startingWeightKg,goalValue=profile&&profile.goalWeightKg;
        const hasStart=startValue!==null&&startValue!==undefined&&startValue!=="",hasGoal=goalValue!==null&&goalValue!==undefined&&goalValue!=="";
        const custom = Number(fasting && fasting.customHours);
        if (!fasting || !appearance || !validOptionalWeight(startValue) || !validOptionalWeight(goalValue) || (profile&&profile.weightUnit!==undefined&&!WEIGHT_UNITS.includes(profile.weightUnit)) || (profile&&profile.heightUnit!==undefined&&!HEIGHT_UNITS.includes(profile.heightUnit)) || (hasStart&&hasGoal&&Number(startValue)<=Number(goalValue)) || !FASTING_PROTOCOLS.includes(fasting.protocol) || !Number.isFinite(custom) || custom<1 || custom>168 || typeof fasting.electrolyteReminders!=="boolean" || !THEMES.includes(appearance.theme)) {
          throw new Error("The settings entry is invalid.");
        }
        if (parsed.nutrition!==undefined) {
          const nutrition = parsed.nutrition;
          if (!nutrition || typeof nutrition!=="object" || Array.isArray(nutrition)) throw new Error("The nutrition settings entry is invalid.");
          const normalised = normaliseSettings(parsed).nutrition;
          const hasInvalidRequiredValue =
            (nutrition.age!==null && nutrition.age!==undefined && normalised.age===null) ||
            (nutrition.heightCm!==null && nutrition.heightCm!==undefined && normalised.heightCm===null) ||
            (nutrition.currentWeightKg!==null && nutrition.currentWeightKg!==undefined && normalised.currentWeightKg===null) ||
            (nutrition.goalWeightKg!==null && nutrition.goalWeightKg!==undefined && normalised.goalWeightKg===null) ||
            (nutrition.sex!==undefined && nutrition.sex!=="" && !NUTRITION_SEXES.includes(nutrition.sex)) ||
            (nutrition.activityLevel!==undefined && nutrition.activityLevel!=="" && !ACTIVITY_LEVELS.includes(nutrition.activityLevel)) ||
            (nutrition.calorieMode!==undefined && !CALORIE_MODES.includes(nutrition.calorieMode)) ||
            (nutrition.dietaryPreference!==undefined && !DIETARY_PREFERENCES.includes(nutrition.dietaryPreference)) ||
            (nutrition.mealsPerDay!==undefined && (!Number.isInteger(Number(nutrition.mealsPerDay)) || Number(nutrition.mealsPerDay)<1 || Number(nutrition.mealsPerDay)>5)) ||
            (nutrition.manualCalorieTarget!==null && nutrition.manualCalorieTarget!==undefined && normalised.manualCalorieTarget===null) ||
            (nutrition.proteinTargetGrams!==null && nutrition.proteinTargetGrams!==undefined && normalised.proteinTargetGrams===null) ||
            (nutrition.fibreTargetGrams!==null && nutrition.fibreTargetGrams!==undefined && normalised.fibreTargetGrams===null) ||
            (nutrition.targetDate!==undefined && typeof nutrition.targetDate!=="string");
          if (hasInvalidRequiredValue) throw new Error("The nutrition settings entry is invalid.");
        }
        if (parsed.schedule!==undefined && !FC.schedule.isValidSchedule(parsed.schedule)) throw new Error("The schedule settings entry is invalid.");
        if (parsed.fastingSchedule!==undefined && !FC.schedule.isValidFastingSchedule(parsed.fastingSchedule)) throw new Error("The fasting schedule entry is invalid.");
      } else if (key==="weights") {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed) || !parsed.every(item=>item && typeof item.date==="string" && Number.isFinite(Number(item.weight)) && Number(item.weight)>=18 && Number(item.weight)<=318)) {
          throw new Error("The weight history is invalid.");
        }
      } else if (key==="foodLog") {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed!=="object" || Array.isArray(parsed) || !Object.entries(parsed).every(([date,entries])=>FC.food && FC.food.isValidDateKey(date) && Array.isArray(entries) && entries.every(item=>FC.food.isValidStoredEntry(item,date)))) {
          throw new Error("The food log is invalid.");
        }
      } else if (key.startsWith("checklist-")) {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed!=="object" || Array.isArray(parsed) || !Object.values(parsed).every(item=>typeof item==="boolean")) {
          throw new Error("A checklist entry is invalid.");
        }
      } else if (key.startsWith("water-") && (!Number.isFinite(Number(value)) || Number(value)<0 || Number(value)>20)) {
        throw new Error("A water entry is invalid.");
      }
    });
    return backup.data;
  }

  function importBackupData(data) {
    Object.entries(data).forEach(([key,value])=>{
      localStorage.setItem(key,key===SETTINGS_KEY ? JSON.stringify(normaliseSettings(JSON.parse(value))) : value);
    });
  }

  function clearAll() {
    localStorage.clear();
  }

  function toDisplayWeight(kg,unit) {
    return unit==="lb" ? kg*KG_TO_LB : kg;
  }

  function toKilograms(value,unit) {
    return unit==="lb" ? value/KG_TO_LB : value;
  }

  function kilogramsToStones(kg,precision=1) {
    const totalPounds=Number(kg)*KG_TO_LB;
    let stones=Math.floor(totalPounds/14);
    let pounds=Number((totalPounds-stones*14).toFixed(precision));
    if (pounds>=14) { stones+=1; pounds=0; }
    return {stones,pounds};
  }

  function stonesToKilograms(stones,pounds) {
    return (Number(stones)*14+Number(pounds))*LB_TO_KG;
  }

  function centimetresToFeetInches(cm,precision=1) {
    const totalInches=Number(cm)/2.54;
    let feet=Math.floor(totalInches/12);
    let inches=Number((totalInches-feet*12).toFixed(precision));
    if (inches>=12) { feet+=1; inches=0; }
    return {feet,inches};
  }

  function feetInchesToCentimetres(feet,inches) {
    return (Number(feet)*12+Number(inches))*2.54;
  }

  FC.constants = { SETTINGS_KEY, APP_VERSION, FASTING_PROTOCOLS, THEMES, NUTRITION_SEXES, ACTIVITY_LEVELS, CALORIE_MODES, DIETARY_PREFERENCES, WEIGHT_UNITS, HEIGHT_UNITS };
  FC.storage = {
    cloneDefaults,
    normaliseSettings,
    loadSettings,
    saveSettings,
    getWeights,
    saveWeights,
    getChecklist,
    saveChecklist,
    getWater,
    saveWater,
    getFoodLog,
    saveFoodLog,
    collectBackupData,
    validateBackup,
    importBackupData,
    clearAll
  };
  FC.units = { LB_TO_KG, KG_TO_LB, toDisplayWeight, toKilograms, kilogramsToStones, stonesToKilograms, centimetresToFeetInches, feetInchesToCentimetres };
  FC.state = { settings: loadSettings() };
})(window.FastingCoach = window.FastingCoach || {});
