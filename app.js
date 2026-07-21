(function (FC) {
  "use strict";

  const schedule = {
    0: [["8:00","Wake, hydrate"],["10:00","Grocery shopping"],["12:00","Lunch"],["14:00","Meal prep"],["15:30","Protein snack"],["19:00","Dinner"],["20:00","Begin fast"],["22:30","Sleep"]],
    1: [["7:00","Wake and drink 500 ml water"],["9:00","Work"],["12:00","Chicken Power Bowl"],["12:30","10-minute walk"],["15:30","Protein snack"],["18:30","Push workout"],["19:45","Lean Beef & Potatoes"],["20:00","Begin fast"],["22:30","Sleep"]],
    2: [["7:00","Wake and hydrate"],["9:00","Work"],["12:00","Lunch"],["15:30","Protein snack"],["18:30","45-minute brisk walk"],["19:30","Dinner"],["20:00","Begin fast"],["22:30","Sleep"]],
    3: [["7:00","Wake and drink 500 ml water"],["9:00","Work"],["12:00","Chicken Power Bowl"],["12:30","10-minute walk"],["15:30","Protein snack"],["18:30","Pull workout"],["19:45","Dinner"],["20:00","Begin fast"],["22:30","Sleep"]],
    4: [["7:00","Wake and hydrate"],["9:00","Work"],["12:00","Lunch"],["15:30","Protein snack"],["18:30","45-minute brisk walk"],["19:30","Dinner"],["20:00","Begin fast"],["22:30","Sleep"]],
    5: [["7:00","Wake and drink 500 ml water"],["9:00","Work"],["12:00","Chicken Power Bowl"],["12:30","10-minute walk"],["15:30","Protein snack"],["18:30","Leg workout"],["19:45","Dinner"],["20:00","Begin fast"],["22:30","Sleep"]],
    6: [["8:00","Wake and hydrate"],["12:00","Lunch"],["14:00","60-minute walk, swim, or cycle"],["15:30","Protein snack"],["19:00","Dinner"],["20:00","Begin fast"]]
  };
  const workouts = {
    1: ["Bench Press — 3 × 8–10","Incline Dumbbell Press — 3 × 10","Shoulder Press — 3 × 10","Lateral Raises — 3 × 15","Triceps Pushdowns — 3 × 12","Incline Walk — 10 minutes"],
    3: ["Lat Pulldown — 3 × 10","Seated Cable Row — 3 × 10","Face Pull — 3 × 15","Dumbbell Curl — 3 × 12","Hammer Curl — 3 × 12","Incline Walk — 10 minutes"],
    5: ["Leg Press — 3 × 10","Romanian Deadlift — 3 × 10","Leg Curl — 3 × 12","Leg Extension — 3 × 12","Standing Calf Raises — 3 × 15","Plank — 3 sets"]
  };
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const today = new Date();
  const day = today.getDay();
  const dateKey = today.toISOString().slice(0,10);
  const checklistItems = [
    "Stay near 1,800 kcal",
    "Reach 180 g protein",
    "Drink 2.5–3.5 L water",
    "Complete workout or walk",
    "Reach your step goal",
    "Stop eating by 8:00 PM",
    "Aim for 7–8 hours of sleep"
  ];
  let water = FC.storage.getWater(dateKey);

  function unitLabel() {
    return FC.state.settings.profile.weightUnit==="lb" ? "lb" : "kg";
  }

  function toDisplayWeight(kg,unit=FC.state.settings.profile.weightUnit) {
    return FC.units.toDisplayWeight(kg,unit);
  }

  function toKilograms(value,unit=FC.state.settings.profile.weightUnit) {
    return FC.units.toKilograms(value,unit);
  }

  function formatWeight(kg,unit=FC.state.settings.profile.weightUnit) {
    return toDisplayWeight(kg,unit).toFixed(1);
  }

  function compactWeight(kg) {
    return Number(toDisplayWeight(kg).toFixed(1)).toString();
  }

  function renderSchedule() {
    document.getElementById("todaySchedule").innerHTML = schedule[day].map(([time,activity])=>
      `<div class="event"><time>${time}</time><div>${activity}</div></div>`
    ).join("");
  }

  function renderWeek() {
    document.getElementById("weekCalendar").innerHTML = days.map((name,index)=>`
      <details ${index===day ? "open" : ""}>
        <summary>${name}</summary>
        <div class="timeline" style="margin:10px 0 16px;">
          ${schedule[index].map(([time,activity])=>`<div class="event"><time>${time}</time><div>${activity}</div></div>`).join("")}
        </div>
      </details>`).join("");
  }

  function renderChecklist() {
    const saved = FC.storage.getChecklist(dateKey);
    const container = document.getElementById("dailyChecklist");
    container.innerHTML = checklistItems.map((item,index)=>`
      <label class="check"><input type="checkbox" data-i="${index}" ${saved[index] ? "checked" : ""}><span>${item}</span></label>
    `).join("");
    container.querySelectorAll("input").forEach(box=>box.addEventListener("change",event=>{
      saved[event.target.dataset.i] = event.target.checked;
      FC.storage.saveChecklist(dateKey,saved);
    }));
  }

  function renderWorkout() {
    const title = document.getElementById("workoutTitle");
    const body = document.getElementById("workoutBody");
    if (workouts[day]) {
      title.textContent = days[day] + " workout";
      body.innerHTML = `<ol>${workouts[day].map(item=>`<li>${item}</li>`).join("")}</ol>`;
    } else {
      title.textContent = days[day] + " activity";
      body.innerHTML = day===0 ? "<p>Rest, grocery shopping, and meal prep.</p>" :
        day===6 ? "<p>Complete 60 minutes of walking, swimming, or cycling.</p>" :
        "<p>Complete a 30–45 minute brisk walk and light stretching.</p>";
    }
  }

  function getWeights() {
    return FC.storage.getWeights(dateKey,FC.state.settings.profile.startingWeightKg);
  }

  function renderProgress() {
    const weights = getWeights();
    const latest = weights[weights.length-1].weight;
    const start = FC.state.settings.profile.startingWeightKg;
    const goal = FC.state.settings.profile.goalWeightKg;
    document.getElementById("currentWeight").textContent = formatWeight(latest);
    document.getElementById("currentWeightUnit").textContent = unitLabel();
    const percent = Math.max(0,Math.min(100,((start-latest)/(start-goal))*100));
    document.getElementById("weightProgress").style.width = percent+"%";
    document.getElementById("weightMessage").textContent = `${formatWeight(Math.max(0,latest-goal))} ${unitLabel()} remaining`;
    document.getElementById("weightHistory").innerHTML = weights.slice().reverse().map(entry=>
      `<div class="row" style="padding:8px 0;border-top:1px solid var(--line)"><span>${entry.date}</span><strong>${formatWeight(entry.weight)} ${unitLabel()}</strong></div>`
    ).join("");
    drawChart(weights);
  }

  function drawChart(weights) {
    const canvas = document.getElementById("weightChart");
    const context = canvas.getContext("2d");
    const styles = getComputedStyle(document.documentElement);
    const chartInk = styles.getPropertyValue("--ink").trim();
    const chartLine = styles.getPropertyValue("--line").trim();
    const chartMuted = styles.getPropertyValue("--muted").trim();
    context.clearRect(0,0,canvas.width,canvas.height);
    const pad=34, width=canvas.width-pad*2, height=canvas.height-pad*2;
    context.strokeStyle=chartLine;
    context.lineWidth=1;
    context.beginPath();
    context.moveTo(pad,pad);
    context.lineTo(pad,pad+height);
    context.lineTo(pad+width,pad+height);
    context.stroke();
    if (!weights.length) return;
    const values = weights.map(entry=>entry.weight);
    const min = Math.min(FC.state.settings.profile.goalWeightKg,...values)-2;
    const max = Math.max(FC.state.settings.profile.startingWeightKg,...values)+2;
    const points = weights.map((entry,index)=>({
      x: pad + (weights.length===1 ? .5 : index/(weights.length-1))*width,
      y: pad + (max-entry.weight)/(max-min)*height
    }));
    if (points.length>1) {
      context.strokeStyle=chartInk;
      context.lineWidth=3;
      context.beginPath();
      points.forEach((point,index)=>index===0 ? context.moveTo(point.x,point.y) : context.lineTo(point.x,point.y));
      context.stroke();
    }
    context.fillStyle=chartInk;
    points.forEach(point=>{
      context.beginPath();
      context.arc(point.x,point.y,5,0,Math.PI*2);
      context.fill();
    });
    context.fillStyle=chartMuted;
    context.font="12px -apple-system";
    context.fillText(toDisplayWeight(max).toFixed(0)+" "+unitLabel(),2,pad+4);
    context.fillText(toDisplayWeight(min).toFixed(0)+" "+unitLabel(),2,pad+height);
  }

  function renderWater() {
    document.getElementById("waterCount").textContent=water;
  }

  function renderSettingsSummary() {
    const settings = FC.state.settings;
    const protocol = settings.fasting.protocol==="Custom" ? `${settings.fasting.customHours}h fast` : settings.fasting.protocol;
    document.getElementById("headerSummary").textContent = `${compactWeight(settings.profile.startingWeightKg)} ${unitLabel()} → ${compactWeight(settings.profile.goalWeightKg)} ${unitLabel()} · 1,800 kcal · ${protocol} schedule`;
    const weightInput = document.getElementById("weightInput");
    weightInput.placeholder = settings.profile.weightUnit==="lb" ? "e.g. 247.8" : "e.g. 112.4";
    weightInput.min = settings.profile.weightUnit==="lb" ? "40" : "18";
    weightInput.max = settings.profile.weightUnit==="lb" ? "700" : "318";
  }

  function refreshForSettings() {
    FC.theme.apply();
    renderSettingsSummary();
    renderProgress();
  }

  function reloadStoredState() {
    FC.state.settings = FC.storage.loadSettings();
    water = FC.storage.getWater(dateKey);
    renderChecklist();
    renderWater();
    refreshForSettings();
  }

  document.getElementById("addWater").addEventListener("click",()=>{
    water=Math.min(20,water+1);
    FC.storage.saveWater(dateKey,water);
    renderWater();
  });
  document.getElementById("resetWater").addEventListener("click",()=>{
    water=0;
    FC.storage.saveWater(dateKey,water);
    renderWater();
  });
  document.getElementById("saveWeight").addEventListener("click",()=>{
    const entered = Number(document.getElementById("weightInput").value);
    const weightKg = toKilograms(entered);
    if (!entered || weightKg<18 || weightKg>318) return alert("Enter a valid weight.");
    const weights = getWeights();
    const existing = weights.find(entry=>entry.date===dateKey);
    if (existing) existing.weight=weightKg;
    else weights.push({date:dateKey,weight:weightKg});
    weights.sort((a,b)=>a.date.localeCompare(b.date));
    FC.storage.saveWeights(weights);
    document.getElementById("weightInput").value="";
    renderProgress();
  });
  document.querySelectorAll(".tab").forEach(button=>button.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach(tab=>tab.classList.remove("active"));
    document.querySelectorAll(".view").forEach(view=>view.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.view).classList.add("active");
  }));

  FC.app = {
    dateKey,
    formatWeight,
    toDisplayWeight,
    toKilograms,
    unitLabel,
    renderProgress,
    renderChecklist,
    renderWater,
    refreshForSettings,
    reloadStoredState
  };

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
  renderSchedule();
  renderWeek();
  renderChecklist();
  renderWorkout();
  renderWater();
  refreshForSettings();
})(window.FastingCoach = window.FastingCoach || {});
