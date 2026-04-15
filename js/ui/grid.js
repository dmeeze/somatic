/**
 * grid.js — Needs grid with selection logic.
 * "Something else" is no longer rendered here — it lives in the bottom bar.
 */

/**
 * Mount the needs grid into a container.
 *
 * @param {HTMLElement} container
 * @param {object[]} needs - Array of NeedCard objects
 * @param {object} session - Current session state (read-only snapshot)
 * @param {object} callbacks
 * @param {function(string): void} callbacks.onSelect - Called when a need is toggled
 */
export function mountGrid(container, needs, session, callbacks) {
  container.innerHTML = '';
  container.className = 'needs-grid';

  const enabledNeeds = needs.filter(n => n.enabled && !n.isSomethingElse);

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

    card.addEventListener('click', () => callbacks.onSelect(need.id));
  });
}

/**
 * Update the visual selected state of all need cards.
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
 * Toggle a need in/out of the selection.
 * @param {string} needId
 * @param {string[]} currentSelected
 * @returns {string[]}
 */
export function toggleNeedSelection(needId, currentSelected) {
  if (currentSelected.includes(needId)) {
    return currentSelected.filter(id => id !== needId);
  }
  return [...currentSelected, needId];
}
