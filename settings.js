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

  function setStatus(element,message,type="success") {
    element.textContent = message;
    element.className = `status-message ${type}`;
  }

  function toggleCustomHours() {
    const isCustom = document.getElementById("fastingProtocol").value==="Custom";
    customHoursRow.hidden = !isCustom;
    customFastingHours.required = isCustom;
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
    settingsStatus.textContent = "";
    dataStatus.textContent = "";
    clearConfirmation.hidden = true;
    toggleCustomHours();
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

  document.querySelectorAll('input[name="weightUnit"]').forEach(input=>input.addEventListener("change",event=>{
    const nextUnit = event.target.value;
    ["startingWeightSetting","goalWeightSetting"].forEach(id=>{
      const field = document.getElementById(id);
      const kg = FC.app.toKilograms(Number(field.value),formWeightUnit);
      field.value = FC.app.toDisplayWeight(kg,nextUnit).toFixed(1);
    });
    formWeightUnit = nextUnit;
    document.querySelectorAll(".settingsWeightUnit").forEach(element=>element.textContent=nextUnit);
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
    if (!Number.isFinite(startKg) || !Number.isFinite(goalKg) || startKg<18 || startKg>318 || goalKg<18 || goalKg>318 || startKg<=goalKg) {
      setStatus(settingsStatus,"Starting weight must be greater than goal weight, and both must be valid.","error");
      return;
    }
    if (protocol==="Custom" && (!Number.isFinite(customHours) || customHours<1 || customHours>168)) {
      setStatus(settingsStatus,"Enter a custom fasting duration between 1 and 168 hours.","error");
      return;
    }
    FC.state.settings.profile = {
      startingWeightKg: startKg,
      goalWeightKg: goalKg,
      weightUnit: formWeightUnit
    };
    FC.state.settings.fasting = {
      protocol,
      customHours: protocol==="Custom" ? customHours : FC.state.settings.fasting.customHours,
      electrolyteReminders: document.getElementById("electrolyteReminders").checked
    };
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

  FC.settings = { open, close, fillForm };
})(window.FastingCoach = window.FastingCoach || {});
