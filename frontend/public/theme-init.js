(function () {
  try {
    var t = localStorage.getItem("studymind_theme");
    if (t === "light" || t === "dark") {
      document.documentElement.dataset.theme = t;
      document.documentElement.style.colorScheme = t;
    }
  } catch (e) {}
})();
