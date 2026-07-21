(function (FC) {
  "use strict";

  const settingsOverlay = document.getElementById("settingsOverlay");
  const settingsPanel = document.getElementById("settingsPanel");
  const settingsForm = document.getElementById("settingsForm");
  const settingsStatus = document.getElementById("settingsStatus");
  const dataStatus = document.getElementById("dataStatus");
  const customHoursRow = document.getElementById("customHoursRow");
  const customFastingHours = document.getElementById("customFastingHours");
  const clearConfirmation = document.getElementById("clearConfirmation");
  let settingsReturnFocus = null;
  let formWeightUnit = FC.state.settings.profile.weightUnit;

  const nutritionFields = {
    age: document.getElementById("nutritionAge"),
    sex: document.getElementById("nutritionSex"),
    heightCm: document.getElementById("nutritionHeightCm"),
    heightFeet: document.getElementById("nutritionHeightFeet"),
    heightInches: document.getElementById("nutritionHeightInches"),
    currentWeight: document.getElementById("nutritionCurrentWeight"),
    goalWeight: document.getElementById("nutritionGoalWeight"),
    activityLevel: document.getElementById("nutritionActivity"),
    targetDate: document.getElementById("nutritionTargetDate"),
    manualCalorieTarget: document.getElementById("manualCalorieTarget"),
    mealsPerDay: document.getElementById("nutritionMealsPerDay"),
    dietaryPreference: document.getElementById("dietaryPreference"),
    proteinTargetGrams: document.getElementById("proteinTarget"),
    fibreTargetGrams: document.getElementById("fibreTarget")
  };

  function setStatus(element,message,type="success") {
    element.textContent = message;
    element.className = `status-message ${type}`;
  }

  function toggleCustomHours() {
    const isCustom = document.getElementById("fastingProtocol").value==="Custom";
    customHoursRow.hidden = !isCustom;
    customFastingHours.required = isCustom;
  }

  function selectedCalorieMode() {
    return document.querySelector('input[name="calorieMode"]:checked')?.value || "automatic";
  }

  function toggleNutritionControls() {
    const imperial = formWeightUnit==="lb";
    document.getElementById("heightMetricRow").hidden = imperial;
    document.getElementById("heightImperialRow").hidden = !imperial;
    const forceManual = nutritionFields.sex.value==="preferNotToSay";
    const automatic = document.querySelector('input[name="calorieMode"][value="automatic"]');
    automatic.disabled = forceManual;
    if (forceManual) document.querySelector('input[name="calorieMode"][value="manual"]').checked = true;
    const manual = selectedCalorieMode()==="manual";
    document.getElementById("manualCalorieRow").hidden = !manual;
    nutritionFields.manualCalorieTarget.required = manual;
  }

  function optionalNumber(field) {
    return field.value.trim()==="" ? null : Number(field.value);
  }

  function heightFromForm() {
    if (formWeightUnit!=="lb") return optionalNumber(nutritionFields.heightCm);
    const feet = optionalNumber(nutritionFields.heightFeet);
    const inches = optionalNumber(nutritionFields.heightInches);
    if (feet===null && inches===null) return null;
    return ((feet || 0)*12+(inches || 0))*2.54;
  }

  function nutritionFromForm() {
    return {
      age: optionalNumber(nutritionFields.age),
      sex: nutritionFields.sex.value,
      heightCm: heightFromForm(),
      currentWeightKg: FC.app.toKilograms(optionalNumber(nutritionFields.currentWeight),formWeightUnit),
      goalWeightKg: FC.app.toKilograms(optionalNumber(nutritionFields.goalWeight),formWeightUnit),
      activityLevel: nutritionFields.activityLevel.value,
      targetDate: nutritionFields.targetDate.value,
      calorieMode: selectedCalorieMode(),
      manualCalorieTarget: optionalNumber(nutritionFields.manualCalorieTarget),
      mealsPerDay: Number(nutritionFields.mealsPerDay.value),
      dietaryPreference: nutritionFields.dietaryPreference.value,
      proteinTargetGrams: optionalNumber(nutritionFields.proteinTargetGrams),
      fibreTargetGrams: optionalNumber(nutritionFields.fibreTargetGrams)
    };
  }

  function nutritionProfileStarted(nutrition) {
    return nutrition.age!==null || nutrition.sex!=="" || nutrition.heightCm!==null || nutrition.activityLevel!=="" || nutrition.targetDate!=="" || nutrition.manualCalorieTarget!==null || nutrition.proteinTargetGrams!==null || nutrition.fibreTargetGrams!==null;
  }

  function formatEstimate(value,suffix="kcal") {
    return value===null ? "—" : `${value.toLocaleString()} ${suffix}`;
  }

  function renderLiveNutritionSummary() {
    toggleNutritionControls();
    const result = FC.nutrition.calculate(nutritionFromForm());
    document.getElementById("summaryResting").textContent = formatEstimate(result.restingCalories);
    document.getElementById("summaryMaintenance").textContent = formatEstimate(result.maintenanceCalories);
    document.getElementById("summaryTarget").textContent = formatEstimate(result.suggestedCalorieTarget);
    document.getElementById("summaryDeficit").textContent = formatEstimate(result.estimatedDailyDeficit);
    document.getElementById("summaryWeeklyLoss").textContent = result.requestedWeeklyLossKg===null ? "—" : `${result.requestedWeeklyLossKg.toFixed(2)} kg / week`;
    document.getElementById("summaryDays").textContent = result.daysUntilTarget===null ? "—" : result.daysUntilTarget.toLocaleString();
    document.getElementById("summaryPerMeal").textContent = formatEstimate(result.caloriesPerMeal);
    const messages = document.getElementById("nutritionMessages");
    messages.replaceChildren();
    [...result.errors.map(message=>({message,type:"error"})),...result.warnings.map(message=>({message,type:"warning"}))].forEach(item=>{
      const paragraph = document.createElement("p");
      paragraph.className = item.type;
      paragraph.textContent = item.message;
      messages.appendChild(paragraph);
    });
    return result;
  }

  function fillForm() {
    const settings = FC.state.settings;
    formWeightUnit = settings.profile.weightUnit;
    document.getElementById("startingWeightSetting").value = FC.app.formatWeight(settings.profile.startingWeightKg,formWeightUnit);
    document.getElementById("goalWeightSetting").value = FC.app.formatWeight(settings.profile.goalWeightKg,formWeightUnit);
    document.querySelector(`input[name="weightUnit"][value="${formWeightUnit}"]`).checked = true;
    document.querySelectorAll(".settingsWeightUnit").forEach(element=>element.textContent=formWeightUnit);
    document.getElementById("fastingProtocol").value = settings.fasting.protocol;
    customFastingHours.value = settings.fasting.customHours;
    document.getElementById("electrolyteReminders").checked = settings.fasting.electrolyteReminders;
    document.querySelector(`input[name="theme"][value="${settings.appearance.theme}"]`).checked = true;
    const nutrition = settings.nutrition;
    nutritionFields.age.value = nutrition.age ?? "";
    nutritionFields.sex.value = nutrition.sex;
    nutritionFields.heightCm.value = nutrition.heightCm ?? "";
    if (nutrition.heightCm!==null) {
      const totalInches = nutrition.heightCm/2.54;
      nutritionFields.heightFeet.value = Math.floor(totalInches/12);
      nutritionFields.heightInches.value = (totalInches%12).toFixed(1).replace(/\.0$/,"");
    } else {
      nutritionFields.heightFeet.value = "";
      nutritionFields.heightInches.value = "";
    }
    const currentWeightKg = nutrition.currentWeightKg ?? FC.app.latestWeightKg();
    const nutritionGoalKg = nutrition.goalWeightKg ?? settings.profile.goalWeightKg;
    nutritionFields.currentWeight.value = FC.app.toDisplayWeight(currentWeightKg,formWeightUnit).toFixed(1);
    nutritionFields.goalWeight.value = FC.app.toDisplayWeight(nutritionGoalKg,formWeightUnit).toFixed(1);
    nutritionFields.activityLevel.value = nutrition.activityLevel;
    nutritionFields.targetDate.value = nutrition.targetDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate()+1);
    nutritionFields.targetDate.min = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,"0")}-${String(tomorrow.getDate()).padStart(2,"0")}`;
    document.querySelector(`input[name="calorieMode"][value="${nutrition.calorieMode}"]`).checked = true;
    nutritionFields.manualCalorieTarget.value = nutrition.manualCalorieTarget ?? "";
    nutritionFields.mealsPerDay.value = nutrition.mealsPerDay;
    nutritionFields.dietaryPreference.value = nutrition.dietaryPreference;
    nutritionFields.proteinTargetGrams.value = nutrition.proteinTargetGrams ?? "";
    nutritionFields.fibreTargetGrams.value = nutrition.fibreTargetGrams ?? "";
    settingsStatus.textContent = "";
    dataStatus.textContent = "";
    clearConfirmation.hidden = true;
    toggleCustomHours();
    renderLiveNutritionSummary();
  }

  function setBackgroundInert(value) {
    [document.querySelector("header"),document.querySelector("main"),document.querySelector("nav")].forEach(element=>{
      if (value) element.setAttribute("inert","");
      else element.removeAttribute("inert");
    });
  }

  function open() {
    settingsReturnFocus = document.activeElement;
    fillForm();
    settingsOverlay.hidden = false;
    document.body.classList.add("settings-open");
    document.getElementById("openSettings").setAttribute("aria-expanded","true");
    setBackgroundInert(true);
    settingsPanel.focus();
  }

  function close() {
    settingsOverlay.hidden = true;
    document.body.classList.remove("settings-open");
    document.getElementById("openSettings").setAttribute("aria-expanded","false");
    setBackgroundInert(false);
    if (settingsReturnFocus) settingsReturnFocus.focus();
  }

  function openNutrition() {
    open();
    const section = document.getElementById("nutritionProfileSection");
    section.scrollIntoView({block:"start"});
    setTimeout(()=>nutritionFields.age.focus(),0);
  }

  function handleKeys(event) {
    if (event.key==="Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key!=="Tab") return;
    const focusable = [...settingsPanel.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>!element.closest("[hidden]"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length-1];
    if (event.shiftKey && document.activeElement===first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement===last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.getElementById("openSettings").addEventListener("click",open);
  document.getElementById("closeSettings").addEventListener("click",close);
  settingsOverlay.addEventListener("click",event=>{
    if (event.target===settingsOverlay) close();
  });
  settingsPanel.addEventListener("keydown",handleKeys);
  document.getElementById("fastingProtocol").addEventListener("change",toggleCustomHours);
  document.getElementById("nutritionProfileSection").addEventListener("input",renderLiveNutritionSummary);
  document.getElementById("nutritionProfileSection").addEventListener("change",renderLiveNutritionSummary);

  document.querySelectorAll('input[name="weightUnit"]').forEach(input=>input.addEventListener("change",event=>{
    const nextUnit = event.target.value;
    if (formWeightUnit==="kg" && nextUnit==="lb") {
      const heightCm = optionalNumber(nutritionFields.heightCm);
      if (heightCm!==null) {
        const totalInches = heightCm/2.54;
        nutritionFields.heightFeet.value = Math.floor(totalInches/12);
        nutritionFields.heightInches.value = (totalInches%12).toFixed(1).replace(/\.0$/,"");
      }
    } else if (formWeightUnit==="lb" && nextUnit==="kg") {
      const heightCm = heightFromForm();
      nutritionFields.heightCm.value = heightCm===null ? "" : heightCm.toFixed(1);
    }
    ["startingWeightSetting","goalWeightSetting","nutritionCurrentWeight","nutritionGoalWeight"].forEach(id=>{
      const field = document.getElementById(id);
      if (field.value.trim()==="") return;
      const kg = FC.app.toKilograms(Number(field.value),formWeightUnit);
      field.value = FC.app.toDisplayWeight(kg,nextUnit).toFixed(1);
    });
    formWeightUnit = nextUnit;
    document.querySelectorAll(".settingsWeightUnit").forEach(element=>element.textContent=nextUnit);
    toggleNutritionControls();
    renderLiveNutritionSummary();
  }));

  document.querySelectorAll('input[name="theme"]').forEach(input=>input.addEventListener("change",event=>{
    FC.state.settings.appearance.theme = event.target.value;
    FC.storage.saveSettings(FC.state.settings);
    FC.theme.apply();
    FC.app.renderProgress();
    setStatus(settingsStatus,"Theme applied and saved.");
  }));

  settingsForm.addEventListener("submit",event=>{
    event.preventDefault();
    const startKg = FC.app.toKilograms(Number(document.getElementById("startingWeightSetting").value),formWeightUnit);
    const goalKg = FC.app.toKilograms(Number(document.getElementById("goalWeightSetting").value),formWeightUnit);
    const protocol = document.getElementById("fastingProtocol").value;
    const customHours = Number(customFastingHours.value);
    const nutrition = nutritionFromForm();
    const nutritionResult = FC.nutrition.calculate(nutrition);
    if (!Number.isFinite(startKg) || !Number.isFinite(goalKg) || startKg<18 || startKg>318 || goalKg<18 || goalKg>318 || startKg<=goalKg) {
      setStatus(settingsStatus,"Starting weight must be greater than goal weight, and both must be valid.","error");
      return;
    }
    if (protocol==="Custom" && (!Number.isFinite(customHours) || customHours<1 || customHours>168)) {
      setStatus(settingsStatus,"Enter a custom fasting duration between 1 and 168 hours.","error");
      return;
    }
    if (nutritionProfileStarted(nutrition) && !nutritionResult.complete) {
      setStatus(settingsStatus,nutritionResult.errors[0] || "Complete the nutrition profile before saving.","error");
      document.getElementById("nutritionProfileSection").scrollIntoView({block:"start"});
      return;
    }
    FC.state.settings.profile = {
      ...FC.state.settings.profile,
      startingWeightKg: startKg,
      goalWeightKg: goalKg,
      weightUnit: formWeightUnit
    };
    FC.state.settings.fasting = {
      ...FC.state.settings.fasting,
      protocol,
      customHours: protocol==="Custom" ? customHours : FC.state.settings.fasting.customHours,
      electrolyteReminders: document.getElementById("electrolyteReminders").checked
    };
    FC.state.settings.nutrition = nutrition;
    if (nutritionResult.complete) FC.state.settings.profile.goalWeightKg = nutrition.goalWeightKg;
    FC.storage.saveSettings(FC.state.settings);
    FC.app.refreshForSettings();
    setStatus(settingsStatus,"Settings saved.");
  });

  document.getElementById("exportData").addEventListener("click",()=>{
    const blob = new Blob([JSON.stringify(FC.storage.collectBackupData(),null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fasting-coach-backup-${FC.app.dateKey}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),0);
    setStatus(dataStatus,"Backup exported successfully.");
  });

  document.getElementById("importData").addEventListener("change",async event=>{
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size>1024*1024) throw new Error("Backup file must be smaller than 1 MB.");
      const data = FC.storage.validateBackup(JSON.parse(await file.text()));
      FC.storage.importBackupData(data);
      FC.app.reloadStoredState();
      fillForm();
      setStatus(dataStatus,"Backup imported successfully.");
    } catch (error) {
      setStatus(dataStatus,error.message || "The backup could not be imported.","error");
    } finally {
      event.target.value = "";
    }
  });

  document.getElementById("requestClearData").addEventListener("click",()=>{
    clearConfirmation.hidden = false;
    document.getElementById("cancelClearData").focus();
  });
  document.getElementById("cancelClearData").addEventListener("click",()=>{
    clearConfirmation.hidden = true;
    document.getElementById("requestClearData").focus();
  });
  document.getElementById("confirmClearData").addEventListener("click",()=>{
    FC.storage.clearAll();
    FC.app.reloadStoredState();
    fillForm();
    clearConfirmation.hidden = true;
    setStatus(dataStatus,"All locally stored app data has been cleared.");
  });

  FC.settings = { open, openNutrition, close, fillForm };
})(window.FastingCoach = window.FastingCoach || {});
