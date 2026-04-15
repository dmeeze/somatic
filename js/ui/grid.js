/**
 * grid.js — Needs grid with selection logic, 3-need FIFO cap, and FIFO warning.
 */

/**
 * Mount the needs grid into a container.
 *
 * @param {HTMLElement} container
 * @param {object[]} needs - Array of NeedCard objects
 * @param {object} session - Current session state (read-only snapshot)
 * @param {object} callbacks
 * @param {function(string): void} callbacks.onSelect - Called when a normal need is toggled
 * @param {function(): void} callbacks.onSomethingElse - Called when "Something else" is tapped
 * @param {function(string): void} callbacks.onFifoWarning - Called first time cap is hit (for snackbar)
 */
export function mountGrid(container, needs, session, callbacks) {
  container.innerHTML = '';
  container.className = 'needs-grid';

  const enabledNeeds = needs.filter(n => n.enabled);

  enabledNeeds.forEach(need => {
    const card = document.createElement('button');
    card.className = 'need-card';
    card.dataset.needId = need.id;
    card.type = 'button';
    card.setAttribute('aria-pressed', 'false');

    const icon = document.createElement('i');
    icon.className = `need-card-icon ${need.icon}`;
    icon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'need-card-label';
    label.textContent = need.label;

    card.appendChild(icon);
    card.appendChild(label);
    container.appendChild(card);

    if (need.isSomethingElse) {
      card.dataset.somethingElse = 'true';
    }

    card.addEventListener('click', () => {
      if (need.isSomethingElse) {
        callbacks.onSomethingElse();
      } else {
        callbacks.onSelect(need.id);
      }
    });
  });
}

/**
 * Update the visual selected state of all need cards.
 * Call this after any session state change.
 *
 * @param {HTMLElement} container
 * @param {string[]} selectedNeedIds
 */
export function updateGridSelection(container, selectedNeedIds) {
  const cards = container.querySelectorAll('.need-card');
  cards.forEach(card => {
    const isSelected = selectedNeedIds.includes(card.dataset.needId);
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', String(isSelected));
  });
}

/**
 * Update the label on the "Something else" card to show custom text.
 *
 * @param {HTMLElement} container
 * @param {string} text - Custom text, or empty string to reset to default
 */
export function updateSomethingElseLabel(container, text) {
  const card = container.querySelector('[data-something-else="true"]');
  if (!card) return;
  const labelEl = card.querySelector('.need-card-label');
  if (labelEl) {
    labelEl.textContent = text ? `Something else: ${text}` : 'Something else\u2026';
  }
}

/**
 * Toggle a need in/out of the selection. No cap — all needs can be selected.
 *
 * @param {string} needId
 * @param {string[]} currentSelected
 * @returns {string[]} new selection array
 */
export function toggleNeedSelection(needId, currentSelected) {
  if (currentSelected.includes(needId)) {
    return currentSelected.filter(id => id !== needId);
  }
  return [...currentSelected, needId];
}
