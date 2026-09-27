/* Light / dark mode switcher: respects the OS preference on first visit,
   remembers an explicit choice in localStorage and exposes it as
   `data-theme` on <html>, which custom.css keys its dark rules off. */

(function () {
  'use strict';

  var STORAGE_KEY = 'lrcc-theme';
  var DARK = 'dark';
  var LIGHT = 'light';

  /* localStorage is unavailable in some privacy modes -- degrade gracefully. */
  function readStored() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function writeStored(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      /* ignore -- the toggle still works for the current page view */
    }
  }

  function prefersDark() {
    return (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }

  function currentTheme() {
    return readStored() || (prefersDark() ? DARK : LIGHT);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /* Apply immediately, before the DOM is ready, to avoid a flash of the
     wrong theme. */
  applyTheme(currentTheme());

  /* Set by buildSwitcher(); re-renders the button icon and labels. */
  var refreshSwitcher = function () {};

  function buildSwitcher() {
    if (document.getElementById('lrcc-theme-switcher')) {
      return;
    }

    var button = document.createElement('button');
    button.id = 'lrcc-theme-switcher';
    button.className = 'lrcc-theme-switcher';
    button.setAttribute('type', 'button');

    function refresh() {
      var isDark = document.documentElement.getAttribute('data-theme') === DARK;
      button.textContent = isDark ? '☀' : '☽'; /* sun / moon */
      var label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }

    button.addEventListener('click', function () {
      var next =
        document.documentElement.getAttribute('data-theme') === DARK
          ? LIGHT
          : DARK;
      applyTheme(next);
      writeStored(next);
      refresh();
    });

    refreshSwitcher = refresh;
    refresh();
    document.body.appendChild(button);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildSwitcher);
  } else {
    buildSwitcher();
  }

  /* Follow the OS setting as long as the visitor has not chosen explicitly. */
  if (window.matchMedia) {
    var query = window.matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (event) {
      if (readStored()) {
        return; /* an explicit choice always wins */
      }
      applyTheme(event.matches ? DARK : LIGHT);
      refreshSwitcher();
    };
    if (query.addEventListener) {
      query.addEventListener('change', onChange);
    } else if (query.addListener) {
      query.addListener(onChange);
    }
  }
})();
