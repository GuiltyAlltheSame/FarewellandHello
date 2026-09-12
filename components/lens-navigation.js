export function createLensNavigation(pages, onSelect, onOpenMenu) {
  let currentIndex = 0;
  let animationTimer = 0;
  let hasRendered = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const controls = document.createElement('nav');
  controls.className = 'page-controls';
  controls.setAttribute('aria-label', 'Навигация по книге');

  function makeButton(className, label, content) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('aria-label', label);
    button.innerHTML = content;
    return button;
  }

  const previous = makeButton('page-controls__button page-controls__button--previous', 'Предыдущая страница', '<span aria-hidden="true">←</span><span>Предыдущая</span>');
  const next = makeButton('page-controls__button page-controls__button--next', 'Следующая страница', '<span>Следующая</span><span aria-hidden="true">→</span>');

  const counter = document.createElement('button');
  counter.type = 'button';
  counter.className = 'page-counter';
  counter.setAttribute('aria-controls', 'chapter-menu');
  const track = document.createElement('span');
  track.className = 'page-counter__track';
  const strip = document.createElement('span');
  strip.className = 'page-counter__strip';
  track.append(strip);
  counter.append(track);
  controls.append(previous, counter, next);

  function makeNumber(value, className = '') {
    const number = document.createElement('span');
    number.className = `page-counter__number ${className}`;
    number.textContent = value;
    return number;
  }

  function renderNumber(index, animate) {
    const value = pages[index].number;
    counter.setAttribute('aria-label', `Страница ${Number(value)}. Открыть список страниц`);
    if (!animate || reducedMotion.matches) {
      strip.replaceChildren(makeNumber(value, 'page-counter__number--current'));
      counter.className = 'page-counter';
      return;
    }

    const previousValue = pages[currentIndex].number;
    const direction = index > currentIndex ? 'forward' : 'backward';
    clearTimeout(animationTimer);
    counter.className = `page-counter is-rolling page-counter--${direction}`;
    strip.replaceChildren(...(direction === 'forward'
      ? [makeNumber(previousValue), makeNumber(value)]
      : [makeNumber(value), makeNumber(previousValue)]
    ));
    animationTimer = window.setTimeout(() => {
      strip.replaceChildren(makeNumber(value, 'page-counter__number--current'));
      counter.className = 'page-counter';
    }, 270);
  }

  previous.addEventListener('click', () => {
    if (currentIndex > 0) onSelect(pages[currentIndex - 1].id);
  });
  next.addEventListener('click', () => {
    if (currentIndex < pages.length - 1) onSelect(pages[currentIndex + 1].id);
  });
  counter.addEventListener('click', () => onOpenMenu?.());

  return {
    update(index) {
      renderNumber(index, hasRendered && index !== currentIndex);
      currentIndex = index;
      hasRendered = true;
      previous.disabled = index === 0;
      next.disabled = index === pages.length - 1;
      return controls;
    }
  };
}
