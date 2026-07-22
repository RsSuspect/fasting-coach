(function (FC) {
  "use strict";

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
  let timelineRefreshTimer = 0;
  let timelineResizeFrame = 0;

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
    return kg!==null&&kg!==undefined&&kg!==""&&Number.isFinite(Number(kg)) ? toDisplayWeight(Number(kg),unit).toFixed(1) : "";
  }

  function compactWeight(kg) {
    return Number.isFinite(Number(kg)) && Number(kg)>0 ? Number(toDisplayWeight(Number(kg)).toFixed(1)).toString() : "";
  }

  function localDateKey(value=new Date()) {
    return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`;
  }

  function timeToMinutes(value) {
    const match=typeof value==="string" ? value.trim().match(/^(\d{1,2}):(\d{2})$/) : null;
    if (!match) return null;
    const hours=Number(match[1]),minutes=Number(match[2]);
    return Number.isInteger(hours) && Number.isInteger(minutes) && hours>=0 && hours<24 && minutes>=0 && minutes<60 ? hours*60+minutes : null;
  }

  function renderTimeline(items,isToday=false) {
    if (!items.length) return '<div class="empty-state">No events planned. <button class="secondary compact-action edit-schedule-empty" type="button">Edit schedule</button></div>';
    const events=items.map(item=>{
      const {time,name,description,type}=item;
      const minutes=timeToMinutes(time);
      const minutesAttribute=minutes===null ? "" : ` data-time-minutes="${minutes}"`;
      return `<div class="event timeline-event timeline-event--${escapeHtml(type||"user")}"${minutesAttribute}><time datetime="${escapeHtml(time)}">${escapeHtml(time)}</time><div><span class="timeline-event-label">${escapeHtml(name)}</span>${description ? `<span class="timeline-event-description">${escapeHtml(description)}</span>` : ""}</div></div>`;
    }).join("");
    return `<div class="timeline-events">${events}</div>${isToday ? '<div class="timeline-now-marker" role="status" aria-live="off" hidden><span class="timeline-now-dot" aria-hidden="true"></span><span class="timeline-now-label"></span></div>' : ""}`;
  }

  function renderSchedule() {
    const container=document.getElementById("todaySchedule");
    container.classList.add("timeline--has-current-time");
    container.dataset.date=localDateKey();
    container.innerHTML=renderTimeline(FC.schedule.eventsForDay(FC.state.settings,new Date().getDay()),true);
    const status=FC.schedule.fastingStatus(FC.state.settings.fastingSchedule);
    document.getElementById("fastingPlanStatus").textContent=status.message;
  }

  function renderWeek() {
    document.getElementById("weekCalendar").innerHTML = days.map((name,index)=>`
      <details ${index===day ? "open" : ""}>
        <summary>${name}</summary>
        <div class="timeline${index===day ? " timeline--has-current-time" : ""}" data-date="${index===day ? localDateKey() : ""}">
          ${renderTimeline(FC.schedule.eventsForDay(FC.state.settings,index),index===day)}
        </div>
      </details>`).join("");
  }

  function timelineDescription(events,minutes,timeLabel,boundary) {
    if (boundary==="before") return `Current time, ${timeLabel}, before ${events[0].activity}`;
    if (boundary==="after") return `Current time, ${timeLabel}, after ${events[events.length-1].activity}`;
    const nextIndex=events.findIndex(event=>event.minutes>minutes);
    if (nextIndex<0) return `Current time, ${timeLabel}, at ${events[events.length-1].activity}`;
    const previous=events[Math.max(0,nextIndex-1)];
    if (previous.minutes===minutes) return `Current time, ${timeLabel}, at ${previous.activity}`;
    return `Current time, ${timeLabel}, between ${previous.activity} and ${events[nextIndex].activity}`;
  }

  function calculateTimelinePosition(events,minutes,height) {
    if (!events.length) return {position:0,boundary:""};
    if (minutes<events[0].minutes) return {position:0,boundary:"before"};
    if (minutes>events[events.length-1].minutes) return {position:height,boundary:"after"};
    const exact=events.find(event=>event.minutes===minutes);
    if (exact) return {position:exact.centre,boundary:""};
    const nextIndex=events.findIndex(event=>event.minutes>minutes);
    if (nextIndex<=0) return {position:events[0].centre,boundary:""};
    const previous=events[nextIndex-1],next=events[nextIndex];
    const timeRange=next.minutes-previous.minutes;
    const ratio=timeRange>0 ? (minutes-previous.minutes)/timeRange : 0;
    return {position:previous.centre+(next.centre-previous.centre)*ratio,boundary:""};
  }

  function applyTimelineEventStates(events,minutes) {
    const nextIndex=events.findIndex(event=>event.minutes>minutes);
    events.forEach((event,index)=>{
      let state="future";
      if (event.minutes<minutes) state="past";
      if (event.minutes===minutes || (index===nextIndex-1 && nextIndex>0)) state="current";
      if (index===nextIndex) state="next";
      event.element.classList.remove("timeline-event--past","timeline-event--current","timeline-event--next","timeline-event--future");
      event.element.classList.add(`timeline-event--${state}`);
    });
  }

  function updateTimeline(timeline,now=new Date()) {
    const marker=timeline.querySelector(".timeline-now-marker");
    if (!marker) return;
    const representsToday=timeline.dataset.date===localDateKey(now);
    const isVisible=timeline.getClientRects().length>0;
    const eventElements=[...timeline.querySelectorAll(".timeline-event[data-time-minutes]")];
    if (!representsToday || !isVisible || !eventElements.length) { marker.hidden=true; return; }
    const events=eventElements.map(element=>({
      element,
      minutes:Number(element.dataset.timeMinutes),
      activity:element.lastElementChild.textContent.trim(),
      centre:element.offsetTop+element.offsetHeight/2
    })).filter(event=>Number.isFinite(event.minutes)).sort((a,b)=>a.minutes-b.minutes);
    if (!events.length) { marker.hidden=true; return; }
    const minutes=now.getHours()*60+now.getMinutes();
    const timeLabel=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const timelineHeight=timeline.querySelector(".timeline-events").offsetHeight;
    const {position,boundary}=calculateTimelinePosition(events,minutes,timelineHeight);
    applyTimelineEventStates(events,minutes);
    const nearestEvent=events.reduce((nearest,event)=>Math.abs(event.centre-position)<Math.abs(nearest.centre-position) ? event : nearest,events[0]);
    const collision=Math.abs(nearestEvent.centre-position)<=22;
    marker.classList.remove("timeline-now-marker--collision-above","timeline-now-marker--collision-below");
    if (collision) {
      const markerIsAboveEvent=position<nearestEvent.centre;
      const placeLabelBelow=position<28 ? true : position>timelineHeight-28 ? false : !markerIsAboveEvent;
      marker.classList.add(placeLabelBelow ? "timeline-now-marker--collision-below" : "timeline-now-marker--collision-above");
    }
    marker.style.top=`${Math.max(0,position)}px`;
    marker.querySelector(".timeline-now-label").textContent=boundary==="before" ? `${timeLabel} · before` : boundary==="after" ? `${timeLabel} · after` : timeLabel;
    marker.setAttribute("aria-label",timelineDescription(events,minutes,timeLabel,boundary));
    marker.hidden=false;
  }

  function refreshTimelines(now=new Date()) {
    document.querySelectorAll(".timeline").forEach(timeline=>updateTimeline(timeline,now));
  }

  function scheduleTimelineRefresh() {
    window.clearTimeout(timelineRefreshTimer);
    const delay=60000-(Date.now()%60000)+25;
    timelineRefreshTimer=window.setTimeout(()=>{ refreshTimelines(); scheduleTimelineRefresh(); },delay);
  }

  function getChecklistItems() {
    const nutrition = FC.state.settings.nutrition;
    const result = FC.nutrition.calculate(effectiveNutritionProfile());
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
    const result=FC.nutrition.calculate(effectiveNutritionProfile());
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
      const body=mealEntries.length ? mealEntries.map(entry=>`<div class="meal-entry"><div class="meal-entry-copy"><strong>${escapeHtml(entry.name)}</strong><div class="sub">${entry.calories.toLocaleString()} kcal${entry.proteinGrams ? ` · ${entry.proteinGrams.toLocaleString()} g protein` : ""}${entry.carbohydrateGrams ? ` · ${entry.carbohydrateGrams.toLocaleString()} g carbs` : ""}</div></div><div class="meal-entry-actions"><button class="secondary edit-food" type="button" data-id="${escapeHtml(entry.id)}">Edit</button><button class="danger delete-food" type="button" data-id="${escapeHtml(entry.id)}" aria-label="Delete ${escapeHtml(entry.name)}">Delete</button></div></div>`).join("") : `<p class="empty-food">No entries</p>`;
      return `<section class="card meal-section${mealEntries.length ? "" : " is-empty"}"><div class="meal-header"><div><h2>${meal}</h2><span class="sub">${total.calories.toLocaleString()} kcal</span></div><button class="add-food" type="button" data-meal="${meal}" aria-label="Add food to ${meal}">Add</button></div>${body}</section>`;
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
    const progressBox=progress.closest(".calorie-ring");
    const circumference=2*Math.PI*50;
    const percentageText=document.getElementById("caloriePercentage");
    const remainingText=document.getElementById("calorieRemaining");
    consumed.textContent=totals.calories.toLocaleString();
    if (target===null) {
      targetText.textContent="Complete nutrition profile in Settings";
      status.textContent="Complete your nutrition profile to unlock target-based progress.";
      percentageText.textContent="—";
      remainingText.textContent="Profile needed";
      progress.style.strokeDashoffset=String(circumference);
      progressBox.setAttribute("aria-valuenow","0");
      progressBox.setAttribute("aria-valuetext",`${totals.calories.toLocaleString()} kilocalories consumed; nutrition profile incomplete; target, remaining calories, and percentage unavailable`);
      progressBox.classList.remove("is-over");
      document.getElementById("completeNutritionProfile").hidden=false;
    } else {
      const remaining=Math.max(0,target-totals.calories);
      const over=Math.max(0,totals.calories-target);
      const percentage=Math.round(totals.calories/target*100);
      targetText.textContent=`Target ${target.toLocaleString()} kcal`;
      status.textContent=over>0 ? `${over.toLocaleString()} kcal above today’s estimate. Your overall pattern matters more than one day.` : `${remaining.toLocaleString()} kcal remaining · ${percentage}% used`;
      percentageText.textContent=`${percentage}%`;
      remainingText.textContent=over>0 ? `${over.toLocaleString()} kcal over` : `${remaining.toLocaleString()} kcal remaining`;
      status.classList.toggle("over-target",over>0);
      progress.style.strokeDashoffset=String(circumference*(1-Math.min(100,percentage)/100));
      progressBox.setAttribute("aria-valuenow",String(Math.min(100,percentage)));
      progressBox.setAttribute("aria-valuetext",over>0 ? `${totals.calories.toLocaleString()} kilocalories consumed; target ${target.toLocaleString()} kilocalories; ${percentage}% complete; ${over.toLocaleString()} kilocalories over target` : `${totals.calories.toLocaleString()} kilocalories consumed; target ${target.toLocaleString()} kilocalories; ${percentage}% complete; ${remaining.toLocaleString()} kilocalories remaining`);
      progressBox.classList.toggle("is-over",over>0);
      document.getElementById("completeNutritionProfile").hidden=true;
    }
    const proteinTarget=Number(nutrition.proteinTargetGrams)>0 ? Number(nutrition.proteinTargetGrams) : null;
    const fibreTarget=Number(nutrition.fibreTargetGrams)>0 ? Number(nutrition.fibreTargetGrams) : null;
    function macroProgress(value,goal) {
      if (!goal) return "";
      const percent=Math.min(100,Math.round(value/goal*100));
      return `<span class="mini-progress" role="progressbar" aria-label="${percent}% complete" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><i style="width:${percent}%"></i></span>`;
    }
    document.getElementById("todayMacroTotals").innerHTML=`<div class="macro-primary"><span>Protein</span><strong>${totals.proteinGrams.toLocaleString()}${proteinTarget ? ` / ${proteinTarget.toLocaleString()}` : ""} g</strong>${macroProgress(totals.proteinGrams,proteinTarget)}</div><div class="macro-quiet"><span>Carbohydrates</span><strong>${totals.carbohydrateGrams.toLocaleString()} g</strong></div><div class="macro-quiet"><span>Fat</span><strong>${totals.fatGrams.toLocaleString()} g</strong></div><div class="macro-primary"><span>Fibre</span><strong>${totals.fibreGrams.toLocaleString()}${fibreTarget ? ` / ${fibreTarget.toLocaleString()}` : ""} g</strong>${macroProgress(totals.fibreGrams,fibreTarget)}</div>`;
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
    return FC.storage.getWeights();
  }

  function latestWeightKg() {
    const weights = getWeights();
    return weights.length ? Number(weights[weights.length-1].weight) : null;
  }

  function effectiveNutritionProfile() {
    return {...FC.state.settings.nutrition,currentWeightKg:latestWeightKg(),goalWeightKg:FC.state.settings.profile.goalWeightKg};
  }

  function renderNutritionSummary() {
    const result = FC.nutrition.calculate(effectiveNutritionProfile());
    renderTodayNutrition();
    return result;
  }

  function renderProgress() {
    const weights = getWeights();
    const start = FC.state.settings.profile.startingWeightKg;
    const goal = FC.state.settings.profile.goalWeightKg;
    const latest = latestWeightKg();
    const hasCurrent=latest!==null,hasGoal=goal!==null,hasStart=start!==null;
    const current=document.getElementById("currentWeight"),currentUnit=document.getElementById("currentWeightUnit"),display=document.getElementById("currentWeightDisplay");
    current.textContent=hasCurrent ? formatWeight(latest) : "Not set";
    currentUnit.textContent=unitLabel();
    currentUnit.hidden=!hasCurrent;
    display.setAttribute("aria-label",hasCurrent ? `Current weight ${formatWeight(latest)} ${unitLabel()}` : "Current weight not set");
    const goalBadge=document.getElementById("weightGoalSummary");
    goalBadge.hidden=!hasGoal;
    goalBadge.textContent=hasGoal ? `Goal ${formatWeight(goal)} ${unitLabel()}` : "";
    const canShowProgress=hasCurrent&&hasGoal&&hasStart&&start!==goal;
    const progressTrack=document.getElementById("weightProgressTrack");
    progressTrack.hidden=!canShowProgress;
    progressTrack.setAttribute("aria-hidden",String(!canShowProgress));
    document.getElementById("weightProgress").style.width=canShowProgress ? Math.max(0,Math.min(100,((start-latest)/(start-goal))*100))+"%" : "0%";
    document.getElementById("weightMessage").textContent=!hasCurrent ? "Log your first weight to begin tracking." : !hasGoal ? "Add a goal weight to track progress." : `${formatWeight(Math.max(0,latest-goal))} ${unitLabel()} remaining`;
    const change=weights.length>1 ? latest-weights[weights.length-2].weight : null;
    document.getElementById("weightChange").textContent = weights.length===0 ? "" : change===null ? "Add another weigh-in to reveal your trend" : `${change>0 ? "+" : ""}${formatWeight(change)} ${unitLabel()} since last entry`;
    document.getElementById("weightHistory").innerHTML = weights.slice().reverse().map(entry=>
      `<div class="row" style="padding:8px 0;border-top:1px solid var(--line)"><span>${entry.date}</span><strong>${formatWeight(entry.weight)} ${unitLabel()}</strong></div>`
    ).join("");
    drawChart(weights);
    drawWeightSparkline(weights);
  }

  function drawWeightSparkline(weights) {
    const canvas=document.getElementById("weightSparkline");
    const context=canvas.getContext("2d");
    context.clearRect(0,0,canvas.width,canvas.height);
    canvas.hidden=weights.length<2;
    if (weights.length<2) return;
    const values=weights.slice(-8).map(entry=>Number(entry.weight));
    const min=Math.min(...values),max=Math.max(...values),range=Math.max(1,max-min);
    const styles=getComputedStyle(document.documentElement);
    context.strokeStyle=styles.getPropertyValue("--accent").trim();
    context.fillStyle=styles.getPropertyValue("--card-solid").trim();
    context.lineWidth=4;
    context.lineJoin="round";
    const points=values.map((value,index)=>({x:8+index/(values.length-1)*(canvas.width-16),y:10+(max-value)/range*(canvas.height-20)}));
    context.beginPath();
    points.forEach((point,index)=>index ? context.lineTo(point.x,point.y) : context.moveTo(point.x,point.y));
    context.stroke();
    points.forEach(point=>{context.beginPath();context.arc(point.x,point.y,4,0,Math.PI*2);context.fill();context.stroke();});
  }

  function drawChart(weights) {
    const canvas = document.getElementById("weightChart");
    const context = canvas.getContext("2d");
    const styles = getComputedStyle(document.documentElement);
    const chartInk = styles.getPropertyValue("--ink").trim();
    const chartLine = styles.getPropertyValue("--line").trim();
    const chartMuted = styles.getPropertyValue("--muted").trim();
    context.clearRect(0,0,canvas.width,canvas.height);
    const pad=42, width=canvas.width-pad*2, height=canvas.height-pad*2;
    context.strokeStyle=chartLine;
    context.lineWidth=1;
    for (let index=0;index<=4;index++) {
      const y=pad+height*(index/4);
      context.beginPath();context.moveTo(pad,y);context.lineTo(pad+width,y);context.stroke();
    }
    context.beginPath();
    context.moveTo(pad,pad);
    context.lineTo(pad,pad+height);
    context.lineTo(pad+width,pad+height);
    context.stroke();
    const chartMessage=document.getElementById("weightChartMessage");
    if (!weights.length) { chartMessage.textContent="Log your first weight to begin a trend."; return; }
    chartMessage.textContent=weights.length===1 ? "Add another weigh-in to reveal your weight trend." : `${weights.length} recorded weigh-ins shown without interpolated values.`;
    const values = weights.map(entry=>entry.weight);
    const referenceValues=[...values,FC.state.settings.profile.goalWeightKg,FC.state.settings.profile.startingWeightKg].filter(value=>Number.isFinite(Number(value))&&Number(value)>0).map(Number);
    const min = Math.min(...referenceValues)-2;
    const max = Math.max(...referenceValues)+2;
    const points = weights.map((entry,index)=>({
      x: pad + (weights.length===1 ? .5 : index/(weights.length-1))*width,
      y: pad + (max-entry.weight)/(max-min)*height
    }));
    if (points.length>1) {
      context.strokeStyle=styles.getPropertyValue("--accent").trim();
      context.lineWidth=4;
      context.lineJoin="round";
      context.beginPath();
      points.forEach((point,index)=>index===0 ? context.moveTo(point.x,point.y) : context.lineTo(point.x,point.y));
      context.stroke();
    }
    context.fillStyle=styles.getPropertyValue("--card-solid").trim();
    context.strokeStyle=styles.getPropertyValue("--accent").trim();
    context.lineWidth=3;
    points.forEach(point=>{
      context.beginPath();
      context.arc(point.x,point.y,6,0,Math.PI*2);
      context.fill();context.stroke();
    });
    context.fillStyle=chartMuted;
    context.font="12px -apple-system";
    context.fillText(toDisplayWeight(max).toFixed(0)+" "+unitLabel(),2,pad+4);
    context.fillText(toDisplayWeight(min).toFixed(0)+" "+unitLabel(),2,pad+height);
  }

  function renderWater() {
    document.getElementById("waterCount").textContent=water;
    document.getElementById("waterSteps").innerHTML=Array.from({length:8},(_,index)=>`<span class="water-step${index<Math.min(water,8) ? " is-filled" : ""}"></span>`).join("");
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
    if (viewId==="today" || viewId==="calendar") requestAnimationFrame(()=>refreshTimelines());
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
    const current=latestWeightKg(),goal=settings.profile.goalWeightKg;
    const weightSummary=current!==null&&goal!==null ? `${compactWeight(current)} ${unitLabel()} → ${compactWeight(goal)} ${unitLabel()}` : current!==null ? `${compactWeight(current)} ${unitLabel()}` : goal!==null ? `Goal ${compactWeight(goal)} ${unitLabel()}` : "";
    document.getElementById("headerSummary").textContent = [weightSummary,calorieSummary,`${protocol} schedule`].filter(Boolean).join(" · ");
    const weightInput = document.getElementById("weightInput");
    weightInput.placeholder = settings.profile.weightUnit==="lb" ? "e.g. 247.8" : "e.g. 112.4";
    weightInput.min = settings.profile.weightUnit==="lb" ? "40" : "18";
    weightInput.max = settings.profile.weightUnit==="lb" ? "700" : "318";
  }

  function refreshForSettings() {
    FC.theme.apply();
    renderSchedule();
    renderWeek();
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
  document.getElementById("openProgressFromWeight").addEventListener("click",()=>{ activateView("progress"); document.getElementById("weightInput").focus(); });
  document.getElementById("editScheduleFromToday").addEventListener("click",()=>FC.settings.openSchedule());
  document.addEventListener("click",event=>{ if (event.target.closest(".edit-schedule-empty")) FC.settings.openSchedule(); });
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
    if (FC.state.settings.profile.startingWeightKg===null) FC.state.settings.profile.startingWeightKg=weightKg;
    FC.state.settings.nutrition.currentWeightKg=weightKg;
    FC.storage.saveSettings(FC.state.settings);
    document.getElementById("weightInput").value="";
    renderProgress(); renderSettingsSummary();
  });
  document.querySelectorAll(".tab").forEach(button=>button.addEventListener("click",()=>activateView(button.dataset.view)));
  document.querySelectorAll("#weekCalendar details").forEach(details=>details.addEventListener("toggle",()=>requestAnimationFrame(()=>refreshTimelines())));
  window.addEventListener("resize",()=>{
    cancelAnimationFrame(timelineResizeFrame);
    timelineResizeFrame=requestAnimationFrame(()=>refreshTimelines());
  });
  document.addEventListener("visibilitychange",()=>{ if (!document.hidden) refreshTimelines(); });

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

  FC.timeline = {
    timeToMinutes,
    localDateKey,
    refresh:refreshTimelines
  };

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
  renderSchedule();
  renderWeek();
  requestAnimationFrame(()=>refreshTimelines());
  scheduleTimelineRefresh();
  renderWorkout();
  renderWater();
  renderFoodScreen();
  refreshForSettings();
})(window.FastingCoach = window.FastingCoach || {});
