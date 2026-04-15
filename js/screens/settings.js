/**
 * settings.js — Stage 2: full settings screen.
 * Urgency level editing, need card editing, UI prefs, factory reset.
 */

import {
  saveConfig, resetConfig, getConfig,
  serializeConfig, deserializeConfig,
  savePreImportSnapshot, getPreImportSnapshot, clearPreImportSnapshot,
} from '../data/config.js';
import { showConfirm } from '../ui/dialog.js';
import { ICONS } from '../data/icons.js';
import { ICONS_ALL } from '../data/icons-all.js';

let _config = null;
let _onConfigChange = null;
let _activeTab = 'urgency';

export function mountSettings(config, onConfigChange) {
  _config = config;
  _onConfigChange = onConfigChange;
  _render();
}

// ── Save helper ───────────────────────────────────────────────────────────────

function _save(newConfig) {
  _config = newConfig;
  saveConfig(newConfig);
  _onConfigChange(newConfig);
}

// ── Top-level render ──────────────────────────────────────────────────────────

const _TABS = [
  { id: 'urgency',      label: 'Urgency' },
  { id: 'needs',        label: 'Needs' },
  { id: 'theme',        label: 'Theme' },
  { id: 'app',          label: 'App' },
  { id: 'instructions', label: 'Instructions' },
];

function _render() {
  const section = document.getElementById('settings');
  const wasActive = section.classList.contains('active');
  section.innerHTML = '';
  section.className = 'screen screen--settings' + (wasActive ? ' active' : '');

  // Sticky header
  const header = document.createElement('div');
  header.className = 'settings-header';

  const backBtn = document.createElement('button');
  backBtn.className = 'settings-back-btn';
  backBtn.setAttribute('aria-label', 'Back to home');
  backBtn.innerHTML = '<i class="fas fa-arrow-left" aria-hidden="true"></i>';
  backBtn.addEventListener('click', () => { window.location.hash = 'home'; });

  const title = document.createElement('h1');
  title.className = 'settings-title';
  title.textContent = 'Settings';

  header.appendChild(backBtn);
  header.appendChild(title);
  section.appendChild(header);

  // Tab bar
  const tabBar = document.createElement('div');
  tabBar.className = 'settings-tabs';

  _TABS.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'settings-tab' + (_activeTab === tab.id ? ' active' : '');
    btn.textContent = tab.label;
    btn.dataset.tabId = tab.id;
    btn.addEventListener('click', () => {
      _activeTab = tab.id;
      tabBar.querySelectorAll('.settings-tab').forEach(b =>
        b.classList.toggle('active', b.dataset.tabId === _activeTab));
      _renderBody(body);
    });
    tabBar.appendChild(btn);
  });
  section.appendChild(tabBar);

  // Scrollable body
  const body = document.createElement('div');
  body.className = 'settings-body';
  section.appendChild(body);

  _renderBody(body);
}

function _renderBody(body) {
  body.innerHTML = '';
  switch (_activeTab) {
    case 'urgency':      _renderUrgencySection(body); break;
    case 'needs':        _renderNeedsSection(body); break;
    case 'theme':        _renderThemeTab(body); break;
    case 'app':          _renderBackupSection(body); _renderPrefsSection(body); _renderResetSection(body); break;
    case 'instructions': _renderInstructionsTab(body); break;
  }
}

// ── Urgency section ───────────────────────────────────────────────────────────

