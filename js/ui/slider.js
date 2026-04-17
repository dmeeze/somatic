/**
 * slider.js — Urgency slider widget.
 * Supports horizontal (default) and vertical orientations.
 */

/**
 * Build and mount the urgency slider.
 *
 * @param {HTMLElement} container
 * @param {object[]} urgencyLevels
 * @param {number} initialIndex
 * @param {function(number): void} onChange
 * @param {object} [options]
 * @param {boolean} [options.vertical=false] - Render as a vertical strip
 */
export function mountSlider(container, urgencyLevels, initialIndex, onChange, { vertical = false } = {}) {
  container.innerHTML = '';
  container.classList.add('slider-widget');
  if (vertical) container.classList.add('slider-widget--vertical');

  const gradientStops = urgencyLevels.map((_, i) => `var(--urgency-${i})`).join(', ');
  const gradientDirection = vertical ? 'to bottom' : 'to right';

  const trackWrap = document.createElement('div');
  trackWrap.className = 'slider-track-wrap';
  if (vertical) trackWrap.classList.add('slider-track-wrap--vertical');

  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = String(urgencyLevels.length - 1);
  input.step = '1';
  input.value = String(initialIndex);
  input.className = 'slider-input';
  input.setAttribute('aria-label', 'Urgency level');
  if (vertical) {
    input.classList.add('slider-input--vertical');
    // writing-mode makes range inputs render and interact vertically
    input.style.writingMode = 'vertical-lr';
    input.style.direction = 'ltr';
  }

  const track = document.createElement('div');
  track.className = 'slider-track';
  track.style.background = `linear-gradient(${gradientDirection}, ${gradientStops})`;

  const thumb = document.createElement('div');
  thumb.className = 'slider-thumb';

  urgencyLevels.forEach((_, i) => {
    const pct = urgencyLevels.length > 1 ? (i / (urgencyLevels.length - 1)) * 100 : 50;
    const dot = document.createElement('span');
    dot.className = 'slider-dot';
    dot.setAttribute('aria-hidden', 'true');
    if (vertical) {
      dot.style.top = `${pct}%`;
      dot.style.left = '50%';
      dot.style.transform = 'translateX(-50%) translateY(-50%)';
    } else {
      dot.style.left = `${pct}%`;
      dot.style.transform = 'translateX(-50%) translateY(-50%)';
    }
    trackWrap.appendChild(dot);
  });

  const currentLabel = document.createElement('span');
  currentLabel.className = 'slider-current-label';

  trackWrap.appendChild(track);
  trackWrap.appendChild(thumb);
  trackWrap.appendChild(input);
  container.appendChild(currentLabel);
  container.appendChild(trackWrap);

  function update(index) {
    const level = urgencyLevels[index];
    const pct = urgencyLevels.length > 1 ? (index / (urgencyLevels.length - 1)) * 100 : 50;

    if (vertical) {
      thumb.style.top = `${pct}%`;
      thumb.style.left = '50%';
      thumb.style.transform = 'translateX(-50%) translateY(-50%)';
    } else {
      thumb.style.left = `${pct}%`;
    }

    thumb.innerHTML = `<i class="${level.icon}" aria-hidden="true"></i>`;
    thumb.style.backgroundColor = `var(--urgency-${index})`;
    currentLabel.textContent = level.label;
  }

  input.addEventListener('input', () => {
    const index = parseInt(input.value, 10);
    update(index);
    onChange(index);
    if (navigator.vibrate) navigator.vibrate(10);
  });

  update(initialIndex);

  return {
    setValue(index) {
      input.value = String(index);
      update(index);
    },
  };
}
