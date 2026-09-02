(() => {
  "use strict";

  const THEME_KEY = "theme";
  const themeToggle = document.querySelector("#theme-toggle");
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  const themeColors = {
    dark: "#191b2a",
    light: "#eef0f5"
  };

  function currentTheme() {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
  }

  function syncThemeUI(theme) {
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", themeColors[theme]);
    }

    if (themeToggle) {
      const nextTheme = theme === "dark" ? "light" : "dark";
      themeToggle.setAttribute(
        "aria-label",
        `Switch to ${nextTheme} mode`
      );
      themeToggle.setAttribute(
        "title",
        `Switch to ${nextTheme} mode`
      );
    }
  }

  function applyTheme(theme, persist = true) {
    const safeTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = safeTheme;
    syncThemeUI(safeTheme);

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, safeTheme);
      } catch {
        // Theme switching still works if storage is unavailable.
      }
    }
  }

  syncThemeUI(currentTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }

  const websiteLink = document.querySelector("#website-link");
  const websiteMessage = document.querySelector("#website-message");

  function hideWebsiteMessage() {
    if (!websiteMessage) return;

    websiteMessage.classList.remove("is-visible");
    window.setTimeout(() => {
      if (!websiteMessage.classList.contains("is-visible")) {
        websiteMessage.textContent = "";
      }
    }, 180);
  }

  function showWebsiteMessage() {
    if (!websiteMessage) return;

    websiteMessage.textContent = "Surprise! You’re already here.";
    websiteMessage.classList.add("is-visible");
  }

  if (websiteLink && websiteMessage) {
    websiteLink.addEventListener("click", (event) => {
      event.stopPropagation();

      if (websiteMessage.classList.contains("is-visible")) {
        hideWebsiteMessage();
        return;
      }

      showWebsiteMessage();
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".website-item")) {
        hideWebsiteMessage();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        hideWebsiteMessage();
      }
    });
  }
})();
