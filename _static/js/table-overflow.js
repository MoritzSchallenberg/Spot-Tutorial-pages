/* Tables that genuinely overflow their column become a labelled, keyboard
   focusable scroll region with a visible hint; tables that fit are left
   untouched. Long code literals get line-break opportunities after "/", "_"
   and "::" so they wrap at natural points instead of mid-word. */
(function () {
  'use strict';

  function addBreakHints() {
    var codes = document.querySelectorAll('.rst-content table code.literal, .rst-content code.literal');
    codes.forEach(function (code) {
      if (code.dataset.wbr || code.children.length || code.textContent.length < 14) return;
      code.dataset.wbr = '1';
      var parts = code.textContent.split(/(?<=[\/_])|(?=::)|(?<=::)|(?<=→)/);
      code.textContent = '';
      parts.forEach(function (part, i) {
        if (i) code.appendChild(document.createElement('wbr'));
        code.appendChild(document.createTextNode(part));
      });
    });
  }

  function headingFor(el) {
    var cur = el;
    while (cur && cur !== document.body) {
      var prev = cur.previousElementSibling;
      while (prev) {
        var h = prev.matches('h1,h2,h3,h4,h5,h6') ? prev : prev.querySelector('h1,h2,h3,h4,h5,h6');
        if (h) return h.textContent.replace(/[¶\s]+$/, '').trim();
        prev = prev.previousElementSibling;
      }
      cur = cur.parentElement;
    }
    return document.title;
  }

  function update() {
    document.querySelectorAll('.rst-content .wy-table-responsive').forEach(function (wrap) {
      var scrolls = wrap.scrollWidth > wrap.clientWidth + 1;
      var hint = wrap.previousElementSibling;
      var hasHint = hint && hint.classList.contains('table-scroll-hint');
      if (scrolls) {
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('role', 'region');
        wrap.setAttribute('aria-label', 'Table: ' + headingFor(wrap) + ' (horizontally scrollable)');
        if (!hasHint) {
          var p = document.createElement('p');
          p.className = 'table-scroll-hint';
          p.textContent = 'Horizontally scrollable table →';
          wrap.parentNode.insertBefore(p, wrap);
        }
      } else {
        wrap.removeAttribute('tabindex');
        wrap.removeAttribute('role');
        wrap.removeAttribute('aria-label');
        if (hasHint) hint.remove();
      }
    });
  }

  function init() {
    addBreakHints();
    update();
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(update, 150);
    });
    window.addEventListener('load', update);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
