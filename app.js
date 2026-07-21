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
  const checklistFallbacks = [
    "Stay within your calorie goal",
    "Include a good protein source with your meals",
    "Drink 2.5–3.5 L water",
    "Complete workout or walk",
    "Reach your step goal",
    "Stop eating by 8:00 PM",
    "Aim for 7–8 hours of sleep"
  ];
  let water = FC.storage.getWater(dateKey);
  let foodLog = FC.storage.getFoodLog();
  let selectedFoodDate = dateKey;
  let foodDialogReturnFocus = null;
  let foodDialogReturnFocusSelector = "";
  let foodDialogOrigin = "meals";

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

  function getChecklistItems() {
    const nutrition = FC.state.settings.nutrition;
    const result = FC.nutrition.calculate(nutrition);
    if (!result.complete) return checklistFallbacks;
    const calorieTarget = nutrition.calorieMode==="manual"
      ? Math.round(nutrition.manualCalorieTarget)
      : result.suggestedCalorieTarget;
    const proteinTarget = Number(nutrition.proteinTargetGrams);
    return [
      `Stay near ${calorieTarget.toLocaleString()} kcal`,
      Number.isFinite(proteinTarget) && proteinTarget>0
        ? `Reach ${Math.round(proteinTarget).toLocaleString()} g protein`
        : checklistFallbacks[1],
      ...checklistFallbacks.slice(2)
    ];
  }

  function renderChecklist() {
    const saved = FC.storage.getChecklist(dateKey);
    const container = document.getElementById("dailyChecklist");
    container.innerHTML = getChecklistItems().map((item,index)=>`
      <label class="check"><input type="checkbox" data-i="${index}" ${saved[index] ? "checked" : ""}><span>${item}</span></label>
    `).join("");
    container.querySelectorAll("input").forEach(box=>box.addEventListener("change",event=>{
      saved[event.target.dataset.i] = event.target.checked;
      FC.storage.saveChecklist(dateKey,saved);
    }));
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
  }

  function entriesFor(date) {
    return Array.isArray(foodLog[date]) ? foodLog[date] : [];
  }

  function effectiveNutritionTarget() {
    const result=FC.nutrition.calculate(FC.state.settings.nutrition);
    return result.complete ? result.suggestedCalorieTarget : null;
  }

  function renderFoodScreen() {
    document.getElementById("foodDate").value=selectedFoodDate;
    const entries=entriesFor(selectedFoodDate);
    const totals=FC.food.totals(entries);
    document.getElementById("foodDailyTotals").innerHTML=`<strong>${totals.calories.toLocaleString()} kcal</strong><div class="sub">Protein ${totals.proteinGrams.toLocaleString()} g · Carbohydrates ${totals.carbohydrateGrams.toLocaleString()} g · Fat ${totals.fatGrams.toLocaleString()} g · Fibre ${totals.fibreGrams.toLocaleString()} g</div>`;
    document.getElementById("foodMealSections").innerHTML=FC.food.MEALS.map(meal=>{
      const mealEntries=entries.filter(entry=>entry.meal===meal);
      const total=totals.meals[meal];
      const body=mealEntries.length ? mealEntries.map(entry=>`<div class="meal-entry"><div><strong>${escapeHtml(entry.name)}</strong><div class="sub">${entry.calories.toLocaleString()} kcal · ${entry.proteinGrams.toLocaleString()} g protein</div></div><div class="meal-entry-actions"><button class="secondary edit-food" type="button" data-id="${escapeHtml(entry.id)}">Edit</button><button class="danger delete-food" type="button" data-id="${escapeHtml(entry.id)}" aria-label="Delete ${escapeHtml(entry.name)}">Delete</button></div></div>`).join("") : `<p class="empty-food">Nothing logged for ${meal.toLowerCase()}. Add an entry when you’re ready.</p>`;
      return `<section class="card"><div class="meal-header"><div><h2>${meal}</h2><span class="sub">${total.calories.toLocaleString()} kcal</span></div><button class="add-food" type="button" data-meal="${meal}">Add Food</button></div>${body}</section>`;
    }).join("");
  }

  function renderTodayNutrition() {
    const entries=entriesFor(dateKey);
    const totals=FC.food.totals(entries);
    const nutrition=FC.state.settings.nutrition;
    const target=effectiveNutritionTarget();
    const consumed=document.getElementById("todayCaloriesConsumed");
    const targetText=document.getElementById("todayCalorieTarget");
    const status=document.getElementById("todayCalorieStatus");
    const progress=document.getElementById("calorieProgress");
    const progressBox=progress.parentElement;
    consumed.textContent=totals.calories.toLocaleString();
    if (target===null) {
      targetText.textContent="No calorie target yet";
      status.textContent="Complete your nutrition profile to calculate calories remaining.";
      progress.style.width="0%";
      progressBox.setAttribute("aria-valuenow","0");
      document.getElementById("completeNutritionProfile").hidden=false;
    } else {
      const remaining=Math.max(0,target-totals.calories);
      const over=Math.max(0,totals.calories-target);
      const percentage=Math.round(totals.calories/target*100);
      targetText.textContent=`of ${target.toLocaleString()} kcal target`;
      status.textContent=over>0 ? `${over.toLocaleString()} kcal above today’s estimate. Your overall pattern matters more than one day.` : `${remaining.toLocaleString()} kcal remaining · ${percentage}% used`;
      status.classList.toggle("over-target",over>0);
      progress.style.width=`${Math.min(100,percentage)}%`;
      progressBox.setAttribute("aria-valuenow",String(Math.min(100,percentage)));
      progressBox.setAttribute("aria-valuetext",`${percentage}% of calorie target used`);
      document.getElementById("completeNutritionProfile").hidden=true;
    }
    const proteinTarget=Number(nutrition.proteinTargetGrams)>0 ? Number(nutrition.proteinTargetGrams) : null;
    const fibreTarget=Number(nutrition.fibreTargetGrams)>0 ? Number(nutrition.fibreTargetGrams) : null;
    document.getElementById("todayMacroTotals").innerHTML=`<div>Protein<strong>${totals.proteinGrams.toLocaleString()}${proteinTarget ? ` / ${proteinTarget.toLocaleString()}` : ""} g</strong></div><div>Carbohydrates<strong>${totals.carbohydrateGrams.toLocaleString()} g</strong></div><div>Fat<strong>${totals.fatGrams.toLocaleString()} g</strong></div><div>Fibre<strong>${totals.fibreGrams.toLocaleString()}${fibreTarget ? ` / ${fibreTarget.toLocaleString()}` : ""} g</strong></div>`;
    document.getElementById("todayMealTotals").innerHTML=FC.food.MEALS.map(meal=>`<div>${meal}<strong>${totals.meals[meal].calories.toLocaleString()} kcal</strong></div>`).join("");
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

  function latestWeightKg() {
    const weights = getWeights();
    return weights.length ? Number(weights[weights.length-1].weight) : FC.state.settings.profile.startingWeightKg;
  }

  function renderNutritionSummary() {
    const result = FC.nutrition.calculate(FC.state.settings.nutrition);
    renderTodayNutrition();
    return result;
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

  function clearFoodErrors() {
    ["Meal","Name","Calories","Protein","Carbohydrate","Fat","Fibre"].forEach(name=>{
      document.getElementById(`food${name}Error`).textContent="";
      document.getElementById(`food${name}`).removeAttribute("aria-invalid");
    });
  }

  function openFoodDialog(meal="Breakfast",entryId="",origin=null) {
    const entry=entryId ? entriesFor(selectedFoodDate).find(item=>item.id===entryId) : null;
    foodDialogReturnFocus=document.activeElement;
    foodDialogReturnFocusSelector=foodDialogReturnFocus.id ? `#${foodDialogReturnFocus.id}`
      : foodDialogReturnFocus.classList.contains("add-food") ? `.add-food[data-meal="${foodDialogReturnFocus.dataset.meal}"]`
      : foodDialogReturnFocus.classList.contains("edit-food") ? `.edit-food[data-id="${foodDialogReturnFocus.dataset.id}"]`
      : "";
    foodDialogOrigin=origin || (document.querySelector(".view.active")?.id==="today" ? "today" : "meals");
    clearFoodErrors();
    document.getElementById("foodDialogTitle").textContent=entry ? "Edit Food" : "Add Food";
    document.getElementById("foodEntryId").value=entry ? entry.id : "";
    document.getElementById("foodMeal").value=entry ? entry.meal : meal;
    document.getElementById("foodName").value=entry ? entry.name : "";
    document.getElementById("foodCalories").value=entry ? entry.calories : "";
    document.getElementById("foodProtein").value=entry && entry.proteinGrams ? entry.proteinGrams : "";
    document.getElementById("foodCarbohydrate").value=entry && entry.carbohydrateGrams ? entry.carbohydrateGrams : "";
    document.getElementById("foodFat").value=entry && entry.fatGrams ? entry.fatGrams : "";
    document.getElementById("foodFibre").value=entry && entry.fibreGrams ? entry.fibreGrams : "";
    document.getElementById("foodDialogOverlay").hidden=false;
    document.body.classList.add("settings-open");
    document.getElementById("foodDialog").focus();
    setTimeout(()=>document.getElementById("foodName").focus(),0);
  }

  function closeFoodDialog() {
    document.getElementById("foodDialogOverlay").hidden=true;
    document.body.classList.remove("settings-open");
    activateView(foodDialogOrigin);
    const focusTarget=document.contains(foodDialogReturnFocus) ? foodDialogReturnFocus : document.querySelector(foodDialogReturnFocusSelector);
    if (focusTarget) focusTarget.focus();
  }

  function activateView(viewId) {
    document.querySelectorAll(".tab").forEach(tab=>tab.classList.toggle("active",tab.dataset.view===viewId));
    document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view.id===viewId));
  }

  function changeFoodDate(offset) {
    const [year,month,date]=selectedFoodDate.split("-").map(Number);
    const next=new Date(year,month-1,date+offset);
    selectedFoodDate=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}-${String(next.getDate()).padStart(2,"0")}`;
    renderFoodScreen();
  }

  function saveFoodEntry(event) {
    event.preventDefault();
    clearFoodErrors();
    const input={meal:document.getElementById("foodMeal").value,name:document.getElementById("foodName").value,calories:document.getElementById("foodCalories").value,proteinGrams:document.getElementById("foodProtein").value,carbohydrateGrams:document.getElementById("foodCarbohydrate").value,fatGrams:document.getElementById("foodFat").value,fibreGrams:document.getElementById("foodFibre").value};
    const result=FC.food.validate(input);
    if (!result.valid) {
      const fieldIds={meal:"Meal",name:"Name",calories:"Calories",proteinGrams:"Protein",carbohydrateGrams:"Carbohydrate",fatGrams:"Fat",fibreGrams:"Fibre"};
      Object.entries(result.errors).forEach(([field,message])=>{
        document.getElementById(`food${fieldIds[field]}Error`).textContent=message;
        document.getElementById({meal:"foodMeal",name:"foodName",calories:"foodCalories",proteinGrams:"foodProtein",carbohydrateGrams:"foodCarbohydrate",fatGrams:"foodFat",fibreGrams:"foodFibre"}[field]).setAttribute("aria-invalid","true");
      });
      const first=Object.keys(result.errors)[0];
      document.getElementById({meal:"foodMeal",name:"foodName",calories:"foodCalories",proteinGrams:"foodProtein",carbohydrateGrams:"foodCarbohydrate",fatGrams:"foodFat",fibreGrams:"foodFibre"}[first]).focus();
      return;
    }
    const id=document.getElementById("foodEntryId").value;
    const entries=entriesFor(selectedFoodDate).slice();
    const existingIndex=entries.findIndex(item=>item.id===id);
    const now=new Date().toISOString();
    const entry={...result.value,id:id || FC.food.createId(),date:selectedFoodDate,createdAt:existingIndex>=0 ? entries[existingIndex].createdAt : now,updatedAt:now};
    if (existingIndex>=0) entries[existingIndex]=entry; else entries.push(entry);
    foodLog[selectedFoodDate]=entries;
    FC.storage.saveFoodLog(foodLog);
    renderFoodScreen();
    renderTodayNutrition();
    closeFoodDialog();
  }

  function renderSettingsSummary() {
    const settings = FC.state.settings;
    const protocol = settings.fasting.protocol==="Custom" ? `${settings.fasting.customHours}h fast` : settings.fasting.protocol;
    const nutrition = renderNutritionSummary();
    const calorieSummary = nutrition.complete ? `${nutrition.suggestedCalorieTarget.toLocaleString()} kcal` : "Nutrition profile needed";
    document.getElementById("headerSummary").textContent = `${compactWeight(settings.profile.startingWeightKg)} ${unitLabel()} → ${compactWeight(settings.profile.goalWeightKg)} ${unitLabel()} · ${calorieSummary} · ${protocol} schedule`;
    const weightInput = document.getElementById("weightInput");
    weightInput.placeholder = settings.profile.weightUnit==="lb" ? "e.g. 247.8" : "e.g. 112.4";
    weightInput.min = settings.profile.weightUnit==="lb" ? "40" : "18";
    weightInput.max = settings.profile.weightUnit==="lb" ? "700" : "318";
  }

  function refreshForSettings() {
    FC.theme.apply();
    renderSettingsSummary();
    renderProgress();
    renderChecklist();
  }

  function reloadStoredState() {
    FC.state.settings = FC.storage.loadSettings();
    foodLog = FC.storage.getFoodLog();
    water = FC.storage.getWater(dateKey);
    renderWater();
    renderFoodScreen();
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
  document.getElementById("completeNutritionProfile").addEventListener("click",()=>FC.settings.openNutrition());
  document.getElementById("todayAddMeal").addEventListener("click",()=>{ selectedFoodDate=dateKey; openFoodDialog("Breakfast","","today"); });
  document.getElementById("previousFoodDay").addEventListener("click",()=>changeFoodDate(-1));
  document.getElementById("nextFoodDay").addEventListener("click",()=>changeFoodDate(1));
  document.getElementById("foodDate").addEventListener("change",event=>{ if (event.target.value) { selectedFoodDate=event.target.value; renderFoodScreen(); } });
  document.getElementById("foodMealSections").addEventListener("click",event=>{
    const add=event.target.closest(".add-food");
    const edit=event.target.closest(".edit-food");
    const remove=event.target.closest(".delete-food");
    if (add) openFoodDialog(add.dataset.meal);
    if (edit) openFoodDialog("Breakfast",edit.dataset.id);
    if (remove && confirm("Delete this food entry?")) {
      foodLog[selectedFoodDate]=entriesFor(selectedFoodDate).filter(item=>item.id!==remove.dataset.id);
      if (!foodLog[selectedFoodDate].length) delete foodLog[selectedFoodDate];
      FC.storage.saveFoodLog(foodLog); renderFoodScreen(); renderTodayNutrition();
    }
  });
  document.getElementById("foodForm").addEventListener("submit",saveFoodEntry);
  document.getElementById("cancelFoodEntry").addEventListener("click",closeFoodDialog);
  document.getElementById("closeFoodDialog").addEventListener("click",closeFoodDialog);
  document.getElementById("foodDialogOverlay").addEventListener("click",event=>{ if(event.target.id==="foodDialogOverlay") closeFoodDialog(); });
  document.getElementById("foodDialog").addEventListener("keydown",event=>{
    if(event.key==="Escape"){event.preventDefault();closeFoodDialog();return;}
    if(event.key!=="Tab") return;
    const focusable=[...document.getElementById("foodDialog").querySelectorAll('button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled])')];
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
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
  document.querySelectorAll(".tab").forEach(button=>button.addEventListener("click",()=>activateView(button.dataset.view)));

  FC.app = {
    dateKey,
    formatWeight,
    toDisplayWeight,
    toKilograms,
    unitLabel,
    latestWeightKg,
    renderNutritionSummary,
    renderProgress,
    renderChecklist,
    renderWater,
    renderFoodScreen,
    renderTodayNutrition,
    refreshForSettings,
    reloadStoredState
  };

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
  renderSchedule();
  renderWeek();
  renderWorkout();
  renderWater();
  renderFoodScreen();
  refreshForSettings();
})(window.FastingCoach = window.FastingCoach || {});
