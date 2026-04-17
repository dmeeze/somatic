/**
 * dialog.js — Custom need bottom-sheet + generic modal utility.
 */

// ─── Generic modal ───────────────────────────────────────────────────────────

/**
 * Show a simple alert-style modal with a single confirm button.
 * Returns a Promise that resolves when the user dismisses it.
 *
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.confirmLabel]
 * @returns {Promise<void>}
 */
export function showModal({ title, message, confirmLabel = 'OK' }) {
  return new Promise(resolve => {
    const overlay = _buildOverlay();
    const box = document.createElement('div');
    box.className = 'modal-box';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', title);

    const h2 = document.createElement('h2');
    h2.className = 'modal-title';
    h2.textContent = title;

    const p = document.createElement('p');
    p.className = 'modal-message';
    p.textContent = message;

    const btn = document.createElement('button');
    btn.className = 'btn btn-primary';
    btn.textContent = confirmLabel;
    btn.addEventListener('click', () => {
      _removeOverlay(overlay);
      resolve();
    });

    box.appendChild(h2);
    box.appendChild(p);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    btn.focus();
  });
}

/**
 * Show a confirm/cancel modal. Returns true if confirmed, false if cancelled.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.confirmLabel]
 * @param {string} [opts.danger] - if true, confirm button is styled red
 * @returns {Promise<boolean>}
 */
export function showConfirm({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise(resolve => {
    const overlay = _buildOverlay();
    const box = document.createElement('div');
    box.className = 'modal-box';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', title);

    const h2 = document.createElement('h2');
    h2.className = 'modal-title';
    h2.textContent = title;

    const p = document.createElement('p');
    p.className = 'modal-message';
    p.textContent = message;

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => { _removeOverlay(overlay); resolve(false); });

    const confirmBtn = document.createElement('button');
    confirmBtn.className = danger ? 'btn btn-danger' : 'btn btn-primary';
    confirmBtn.textContent = confirmLabel;
    confirmBtn.addEventListener('click', () => { _removeOverlay(overlay); resolve(true); });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    box.appendChild(h2);
    box.appendChild(p);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    confirmBtn.focus();
  });
}

// ─── Custom need bottom-sheet ────────────────────────────────────────────────

/**
 * Open the "Something else…" bottom-sheet.
 * Shows chips for any disabled needs, plus a text field for new needs.
 *
 * @param {object[]} disabledNeeds - needs with enabled: false (may be empty)
 * @returns {Promise<{needId: string, text: string, createNew: false}|{text: string, createNew: true}|null>}
 *   null = cancelled
 *   { needId, text, createNew: false } = picked an existing disabled need
 *   { text, createNew: true }          = typed a new need (caller should persist it)
 */
export function showSomethingElseSheet(disabledNeeds = []) {
  return new Promise(resolve => {
    const overlay = _buildOverlay('sheet-overlay');

    const sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'What do you need?');

    const handle = document.createElement('div');
    handle.className = 'sheet-handle';
    handle.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h2');
    title.className = 'sheet-title';
    title.textContent = 'Something else…';

    sheet.appendChild(handle);
    sheet.appendChild(title);

    // Chips for disabled needs
    if (disabledNeeds.length > 0) {
      const chipsTitle = document.createElement('p');
      chipsTitle.className = 'sheet-chips-title';
      chipsTitle.textContent = 'Choose from your other needs:';

      const chips = document.createElement('div');
      chips.className = 'sheet-chips';

      disabledNeeds.forEach(need => {
        const chip = document.createElement('button');
        chip.className = 'sheet-chip';
        chip.type = 'button';
        chip.innerHTML = `<i class="${need.icon}" aria-hidden="true"></i>${need.label}`;
        chip.addEventListener('click', () => close({ needId: need.id, text: need.label, createNew: false }));
        chips.appendChild(chip);
      });

      sheet.appendChild(chipsTitle);
      sheet.appendChild(chips);
    }

    // Divider / label
    const divider = document.createElement('p');
    divider.className = 'sheet-divider';
    divider.textContent = disabledNeeds.length > 0 ? 'Or type something new:' : 'Type what you need:';
    sheet.appendChild(divider);

    // Textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'sheet-textarea';
    textarea.rows = 2;
    textarea.placeholder = 'Type what you need…';
    textarea.setAttribute('aria-label', 'Describe what you need');
    textarea.maxLength = 200;

    textarea.addEventListener('input', () => {
      textarea.rows = 2;
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10) || 24;
      const rows = Math.min(4, Math.ceil(textarea.scrollHeight / lineHeight));
      textarea.rows = rows;
    });

    sheet.appendChild(textarea);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'sheet-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';

    const selectBtn = document.createElement('button');
    selectBtn.className = 'btn btn-primary';
    selectBtn.textContent = 'Add & select';
    selectBtn.type = 'button';

    actions.appendChild(cancelBtn);
    actions.appendChild(selectBtn);
    sheet.appendChild(actions);

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => textarea.focus());

    function close(result) {
      _removeOverlay(overlay);
      resolve(result);
    }

    cancelBtn.addEventListener('click', () => close(null));

    selectBtn.addEventListener('click', () => {
      const text = textarea.value.trim();
      if (text) close({ text, createNew: true });
    });

    overlay.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(null); }
    });
    overlay.addEventListener('click', e => {
      if (e.target === overlay) close(null);
    });
  });
}

// ─── Snackbar ────────────────────────────────────────────────────────────────

let _snackbarTimeout = null;

/**
 * Show a brief inline snackbar message.
 * Auto-dismisses after `duration` ms (default 3000).
 *
 * @param {string} message
 * @param {number} [duration]
 */
export function showSnackbar(message, duration = 3000) {
  // Remove any existing snackbar
  const existing = document.querySelector('.snackbar');
  if (existing) existing.remove();
  if (_snackbarTimeout) clearTimeout(_snackbarTimeout);

  const bar = document.createElement('div');
  bar.className = 'snackbar';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');
  bar.textContent = message;

  document.body.appendChild(bar);

  // Trigger enter animation on next frame
  requestAnimationFrame(() => bar.classList.add('snackbar--visible'));

  _snackbarTimeout = setTimeout(() => {
    bar.classList.remove('snackbar--visible');
    bar.addEventListener('transitionend', () => bar.remove(), { once: true });
  }, duration);
}

// ─── Private helpers ─────────────────────────────────────────────────────────

function _buildOverlay(extraClass = '') {
  const overlay = document.createElement('div');
  overlay.className = ['modal-overlay', extraClass].filter(Boolean).join(' ');
  return overlay;
}

function _removeOverlay(overlay) {
  overlay.classList.add('modal-overlay--closing');
  overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
  // Fallback in case animation doesn't fire
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 400);
}
