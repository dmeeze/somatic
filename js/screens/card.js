/**
 * card.js — Full-screen communication card.
 *
 * Exports:
 *   show(urgencyLevel, selectedNeeds, somethingElseText)
 *   hide()
 */

let _wakeLock = null;
let _onClose = null;

/**
 * Show the communication card.
 *
 * @param {object} urgencyLevel - { id, label, icon }
 * @param {object[]} selectedNeeds - Array of NeedCard objects (0–3)
 * @param {string} somethingElseText - Custom text for the "Something else" card
 * @param {function(): void} onClose - Called when the card is dismissed
 */
export function show(urgencyLevel, selectedNeeds, somethingElseText, onClose) {
  _onClose = onClose;

  const section = document.getElementById('card');
  section.innerHTML = '';
  section.className = 'screen screen--card active';

  // ── Close button (top-right) ─────────────────────────────────────────────
  const closeTopBtn = document.createElement('button');
  closeTopBtn.className = 'card-close-top';
  closeTopBtn.setAttribute('aria-label', 'Close card');
  closeTopBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
  closeTopBtn.addEventListener('click', hide);

  // ── Urgency block ─────────────────────────────────────────────────────────
  const urgencyBlock = document.createElement('div');
  urgencyBlock.className = 'card-urgency';

  const urgencyIcon = document.createElement('i');
  urgencyIcon.className = `card-urgency-icon ${urgencyLevel.icon}`;
  urgencyIcon.setAttribute('aria-hidden', 'true');

  const urgencyLabel = document.createElement('p');
  urgencyLabel.className = 'card-urgency-label';
  urgencyLabel.textContent = urgencyLevel.label;

  urgencyBlock.appendChild(urgencyIcon);
  urgencyBlock.appendChild(urgencyLabel);

  // ── Needs list ────────────────────────────────────────────────────────────
  const needsList = document.createElement('ul');
  needsList.className = 'card-needs';
  if (selectedNeeds.length > 3) needsList.classList.add('card-needs--columns');

  if (selectedNeeds.length === 0) {
    needsList.classList.add('card-needs--empty');
  } else {
    selectedNeeds.forEach(need => {
      const li = document.createElement('li');
      li.className = 'card-need-item';

      const icon = document.createElement('i');
      icon.className = `card-need-icon ${need.icon}`;
      icon.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.className = 'card-need-label';
      label.textContent = need.isSomethingElse && somethingElseText
        ? somethingElseText
        : need.label;

      li.appendChild(icon);
      li.appendChild(label);
      needsList.appendChild(li);
    });
  }

  // ── Assemble ──────────────────────────────────────────────────────────────
  section.appendChild(closeTopBtn);
  section.appendChild(urgencyBlock);
  section.appendChild(needsList);

  // Stop taps on the card body from doing anything
  section.addEventListener('click', _stopBodyClick);

  // Navigate to #card
  window.location.hash = 'card';

  // Request wake lock
  _acquireWakeLock();
}

/**
 * Hide the communication card and return to home.
 * Pass navigate=false when called from the router (avoids a redundant hashchange).
 */
export function hide(navigate = true) {
  const section = document.getElementById('card');
  section.removeEventListener('click', _stopBodyClick);

  _releaseWakeLock();

  if (_onClose) {
    _onClose();
    _onClose = null;
  }

  if (navigate) window.location.hash = 'home';
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _stopBodyClick(e) {
  // Allow clicks on the close buttons themselves
  if (e.target.closest('.card-close-top') || e.target.closest('.card-close-bottom')) return;
  // Block everything else
  e.stopPropagation();
}

async function _acquireWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      _wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch {
    // Degrade silently — wake lock unavailable or denied
  }
}

function _releaseWakeLock() {
  if (_wakeLock) {
    _wakeLock.release().catch(() => {});
    _wakeLock = null;
  }
}
