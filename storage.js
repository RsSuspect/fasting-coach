(function (FC) {
  "use strict";

  const SETTINGS_KEY = "fastingCoachSettings";
  const APP_VERSION = "1.1.0";
  const KG_TO_LB = 2.2046226218;
  const FASTING_PROTOCOLS = ["16:8","18:6","20:4","OMAD","24 hours","36 hours","48 hours","72 hours","Custom"];
  const THEMES = ["system","light","dark"];
  const DEFAULT_SETTINGS = {
    version: 1,
    profile: { startingWeightKg: 115, goalWeightKg: 80, weightUnit: "kg" },
    fasting: { protocol: "16:8", customHours: 16, electrolyteReminders: false },
    appearance: { theme: "system" }
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
    const startingWeightKg = Number(profile.startingWeightKg);
    const goalWeightKg = Number(profile.goalWeightKg);
    const customHours = Number(fasting.customHours);
    let safeStart = Number.isFinite(startingWeightKg) && startingWeightKg>=18 && startingWeightKg<=318 ? startingWeightKg : defaults.profile.startingWeightKg;
    let safeGoal = Number.isFinite(goalWeightKg) && goalWeightKg>=18 && goalWeightKg<=318 ? goalWeightKg : defaults.profile.goalWeightKg;
    if (safeStart<=safeGoal) {
      safeStart=defaults.profile.startingWeightKg;
      safeGoal=defaults.profile.goalWeightKg;
    }
    return {
      version: 1,
      profile: {
        startingWeightKg: safeStart,
        goalWeightKg: safeGoal,
        weightUnit: profile.weightUnit==="lb" ? "lb" : "kg"
      },
      fasting: {
        protocol: FASTING_PROTOCOLS.includes(fasting.protocol) ? fasting.protocol : defaults.fasting.protocol,
        customHours: Number.isFinite(customHours) && customHours>=1 && customHours<=168 ? customHours : defaults.fasting.customHours,
        electrolyteReminders: fasting.electrolyteReminders===true
      },
      appearance: {
        theme: THEMES.includes(appearance.theme) ? appearance.theme : defaults.appearance.theme
      }
    };
  }

  function loadSettings() {
    try {
      return normaliseSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null"));
    } catch (error) {
      return cloneDefaults();
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
  }

  function getWeights(dateKey,startingWeightKg) {
    return JSON.parse(localStorage.getItem("weights") || `[{"date":"${dateKey}","weight":${startingWeightKg}}]`);
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

  function collectBackupData() {
    const data = {};
    for (let i=0;i<localStorage.length;i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    return {
      app: "Fasting Coach",
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data
    };
  }

  function validateBackup(backup) {
    if (!backup || typeof backup!=="object" || Array.isArray(backup) || backup.app!=="Fasting Coach" || !backup.data || typeof backup.data!=="object" || Array.isArray(backup.data)) {
      throw new Error("This is not a valid Fasting Coach backup.");
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
        const start = Number(profile && profile.startingWeightKg);
        const goal = Number(profile && profile.goalWeightKg);
        const custom = Number(fasting && fasting.customHours);
        if (!profile || !fasting || !appearance || !Number.isFinite(start) || !Number.isFinite(goal) || start<18 || start>318 || goal<18 || goal>318 || start<=goal || !["kg","lb"].includes(profile.weightUnit) || !FASTING_PROTOCOLS.includes(fasting.protocol) || !Number.isFinite(custom) || custom<1 || custom>168 || typeof fasting.electrolyteReminders!=="boolean" || !THEMES.includes(appearance.theme)) {
          throw new Error("The settings entry is invalid.");
        }
      } else if (key==="weights") {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed) || !parsed.every(item=>item && typeof item.date==="string" && Number.isFinite(Number(item.weight)) && Number(item.weight)>=18 && Number(item.weight)<=318)) {
          throw new Error("The weight history is invalid.");
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
    Object.entries(data).forEach(([key,value])=>localStorage.setItem(key,value));
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

  FC.constants = { SETTINGS_KEY, APP_VERSION, FASTING_PROTOCOLS, THEMES };
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
    collectBackupData,
    validateBackup,
    importBackupData,
    clearAll
  };
  FC.units = { toDisplayWeight, toKilograms };
  FC.state = { settings: loadSettings() };
})(window.FastingCoach = window.FastingCoach || {});
