(function (FC) {
  "use strict";

  const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");

  function apply(theme=FC.state.settings.appearance.theme) {
    if (theme==="system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme",theme);
    const isDark = theme==="dark" || (theme==="system" && themeMedia.matches);
    document.querySelector('meta[name="theme-color"]').setAttribute("content",isDark ? "#0f172a" : "#111827");
  }

  const handleSystemThemeChange = ()=>{
    if (FC.state.settings.appearance.theme==="system") apply();
  };

  if (themeMedia.addEventListener) themeMedia.addEventListener("change",handleSystemThemeChange);
  else themeMedia.addListener(handleSystemThemeChange);

  FC.theme = { apply, media:themeMedia };
  apply();
})(window.FastingCoach = window.FastingCoach || {});
