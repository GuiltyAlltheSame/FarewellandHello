export function createLightbox(root) {
  const image = root.querySelector('#lightbox-image');
  const caption = root.querySelector('#lightbox-caption');
  const closeButton = root.querySelector('.lightbox__close');
  const previousButton = root.querySelector('[data-lightbox-previous]');
  const nextButton = root.querySelector('[data-lightbox-next]');
  let items = [];
  let index = 0;
  let returnFocus = null;

  const render = () => {
    const asset = items[index]?.asset ?? items[index];
    if (!asset) return;
    image.src = asset.image;
    image.alt = asset.alt;
    caption.replaceChildren();
    const hasMultipleItems = items.length > 1;
    previousButton.disabled = !hasMultipleItems;
    nextButton.disabled = !hasMultipleItems;
    previousButton.hidden = !hasMultipleItems;
    nextButton.hidden = !hasMultipleItems;
    caption.hidden = Boolean(asset.hideLightboxCaption);
    if (asset.hideLightboxCaption) {
      return;
    }
    if (asset.displayTitle) {
      const title = document.createElement('strong');
      title.textContent = asset.displayTitle;
      caption.append(title);
    }
    if (asset.displayMeta) {
      const date = document.createElement('span');
      date.textContent = asset.displayMeta;
      caption.append(date);
    }
  };

  const close = () => {
    if (root.hidden) return;
    root.hidden = true;
    image.removeAttribute('src');
    document.body.classList.remove('is-lightbox-open');
    document.removeEventListener('keydown', onKeyDown);
    returnFocus?.focus();
  };
  const move = (step) => {
    if (items.length < 2) return;
    index = (index + step + items.length) % items.length;
    render();
  };
  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
    if (event.key === 'Tab') {
      const focusable = [closeButton, previousButton, nextButton].filter((element) => !element.disabled);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  root.querySelectorAll('[data-close-lightbox]').forEach((element) => element.addEventListener('click', close));
  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));

  return {
    open(nextItems, nextIndex, trigger) {
      items = nextItems;
      index = nextIndex;
      returnFocus = trigger;
      render();
      root.hidden = false;
      document.body.classList.add('is-lightbox-open');
      document.addEventListener('keydown', onKeyDown);
      closeButton.focus();
    },
    close
  };
}
