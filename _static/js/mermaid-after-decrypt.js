/* ==========================================================================
   Re-run Mermaid after a StatiCrypt decrypt.

   sphinxcontrib-mermaid renders every `.mermaid`/`pre.mermaid` block once,
   on the page's "load" event, and exposes that render function globally as
   `window.runMermaid` (see its own default.js.j2 template). StatiCrypt
   protects the whole page by replacing the visible document with a
   password form and only writing the real page content in afterwards (via
   `document.write`), either once the password is submitted or immediately
   on page load if it is auto-restored from a "remember me" flag.

   Both cases were tried and rejected before this one:
     - Re-triggering on every DOM mutation with `runMermaid(false)` fired
       many times in quick succession and left diagrams marked internally
       as handled without ever actually drawing an SVG.
     - Waiting for the window's "load" event before polling seemed right
       (it is the same event sphinxcontrib-mermaid's own script waits
       for), but measurement showed it does not fire reliably after
       StatiCrypt's document.write(): on a "remember me" auto-unlock,
       document.readyState does reach "complete", yet no "load" event is
       ever dispatched to any listener -- including sphinxcontrib-mermaid's
       own, which then also never runs. A manual password submission
       appeared to work only by accident: the placeholder gate page's own
       one-time "load" had already started this script's poll loop before
       the user finished typing, and the loop was still running (well
       within its bounded attempt budget) by the time the real content
       landed a few seconds later.

   Depending on "load" is therefore not reliable here at all. Polling
   document.readyState directly sidesteps it: that property does keep
   reflecting reality even when the event that is supposed to announce it
   does not fire.
   ========================================================================== */

(function () {
  'use strict';

  function hasUnrenderedMermaidBlocks() {
    var blocks = document.querySelectorAll('.mermaid, pre.mermaid');
    for (var i = 0; i < blocks.length; i++) {
      /* A block mermaid has already successfully drawn contains an <svg>
         child -- checking for that directly (rather than trusting a
         "data-processed" marker, which the block can carry even when
         nothing actually rendered) is what keeps this from re-triggering
         needlessly on a plain, non-gated page where mermaid's own render
         already succeeded before this poll's first tick. */
      if (!blocks[i].querySelector('svg')) {
        return true;
      }
    }
    return false;
  }

  var fired = false;
  var attempts = 0;
  var MAX_ATTEMPTS = 60; // 60 x 150ms = 9s, generous for a local decrypt/splice
  var completeSince = null;
  /* Once document.readyState first reads "complete", wait this long before
     acting -- mermaid's own render (window.addEventListener("load", ...))
     is async (awaits mermaid.run()) and is not safe to call concurrently
     with a second render pass. On an ordinary page "complete" is reached
     right as that render starts, so this buffer gives it room to finish
     before this script ever checks whether anything is still unrendered. */
  var SETTLE_MS = 900;

  function tick() {
    if (fired) return;
    attempts += 1;

    if (document.readyState === 'complete') {
      if (completeSince === null) {
        completeSince = Date.now();
      }
      var settled = Date.now() - completeSince >= SETTLE_MS;
      if (settled && typeof window.runMermaid === 'function' && hasUnrenderedMermaidBlocks()) {
        fired = true;
        /* rerun=true forces mermaid to (re-)draw from each block's stored
           source, rather than trusting whatever partial "already handled"
           state a block may be in after content was spliced into a live
           page -- the reliable choice here, unlike the incremental
           "only draw what's new" mode meant for normal page interactions. */
        window.runMermaid(true);
        return;
      }
    } else {
      completeSince = null;
    }

    if (attempts < MAX_ATTEMPTS) {
      setTimeout(tick, 150);
    }
  }

  tick();
})();
