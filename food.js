(function (FC) {
  "use strict";

  const MEALS = ["Breakfast","Lunch","Dinner","Snacks"];
  const MAX = { calories: 20000, proteinGrams: 1000, carbohydrateGrams: 2000, fatGrams: 1000, fibreGrams: 500 };

  function isValidDateKey(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
    const [year,month,day]=value.split("-").map(Number);
    const date=new Date(Date.UTC(year,month-1,day));
    return date.getUTCFullYear()===year && date.getUTCMonth()===month-1 && date.getUTCDate()===day;
  }

  function finiteNumber(value) {
    if (value===null || value==="" || value===undefined) return null;
    const number=Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function validate(input) {
    const errors={};
    const name=String(input.name || "").trim();
    if (!name) errors.name="Enter a food or meal name.";
    else if (name.length>120) errors.name="Keep the name to 120 characters or fewer.";
    const values={};
    ["calories","proteinGrams","carbohydrateGrams","fatGrams","fibreGrams"].forEach(field=>{
      const optional=field!=="calories";
      const raw=input[field];
      const number=finiteNumber(raw);
      if (optional && (raw==="" || raw===null || raw===undefined)) values[field]=0;
      else if (number===null || number<(optional ? 0 : Number.MIN_VALUE)) errors[field]=optional ? "Enter zero or a positive number." : "Calories must be greater than zero.";
      else if (number>MAX[field]) errors[field]=`Enter ${MAX[field].toLocaleString()} or less.`;
      else values[field]=number;
    });
    if (!MEALS.includes(input.meal)) errors.meal="Choose a meal.";
    return { valid:Object.keys(errors).length===0, errors, value:{...values,name,meal:input.meal} };
  }

  function isValidStoredEntry(entry,date) {
    if (!entry || typeof entry!=="object" || Array.isArray(entry) || typeof entry.id!=="string" || !entry.id || entry.id.length>200 || entry.date!==date || typeof entry.createdAt!=="string" || typeof entry.updatedAt!=="string" || !Number.isFinite(Date.parse(entry.createdAt)) || !Number.isFinite(Date.parse(entry.updatedAt))) return false;
    const result=validate(entry);
    return result.valid && ["calories","proteinGrams","carbohydrateGrams","fatGrams","fibreGrams"].every(field=>typeof entry[field]==="number");
  }

  function totals(entries) {
    const result={calories:0,proteinGrams:0,carbohydrateGrams:0,fatGrams:0,fibreGrams:0,meals:{}};
    MEALS.forEach(meal=>result.meals[meal]={calories:0,count:0});
    entries.forEach(entry=>{
      ["calories","proteinGrams","carbohydrateGrams","fatGrams","fibreGrams"].forEach(field=>result[field]+=entry[field]);
      result.meals[entry.meal].calories+=entry.calories;
      result.meals[entry.meal].count++;
    });
    return result;
  }

  function createId() {
    return globalThis.crypto && typeof globalThis.crypto.randomUUID==="function" ? globalThis.crypto.randomUUID() : `food-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  FC.food={MEALS,MAX,isValidDateKey,validate,isValidStoredEntry,totals,createId};
})(window.FastingCoach = window.FastingCoach || {});
