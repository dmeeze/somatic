/**
 * home.js — Home screen: urgency slider + needs grid + Show Card button.
 */

import { mountSlider } from '../ui/slider.js';
import { mountGrid, updateGridSelection, toggleNeedSelection, updateSomethingElseLabel } from '../ui/grid.js';
import { showSomethingElseSheet } from '../ui/dialog.js';
import { saveConfig } from '../data/config.js';
import { getSession, updateSession } from '../data/config.js';
import { show as showCard } from './card.js';

/**
 * Mount the home screen.
 *
 * @param {object} config - AppConfig from getConfig()
 */
export function mountHome(config, onConfigChange) {
  const section = document.getElementById('home');
  const wasActive = section.classList.contains('active');
  section.innerHTML = '';
  section.className = 'screen screen--home' + (wasActive ? ' active' : '');

  // ── Settings button (bottom bar) ─────────────────────────────────────────
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'settings-btn';
  settingsBtn.setAttribute('aria-label', 'Open settings');
  settingsBtn.innerHTML = '<i class="fas fa-cog" aria-hidden="true"></i>';
  settingsBtn.addEventListener('click', () => {
    window.location.hash = 'settings';
  });

  // ── Slider region ────────────────────────────────────────────────────────
  const sliderRegion = document.createElement('section');
  sliderRegion.className = 'home-slider-region';
  sliderRegion.setAttribute('aria-label', 'Urgency level');

  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'slider-container';

  sliderRegion.appendChild(sliderContainer);

  // ── Needs region ─────────────────────────────────────────────────────────
  const needsRegion = document.createElement('section');
  needsRegion.className = 'home-needs-region';
  needsRegion.setAttribute('aria-label', 'Select needs');

  const needsHeading = document.createElement('h2');
  needsHeading.className = 'home-needs-heading';
  needsHeading.textContent = 'What do you need?';

  const gridContainer = document.createElement('div');
  gridContainer.className = 'grid-container';

  needsRegion.appendChild(needsHeading);
  needsRegion.appendChild(gridContainer);

  // ── Show Card button ─────────────────────────────────────────────────────
  const showCardBtn = document.createElement('button');
  showCardBtn.className = 'show-card-btn';
  showCardBtn.setAttribute('aria-label', 'Show communication card');
  showCardBtn.innerHTML = `
    <i class="fas fa-id-card" aria-hidden="true"></i>
    <span>Show</span>
  `;

  // ── Bottom bar: settings + show card ─────────────────────────────────────
  const bottomBar = document.createElement('div');
  bottomBar.className = 'home-bottom-bar';
  bottomBar.appendChild(settingsBtn);
  bottomBar.appendChild(showCardBtn);

  // ── Assemble ─────────────────────────────────────────────────────────────
  section.appendChild(sliderRegion);
  section.appendChild(needsRegion);
  section.appendChild(bottomBar);

  // ── Mount slider ─────────────────────────────────────────────────────────
  const session = getSession();

  mountSlider(
    sliderContainer,
    config.urgencyLevels,
    session.urgencyIndex,
    (newIndex) => {
      updateSession({ urgencyIndex: newIndex });
    }
  );

  // ── Mount needs grid ──────────────────────────────────────────────────────
  mountGrid(
    gridContainer,
    config.needs,
    getSession(),
    {
      onSelect(needId) {
        const s = getSession();
        const selected = toggleNeedSelection(needId, s.selectedNeedIds);
        updateSession({ selectedNeedIds: selected });
        updateGridSelection(gridContainer, selected);
      },

      async onSomethingElse() {
        const s = getSession();
        const somethingElseNeed = config.needs.find(n => n.isSomethingElse);
        if (!somethingElseNeed) return;

        // If already selected — deselect and clear
        if (s.selectedNeedIds.includes(somethingElseNeed.id)) {
          const selected = toggleNeedSelection(somethingElseNeed.id, s.selectedNeedIds);
          updateSession({ selectedNeedIds: selected, somethingElseText: '' });
          updateGridSelection(gridContainer, selected);
          updateSomethingElseLabel(gridContainer, '');
          return;
        }

        // Open sheet — show disabled needs as chips + text input
        const disabledNeeds = config.needs.filter(n => !n.enabled && !n.isSomethingElse);
        const result = await showSomethingElseSheet(disabledNeeds);
        if (result === null) return;

        if (result.createNew) {
          // Persist new need to config, then re-mount so it appears in grid
          const newNeed = {
            id: 'n' + Date.now(),
            label: result.text,
            icon: 'fas fa-star',
            isSomethingElse: false,
            enabled: true,
          };
          const newConfig = { ...config, needs: [...config.needs, newNeed] };
          saveConfig(newConfig);
          // Pre-select the new need and the Something Else card before re-mount
          const selected = toggleNeedSelection(somethingElseNeed.id,
            [...s.selectedNeedIds, newNeed.id]);
          updateSession({ selectedNeedIds: selected, somethingElseText: result.text });
          onConfigChange(newConfig);
        } else {
          // Existing disabled need — select Something Else card with its label
          const selected = toggleNeedSelection(somethingElseNeed.id, s.selectedNeedIds);
          updateSession({ selectedNeedIds: selected, somethingElseText: result.text });
          updateGridSelection(gridContainer, selected);
          updateSomethingElseLabel(gridContainer, result.text);
        }
      },
    }
  );

  // Render initial selection state
  updateGridSelection(gridContainer, session.selectedNeedIds);

  // ── Show Card button ──────────────────────────────────────────────────────
  showCardBtn.addEventListener('click', () => {
    const s = getSession();
    const urgencyLevel = config.urgencyLevels[s.urgencyIndex];
    const selectedNeeds = s.selectedNeedIds
      .map(id => config.needs.find(n => n.id === id))
      .filter(Boolean);

    // Brief flash animation
    document.body.classList.add('show-card-flash');
    setTimeout(() => {
      document.body.classList.remove('show-card-flash');

      showCard(urgencyLevel, selectedNeeds, s.somethingElseText, () => {
        updateSession({ selectedNeedIds: [], somethingElseText: '' });
        updateGridSelection(gridContainer, []);
        updateSomethingElseLabel(gridContainer, '');
      });
    }, 150);
  });
}
