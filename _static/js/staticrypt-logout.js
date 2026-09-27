/* ==========================================================================
   "Log out" of a remembered StatiCrypt session.

   StatiCrypt's own "remember me" checkbox (enabled by default via this
   project's custom password template, see scripts/staticrypt/) stores a
   salted+hashed password in localStorage under two fixed keys --
   "staticrypt_passphrase" and "staticrypt_expiration" -- and uses them to
   silently re-decrypt every page on load, without a password prompt, for
   as long as the remembered entry has not expired. There is no built-in
   way to end that early; this button removes both keys and reloads the
   current page, which then has nothing to auto-decrypt with and falls
   back to the normal password prompt.

   Never touches, reads, or writes the actual password anywhere -- only
   StatiCrypt's own already-hashed localStorage entry, by name.

   The button only ever appears when a remembered entry actually exists,
   so it stays invisible by itself on an unencrypted build (a local
   preview, or this same script accidentally left on a page that was
   never behind the password gate) -- there is nothing to log out of
   there.
   ========================================================================== */

(function () {
  'use strict';

  var PASSPHRASE_KEY = 'staticrypt_passphrase';
  var EXPIRATION_KEY = 'staticrypt_expiration';

  function hasRememberedSession() {
    try {
      return window.localStorage.getItem(PASSPHRASE_KEY) !== null;
    } catch (e) {
      return false;
    }
  }

  function logOut() {
    try {
      window.localStorage.removeItem(PASSPHRASE_KEY);
      window.localStorage.removeItem(EXPIRATION_KEY);
    } catch (e) {
      /* localStorage unavailable -- nothing was remembered anyway */
    }
    window.location.reload();
  }

  function buildButton() {
    if (!hasRememberedSession() || document.getElementById('lrcc-staticrypt-logout')) {
      return;
    }

    var button = document.createElement('button');
    button.id = 'lrcc-staticrypt-logout';
    button.className = 'lrcc-staticrypt-logout';
    button.type = 'button';
    button.textContent = 'Log out';
    button.setAttribute('aria-label', 'Log out and forget the remembered password on this device');
    button.setAttribute('title', 'Log out and forget the remembered password on this device');
    button.addEventListener('click', logOut);

    document.body.appendChild(button);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildButton);
  } else {
    buildButton();
  }
})();
