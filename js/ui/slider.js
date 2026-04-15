/**
 * slider.js — Urgency slider widget.
 *
 * Renders into a container element. Calls onChange(index) when the value changes.
 */

/**
 * Build and mount the urgency slider.
 *
 * @param {HTMLElement} container - Element to render into
 * @param {object[]} urgencyLevels - Array of { id, label, icon } (exactly 5)
 * @param {number} initialIndex - Starting position (0-based)
 * @param {function(number): void} onChange - Called with new index on change
 */
export function mountSlider(container, urgencyLevels, initialIndex, onChange) {
  container.innerHTML = '';
  container.classList.add('slider-widget');

  // --- Build gradient CSS from urgency colour vars ---
  const gradientStops = urgencyLevels
    .map((_, i) => `var(--urgency-${i})`)
    .join(', ');

  // Wrapper for the track + thumb layer
  const trackWrap = document.createElement('div');
  trackWrap.className = 'slider-track-wrap';

  // The real range input (invisible; handles interaction)
  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = String(urgencyLevels.length - 1);
  input.step = '1';
  input.value = String(initialIndex);
  input.className = 'slider-input';
  input.setAttribute('aria-label', 'Urgency level');

  // The visual track (gradient bar)
  const track = document.createElement('div');
  track.className = 'slider-track';
  track.style.background = `linear-gradient(to right, ${gradientStops})`;

  // The visual thumb (icon)
  const thumb = document.createElement('div');
  thumb.className = 'slider-thumb';

  // Tick marks + labels — absolutely positioned to match thumb centres exactly
  const ticksRow = document.createElement('div');
  ticksRow.className = 'slider-ticks';

  urgencyLevels.forEach((level, i) => {
    const pct = urgencyLevels.length > 1
      ? (i / (urgencyLevels.length - 1)) * 100
      : 50;

    const tick = document.createElement('div');
    tick.className = 'slider-tick';
    if (i === 0) tick.classList.add('slider-tick--first');
    if (i === urgencyLevels.length - 1) tick.classList.add('slider-tick--last');
    tick.style.left = `${pct}%`;

    const mark = document.createElement('span');
    mark.className = 'slider-tick-mark';

    const label = document.createElement('span');
    label.className = 'slider-tick-label';
    label.textContent = level.label;
    label.title = level.label;

    tick.appendChild(mark);
    tick.appendChild(label);
    ticksRow.appendChild(tick);
  });

  trackWrap.appendChild(track);
  trackWrap.appendChild(thumb);
  trackWrap.appendChild(input);

  container.appendChild(trackWrap);
  container.appendChild(ticksRow);

  // --- Update function ---
  function update(index) {
    const level = urgencyLevels[index];
    const pct = urgencyLevels.length > 1
      ? (index / (urgencyLevels.length - 1)) * 100
      : 50;

    // Position thumb
    thumb.style.left = `${pct}%`;

    // Update thumb icon
    thumb.innerHTML = `<i class="${level.icon}" aria-hidden="true"></i>`;

    // Set thumb background to the matching urgency colour
    thumb.style.backgroundColor = `var(--urgency-${index})`;
  }

  // --- Event handling ---
  input.addEventListener('input', () => {
    const index = parseInt(input.value, 10);
    update(index);
    onChange(index);

    // Haptic feedback — single 10ms pulse per tick
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  });

  // Initial render
  update(initialIndex);

  // Return a handle to update the slider programmatically
  return {
    setValue(index) {
      input.value = String(index);
      update(index);
    },
  };
}
