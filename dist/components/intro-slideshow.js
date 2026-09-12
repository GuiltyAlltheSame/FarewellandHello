const SLIDE_INTERVAL = 6000;
const MOBILE_SLIDE_INTERVAL = 10000;
const PHOTO_IDS = [
  'p0934-01', 'p0942-01', 'p0952-01', 'p0956-01', 'p0960-01',
  'p0968-01', 'p1004-01', 'p1008-01', 'p1014-01', 'p1017-01'
];

export function createIntroSlideshow(intro, pages) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileViewport = window.matchMedia('(max-width: 700px)');
  const assets = new Map(pages.flatMap((page) => page.assets).map((asset) => [asset.id, asset]));
  const photos = PHOTO_IDS.map((id) => assets.get(id)).filter(Boolean);
  const layers = [...intro.querySelectorAll('.intro__slide')];
  const loaded = new Map();
  let current = 0;
  let activeLayer = 0;
  let timer;
  let advancing = false;
  layers[activeLayer].dataset.panDirection = 'left';

  function preload(index) {
    if (!loaded.has(index)) {
      const image = new Image();
      image.src = photos[index].image;
      loaded.set(index, image.decode().then(() => image).catch(() => {
        loaded.delete(index);
        return null;
      }));
    }
    return loaded.get(index);
  }

  function canPlay() {
    return !reducedMotion.matches && !intro.hidden && !document.hidden && photos.length > 1;
  }

  async function advance() {
    if (advancing) return;
    advancing = true;
    try {
    const next = (current + 1) % photos.length;
    const image = await preload(next);
    if (!image || !canPlay() || next !== (current + 1) % photos.length) return;
    const incoming = 1 - activeLayer;
    layers[incoming].src = image.src;
    layers[incoming].dataset.panDirection = next % 2 ? 'right' : 'left';
    try {
      await layers[incoming].decode();
    } catch {
      // The preloaded source remains usable if this browser rejects decode().
    }
    if (!canPlay() || next !== (current + 1) % photos.length) return;
    layers[incoming].classList.add('is-active');
    const outgoing = layers[activeLayer];
    outgoing.classList.add('is-leaving');
    window.setTimeout(() => outgoing.classList.remove('is-active', 'is-leaving'), 1600);
    activeLayer = incoming;
    current = next;
    void preload((current + 1) % photos.length);
    } finally {
      advancing = false;
    }
  }

  function refresh() {
    window.clearInterval(timer);
    if (canPlay()) {
      void preload((current + 1) % photos.length);
      timer = window.setInterval(advance, mobileViewport.matches ? MOBILE_SLIDE_INTERVAL : SLIDE_INTERVAL);
    }
  }

  document.addEventListener('visibilitychange', refresh);
  reducedMotion.addEventListener?.('change', refresh);
  mobileViewport.addEventListener?.('change', refresh);
  refresh();
  return { refresh };
}
