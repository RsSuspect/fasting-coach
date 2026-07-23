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
  let formHeightUnit = FC.state.settings.profile.heightUnit;
  let draftSchedule=FC.schedule.normaliseSchedule(FC.state.settings.schedule);
  let draftFastingSchedule=FC.schedule.normaliseFastingSchedule(FC.state.settings.fastingSchedule,FC.state.settings.fasting);
  let scheduleDialogReturnFocus=null;

  const nutritionFields = {
    age: document.getElementById("nutritionAge"),
    sex: document.getElementById("nutritionSex"),
    heightCm: document.getElementById("nutritionHeightCm"),
    heightFeet: document.getElementById("nutritionHeightFeet"),
    heightInches: document.getElementById("nutritionHeightInches"),
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
    const imperial = formHeightUnit==="ft-in";
    document.getElementById("heightMetricRow").hidden = imperial;
    document.getElementById("heightImperialRow").hidden = !imperial;
    [nutritionFields.heightCm].forEach(field=>field.disabled=imperial);
    [nutritionFields.heightFeet,nutritionFields.heightInches].forEach(field=>field.disabled=!imperial);
    const forceManual = nutritionFields.sex.value==="preferNotToSay";
    const automatic = document.querySelector('input[name="calorieMode"][value="automatic"]');
    automatic.disabled = forceManual;
    if (forceManual) document.querySelector('input[name="calorieMode"][value="manual"]').checked = true;
    const manual = selectedCalorieMode()==="manual";
    document.getElementById("manualCalorieRow").hidden = !manual;
    nutritionFields.manualCalorieTarget.required = false;
  }

  function optionalNumber(field) {
    return field.value.trim()==="" ? null : Number(field.value);
  }

  function heightFromForm() {
    if (formHeightUnit!=="ft-in") return optionalNumber(nutritionFields.heightCm);
    const feet = optionalNumber(nutritionFields.heightFeet);
    const inches = optionalNumber(nutritionFields.heightInches);
    if (feet===null && inches===null) return null;
    if (!Number.isInteger(feet??0) || (inches??0)<0 || (inches??0)>=12) return NaN;
    return FC.units.feetInchesToCentimetres(feet||0,inches||0);
  }

  function stoneWeightFromFields(prefix) {
    const stones=optionalNumber(document.getElementById(`${prefix}WeightStones`));
    const pounds=optionalNumber(document.getElementById(`${prefix}WeightPounds`));
    if (stones===null&&pounds===null) return null;
    if (!Number.isInteger(stones??0)||(stones??0)<0||(pounds??0)<0||(pounds??0)>=14) return NaN;
    const kilograms=FC.units.stonesToKilograms(stones||0,pounds||0);
    return kilograms>0 ? kilograms : NaN;
  }

  function weightFromForm(prefix) {
    if (formWeightUnit==="st") return stoneWeightFromFields(prefix);
    const value=optionalNumber(document.getElementById(`${prefix}WeightSetting`));
    return value===null ? null : FC.app.toKilograms(value,formWeightUnit);
  }

  function fillWeightFields(prefix,kg) {
    const single=document.getElementById(`${prefix}WeightSetting`);
    const stoneFields=document.getElementById(`${prefix}StoneFields`);
    const isStone=formWeightUnit==="st";
    single.hidden=isStone; single.disabled=isStone;
    stoneFields.hidden=!isStone;
    stoneFields.querySelectorAll("input").forEach(field=>field.disabled=!isStone);
    if (kg===null) { single.value=""; document.getElementById(`${prefix}WeightStones`).value=""; document.getElementById(`${prefix}WeightPounds`).value=""; return; }
    if (isStone) {
      const parts=FC.units.kilogramsToStones(kg);
      document.getElementById(`${prefix}WeightStones`).value=parts.stones;
      document.getElementById(`${prefix}WeightPounds`).value=parts.pounds;
    } else single.value=FC.app.formatWeight(kg,formWeightUnit);
  }

  function nutritionFromForm() {
    const goalWeight=weightFromForm("goal");
    return {
      age: optionalNumber(nutritionFields.age),
      sex: nutritionFields.sex.value,
      heightCm: heightFromForm(),
      currentWeightKg: FC.app.latestWeightKg(),
      goalWeightKg: goalWeight,
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

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[character]);
  }

  function renderScheduleEditor() {
    const list=document.getElementById("scheduleEditorList");
    const events=draftSchedule.events;
    list.innerHTML=events.length ? events.map(event=>`<article class="schedule-editor-item" data-event-id="${escapeHtml(event.id)}"><div><strong>${escapeHtml(event.time)} · ${escapeHtml(event.name)}</strong><span class="setting-help">${event.enabled ? "Enabled" : "Disabled"} · ${event.days.map(day=>FC.schedule.WEEKDAYS[day].slice(0,3)).join(", ")}${event.description ? ` · ${escapeHtml(event.description)}` : ""}</span></div><div class="schedule-item-actions"><button class="secondary" data-schedule-action="up" type="button" aria-label="Move ${escapeHtml(event.name)} up">↑</button><button class="secondary" data-schedule-action="down" type="button" aria-label="Move ${escapeHtml(event.name)} down">↓</button><button class="secondary" data-schedule-action="edit" type="button">Edit</button><button class="danger" data-schedule-action="delete" type="button">Delete</button></div></article>`).join("") : '<p class="empty-state">No schedule events yet.</p>';
  }

  function renderFastingScheduleEditor() {
    document.getElementById("fastingScheduleEditor").innerHTML=FC.schedule.WEEKDAYS.map((name,index)=>{
      const item=draftFastingSchedule.days[String(index)];
      const minutes=FC.schedule.fastingDuration(item);
      const summary=item.enabled ? `${Math.floor(minutes/60)}h ${minutes%60 ? `${minutes%60}m` : ""}${FC.schedule.isOvernight(item) ? " · overnight" : ""}` : "Disabled";
      return `<details class="fasting-day" ${index===1 ? "open" : ""}><summary><strong>${name}</strong><span>${summary}</span></summary><div class="fasting-day-fields"><label class="toggle-row"><span>Enabled</span><input class="toggle" data-fasting-field="enabled" data-day="${index}" type="checkbox" ${item.enabled ? "checked" : ""}></label><label>Starts<input data-fasting-field="startTime" data-day="${index}" type="time" value="${item.startTime}"></label><label>Ends<input data-fasting-field="endTime" data-day="${index}" type="time" value="${item.endTime}"></label>${index ? `<button class="secondary copy-fasting-day" data-day="${index}" type="button">Copy previous day</button>` : ""}</div></details>`;
    }).join("");
  }

  function showScheduleErrors(errors={}) {
    ["name","time","description","days"].forEach(key=>document.getElementById(`scheduleEvent${key[0].toUpperCase()+key.slice(1)}Error`).textContent=errors[key]||"");
  }

  function openScheduleEvent(eventId="",trigger=document.activeElement) {
    scheduleDialogReturnFocus=trigger;
    const existing=draftSchedule.events.find(event=>event.id===eventId);
    document.getElementById("scheduleEventTitle").textContent=existing ? "Edit schedule event" : "Add schedule event";
    document.getElementById("scheduleEventId").value=existing?.id||"";
    document.getElementById("scheduleEventName").value=existing?.name||"";
    document.getElementById("scheduleEventTime").value=existing?.time||"08:00";
    document.getElementById("scheduleEventDescription").value=existing?.description||"";
    document.getElementById("scheduleEventEnabled").checked=existing?.enabled!==false;
    document.getElementById("scheduleEventDays").innerHTML=FC.schedule.WEEKDAYS.map((name,index)=>`<label class="choice"><input type="checkbox" value="${index}" ${(existing?.days||[new Date().getDay()]).includes(index) ? "checked" : ""}><span>${name.slice(0,3)}</span></label>`).join("");
    showScheduleErrors();
    document.getElementById("scheduleEventOverlay").hidden=false;
    settingsPanel.setAttribute("inert","");
    document.getElementById("scheduleEventDialog").focus();
  }

  function closeScheduleEvent() {
    document.getElementById("scheduleEventOverlay").hidden=true;
    settingsPanel.removeAttribute("inert");
    scheduleDialogReturnFocus?.focus();
  }

  function fillForm() {
    const settings = FC.state.settings;
    formWeightUnit = settings.profile.weightUnit;
    formHeightUnit = settings.profile.heightUnit;
    fillWeightFields("starting",settings.profile.startingWeightKg);
    fillWeightFields("goal",settings.profile.goalWeightKg);
    document.querySelector(`input[name="weightUnit"][value="${formWeightUnit}"]`).checked = true;
    document.querySelector(`input[name="heightUnit"][value="${formHeightUnit}"]`).checked = true;
    document.querySelectorAll(".settingsWeightUnit").forEach(element=>element.textContent=formWeightUnit==="st"?"st + lb":formWeightUnit);
    document.getElementById("fastingProtocol").value = settings.fasting.protocol;
    customFastingHours.value = settings.fasting.customHours;
    document.getElementById("electrolyteReminders").checked = settings.fasting.electrolyteReminders;
    document.querySelector(`input[name="theme"][value="${settings.appearance.theme}"]`).checked = true;
    const nutrition = settings.nutrition;
    nutritionFields.age.value = nutrition.age ?? "";
    nutritionFields.sex.value = nutrition.sex;
    nutritionFields.heightCm.value = nutrition.heightCm ?? "";
    if (nutrition.heightCm!==null) {
      const parts=FC.units.centimetresToFeetInches(nutrition.heightCm);
      nutritionFields.heightFeet.value = parts.feet;
      nutritionFields.heightInches.value = String(parts.inches);
    } else {
      nutritionFields.heightFeet.value = "";
      nutritionFields.heightInches.value = "";
    }
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
    draftSchedule=FC.schedule.normaliseSchedule(settings.schedule);
    draftFastingSchedule=FC.schedule.normaliseFastingSchedule(settings.fastingSchedule,settings.fasting);
    renderScheduleEditor();
    renderFastingScheduleEditor();
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

  function openSchedule() {
    open();
    const section=document.getElementById("scheduleSettingsSection");
    section.scrollIntoView({block:"start"});
    setTimeout(()=>document.getElementById("addScheduleEvent").focus(),0);
  }

  function handleKeys(event) {
    if (event.key==="Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key!=="Tab") return;
    const focusable = [...settingsPanel.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(element=>!element.closest("[hidden]"));
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
  document.getElementById("goalWeightSetting").addEventListener("input",renderLiveNutritionSummary);
  document.querySelectorAll("#goalStoneFields input").forEach(input=>input.addEventListener("input",renderLiveNutritionSummary));
  document.getElementById("addScheduleEvent").addEventListener("click",event=>openScheduleEvent("",event.currentTarget));
  document.getElementById("scheduleEditorList").addEventListener("click",event=>{
    const button=event.target.closest("[data-schedule-action]");
    const item=event.target.closest("[data-event-id]");
    if (!button || !item) return;
    const index=draftSchedule.events.findIndex(entry=>entry.id===item.dataset.eventId);
    if (index<0) return;
    const action=button.dataset.scheduleAction;
    if (action==="edit") return openScheduleEvent(item.dataset.eventId,button);
    if (action==="delete") {
      if (!confirm(`Delete “${draftSchedule.events[index].name}”?`)) return;
      draftSchedule.events.splice(index,1);
    } else {
      const next=action==="up" ? index-1 : index+1;
      if (next<0 || next>=draftSchedule.events.length) return;
      [draftSchedule.events[index],draftSchedule.events[next]]=[draftSchedule.events[next],draftSchedule.events[index]];
    }
    renderScheduleEditor();
  });
  document.querySelectorAll(".day-shortcut").forEach(button=>button.addEventListener("click",()=>{
    const days=button.dataset.days.split(",");
    document.querySelectorAll("#scheduleEventDays input").forEach(input=>input.checked=days.includes(input.value));
  }));
  ["closeScheduleEvent","cancelScheduleEvent"].forEach(id=>document.getElementById(id).addEventListener("click",closeScheduleEvent));
  document.getElementById("scheduleEventOverlay").addEventListener("click",event=>{ if (event.target===event.currentTarget) closeScheduleEvent(); });
  document.getElementById("scheduleEventDialog").addEventListener("keydown",event=>{
    if (event.key==="Escape") { event.preventDefault(); closeScheduleEvent(); return; }
    if (event.key!=="Tab") return;
    const focusable=[...event.currentTarget.querySelectorAll('button:not([disabled]),input:not([disabled]):not([type="hidden"]),textarea:not([disabled])')];
    const first=focusable[0],last=focusable[focusable.length-1];
    if (event.shiftKey&&document.activeElement===first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey&&document.activeElement===last) { event.preventDefault(); first.focus(); }
  });
  document.getElementById("scheduleEventForm").addEventListener("submit",event=>{
    event.preventDefault();
    const input={name:document.getElementById("scheduleEventName").value,time:document.getElementById("scheduleEventTime").value,description:document.getElementById("scheduleEventDescription").value,enabled:document.getElementById("scheduleEventEnabled").checked,days:[...document.querySelectorAll("#scheduleEventDays input:checked")].map(item=>Number(item.value))};
    const result=FC.schedule.validateEvent(input);
    showScheduleErrors(result.errors);
    if (!result.valid) return;
    const id=document.getElementById("scheduleEventId").value;
    const index=draftSchedule.events.findIndex(item=>item.id===id);
    const now=new Date().toISOString();
    const saved={...result.value,id:id||FC.schedule.createId(),createdAt:index>=0 ? draftSchedule.events[index].createdAt : now,updatedAt:now};
    if (index>=0) draftSchedule.events[index]=saved; else draftSchedule.events.push(saved);
    renderScheduleEditor();
    closeScheduleEvent();
  });
  document.getElementById("fastingScheduleEditor").addEventListener("change",event=>{
    const field=event.target.dataset.fastingField,day=event.target.dataset.day;
    if (!field || day===undefined) return;
    draftFastingSchedule.days[day][field]=field==="enabled" ? event.target.checked : event.target.value;
    renderFastingScheduleEditor();
  });
  document.getElementById("fastingScheduleEditor").addEventListener("click",event=>{
    const button=event.target.closest(".copy-fasting-day");
    if (!button) return;
    const day=Number(button.dataset.day);
    draftFastingSchedule.days[String(day)]={...draftFastingSchedule.days[String(day-1)]};
    renderFastingScheduleEditor();
  });
  document.getElementById("applyMondayFasting").addEventListener("click",()=>{
    const monday={...draftFastingSchedule.days["1"]};
    FC.schedule.WEEKDAYS.forEach((_,day)=>draftFastingSchedule.days[String(day)]={...monday});
    renderFastingScheduleEditor();
  });
  document.getElementById("resetFastingSchedule").addEventListener("click",()=>{
    if (!confirm("Reset all fasting days to the default 20:00–12:00 window?")) return;
    draftFastingSchedule=FC.schedule.defaultFastingSchedule();
    renderFastingScheduleEditor();
  });

  document.querySelectorAll('input[name="weightUnit"]').forEach(input=>input.addEventListener("change",event=>{
    const nextUnit = event.target.value;
    const startKg=weightFromForm("starting"),goalKg=weightFromForm("goal");
    formWeightUnit = nextUnit;
    fillWeightFields("starting",Number.isFinite(startKg)?startKg:null);
    fillWeightFields("goal",Number.isFinite(goalKg)?goalKg:null);
    document.querySelectorAll(".settingsWeightUnit").forEach(element=>element.textContent=nextUnit==="st"?"st + lb":nextUnit);
    renderLiveNutritionSummary();
  }));

  document.querySelectorAll('input[name="heightUnit"]').forEach(input=>input.addEventListener("change",event=>{
    const heightCm=heightFromForm();
    formHeightUnit=event.target.value;
    if (Number.isFinite(heightCm)) {
      nutritionFields.heightCm.value=heightCm.toFixed(1);
      const parts=FC.units.centimetresToFeetInches(heightCm);
      nutritionFields.heightFeet.value=parts.feet;
      nutritionFields.heightInches.value=parts.inches;
    } else if (heightCm===null) {
      nutritionFields.heightCm.value="";
      nutritionFields.heightFeet.value="";
      nutritionFields.heightInches.value="";
    }
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
    document.getElementById("goalWeightError").textContent="";
    document.getElementById("nutritionHeightCmError").textContent="";
    document.getElementById("nutritionHeightImperialError").textContent="";
    const startKg=weightFromForm("starting");
    const goalKg=weightFromForm("goal");
    const protocol = document.getElementById("fastingProtocol").value;
    const customHours = Number(customFastingHours.value);
    const nutrition = nutritionFromForm();
    if (startKg!==null&&(!Number.isFinite(startKg)||startKg<18||startKg>318)) {
      const pounds=formWeightUnit==="st" ? optionalNumber(document.getElementById("startingWeightPounds")) : null;
      const message=pounds!==null&&pounds>=14 ? "Enter starting-weight pounds from 0 to 13.9." : "Enter a valid starting weight.";
      setStatus(settingsStatus,message,"error");
      (formWeightUnit==="st" ? document.getElementById("startingWeightPounds") : document.getElementById("startingWeightSetting")).focus();
      return;
    }
    if (goalKg!==null&&(!Number.isFinite(goalKg)||goalKg<18||goalKg>318)) {
      const stonePounds=formWeightUnit==="st" ? optionalNumber(document.getElementById("goalWeightPounds")) : null;
      const message=stonePounds!==null&&stonePounds>=14 ? "Enter pounds from 0 to 13.9." : "Enter a valid goal weight.";
      document.getElementById("goalWeightError").textContent=message;
      setStatus(settingsStatus,message,"error");
      (formWeightUnit==="st" ? document.getElementById("goalWeightPounds") : document.getElementById("goalWeightSetting")).focus();
      return;
    }
    if (startKg!==null&&goalKg!==null&&startKg<=goalKg) {
      const message="Goal weight must be below starting weight.";
      document.getElementById("goalWeightError").textContent=message;
      setStatus(settingsStatus,message,"error");
      (formWeightUnit==="st" ? document.getElementById("goalWeightStones") : document.getElementById("goalWeightSetting")).focus();
      return;
    }
    if (nutrition.heightCm!==null&&(!Number.isFinite(nutrition.heightCm)||nutrition.heightCm<100||nutrition.heightCm>250)) {
      const inches=optionalNumber(nutritionFields.heightInches);
      const message=formHeightUnit==="ft-in"&&inches!==null&&inches>=12 ? "Enter inches from 0 to 11.9." : "Enter a valid height.";
      document.getElementById(formHeightUnit==="ft-in"?"nutritionHeightImperialError":"nutritionHeightCmError").textContent=message;
      setStatus(settingsStatus,message,"error");
      (formHeightUnit==="ft-in"?nutritionFields.heightInches:nutritionFields.heightCm).focus();
      return;
    }
    if (protocol==="Custom" && (!Number.isFinite(customHours) || customHours<1 || customHours>168)) {
      setStatus(settingsStatus,"Enter a custom fasting duration between 1 and 168 hours.","error");
      return;
    }
    if (!FC.schedule.isValidSchedule(draftSchedule) || !FC.schedule.isValidFastingSchedule(draftFastingSchedule)) {
      setStatus(settingsStatus,"Check that every schedule event has valid details and every fasting day has valid start and end times.","error");
      document.getElementById("scheduleSettingsSection").scrollIntoView({block:"start"});
      return;
    }
    FC.state.settings.profile = {
      ...FC.state.settings.profile,
      startingWeightKg: startKg,
      goalWeightKg: goalKg,
      weightUnit: formWeightUnit,
      heightUnit: formHeightUnit
    };
    FC.state.settings.fasting = {
      ...FC.state.settings.fasting,
      protocol,
      customHours: protocol==="Custom" ? customHours : FC.state.settings.fasting.customHours,
      electrolyteReminders: document.getElementById("electrolyteReminders").checked
    };
    FC.state.settings.schedule=FC.schedule.normaliseSchedule(draftSchedule);
    FC.state.settings.fastingSchedule=FC.schedule.normaliseFastingSchedule(draftFastingSchedule,FC.state.settings.fasting);
    FC.state.settings.nutrition = nutrition;
    FC.storage.saveSettings(FC.state.settings);
    FC.app.refreshForSettings();
    setStatus(settingsStatus,"Settings saved.");
  });

  document.getElementById("exportData").addEventListener("click",()=>{
    const blob = new Blob([JSON.stringify(FC.storage.collectBackupData(),null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fitness-coach-backup-${FC.app.dateKey}.json`;
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

  FC.settings = { open, openNutrition, openSchedule, close, fillForm };
})(window.FastingCoach = window.FastingCoach || {});
