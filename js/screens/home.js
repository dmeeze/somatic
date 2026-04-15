/**
 * home.js — Home screen: urgency slider + needs grid + bottom bar (settings / SE / Show Card).
 */

import { mountSlider } from '../ui/slider.js';
import { mountGrid, updateGridSelection, toggleNeedSelection } from '../ui/grid.js';
import { showSomethingElseSheet } from '../ui/dialog.js';
import { saveConfig, getSession, updateSession } from '../data/config.js';
import { show as showCard } from './card.js';

/**
 * Mount the home screen.
 * @param {object} config - AppConfig from getConfig()
 * @param {function} onConfigChange
 */
export function mountHome(initialConfig, onConfigChange) {
  let config = initialConfig;
  const section = document.getElementById('home');
  const wasActive = section.classList.contains('active');
  section.innerHTML = '';
  section.className = 'screen screen--home' + (wasActive ? ' active' : '');

  // ── Settings button ──────────────────────────────────────────────────────────
  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'settings-btn';
  settingsBtn.setAttribute('aria-label', 'Open settings');
  settingsBtn.innerHTML = '<i class="fas fa-cog" aria-hidden="true"></i>';
  settingsBtn.addEventListener('click', () => { window.location.hash = 'settings'; });

  // ── Slider region ─────────────────────────────────────────────────────────────
  const sliderRegion = document.createElement('section');
  sliderRegion.className = 'home-slider-region';
  sliderRegion.setAttribute('aria-label', 'Urgency level');

  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'slider-container';
  sliderRegion.appendChild(sliderContainer);

  // ── Needs region ──────────────────────────────────────────────────────────────
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

  // ── Something Else button ─────────────────────────────────────────────────────
  const seBtn = document.createElement('button');
  seBtn.className = 'se-btn';
  seBtn.setAttribute('aria-label', 'Something else');

  const seBtnIcon = document.createElement('i');
  seBtnIcon.className = 'fas fa-ellipsis-h';
  seBtnIcon.setAttribute('aria-hidden', 'true');

  const seBtnLabel = document.createElement('span');
  seBtnLabel.className = 'se-btn-label';
  seBtnLabel.textContent = 'Something else';

  seBtn.appendChild(seBtnIcon);
  seBtn.appendChild(seBtnLabel);

  // ── Show Card button ──────────────────────────────────────────────────────────
  const showCardBtn = document.createElement('button');
  showCardBtn.className = 'show-card-btn';
  showCardBtn.setAttribute('aria-label', 'Show communication card');
  showCardBtn.innerHTML = `
    <i class="fas fa-id-card" aria-hidden="true"></i>
    <span>Show</span>
  `;

  // ── Bottom bar ────────────────────────────────────────────────────────────────
  const bottomBar = document.createElement('div');
  bottomBar.className = 'home-bottom-bar';
  bottomBar.appendChild(settingsBtn);
  bottomBar.appendChild(seBtn);
  bottomBar.appendChild(showCardBtn);

  // ── Assemble ──────────────────────────────────────────────────────────────────
  section.appendChild(sliderRegion);
  section.appendChild(needsRegion);
  section.appendChild(bottomBar);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const somethingElseNeed = config.needs.find(n => n.isSomethingElse);

  function _updateSeBtnState(selectedNeedIds, somethingElseText) {
    const isSelected = somethingElseNeed && selectedNeedIds.includes(somethingElseNeed.id);
    seBtn.classList.toggle('selected', !!isSelected);
    seBtnLabel.textContent = somethingElseText || 'Something else';
  }

  // ── Mount slider ──────────────────────────────────────────────────────────────
  const session = getSession();
  mountSlider(sliderContainer, config.urgencyLevels, session.urgencyIndex, (newIndex) => {
    updateSession({ urgencyIndex: newIndex });
  });

  // ── Mount needs grid ──────────────────────────────────────────────────────────
  mountGrid(gridContainer, config.needs, getSession(), {
    onSelect(needId) {
      const s = getSession();
      const selected = toggleNeedSelection(needId, s.selectedNeedIds);
      updateSession({ selectedNeedIds: selected });
      updateGridSelection(gridContainer, selected);
    },
  });

  // Render initial selection state
  updateGridSelection(gridContainer, session.selectedNeedIds);
  _updateSeBtnState(session.selectedNeedIds, session.somethingElseText);

  // ── SE button logic ───────────────────────────────────────────────────────────
  seBtn.addEventListener('click', async () => {
    if (!somethingElseNeed) return;
    const s = getSession();

    // If already selected — deselect and clear
    if (s.selectedNeedIds.includes(somethingElseNeed.id)) {
      const selected = toggleNeedSelection(somethingElseNeed.id, s.selectedNeedIds);
      updateSession({ selectedNeedIds: selected, somethingElseText: '' });
      _updateSeBtnState(selected, '');
      return;
    }

    // Open sheet — show "others" (needs below "something else" in the array)
    const seIdx = config.needs.findIndex(n => n.isSomethingElse);
    const otherNeeds = seIdx !== -1 ? config.needs.slice(seIdx + 1) : [];
    const result = await showSomethingElseSheet(otherNeeds);
    if (result === null) return;

    if (result.createNew) {
      const newNeed = {
        id: 'n' + Date.now(),
        label: result.text,
        icon: 'fas fa-star',
        isSomethingElse: false,
        enabled: true,
      };
      const needs = [...config.needs];
      const insertIdx = seIdx !== -1 ? seIdx + 1 : needs.length;
      needs.splice(insertIdx, 0, newNeed);
      const newConfig = { ...config, needs };
      const alreadySelected = s.selectedNeedIds.includes(somethingElseNeed.id);
      const selected = alreadySelected ? s.selectedNeedIds : [...s.selectedNeedIds, somethingElseNeed.id];
      updateSession({ selectedNeedIds: selected, somethingElseText: result.text });
      _updateSeBtnState(selected, result.text);
      saveConfig(newConfig);
      onConfigChange(newConfig);
    } else {
      const selected = toggleNeedSelection(somethingElseNeed.id, s.selectedNeedIds);
      updateSession({ selectedNeedIds: selected, somethingElseText: result.text });
      _updateSeBtnState(selected, result.text);
    }
  });

  // ── Show Card button ──────────────────────────────────────────────────────────
  showCardBtn.addEventListener('click', () => {
    const s = getSession();
    const urgencyLevel = config.urgencyLevels[s.urgencyIndex];
    const selectedNeeds = s.selectedNeedIds
      .map(id => config.needs.find(n => n.id === id))
      .filter(Boolean);

    document.body.classList.add('show-card-flash');
    setTimeout(() => {
      document.body.classList.remove('show-card-flash');
      showCard(urgencyLevel, selectedNeeds, s.somethingElseText, () => {
        updateSession({ selectedNeedIds: [], somethingElseText: '' });
        updateGridSelection(gridContainer, []);
        _updateSeBtnState([], '');
      }, config);
    }, 150);
  });
}