function _renderUrgencySection(container) {
  const sec = _makeSection('urgency-section', 'Urgency Levels');
  container.appendChild(sec);

  const list = document.createElement('div');
  list.className = 'settings-list';
  list.id = 'urgency-list';
  sec.appendChild(list);

  _config.urgencyLevels.forEach((level, i) => {
    list.appendChild(_makeUrgencyRow(level, i));
  });

  // Default level picker
  const defaultRow = document.createElement('div');
  defaultRow.className = 'settings-default-row';

  const defaultLabel = document.createElement('label');
  defaultLabel.className = 'settings-default-label';
  defaultLabel.textContent = 'Default level:';
  defaultLabel.htmlFor = 'default-urgency-select';

  const select = document.createElement('select');
  select.className = 'settings-default-select';
  select.id = 'default-urgency-select';

  _config.urgencyLevels.forEach((level, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = level.label;
    if (i === _config.defaultUrgencyIndex) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    _save({ ..._config, defaultUrgencyIndex: parseInt(select.value, 10) });
  });

  defaultRow.appendChild(defaultLabel);
  defaultRow.appendChild(select);
  sec.appendChild(defaultRow);

  // Drag to reorder
  _initSortable(list, (oldIndex, newIndex) => {
    const levels = [..._config.urgencyLevels];
    const defaultId = levels[_config.defaultUrgencyIndex]?.id;
    const [moved] = levels.splice(oldIndex, 1);
    levels.splice(newIndex, 0, moved);
    const newDefaultIndex = Math.max(0, levels.findIndex(l => l.id === defaultId));
    _save({ ..._config, urgencyLevels: levels, defaultUrgencyIndex: newDefaultIndex });
    _reRenderSection();
  });

  // Add level button (disabled at 9 levels)
  const addBtn = document.createElement('button');
  addBtn.className = 'settings-add-btn';
  addBtn.disabled = _config.urgencyLevels.length >= 9;
  addBtn.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i> Add level';
  addBtn.addEventListener('click', () => {
    _showEditModal({ label: 'New level', icon: 'fas fa-meh', title: 'New Urgency Level' }, (newLabel, newIcon) => {
      const newLevel = { id: 'u' + Date.now(), label: newLabel, icon: newIcon };
      _save({ ..._config, urgencyLevels: [..._config.urgencyLevels, newLevel] });
      _reRenderSection();
    });
  });
  sec.appendChild(addBtn);
}

function _makeUrgencyRow(level, index) {
  const row = document.createElement('div');
  row.className = 'settings-row';
  row.dataset.id = level.id;

  const handle = _makeDragHandle();

  const icon = document.createElement('i');
  icon.className = `row-icon ${level.icon}`;
  icon.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'row-label';
  label.textContent = level.label;

  const isDefault = index === _config.defaultUrgencyIndex;
  const badge = document.createElement('span');
  badge.className = 'row-badge';
  badge.textContent = 'Default';
  badge.style.display = isDefault ? '' : 'none';

  const editBtn = _makeIconBtn('fas fa-pen', 'Edit', () => {
    _showEditModal({ label: level.label, icon: level.icon, title: 'Edit Urgency Level' }, (newLabel, newIcon) => {
      const levels = _config.urgencyLevels.map(l =>
        l.id === level.id ? { ...l, label: newLabel, icon: newIcon } : l
      );
      _save({ ..._config, urgencyLevels: levels });
      _reRenderSection();
    });
  });

  const deleteBtn = _makeIconBtn('fas fa-trash', 'Delete', () => {
    if (_config.urgencyLevels.length <= 2) return;
    const levels = _config.urgencyLevels.filter(l => l.id !== level.id);
    const newDefault = Math.min(_config.defaultUrgencyIndex, levels.length - 1);
    _save({ ..._config, urgencyLevels: levels, defaultUrgencyIndex: newDefault });
    _reRenderSection();
  });
  if (_config.urgencyLevels.length <= 2) deleteBtn.disabled = true;

  row.appendChild(handle);
  row.appendChild(icon);
  row.appendChild(label);
  row.appendChild(badge);
  row.appendChild(editBtn);
  row.appendChild(deleteBtn);
  return row;
}

// ── Needs section ─────────────────────────────────────────────────────────────

