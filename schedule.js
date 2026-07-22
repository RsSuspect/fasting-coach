(function (FC) {
  "use strict";

  const WEEKDAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const SCHEMA_VERSION=1;
  const DEFAULT_FASTING_DAY={enabled:true,startTime:"20:00",endTime:"12:00"};
  const DEFAULT_EVENTS={
    0:[["08:00","Wake, hydrate"],["10:00","Grocery shopping"],["12:00","Lunch"],["14:00","Meal prep"],["15:30","Protein snack"],["19:00","Dinner"],["22:30","Sleep"]],
    1:[["07:00","Wake and drink 500 ml water"],["09:00","Work"],["12:00","Chicken Power Bowl"],["12:30","10-minute walk"],["15:30","Protein snack"],["18:30","Push workout"],["19:45","Lean Beef & Potatoes"],["22:30","Sleep"]],
    2:[["07:00","Wake and hydrate"],["09:00","Work"],["12:00","Lunch"],["15:30","Protein snack"],["18:30","45-minute brisk walk"],["19:30","Dinner"],["22:30","Sleep"]],
    3:[["07:00","Wake and drink 500 ml water"],["09:00","Work"],["12:00","Chicken Power Bowl"],["12:30","10-minute walk"],["15:30","Protein snack"],["18:30","Pull workout"],["19:45","Dinner"],["22:30","Sleep"]],
    4:[["07:00","Wake and hydrate"],["09:00","Work"],["12:00","Lunch"],["15:30","Protein snack"],["18:30","45-minute brisk walk"],["19:30","Dinner"],["22:30","Sleep"]],
    5:[["07:00","Wake and drink 500 ml water"],["09:00","Work"],["12:00","Chicken Power Bowl"],["12:30","10-minute walk"],["15:30","Protein snack"],["18:30","Leg workout"],["19:45","Dinner"],["22:30","Sleep"]],
    6:[["08:00","Wake and hydrate"],["12:00","Lunch"],["14:00","60-minute walk, swim, or cycle"],["15:30","Protein snack"],["19:00","Dinner"]]
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function timeToMinutes(value){
    const match=typeof value==="string" ? value.trim().match(/^(\d{2}):(\d{2})$/) : null;
    if(!match) return null;
    const hours=Number(match[1]),minutes=Number(match[2]);
    return hours>=0&&hours<24&&minutes>=0&&minutes<60 ? hours*60+minutes : null;
  }
  function createId(prefix="event"){
    return globalThis.crypto&&typeof globalThis.crypto.randomUUID==="function" ? globalThis.crypto.randomUUID() : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  function defaultSchedule(){
    const stamp="2026-07-22T00:00:00.000Z";
    const events=[];
    WEEKDAYS.forEach((_,day)=>DEFAULT_EVENTS[day].forEach(([time,name],index)=>events.push({id:`default-${day}-${time.replace(":","")}-${index}`,name,time,description:"",enabled:true,days:[day],createdAt:stamp,updatedAt:stamp})));
    return {version:SCHEMA_VERSION,events};
  }
  function validateEvent(input){
    const errors={};
    const name=String(input&&input.name||"").trim();
    const description=String(input&&input.description||"").trim();
    const time=String(input&&input.time||"").trim();
    const days=Array.isArray(input&&input.days) ? [...new Set(input.days.map(Number))].filter(day=>Number.isInteger(day)&&day>=0&&day<=6).sort((a,b)=>a-b) : [];
    if(!name) errors.name="Enter an event name."; else if(name.length>80) errors.name="Keep the event name to 80 characters or fewer.";
    if(description.length>160) errors.description="Keep the description to 160 characters or fewer.";
    if(timeToMinutes(time)===null) errors.time="Choose a valid time.";
    if(!days.length) errors.days="Choose at least one day.";
    return {valid:Object.keys(errors).length===0,errors,value:{name,time,description,enabled:input&&input.enabled!==false,days}};
  }
  function isValidStoredEvent(event){
    if(!event||typeof event!=="object"||Array.isArray(event)||typeof event.id!=="string"||!event.id||event.id.length>200||typeof event.enabled!=="boolean"||typeof event.createdAt!=="string"||typeof event.updatedAt!=="string"||!Number.isFinite(Date.parse(event.createdAt))||!Number.isFinite(Date.parse(event.updatedAt))) return false;
    return validateEvent(event).valid;
  }
  function isValidSchedule(value){ return !!value&&value.version===SCHEMA_VERSION&&Array.isArray(value.events)&&value.events.every(isValidStoredEvent); }
  function normaliseSchedule(value){ return isValidSchedule(value) ? clone(value) : defaultSchedule(); }
  function isValidFastingDay(value){ return !!value&&typeof value==="object"&&!Array.isArray(value)&&typeof value.enabled==="boolean"&&timeToMinutes(value.startTime)!==null&&timeToMinutes(value.endTime)!==null; }
  function defaultFastingSchedule(legacy={}){
    const source={enabled:legacy.enabled!==false,startTime:timeToMinutes(legacy.startTime)!==null?legacy.startTime:DEFAULT_FASTING_DAY.startTime,endTime:timeToMinutes(legacy.endTime)!==null?legacy.endTime:DEFAULT_FASTING_DAY.endTime};
    const days={}; WEEKDAYS.forEach((_,day)=>days[String(day)]={...source});
    return {version:SCHEMA_VERSION,days};
  }
  function isValidFastingSchedule(value){ return !!value&&value.version===SCHEMA_VERSION&&value.days&&typeof value.days==="object"&&!Array.isArray(value.days)&&WEEKDAYS.every((_,day)=>isValidFastingDay(value.days[String(day)])); }
  function normaliseFastingSchedule(value,legacy){ return isValidFastingSchedule(value)?clone(value):defaultFastingSchedule(legacy); }
  function fastingDuration(day){
    if(!isValidFastingDay(day)||!day.enabled) return 0;
    const start=timeToMinutes(day.startTime),end=timeToMinutes(day.endTime);
    return end>start ? end-start : 1440-start+end;
  }
  function isOvernight(day){ return isValidFastingDay(day)&&timeToMinutes(day.endTime)<=timeToMinutes(day.startTime); }
  function userEventsForDay(schedule,day){
    return normaliseSchedule(schedule).events.filter(event=>event.enabled&&event.days.includes(day)).map(event=>({...event,type:"user",minutes:timeToMinutes(event.time)}));
  }
  function hasEquivalentUserMarker(events,type,time){
    const pattern=type==="fast-start"?/^(begin fast|fast begins|fast starts)$/i:/^(end fast|fast ends)$/i;
    return events.some(event=>event.time===time&&pattern.test(event.name.trim()));
  }
  function eventsForDay(settings,day){
    const user=userEventsForDay(settings.schedule,day);
    const fasting=normaliseFastingSchedule(settings.fastingSchedule,settings.fasting);
    const generated=[];
    const current=fasting.days[String(day)];
    if(current.enabled){
      if(!hasEquivalentUserMarker(user,"fast-start",current.startTime)) generated.push({id:`fast-start-${day}`,name:"Fast begins",time:current.startTime,description:"Planned fasting window",enabled:true,days:[day],type:"fast-start",minutes:timeToMinutes(current.startTime)});
      if(!isOvernight(current)&&!hasEquivalentUserMarker(user,"fast-end",current.endTime)) generated.push({id:`fast-end-${day}`,name:"Fast ends",time:current.endTime,description:"Planned fasting window",enabled:true,days:[day],type:"fast-end",minutes:timeToMinutes(current.endTime)});
    }
    const previousDay=(day+6)%7,previous=fasting.days[String(previousDay)];
    if(previous.enabled&&isOvernight(previous)&&!hasEquivalentUserMarker(user,"fast-end",previous.endTime)) generated.push({id:`fast-end-${previousDay}-on-${day}`,name:"Fast ends",time:previous.endTime,description:"Planned fasting window",enabled:true,days:[day],type:"fast-end",minutes:timeToMinutes(previous.endTime)});
    return [...user,...generated].sort((a,b)=>a.minutes-b.minutes||String(a.createdAt||a.id).localeCompare(String(b.createdAt||b.id)));
  }
  function fastingStatus(fastingSchedule,now=new Date()){
    const schedule=normaliseFastingSchedule(fastingSchedule,{}),day=now.getDay(),minutes=now.getHours()*60+now.getMinutes(),current=schedule.days[String(day)],previous=schedule.days[String((day+6)%7)];
    if(previous.enabled&&isOvernight(previous)&&minutes<timeToMinutes(previous.endTime)) return {state:"fasting",message:`Planned fast ends at ${previous.endTime}`};
    if(current.enabled){
      const start=timeToMinutes(current.startTime),end=timeToMinutes(current.endTime);
      if((isOvernight(current)&&minutes>=start)||(!isOvernight(current)&&minutes>=start&&minutes<end)) return {state:"fasting",message:`Planned fast ends at ${current.endTime}${isOvernight(current)?" tomorrow":""}`};
      if(minutes<start) return {state:"before",message:`Planned fast begins at ${current.startTime}`};
      return {state:"after",message:"Today’s planned fasting window has ended"};
    }
    return {state:"disabled",message:"No fasting window is planned to begin today"};
  }

  FC.schedule={WEEKDAYS,SCHEMA_VERSION,timeToMinutes,createId,defaultSchedule,validateEvent,isValidStoredEvent,isValidSchedule,normaliseSchedule,defaultFastingSchedule,isValidFastingDay,isValidFastingSchedule,normaliseFastingSchedule,fastingDuration,isOvernight,eventsForDay,fastingStatus};
})(window.FastingCoach=window.FastingCoach||{});
