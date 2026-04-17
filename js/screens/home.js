/**
 * home.js — Home screen: urgency slider + needs grid + bottom bar (settings / SE / Show Card).
 */

import { mountSlider } from '../ui/slider.js';
import { mountGrid, updateGridSelection, toggleNeedSelection } from '../ui/grid.js';
import { showSomethingElseSheet } from '../ui/dialog.js';
import { saveConfig, getSession, updateSession } from '../data/config.js';
import { show as showCard } from './card.js';
import { getLayoutMode } from '../utils/layout.js';

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
  settingsBtn.innerHTML = `<i class="${config.ui.settingsIcon || 'fas fa-cog'}" aria-hidden="true"></i>`;
  settingsBtn.addEventListener('click', () => { window.location.hash = 'settings'; });

  // ── Slider region ─────────────────────────────────────────────────────────────
  const sliderRegion = document.createElement('section');
  sliderRegion.className = 'home-slider-region';
  sliderRegion.setAttribute('aria-label', 'Mood level');

  const sliderContainer = document.createElement('div');
  sliderContainer.className = 'slider-container';
  sliderRegion.appendChild(sliderContainer);

  // ── Needs region ──────────────────────────────────────────────────────────────
  const needsRegion = document.createElement('section');
  needsRegion.className = 'home-needs-region';
  needsRegion.setAttribute('aria-label', 'Select needs');

  const needsHeading = document.createElement('h2');
  needsHeading.className = 'home-needs-heading';
  needsHeading.textContent = config.ui.needsHeading || 'I want to say';

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
    <i class="${config.ui.showBtnIcon || 'fas fa-id-card'}" aria-hidden="true"></i>
    <span>${config.ui.showBtnLabel || 'Show'}</span>
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

  // ── Mount slider ──────────────────────────────────────────────────────────────
  const session = getSession();
  const layoutMode = getLayoutMode();
  const isLandscape = layoutMode === 'phone-landscape' || layoutMode === 'phone-landscape-compact';
  mountSlider(
    sliderContainer,
    config.urgencyLevels,
    session.urgencyIndex,
    (newIndex) => { updateSession({ urgencyIndex: newIndex }); },
    { vertical: isLandscape }
  );

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

  // ── SE button logic ───────────────────────────────────────────────────────────
  seBtn.addEventListener('click', async () => {
    const s = getSession();
    const disabledNeeds = config.needs.filter(n => !n.isSomethingElse && !n.enabled);
    const result = await showSomethingElseSheet(disabledNeeds);
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
      const seIdx = needs.findIndex(n => n.isSomethingElse);
      needs.splice(seIdx !== -1 ? seIdx : needs.length, 0, newNeed);
      const selected = toggleNeedSelection(newNeed.id, s.selectedNeedIds);
      updateSession({ selectedNeedIds: selected });
      saveConfig({ ...config, needs });
      onConfigChange({ ...config, needs });
    } else {
      const selected = toggleNeedSelection(result.needId, s.selectedNeedIds);
      updateSession({ selectedNeedIds: selected });
      updateGridSelection(gridContainer, selected);
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
      showCard(urgencyLevel, selectedNeeds, () => {
        updateSession({ selectedNeedIds: [] });
        updateGridSelection(gridContainer, []);
      });
    }, 150);
  });
}
