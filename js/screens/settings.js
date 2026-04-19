/**
 * settings.js — Stage 2: full settings screen.
 * Urgency level editing, need card editing, UI prefs, factory reset.
 */

import {
  saveConfig, resetConfig, getConfig,
  serializeConfig, deserializeConfig,
  savePreImportSnapshot, getPreImportSnapshot, clearPreImportSnapshot,
} from '../data/config.js';
import { showConfirm, showSnackbar } from '../ui/dialog.js';
import { applyTheme, serializeTheme, FONT_PAIRINGS, SCALE_OPTIONS, RADIUS_OPTIONS } from '../utils/theme.js';
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
  { id: 'urgency',      label: 'Mood' },
  { id: 'needs',        label: 'Needs' },
  { id: 'theme',        label: 'Theme' },
  { id: 'app',          label: 'App' },
  { id: 'about',        label: 'About' },
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
    case 'app':          _renderBackupSection(body); _renderPrefsSection(body); _renderLabelsSection(body); _renderResetSection(body); break;
    case 'about':        _renderAboutTab(body); break;
  }
}

// ── Urgency section ───────────────────────────────────────────────────────────

function _renderUrgencySection(container) {
  const sec = _makeSection('urgency-section', 'Mood Levels');
  container.appendChild(sec);

  const list = document.createElement('div');
  list.className = 'settings-list';
  list.id = 'urgency-list';
  sec.appendChild(list);

  _config.urgencyLevels.forEach((level, i) => {
    list.appendChild(_makeUrgencyRow(level, i));
  });

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
    const isDefault = index === _config.defaultUrgencyIndex;
    _showEditModal({
      label: level.label,
      icon: level.icon,
      title: 'Edit Urgency Level',
      isDefault,
      onMakeDefault: isDefault ? null : () => {
        _save({ ..._config, defaultUrgencyIndex: index });
        _reRenderSection();
      },
    }, (newLabel, newIcon) => {
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

  // "I want to say" heading editor
  const headingRow = document.createElement('div');
  headingRow.className = 'pref-row pref-row--stacked';

  const headingLabel = document.createElement('label');
  headingLabel.className = 'pref-label';
  headingLabel.htmlFor = 'needs-heading-input';
  headingLabel.textContent = 'Section heading';

  const headingInput = document.createElement('input');
  headingInput.type = 'text';
  headingInput.id = 'needs-heading-input';
  headingInput.className = 'edit-text-input';
  headingInput.value = _config.ui.needsHeading || 'I want to say';
  headingInput.maxLength = 60;
  headingInput.placeholder = 'I want to say';
  headingInput.addEventListener('change', () => {
    const val = headingInput.value.trim() || 'I want to say';
    headingInput.value = val;
    _save({ ..._config, ui: { ..._config.ui, needsHeading: val } });
  });

  headingRow.appendChild(headingLabel);
  headingRow.appendChild(headingInput);
  sec.appendChild(headingRow);

  const list = document.createElement('div');
  list.className = 'settings-list';
  list.id = 'needs-list';
  sec.appendChild(list);

  const regularNeeds = _config.needs.filter(n => !n.isSomethingElse);
  regularNeeds.forEach(need => {
    list.appendChild(_makeNeedRow(need, container));
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'settings-add-btn';
  addBtn.disabled = regularNeeds.length >= 20;
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

  // "Something else" — always present, editable but separate
  const somethingElse = _config.needs.find(n => n.isSomethingElse);
  if (somethingElse) {
    const seRow = document.createElement('div');
    seRow.className = 'settings-something-else-row';

    const seLabel = document.createElement('span');
    seLabel.className = 'settings-something-else-label';
    seLabel.textContent = '"Something else…"';

    const seHint = document.createElement('span');
    seHint.className = 'settings-something-else-hint';
    seHint.textContent = 'Always available — edit label & icon';

    const seLabelWrap = document.createElement('div');
    seLabelWrap.className = 'settings-something-else-label-wrap';
    seLabelWrap.appendChild(seLabel);
    seLabelWrap.appendChild(seHint);

    const seIcon = document.createElement('i');
    seIcon.className = `row-icon ${somethingElse.icon}`;
    seIcon.setAttribute('aria-hidden', 'true');

    const seEditBtn = _makeIconBtn('fas fa-pen', 'Edit', () => {
      _showEditModal({ label: somethingElse.label, icon: somethingElse.icon, title: 'Edit "Something Else"' }, (newLabel, newIcon) => {
        const needs = _config.needs.map(n => n.isSomethingElse ? { ...n, label: newLabel, icon: newIcon } : n);
        _save({ ..._config, needs });
        _renderNeedsSection(container);
      });
    });

    seRow.appendChild(seIcon);
    seRow.appendChild(seLabelWrap);
    seRow.appendChild(seEditBtn);
    sec.appendChild(seRow);
  }

  _initSortable(list, (oldIndex, newIndex) => {
    const regularIds = regularNeeds.map(n => n.id);
    const allNeeds = [..._config.needs];
    // Find actual indices in full needs array
    const fullOld = allNeeds.findIndex(n => n.id === regularIds[oldIndex]);
    const fullNew = allNeeds.findIndex(n => n.id === regularIds[newIndex]);
    const [moved] = allNeeds.splice(fullOld, 1);
    allNeeds.splice(fullNew, 0, moved);
    _save({ ..._config, needs: allNeeds });
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
  iconDesc.textContent = 'Show all 1,853 icons in the picker (browse or search)';

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

// ── Labels section ────────────────────────────────────────────────────────────

function _renderLabelsSection(container) {
  const sec = _makeSection('labels-section', 'Button Labels');
  container.appendChild(sec);

  // "Show" button label
  const showLabelRow = document.createElement('div');
  showLabelRow.className = 'pref-row pref-row--stacked';

  const showLabelLabel = document.createElement('label');
  showLabelLabel.className = 'pref-label';
  showLabelLabel.htmlFor = 'show-btn-label-input';
  showLabelLabel.textContent = '"Show" button label';

  const showLabelInput = document.createElement('input');
  showLabelInput.type = 'text';
  showLabelInput.id = 'show-btn-label-input';
  showLabelInput.className = 'edit-text-input';
  showLabelInput.value = _config.ui.showBtnLabel || 'Show';
  showLabelInput.maxLength = 20;
  showLabelInput.placeholder = 'Show';
  showLabelInput.addEventListener('change', () => {
    const val = showLabelInput.value.trim() || 'Show';
    showLabelInput.value = val;
    _save({ ..._config, ui: { ..._config.ui, showBtnLabel: val } });
  });

  showLabelRow.appendChild(showLabelLabel);
  showLabelRow.appendChild(showLabelInput);
  sec.appendChild(showLabelRow);

  // "Show" button icon
  const showIconRow = document.createElement('div');
  showIconRow.className = 'pref-row';

  const showIconLabelEl = document.createElement('span');
  showIconLabelEl.className = 'pref-label';
  showIconLabelEl.textContent = '"Show" button icon';

  const showIconBtn = document.createElement('button');
  showIconBtn.className = 'label-icon-preview-btn';
  showIconBtn.setAttribute('aria-label', 'Change "Show" button icon');
  showIconBtn.innerHTML = `<i class="${_config.ui.showBtnIcon || 'fas fa-id-card'}" aria-hidden="true"></i>`;
  showIconBtn.addEventListener('click', () => {
    _showIconPicker(_config.ui.showBtnIcon || 'fas fa-id-card', (newIcon) => {
      _save({ ..._config, ui: { ..._config.ui, showBtnIcon: newIcon } });
      _reRenderSection();
    });
  });

  showIconRow.appendChild(showIconLabelEl);
  showIconRow.appendChild(showIconBtn);
  sec.appendChild(showIconRow);

  // Settings / config icon
  const settingsIconRow = document.createElement('div');
  settingsIconRow.className = 'pref-row';

  const settingsIconLabelEl = document.createElement('span');
  settingsIconLabelEl.className = 'pref-label';
  settingsIconLabelEl.textContent = 'Settings icon';

  const settingsIconBtn = document.createElement('button');
  settingsIconBtn.className = 'label-icon-preview-btn';
  settingsIconBtn.setAttribute('aria-label', 'Change settings icon');
  settingsIconBtn.innerHTML = `<i class="${_config.ui.settingsIcon || 'fas fa-cog'}" aria-hidden="true"></i>`;
  settingsIconBtn.addEventListener('click', () => {
    _showIconPicker(_config.ui.settingsIcon || 'fas fa-cog', (newIcon) => {
      _save({ ..._config, ui: { ..._config.ui, settingsIcon: newIcon } });
      _reRenderSection();
    });
  });

  settingsIconRow.appendChild(settingsIconLabelEl);
  settingsIconRow.appendChild(settingsIconBtn);
  sec.appendChild(settingsIconRow);
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

// ── Version footer ────────────────────────────────────────────────────────────

function _renderVersionFooter(container) {
  const version = window.APP_VERSION || 'dev';
  const date    = window.APP_BUILD_DATE || '';
  const p = document.createElement('p');
  p.className = 'settings-version-footer';
  p.textContent = date ? `Version ${version} — ${date}` : `Version ${version}`;
  container.appendChild(p);
}

// ── Theme tab ─────────────────────────────────────────────────────────────────

function _renderThemeTab(container) {
  // New theme button
  const actionsRow = document.createElement('div');
  actionsRow.className = 'theme-tab-actions-row';
  const newBtn = document.createElement('button');
  newBtn.className = 'btn btn-secondary theme-new-btn';
  newBtn.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i> New Theme';
  newBtn.addEventListener('click', () => {
    const base = _config.themes.find(t => t.id === _config.activeThemeId) || _config.themes[0];
    _showThemeEditor({
      ...JSON.parse(JSON.stringify(base)),
      id: 'custom-' + Date.now(),
      name: '',
      builtIn: false,
    }, { isNew: true }, saved => {
      _save({ ..._config, themes: [..._config.themes, saved], activeThemeId: saved.id });
      _reRenderSection();
    });
  });
  actionsRow.appendChild(newBtn);
  container.appendChild(actionsRow);

  // Custom themes section
  const customs = _config.themes.filter(t => !t.builtIn);
  if (customs.length > 0) {
    const sec = document.createElement('div');
    sec.className = 'theme-tab-section';
    const h = document.createElement('h3');
    h.className = 'theme-tab-section-title';
    h.textContent = 'My Themes';
    sec.appendChild(h);
    const gallery = document.createElement('div');
    gallery.className = 'theme-gallery';
    customs.forEach(t => gallery.appendChild(_makeThemeCard(t, true)));
    sec.appendChild(gallery);
    container.appendChild(sec);
  }

  // Built-in presets section
  const presetsSec = document.createElement('div');
  presetsSec.className = 'theme-tab-section';
  const presetsTitle = document.createElement('h3');
  presetsTitle.className = 'theme-tab-section-title';
  presetsTitle.textContent = customs.length > 0 ? 'Presets' : '';
  presetsSec.appendChild(presetsTitle);
  const presetsGallery = document.createElement('div');
  presetsGallery.className = 'theme-gallery';
  _config.themes.filter(t => t.builtIn).forEach(t => presetsGallery.appendChild(_makeThemeCard(t, false)));
  presetsSec.appendChild(presetsGallery);
  container.appendChild(presetsSec);
}

function _makeThemeCard(theme, editable) {
  const wrap = document.createElement('div');
  wrap.className = 'theme-card-wrap';

  const card = document.createElement('button');
  card.className = 'theme-card' + (theme.id === _config.activeThemeId ? ' active' : '');
  card.setAttribute('aria-label', `Select ${theme.name} theme`);
  card.setAttribute('aria-pressed', theme.id === _config.activeThemeId ? 'true' : 'false');

  const swatch = document.createElement('div');
  swatch.className = 'theme-swatch';
  swatch.style.background = theme.colors.pageBg;
  const accent = document.createElement('div');
  accent.className = 'theme-swatch-accent';
  accent.style.background = theme.colors.accentPrimary;
  const bar = document.createElement('div');
  bar.className = 'theme-swatch-bar';
  bar.style.background = `linear-gradient(to right, ${theme.colors.urgencyGradient.join(', ')})`;
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

  const name = document.createElement('span');
  name.className = 'theme-card-name';
  name.textContent = theme.name;
  const tick = document.createElement('span');
  tick.className = 'theme-card-tick';
  tick.textContent = '✓ Active';

  card.appendChild(swatch);
  card.appendChild(name);
  card.appendChild(tick);
  card.addEventListener('click', () => {
    _save({ ..._config, activeThemeId: theme.id });
    _reRenderSection();
  });
  wrap.appendChild(card);

  const actions = document.createElement('div');
  actions.className = 'theme-card-actions';

  if (editable) {
    const editBtn = _makeIconBtn('fas fa-pen', 'Edit theme', () => {
      _showThemeEditor(JSON.parse(JSON.stringify(theme)), { isNew: false }, saved => {
        const themes = _config.themes.map(t => t.id === saved.id ? saved : t);
        _save({ ..._config, themes, activeThemeId: saved.id });
        _reRenderSection();
      });
    });
    const shareBtn = _makeIconBtn('fas fa-share-alt', 'Share theme', () => _shareTheme(theme));
    const deleteBtn = _makeIconBtn('fas fa-trash', 'Delete theme', async () => {
      const ok = await showConfirm({
        title: `Delete "${theme.name}"?`,
        message: 'This cannot be undone.',
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!ok) return;
      const themes = _config.themes.filter(t => t.id !== theme.id);
      const activeId = theme.id === _config.activeThemeId
        ? (themes.find(t => t.builtIn)?.id || themes[0]?.id || '')
        : _config.activeThemeId;
      _save({ ..._config, themes, activeThemeId: activeId });
      _reRenderSection();
    });
    actions.appendChild(editBtn);
    actions.appendChild(shareBtn);
    actions.appendChild(deleteBtn);
  } else {
    const custBtn = document.createElement('button');
    custBtn.className = 'theme-card-customize-btn';
    custBtn.textContent = 'Customize';
    custBtn.addEventListener('click', () => {
      _showThemeEditor({
        ...JSON.parse(JSON.stringify(theme)),
        id: 'custom-' + Date.now(),
        name: theme.name + ' (custom)',
        builtIn: false,
      }, { isNew: true }, saved => {
        _save({ ..._config, themes: [..._config.themes, saved], activeThemeId: saved.id });
        _reRenderSection();
      });
    });
    actions.appendChild(custBtn);
  }
  wrap.appendChild(actions);
  return wrap;
}

function _shareTheme(theme) {
  const b64 = serializeTheme(theme);
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('import', b64);
  const urlStr = url.toString();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(urlStr).then(() => showSnackbar('Share URL copied to clipboard'));
  } else {
    const inp = document.createElement('input');
    inp.value = urlStr;
    document.body.appendChild(inp);
    inp.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(inp);
    showSnackbar('Share URL copied to clipboard');
  }
}

// ── Theme editor ──────────────────────────────────────────────────────────────

function _showThemeEditor(themeToEdit, { isNew = false } = {}, onSave) {
  const draft = JSON.parse(JSON.stringify(themeToEdit));
  const originalTheme = _config.themes.find(t => t.id === _config.activeThemeId) || _config.themes[0];
  const originalFontSize = document.documentElement.style.fontSize;

  function _previewDraft() {
    applyTheme(draft, _config.urgencyLevels.length);
    const SIZES = { default: '16px', large: '19px', xlarge: '22px' };
    document.documentElement.style.fontSize = SIZES[draft.typography?.scale || 'default'] || '16px';
  }

  const overlay = document.createElement('div');
  overlay.className = 'theme-editor-overlay';

  const sheet = document.createElement('div');
  sheet.className = 'theme-editor-sheet';

  // ── Header ──
  const header = document.createElement('div');
  header.className = 'theme-editor-header';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'theme-editor-cancel-btn';
  cancelBtn.setAttribute('aria-label', 'Cancel');
  cancelBtn.innerHTML = '<i class="fas fa-arrow-left" aria-hidden="true"></i>';
  cancelBtn.addEventListener('click', () => {
    applyTheme(originalTheme, _config.urgencyLevels.length);
    document.documentElement.style.fontSize = originalFontSize;
    overlay.remove();
  });

  const titleEl = document.createElement('span');
  titleEl.className = 'theme-editor-title';
  titleEl.textContent = isNew ? 'New Theme' : 'Edit Theme';

  const headerRight = document.createElement('div');
  headerRight.className = 'theme-editor-header-right';

  const shareHeaderBtn = document.createElement('button');
  shareHeaderBtn.className = 'btn btn-secondary theme-editor-share-btn';
  shareHeaderBtn.innerHTML = '<i class="fas fa-share-alt" aria-hidden="true"></i>';
  shareHeaderBtn.setAttribute('aria-label', 'Share');
  shareHeaderBtn.addEventListener('click', () => {
    draft.name = nameInput.value.trim() || draft.name || 'Custom';
    _shareTheme(draft);
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) { nameInput.focus(); return; }
    draft.name = name;
    overlay.remove();
    onSave(draft);
  });

  headerRight.appendChild(shareHeaderBtn);
  headerRight.appendChild(saveBtn);
  header.appendChild(cancelBtn);
  header.appendChild(titleEl);
  header.appendChild(headerRight);
  sheet.appendChild(header);

  // ── Body ──
  const body = document.createElement('div');
  body.className = 'theme-editor-body';

  // Name
  const nameSec = _makeEditorSection('Name');
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'edit-text-input';
  nameInput.value = draft.name;
  nameInput.maxLength = 64;
  nameInput.placeholder = 'Theme name…';
  nameSec.appendChild(nameInput);
  body.appendChild(nameSec);

  // Colors
  const colorsSec = _makeEditorSection('Colors');
  const colorGrid = document.createElement('div');
  colorGrid.className = 'theme-editor-color-grid';
  [
    { key: 'pageBg',          label: 'Page background' },
    { key: 'surfaceBg',       label: 'Surface' },
    { key: 'textPrimary',     label: 'Text' },
    { key: 'textMuted',       label: 'Text (muted)' },
    { key: 'accentPrimary',   label: 'Accent' },
    { key: 'accentSecondary', label: 'Accent (secondary)' },
    { key: 'cardBg',          label: 'Card background' },
    { key: 'cardText',        label: 'Card text' },
    { key: 'cardAccent',      label: 'Card accent' },
  ].forEach(({ key, label }) => {
    colorGrid.appendChild(_makeColorRow(label, draft.colors[key], val => {
      draft.colors[key] = val;
      _previewDraft();
    }));
  });
  colorsSec.appendChild(colorGrid);
  body.appendChild(colorsSec);

  // Urgency gradient
  const urgSec = _makeEditorSection('Urgency Gradient');
  const urgGrid = document.createElement('div');
  urgGrid.className = 'theme-editor-urg-grid';
  const urgBar = document.createElement('div');
  urgBar.className = 'theme-editor-gradient-preview';
  urgBar.style.background = `linear-gradient(to right, ${draft.colors.urgencyGradient.join(', ')})`;

  ['Good', 'Mid', 'Bad'].forEach((label, i) => {
    const col = document.createElement('div');
    col.className = 'theme-editor-urg-col';
    const lbl = document.createElement('span');
    lbl.className = 'theme-editor-urg-label';
    lbl.textContent = label;
    const swatch = _makeColorSwatch(draft.colors.urgencyGradient[i], val => {
      draft.colors.urgencyGradient[i] = val;
      urgBar.style.background = `linear-gradient(to right, ${draft.colors.urgencyGradient.join(', ')})`;
      _previewDraft();
    });
    col.appendChild(lbl);
    col.appendChild(swatch);
    urgGrid.appendChild(col);
  });
  urgSec.appendChild(urgGrid);
  urgSec.appendChild(urgBar);
  body.appendChild(urgSec);

  // Font pairing
  const fontSec = _makeEditorSection('Font');
  const fontGrid = document.createElement('div');
  fontGrid.className = 'theme-editor-font-grid';
  FONT_PAIRINGS.forEach(({ id, label, headingFont }) => {
    const btn = document.createElement('button');
    btn.className = 'theme-editor-font-btn' + (draft.typography?.pairing === id ? ' active' : '');
    const abc = document.createElement('span');
    abc.className = 'theme-editor-font-abc';
    abc.textContent = 'Abc';
    abc.style.fontFamily = headingFont;
    const lbl = document.createElement('span');
    lbl.className = 'theme-editor-font-name';
    lbl.textContent = label;
    btn.appendChild(abc);
    btn.appendChild(lbl);
    btn.addEventListener('click', () => {
      if (!draft.typography) draft.typography = {};
      draft.typography.pairing = id;
      fontGrid.querySelectorAll('.theme-editor-font-btn').forEach(b => b.classList.toggle('active', b === btn));
      _previewDraft();
    });
    fontGrid.appendChild(btn);
  });
  fontSec.appendChild(fontGrid);
  body.appendChild(fontSec);

  // Font size
  const scaleSec = _makeEditorSection('Font Size');
  const scaleGroup = document.createElement('div');
  scaleGroup.className = 'theme-editor-scale-group';
  const SIZES = { default: '16px', large: '19px', xlarge: '22px' };
  SCALE_OPTIONS.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.className = 'theme-editor-scale-btn' + ((draft.typography?.scale || 'default') === id ? ' active' : '');
    const letter = document.createElement('span');
    letter.className = 'theme-editor-scale-letter';
    letter.textContent = 'A';
    letter.style.fontSize = SIZES[id];
    const lbl = document.createElement('span');
    lbl.className = 'theme-editor-scale-label';
    lbl.textContent = label;
    btn.appendChild(letter);
    btn.appendChild(lbl);
    btn.addEventListener('click', () => {
      if (!draft.typography) draft.typography = {};
      draft.typography.scale = id;
      scaleGroup.querySelectorAll('.theme-editor-scale-btn').forEach(b => b.classList.toggle('active', b === btn));
      document.documentElement.style.fontSize = SIZES[id];
    });
    scaleGroup.appendChild(btn);
  });
  scaleSec.appendChild(scaleGroup);
  body.appendChild(scaleSec);

  // Shape / radius
  const shapeSec = _makeEditorSection('Shape');
  const shapeGroup = document.createElement('div');
  shapeGroup.className = 'theme-editor-shape-group';
  RADIUS_OPTIONS.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.className = 'theme-editor-shape-btn' + ((draft.shape?.radius || 'soft') === id ? ' active' : '');
    const preview = document.createElement('div');
    preview.className = `theme-editor-shape-preview theme-editor-shape-preview--${id}`;
    const lbl = document.createElement('span');
    lbl.className = 'theme-editor-shape-label';
    lbl.textContent = label;
    btn.appendChild(preview);
    btn.appendChild(lbl);
    btn.addEventListener('click', () => {
      if (!draft.shape) draft.shape = {};
      draft.shape.radius = id;
      shapeGroup.querySelectorAll('.theme-editor-shape-btn').forEach(b => b.classList.toggle('active', b === btn));
      _previewDraft();
    });
    shapeGroup.appendChild(btn);
  });
  shapeSec.appendChild(shapeGroup);
  body.appendChild(shapeSec);

  sheet.appendChild(body);
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);

  // Apply draft as live preview immediately
  _previewDraft();
}

function _makeEditorSection(title) {
  const sec = document.createElement('div');
  sec.className = 'theme-editor-section';
  if (title) {
    const h = document.createElement('h3');
    h.className = 'theme-editor-section-title';
    h.textContent = title;
    sec.appendChild(h);
  }
  return sec;
}

function _makeColorRow(label, value, onChange) {
  const row = document.createElement('div');
  row.className = 'theme-editor-color-row';
  const lbl = document.createElement('span');
  lbl.className = 'theme-editor-color-label';
  lbl.textContent = label;
  row.appendChild(lbl);
  row.appendChild(_makeColorSwatch(value, onChange));
  return row;
}

function _makeColorSwatch(value, onChange) {
  const swatch = document.createElement('label');
  swatch.className = 'theme-editor-color-swatch';
  swatch.style.background = value;
  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;
  input.addEventListener('input', () => {
    swatch.style.background = input.value;
    onChange(input.value);
  });
  swatch.appendChild(input);
  return swatch;
}

// ── About tab ─────────────────────────────────────────────────────────────────

function _renderAboutTab(container) {
  const wrap = document.createElement('div');
  wrap.className = 'about-tab';

  // ── App name + tagline ────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'about-header';

  const appName = document.createElement('h2');
  appName.className = 'about-app-name';
  appName.textContent = 'Somatic';

  const tagline = document.createElement('p');
  tagline.className = 'about-tagline';
  tagline.textContent = 'A communication tool for when words are hard.';

  header.appendChild(appName);
  header.appendChild(tagline);

  // ── Body copy ─────────────────────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'about-body';

  const paragraphs = [
    'In D&D, Somatic spells are those you cast using gestures.  In this app, Somatic helps you quickly show someone how you\'re feeling and what you need, without having to find the words in the moment.',
    'This app runs entirely on your device, and we never ever see any of your data.  We don\'t track anything.',
    'We built this so you can customize it however you want.  Change the labels, the icons, make it yours.  You can create custom themes — choose your own colours, fonts, and shapes — and share them with others using a simple link.  You can also back up and restore your full settings in the App tab.',
  ];

  paragraphs.forEach(text => {
    const p = document.createElement('p');
    p.textContent = text;
    body.appendChild(p);
  });

  // ── Install section ───────────────────────────────────────────────────────
  const installSection = document.createElement('div');
  installSection.className = 'about-install';

  const installHeading = document.createElement('h3');
  installHeading.className = 'about-install-heading';
  installHeading.textContent = 'Installing as an app';

  const installIntro = document.createElement('p');
  installIntro.textContent = 'Somatic can be added to your home screen so it opens like a regular app — and works even without internet access:';

  const installList = document.createElement('ul');
  installList.className = 'about-install-list';

  const steps = [
    { platform: 'iPhone / iPad', instruction: 'tap the Share button in Safari, then Add to Home Screen.' },
    { platform: 'Android (Chrome)', instruction: 'tap the three-dot menu, then Add to Home Screen or Install app.' },
    { platform: 'Desktop (Chrome / Edge)', instruction: 'look for the install icon in the address bar, or use the menu → Install Somatic.' },
  ];

  steps.forEach(({ platform, instruction }) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = platform + ': ';
    li.appendChild(strong);
    li.appendChild(document.createTextNode(instruction));
    installList.appendChild(li);
  });

  installSection.appendChild(installHeading);
  installSection.appendChild(installIntro);
  installSection.appendChild(installList);

  // ── Version ───────────────────────────────────────────────────────────────
  const version = window.APP_VERSION || 'dev';
  const buildDate = window.APP_BUILD_DATE || '';
  const versionEl = document.createElement('p');
  versionEl.className = 'about-version';
  versionEl.textContent = buildDate ? `Version ${version} — ${buildDate}` : `Version ${version}`;

  // ── Force reload ──────────────────────────────────────────────────────────
  const reloadSection = document.createElement('div');
  reloadSection.className = 'about-reload';

  const reloadDesc = document.createElement('p');
  reloadDesc.className = 'about-reload-desc';
  reloadDesc.textContent = 'If the app feels out of date, clear its cache and reload.';

  const reloadBtn = document.createElement('button');
  reloadBtn.className = 'settings-reset-btn';
  reloadBtn.textContent = 'Force Reload';
  reloadBtn.addEventListener('click', async () => {
    reloadBtn.disabled = true;
    reloadBtn.textContent = 'Reloading\u2026';
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    window.location.reload();
  });

  reloadSection.appendChild(reloadDesc);
  reloadSection.appendChild(reloadBtn);

  wrap.appendChild(header);
  wrap.appendChild(body);
  wrap.appendChild(installSection);
  wrap.appendChild(reloadSection);
  wrap.appendChild(versionEl);
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
  pickerTitle.textContent = 'Choose icon';

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
    const list = filter
      ? iconList.filter(i => i.label.includes(filter.toLowerCase()) || i.icon.includes(filter.toLowerCase()))
      : iconList;
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
    // Scroll active icon into view
    const active = grid.querySelector('.icon-picker-item.active');
    if (active) active.scrollIntoView({ block: 'center' });
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

function _showEditModal({ label, icon, title, isDefault, onMakeDefault }, onSave) {
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

  // Icon field — inline mini picker
  const iconGroup = document.createElement('div');
  iconGroup.className = 'edit-field-group';
  const iconFieldLabel = document.createElement('label');
  iconFieldLabel.className = 'edit-field-label';
  iconFieldLabel.textContent = 'Icon';

  const miniGrid = document.createElement('div');
  miniGrid.className = 'edit-icon-mini-grid';

  function renderMiniGrid() {
    miniGrid.innerHTML = '';
    const fullMode = !!_config.ui.fullIconList;
    const iconList = fullMode ? ICONS_ALL : ICONS;
    // Show up to 17 icons from the list + "..." for full picker
    const preview = iconList.slice(0, 17);
    preview.forEach(({ icon: ic }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'edit-icon-mini-item' + (ic === currentIcon ? ' active' : '');
      btn.setAttribute('aria-label', ic);
      btn.innerHTML = `<i class="${ic}" aria-hidden="true"></i>`;
      btn.addEventListener('click', () => {
        currentIcon = ic;
        renderMiniGrid();
      });
      miniGrid.appendChild(btn);
    });
    // "..." more button
    const moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'edit-icon-mini-item edit-icon-mini-more' + (!preview.some(i => i.icon === currentIcon) && currentIcon ? ' active' : '');
    moreBtn.setAttribute('aria-label', 'More icons');
    // If current icon is not in preview, show it
    if (currentIcon && !preview.some(i => i.icon === currentIcon)) {
      moreBtn.innerHTML = `<i class="${currentIcon}" aria-hidden="true"></i>`;
    } else {
      moreBtn.innerHTML = '<i class="fas fa-ellipsis-h" aria-hidden="true"></i>';
    }
    moreBtn.addEventListener('click', () => {
      _showIconPicker(currentIcon, (newIcon) => {
        currentIcon = newIcon;
        renderMiniGrid();
        if (!overlay.parentNode) document.body.appendChild(overlay);
      });
    });
    miniGrid.appendChild(moreBtn);
  }

  renderMiniGrid();
  iconGroup.appendChild(iconFieldLabel);
  iconGroup.appendChild(miniGrid);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'edit-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => overlay.remove());

  // "Make default" button (urgency levels only)
  if (isDefault !== undefined) {
    const defaultBtn = document.createElement('button');
    defaultBtn.type = 'button';
    defaultBtn.className = 'btn btn-make-default' + (isDefault ? ' btn-make-default--active' : '');
    defaultBtn.textContent = isDefault ? 'Default ✓' : 'Make default';
    defaultBtn.disabled = isDefault;
    if (!isDefault && onMakeDefault) {
      defaultBtn.addEventListener('click', () => {
        overlay.remove();
        onMakeDefault();
      });
    }
    actions.appendChild(defaultBtn);
  }

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