function _renderNeedsSection(container) {
  // Remove existing if re-rendering
  const existing = container.querySelector('#needs-section');
  if (existing) existing.remove();

  const sec = _makeSection('needs-section', 'Need Cards');
  container.appendChild(sec);

  const list = document.createElement('div');
  list.className = 'settings-list';
  list.id = 'needs-list';
  sec.appendChild(list);

  _config.needs.forEach(need => {
    list.appendChild(_makeNeedRow(need, container));
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'settings-add-btn';
  addBtn.disabled = _config.needs.length >= 20;
  addBtn.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i> Add need';
  addBtn.addEventListener('click', () => {
    _showEditModal({ label: '', icon: 'fas fa-star', title: 'New Need Card' }, (newLabel, newIcon) => {
      const newNeed = {
        id: 'n' + Date.now(),
        label: newLabel,
        icon: newIcon,
        isSomethingElse: false,
        enabled: true,
      };
      _save({ ..._config, needs: [..._config.needs, newNeed] });
      _renderNeedsSection(container);
    });
  });
  sec.appendChild(addBtn);

  _initSortable(list, (oldIndex, newIndex) => {
    const needs = [..._config.needs];
    const [moved] = needs.splice(oldIndex, 1);
    needs.splice(newIndex, 0, moved);
    _save({ ..._config, needs });
    _renderNeedsSection(container);
  });
}

function _makeNeedRow(need, sectionContainer) {
  const row = document.createElement('div');
  row.className = 'settings-row' + (need.enabled ? '' : ' row-disabled');
  row.dataset.id = need.id;

  const handle = _makeDragHandle();

  const icon = document.createElement('i');
  icon.className = `row-icon ${need.icon}`;
  icon.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'row-label';
  label.textContent = need.label;

  const actions = document.createElement('div');
  actions.className = 'row-actions';

  // Show/hide toggle (not for "Something else")
  if (!need.isSomethingElse) {
    const visBtn = _makeIconBtn(
      need.enabled ? 'fas fa-eye' : 'fas fa-eye-slash',
      need.enabled ? 'Hide' : 'Show',
      () => {
        const needs = _config.needs.map(n => n.id === need.id ? { ...n, enabled: !n.enabled } : n);
        _save({ ..._config, needs });
        _renderNeedsSection(sectionContainer);
      }
    );
    if (!need.enabled) visBtn.classList.add('row-action-muted');
    actions.appendChild(visBtn);
  }

  // Edit
  const editBtn = _makeIconBtn('fas fa-pen', 'Edit', () => {
    _showEditModal({ label: need.label, icon: need.icon, title: 'Edit Need Card' }, (newLabel, newIcon) => {
      const needs = _config.needs.map(n => n.id === need.id ? { ...n, label: newLabel, icon: newIcon } : n);
      _save({ ..._config, needs });
      _renderNeedsSection(sectionContainer);
    });
  });
  actions.appendChild(editBtn);

  // Delete (not for "Something else")
  if (!need.isSomethingElse) {
    const delBtn = _makeIconBtn('fas fa-trash', 'Delete', async () => {
      const confirmed = await showConfirm({
        title: 'Delete need?',
        message: `Remove "${need.label}" from the grid?`,
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!confirmed) return;
      const needs = _config.needs.filter(n => n.id !== need.id);
      _save({ ..._config, needs });
      _renderNeedsSection(sectionContainer);
    });
    delBtn.classList.add('row-action-danger');
    actions.appendChild(delBtn);
  }

  row.appendChild(handle);
  row.appendChild(icon);
  row.appendChild(label);
  row.appendChild(actions);
  return row;
}

// ── Prefs section ─────────────────────────────────────────────────────────────

function _renderPrefsSection(container) {
  const sec = _makeSection('prefs-section', 'Preferences');
  container.appendChild(sec);

  // Reduce motion toggle
  const motionRow = document.createElement('div');
  motionRow.className = 'pref-row';

  const motionLabel = document.createElement('label');
  motionLabel.className = 'pref-label';
  motionLabel.htmlFor = 'reduce-motion-toggle';
  motionLabel.textContent = 'Reduce motion';

  const toggle = _makeToggle('reduce-motion-toggle', _config.ui.reduceMotion, (checked) => {
    _save({ ..._config, ui: { ..._config.ui, reduceMotion: checked } });
  });

  motionRow.appendChild(motionLabel);
  motionRow.appendChild(toggle);
  sec.appendChild(motionRow);

  // Font size
  const sizeRow = document.createElement('div');
  sizeRow.className = 'pref-row';

  const sizeLabel = document.createElement('span');
  sizeLabel.className = 'pref-label';
  sizeLabel.textContent = 'Text size';

  const sizeBtns = document.createElement('div');
  sizeBtns.className = 'font-size-btns';

  [['default', 'A'], ['large', 'A+'], ['xlarge', 'A++']].forEach(([value, display]) => {
    const btn = document.createElement('button');
    btn.className = 'font-size-btn' + (_config.ui.fontSize === value ? ' active' : '');
    btn.textContent = display;
    btn.addEventListener('click', () => {
      _save({ ..._config, ui: { ..._config.ui, fontSize: value } });
      sizeBtns.querySelectorAll('.font-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    sizeBtns.appendChild(btn);
  });

  sizeRow.appendChild(sizeLabel);
  sizeRow.appendChild(sizeBtns);
  sec.appendChild(sizeRow);

  // Full icon list toggle
  const iconRow = document.createElement('div');
  iconRow.className = 'pref-row';

  const iconLabel = document.createElement('label');
  iconLabel.className = 'pref-label';
  iconLabel.htmlFor = 'full-icon-toggle';
  iconLabel.textContent = 'Full icon library';

  const iconDesc = document.createElement('span');
  iconDesc.className = 'pref-desc';
  iconDesc.textContent = 'Show all 1,853 icons in the picker (use search to find them)';

  const iconLabelWrap = document.createElement('div');
  iconLabelWrap.className = 'pref-label-wrap';
  iconLabelWrap.appendChild(iconLabel);
  iconLabelWrap.appendChild(iconDesc);

  const iconToggle = _makeToggle('full-icon-toggle', _config.ui.fullIconList, (checked) => {
    _save({ ..._config, ui: { ..._config.ui, fullIconList: checked } });
  });

  iconRow.appendChild(iconLabelWrap);
  iconRow.appendChild(iconToggle);
  sec.appendChild(iconRow);
}

// ── Snackbar helper ───────────────────────────────────────────────────────────

function _showSnackbar(message, durationMs = 3000) {
  const existing = document.querySelector('.settings-snackbar');
  if (existing) existing.remove();
  const bar = document.createElement('div');
  bar.className = 'settings-snackbar';
  bar.textContent = message;
  document.body.appendChild(bar);
  // Trigger animation
  requestAnimationFrame(() => bar.classList.add('settings-snackbar--visible'));
  setTimeout(() => {
    bar.classList.remove('settings-snackbar--visible');
    setTimeout(() => bar.remove(), 300);
  }, durationMs);
}

// ── Backup & Restore section ──────────────────────────────────────────────────

function _renderBackupSection(container) {
  const sec = _makeSection('backup-section', 'Backup & Restore');
  container.appendChild(sec);

  // ── Export ─────────────────────────────────────────────────────────────────
  const exportDesc = document.createElement('p');
  exportDesc.className = 'settings-section-desc';
  exportDesc.textContent = 'Save all your settings — urgency levels, needs, themes, and preferences.';
  sec.appendChild(exportDesc);

  const exportBtn = document.createElement('button');
  exportBtn.className = 'settings-action-btn';
  exportBtn.innerHTML = '<i class="fas fa-share-square" aria-hidden="true"></i> Back up settings';
  exportBtn.addEventListener('click', async () => {
    const blob = serializeConfig(_config);
    const shareData = {
      title: 'Somatic backup',
      text: blob,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // user cancelled — don't fall through
      }
    }
    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(blob);
      _showSnackbar('Backup code copied — paste it anywhere to save.');
    } catch {
      _showSnackbar('Could not copy. Open DevTools console and run: copy(somatic_backup)', 5000);
      window.somatic_backup = blob;
    }
  });
  sec.appendChild(exportBtn);

  // ── Import ─────────────────────────────────────────────────────────────────
  const importHeading = document.createElement('p');
  importHeading.className = 'settings-subsection-label';
  importHeading.textContent = 'Restore from backup';
  sec.appendChild(importHeading);

  const textarea = document.createElement('textarea');
  textarea.className = 'backup-import-textarea';
  textarea.placeholder = 'Paste backup code here…';
  textarea.rows = 4;
  sec.appendChild(textarea);

  const importError = document.createElement('p');
  importError.className = 'backup-import-error';
  importError.style.display = 'none';
  sec.appendChild(importError);

  const importBtn = document.createElement('button');
  importBtn.className = 'settings-action-btn';
  importBtn.innerHTML = '<i class="fas fa-upload" aria-hidden="true"></i> Restore';
  importBtn.addEventListener('click', async () => {
    importError.style.display = 'none';
    const blob = textarea.value.trim();
    if (!blob) {
      importError.textContent = 'Please paste a backup code first.';
      importError.style.display = '';
      return;
    }
    let restored;
    try {
      restored = deserializeConfig(blob);
    } catch (e) {
      importError.textContent = e.message;
      importError.style.display = '';
      return;
    }
    const confirmed = await showConfirm({
      title: 'Restore settings?',
      message: 'This will replace all your current settings. Your current settings will be saved for 48 hours so you can undo.',
    });
    if (!confirmed) return;
    savePreImportSnapshot(_config);
    saveConfig(restored);
    location.reload();
  });
  sec.appendChild(importBtn);

  // ── Undo ───────────────────────────────────────────────────────────────────
  const snapshot = getPreImportSnapshot();
  if (snapshot) {
    const undoDiv = document.createElement('div');
    undoDiv.className = 'backup-undo-row';

    const expiresAt = new Date(snapshot.timestamp + 48 * 60 * 60 * 1000);
    const timeStr = expiresAt.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const undoNote = document.createElement('p');
    undoNote.className = 'backup-undo-note';
    undoNote.textContent = `Previous settings saved — undo available until ${timeStr}.`;
    undoDiv.appendChild(undoNote);

    const undoBtn = document.createElement('button');
    undoBtn.className = 'settings-action-btn settings-action-btn--warning';
    undoBtn.innerHTML = '<i class="fas fa-undo" aria-hidden="true"></i> Undo last restore';
    undoBtn.addEventListener('click', async () => {
      const confirmed = await showConfirm({
        title: 'Undo restore?',
        message: 'This will go back to your settings from before the last restore.',
      });
      if (!confirmed) return;
      const snap = getPreImportSnapshot();
      if (!snap) {
        _showSnackbar('Undo period has expired.');
        _reRenderSection();
        return;
      }
      saveConfig(snap.config);
      clearPreImportSnapshot();
      location.reload();
    });
    undoDiv.appendChild(undoBtn);
    sec.appendChild(undoDiv);
  }
}

// ── Reset section ─────────────────────────────────────────────────────────────

function _renderResetSection(container) {
  const sec = _makeSection('reset-section', '');
  container.appendChild(sec);

  const btn = document.createElement('button');
  btn.className = 'settings-reset-btn';
  btn.textContent = 'Factory Reset';
  btn.addEventListener('click', async () => {
    const confirmed = await showConfirm({
      title: 'Factory reset?',
      message: 'This will restore all default labels, needs, and settings. Your theme will not be affected.',
      confirmLabel: 'Reset',
      danger: true,
    });
    if (!confirmed) return;
    const fresh = resetConfig();
    _config = fresh;
    _onConfigChange(fresh);
    _render();
  });

  sec.appendChild(btn);
}

// ── Theme tab ─────────────────────────────────────────────────────────────────

function _renderThemeTab(container) {
  const wrap = document.createElement('div');
  wrap.className = 'theme-gallery';

  _config.themes.forEach(theme => {
    const card = document.createElement('button');
    card.className = 'theme-card' + (theme.id === _config.activeThemeId ? ' active' : '');
    card.setAttribute('aria-label', `Select ${theme.name} theme`);
    card.setAttribute('aria-pressed', theme.id === _config.activeThemeId ? 'true' : 'false');

    // Colour swatch strip
    const swatch = document.createElement('div');
    swatch.className = 'theme-swatch';
    swatch.style.background = theme.colors.pageBg;

    // Accent dot
    const accent = document.createElement('div');
    accent.className = 'theme-swatch-accent';
    accent.style.background = theme.colors.accentPrimary;

    // Gradient bar (urgency colours)
    const bar = document.createElement('div');
    bar.className = 'theme-swatch-bar';
    bar.style.background = `linear-gradient(to right, ${theme.colors.urgencyGradient.join(', ')})`;

    // Card preview strip (mini card)
    const cardStrip = document.createElement('div');
    cardStrip.className = 'theme-swatch-card';
    cardStrip.style.background = theme.colors.cardBg;

    const cardDot = document.createElement('div');
    cardDot.className = 'theme-swatch-card-dot';
    cardDot.style.background = theme.colors.cardAccent;

    cardStrip.appendChild(cardDot);
    swatch.appendChild(accent);
    swatch.appendChild(bar);
    swatch.appendChild(cardStrip);

    // Label
    const name = document.createElement('span');
    name.className = 'theme-card-name';
    name.textContent = theme.name;

    // Active tick
    const tick = document.createElement('span');
    tick.className = 'theme-card-tick';
    tick.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';

    card.appendChild(swatch);
    card.appendChild(name);
    card.appendChild(tick);

    card.addEventListener('click', () => {
      _save({ ..._config, activeThemeId: theme.id });
      _reRenderSection();
    });

    wrap.appendChild(card);
  });

  container.appendChild(wrap);
}

// ── Instructions tab ─────────────────────────────────────────────────────────

function _renderInstructionsTab(container) {
  const wrap = document.createElement('div');
  wrap.className = 'instructions-tab';

  const items = [
    {
      title: 'Setting urgency levels',
      body: 'Drag the handles to reorder levels. Tap the pen icon to change the label or icon. Use the Default dropdown to choose which level is pre-selected when the app opens.',
    },
    {
      title: 'Managing need cards',
      body: 'Tap the eye icon to show or hide a need on the home screen. Hidden needs still appear in the "Something else…" picker. Tap the pen icon to edit, or the bin to delete. Tap "Add need" to create a new one.',
    },
    {
      title: 'Using "Something else…"',
      body: 'Tap the "Something else…" card on the home screen to pick from hidden needs or type a completely new need. New needs are saved to your list automatically.',
    },
    {
      title: 'Showing the card',
      body: 'Set the urgency level with the slider, select any needs, then tap "Show Card". Hold the card up for a teacher or carer to read.',
    },
  ];

  items.forEach(({ title, body }) => {
    const item = document.createElement('div');
    item.className = 'instructions-item';

    const h3 = document.createElement('h3');
    h3.textContent = title;

    const p = document.createElement('p');
    p.textContent = body;

    const placeholder = document.createElement('div');
    placeholder.className = 'instructions-placeholder';
    placeholder.innerHTML = '<i class="fas fa-film" aria-hidden="true"></i> Video coming soon';

    item.appendChild(h3);
    item.appendChild(p);
    item.appendChild(placeholder);
    wrap.appendChild(item);
  });

  container.appendChild(wrap);
}

// ── Icon picker ───────────────────────────────────────────────────────────────

function _showIconPicker(currentIcon, onSelect) {
  const fullMode = !!_config.ui.fullIconList;
  const iconList = fullMode ? ICONS_ALL : ICONS;

  const overlay = document.createElement('div');
  overlay.className = 'icon-picker-overlay';

  const sheet = document.createElement('div');
  sheet.className = 'icon-picker-sheet';

  const pickerHeader = document.createElement('div');
  pickerHeader.className = 'icon-picker-header';

  const pickerTitle = document.createElement('div');
  pickerTitle.className = 'icon-picker-title';
  pickerTitle.textContent = fullMode ? 'Choose icon — use search to browse' : 'Choose icon';

  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'icon-picker-search';
  search.placeholder = fullMode ? 'Search 1,853 icons…' : 'Search…';
  search.setAttribute('aria-label', 'Search icons');

  pickerHeader.appendChild(pickerTitle);
  pickerHeader.appendChild(search);

  const grid = document.createElement('div');
  grid.className = 'icon-picker-grid';

  function renderIcons(filter) {
    grid.innerHTML = '';
    // In full mode, show nothing until the user types
    const list = filter
      ? iconList.filter(i => i.label.includes(filter.toLowerCase()) || i.icon.includes(filter.toLowerCase()))
      : (fullMode ? [] : iconList);
    list.forEach(({ icon }) => {
      const btn = document.createElement('button');
      btn.className = 'icon-picker-item' + (icon === currentIcon ? ' active' : '');
      btn.setAttribute('aria-label', icon);
      btn.innerHTML = `<i class="${icon}" aria-hidden="true"></i>`;
      btn.addEventListener('click', () => {
        document.body.removeChild(overlay);
        onSelect(icon);
      });
      grid.appendChild(btn);
    });
  }

  renderIcons('');
  search.addEventListener('input', () => renderIcons(search.value.trim()));

  // Close on backdrop tap
  overlay.addEventListener('click', e => {
    if (e.target === overlay) document.body.removeChild(overlay);
  });

  sheet.appendChild(pickerHeader);
  sheet.appendChild(grid);
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => search.focus());
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function _showEditModal({ label, icon, title }, onSave) {
  let currentIcon = icon;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const box = document.createElement('div');
  box.className = 'modal-box';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', title);

  const h2 = document.createElement('h2');
  h2.className = 'modal-title';
  h2.textContent = title;

  // Label field
  const labelGroup = document.createElement('div');
  labelGroup.className = 'edit-field-group';
  const labelFieldLabel = document.createElement('label');
  labelFieldLabel.className = 'edit-field-label';
  labelFieldLabel.textContent = 'Label';
  labelFieldLabel.htmlFor = 'edit-label-input';
  const labelInput = document.createElement('input');
  labelInput.type = 'text';
  labelInput.id = 'edit-label-input';
  labelInput.className = 'edit-text-input';
  labelInput.value = label;
  labelInput.maxLength = 80;
  labelInput.placeholder = 'Enter label…';
  labelGroup.appendChild(labelFieldLabel);
  labelGroup.appendChild(labelInput);

  // Icon field
  const iconGroup = document.createElement('div');
  iconGroup.className = 'edit-field-group';
  const iconFieldLabel = document.createElement('label');
  iconFieldLabel.className = 'edit-field-label';
  iconFieldLabel.textContent = 'Icon';

  const iconBtn = document.createElement('button');
  iconBtn.className = 'edit-icon-btn';
  iconBtn.type = 'button';
  iconBtn.innerHTML = `<i class="${currentIcon}" aria-hidden="true"></i><span>Change icon…</span>`;
  iconBtn.addEventListener('click', () => {
    _showIconPicker(currentIcon, (newIcon) => {
      currentIcon = newIcon;
      iconBtn.querySelector('i').className = newIcon;
      // re-show overlay if it was closed by backdrop
      if (!overlay.parentNode) document.body.appendChild(overlay);
    });
  });

  iconGroup.appendChild(iconFieldLabel);
  iconGroup.appendChild(iconBtn);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'edit-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => overlay.remove());

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => {
    const newLabel = labelInput.value.trim();
    if (!newLabel) { labelInput.focus(); return; }
    overlay.remove();
    onSave(newLabel, currentIcon);
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);

  box.appendChild(h2);
  box.appendChild(labelGroup);
  box.appendChild(iconGroup);
  box.appendChild(actions);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => labelInput.focus());

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// ── Sortable ──────────────────────────────────────────────────────────────────

function _initSortable(listEl, onReorder) {
  if (!window.Sortable) return;
  window.Sortable.create(listEl, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd(evt) {
      if (evt.oldIndex !== evt.newIndex) onReorder(evt.oldIndex, evt.newIndex);
    },
  });
}

// ── DOM helpers ───────────────────────────────────────────────────────────────

function _makeSection(id, title) {
  const sec = document.createElement('div');
  sec.className = 'settings-section';
  sec.id = id;
  if (title) {
    const h = document.createElement('h2');
    h.className = 'settings-section-title';
    h.textContent = title;
    sec.appendChild(h);
  }
  return sec;
}

function _makeDragHandle() {
  const el = document.createElement('span');
  el.className = 'drag-handle';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<i class="fas fa-grip-vertical"></i>';
  return el;
}

function _makeIconBtn(iconClass, label, onClick) {
  const btn = document.createElement('button');
  btn.className = 'row-action-btn';
  btn.setAttribute('aria-label', label);
  btn.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
  btn.addEventListener('click', onClick);
  return btn;
}

function _makeToggle(id, checked, onChange) {
  const label = document.createElement('label');
  label.className = 'toggle-switch';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = id;
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));

  const slider = document.createElement('span');
  slider.className = 'toggle-slider';

  label.appendChild(input);
  label.appendChild(slider);
  return label;
}

function _reRenderSection() {
  const body = document.querySelector('.settings-body');
  if (body) _renderBody(body);
  else _render();
}
