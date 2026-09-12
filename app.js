import { project, pages } from './data/site-data.js';
import { renderChapterNavigation, updateChapterNavigation } from './components/navigation.js';
import { createLightbox } from './components/lightbox.js';
import { createIntroSlideshow } from './components/intro-slideshow.js';
import { formatMenuTitle } from './components/menu-titles.js';
import { createLensNavigation } from './components/lens-navigation.js';

const intro = document.querySelector('#intro');
const introSlideshow = createIntroSlideshow(intro, pages);
const pageView = document.querySelector('#chapter-view');
const menu = document.querySelector('#chapter-menu');
const menuToggle = document.querySelector('#menu-toggle');
const aboutPanel = document.querySelector('#about-panel');
const aboutToggle = document.querySelector('#about-toggle');
const themeToggle = document.querySelector('#theme-toggle');
const lightboxRoot = document.querySelector('#lightbox');
const lightbox = createLightbox(lightboxRoot);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const duplicatePageRedirects = {
  "page_0933": "page_0931",
  "page_0944": "page_0943",
  "page_0948": "page_0947",
  "page_0950": "page_0947",
  "page_0961": "page_0963",
  "page_0964": "page_0966",
  "page_0970": "page_0971",
  "page_0973": "page_0974",
  "page_1011": "page_1010",
  "page_1033": "page_1032",
  "page_1038": "page_1036",
  "page_1040": "page_1039"
};
pages.forEach((page, index) => {
  page.number = String(index + 1).padStart(2, '0');
  const template = document.querySelector(`#${page.id}-text`);
  const heading = template?.content.querySelector('h2');
  page.fullTitle = heading?.textContent.trim() || page.title;
  page.menuTitle = formatMenuTitle(heading?.dataset.menuTitle || page.fullTitle);
});

const introPageCount = document.querySelector('#intro-page-count');
if (introPageCount) introPageCount.textContent = String(pages.length);

let activePageId = pages[0].id;
const lensNavigation = createLensNavigation(pages, (id) => {
  openPage(id);
}, () => setExpanded(menuToggle, menu, true));

function getChapterName(page) {
  const sourcePage = Number(page.sourcePage);
  if (sourcePage === 929) return 'От издательства';
  if (sourcePage === 930) return 'В каждом кадре - жизнь';
  if (sourcePage <= 946) return 'Сны из детства';
  if (sourcePage <= 960) return 'Мужание';
  if (sourcePage <= 1002) return 'Люди и дело';
  if (sourcePage <= 1021) return 'Малая родина';
  if (sourcePage === 1045) return 'Авторы';
  if (sourcePage >= 1032) return 'Новая эпоха';
  return 'Память';
}

function getPhotoOverrides(page) {
  const template = document.querySelector(`#${page.id}-text`);
  if (!(template instanceof HTMLTemplateElement)) return new Map();
  const overrides = new Map();
  template.content.querySelectorAll('[data-photo-id]').forEach((field) => {
    const assetId = field.dataset.photoId;
    if (!assetId) return;
    overrides.set(assetId, {
      title: field.dataset.photoTitle?.trim() ?? '',
      place: field.dataset.photoPlace?.trim() ?? '',
      year: field.dataset.photoYear?.trim() ?? ''
    });
  });
  return overrides;
}

function splitCaption(caption) {
  return caption
    .split(/(?<=[.!?…])\s+/u)
    .filter(Boolean)
    .reduce((parts, part) => {
      const previousPart = parts.at(-1) || '';
      if (/(?:^|\s)(?:г|с|п|р|д|ст|им)\.$/iu.test(previousPart)) {
        parts[parts.length - 1] = `${previousPart} ${part}`;
      } else {
        parts.push(part);
      }
      return parts;
    }, []);
}

function getPhotoDisplay(asset, overrides) {
  const customLocations = {
    '0931': 'Находка',
    '0932': 'Сахалин',
    '0935': 'с. Золотая Долина',
    '0936': 'Сахалин. с. Троицкое',
    '0938': 'Сахалин. г. Долинск',
    '0941': 'Приморье, Михайловский район. с. Осиновка'
  };
  const customTitles = {
    '0936': 'Подпасок.',
    '0937': 'Все начиналось с неуменья.',
    '0938': 'Городские школяры.',
    '0941': 'У околицы родного села.'
  };
  const caption = (asset.caption || '').trim();
  const parts = splitCaption(caption);
  const lastPart = parts.at(-1)?.replace(/[.!?…]+$/u, '').trim() || '';
  const locationPattern = /(?:Приморье|Сахалин|Владивосток|Находка|Южно-Сахалинск|Долинск|Невельск|Дальнереченск|Дальнегорск|Спасск|Екатериновка|Осиновка|Троицкое|Владимиро-Александровское|Золотая Долина|Рында|Джигит|Анучинский|Михайловский|Хорольский|леспромхоз|НСРЗ|Дальзавод|ПСРЗ|район|залив|бухта|г\.|с\.)/iu;
  const fallbackLocation = customLocations[asset.sourcePage]
    ?? (parts.length > 1 && locationPattern.test(lastPart) ? lastPart : '');
  const fallbackTitle = customTitles[asset.sourcePage] ?? (fallbackLocation && parts.length > 1
    ? parts.slice(0, -1).join(' ').trim()
    : caption);
  const override = overrides.get(asset.id);
  const location = override ? override.place : fallbackLocation;
  const title = override ? override.title : fallbackTitle;
  const date = override ? override.year : asset.date;
  return {
    ...asset,
    displayTitle: override ? title : (title || asset.alt || caption),
    displayMeta: [location, date].filter(Boolean).join(', ')
  };
}

document.querySelector('#project-intro').textContent = project.intro;

function setExpanded(button, panel, expanded) {
  button.setAttribute('aria-expanded', String(expanded));
  panel.hidden = !expanded;
  if (!expanded) return;
  const currentPage = panel.querySelector('.chapter-menu__item[aria-current="page"]');
  if (!(currentPage instanceof HTMLButtonElement)) return;
  requestAnimationFrame(() => {
    currentPage.scrollIntoView({ block: 'center', inline: 'nearest', behavior: prefersReducedMotion.matches ? 'auto' : 'smooth' });
    currentPage.focus({ preventScroll: true });
  });
}

function setAboutExpanded(expanded) {
  aboutToggle.setAttribute('aria-expanded', String(expanded));
  aboutPanel.hidden = !expanded;
}

function setDarkTheme(enabled) {
  document.body.classList.toggle('theme-dark', enabled);
  themeToggle.setAttribute('aria-pressed', String(enabled));
  const label = enabled ? 'Включить светлую тему' : 'Включить тёмную тему';
  themeToggle.setAttribute('aria-label', label);
  themeToggle.title = label;
  try {
    localStorage.setItem('hello-again-theme', enabled ? 'dark' : 'light');
  } catch {
    // The reader still works when storage is unavailable.
  }
}

function makePhotoButton(asset, index, variant, pageAssets) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = variant;
  button.dataset.assetId = asset.id;
  button.setAttribute('aria-label', `Открыть фотографию: ${asset.alt}`);
  const image = document.createElement('img');
  image.src = asset.image;
  image.width = asset.width;
  image.height = asset.height;
  image.alt = asset.alt;
  image.decoding = 'async';
  if (index > 0) image.loading = 'lazy';
  const label = document.createElement('span');
  label.className = `${variant}__label`;
  label.textContent = asset.displayMeta;
  button.append(image);
  if (asset.displayMeta) button.append(label);
  button.addEventListener('click', () => lightbox.open(pageAssets, index, button));
  return button;
}

function renderVisual(page) {
  const visual = document.createElement('section');
  visual.className = `book-page__visual book-page__visual--${page.layout}`;
  visual.setAttribute('aria-label', `Фотографии со страницы ${page.sourcePage}`);
  const photoOverrides = getPhotoOverrides(page);
  const displayAssets = page.assets.map((asset) => getPhotoDisplay(asset, photoOverrides));

  if (page.layout === 'collage') {
    const board = document.createElement('div');
    board.className = 'collage-board';
    if (['page_0929', 'page_0930'].includes(page.id)) board.classList.add('collage-board--untitled');
    if (page.id === 'page_0930') board.classList.add('collage-board--seven');
    if (page.id === 'page_0958') board.classList.add('collage-board--feature-pair');
    if (['page_0978', 'page_1013'].includes(page.id)) board.classList.add('collage-board--feature-pair', 'collage-board--feature-pair--portrait-right');
    if (page.id === 'page_0972') board.classList.add('collage-board--feature-pair', 'collage-board--feature-pair--reverse');
    if (page.id === 'page_1036') board.classList.add('collage-board--feature-pair', 'collage-board--feature-pair--twin-portrait');
    const rotations = ['page_0929', 'page_0930', 'page_0958', 'page_0972', 'page_0978', 'page_1013', 'page_1036'].includes(page.id)
      ? ['-1.15deg', '.85deg', '-.5deg', '1.35deg', '-.85deg', '.55deg', '-1deg']
      : ['-2.5deg', '1.8deg', '-1deg', '2.7deg', '-1.7deg', '1.1deg', '-2deg'];
    const hoverOffsets = [
      ['2px', '-9px', '.6deg'],
      ['-1px', '-7px', '.35deg'],
      ['3px', '-10px', '-.45deg'],
      ['-2px', '-8px', '.55deg'],
      ['1px', '-6px', '-.3deg'],
      ['-3px', '-11px', '.4deg'],
      ['2px', '-7px', '-.2deg']
    ];
    displayAssets.forEach((asset, index) => {
      const photo = makePhotoButton(asset, index, 'collage-photo', displayAssets);
      photo.style.setProperty('--rotation', rotations[index % rotations.length]);
      const [hoverX, hoverY, hoverTilt] = hoverOffsets[index % hoverOffsets.length];
      photo.style.setProperty('--hover-x', hoverX);
      photo.style.setProperty('--hover-y', hoverY);
      photo.style.setProperty('--hover-tilt', hoverTilt);
      photo.style.setProperty('--order', index);
      board.append(photo);
    });
    visual.append(board);
  } else if (page.assets.length) {
    const photo = makePhotoButton(displayAssets[0], 0, 'feature-photo', displayAssets);
    if (page.id === 'page_1032') photo.classList.add('feature-photo--color-to-bw');
    visual.append(photo);
  } else {
    const empty = document.createElement('p');
    empty.className = 'book-page__empty';
    empty.textContent = 'На этой странице отдельная фотография не выделена.';
    visual.append(empty);
  }
  return visual;
}

function renderText(page) {
  const panel = document.createElement('section');
  panel.className = 'book-page__text';
  const textTemplate = document.querySelector(`#${page.id}-text`);
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = getChapterName(page);
  const text = document.createElement('div');
  text.className = 'ocr-text ocr-text--structured';
  if (textTemplate instanceof HTMLTemplateElement) {
    text.append(textTemplate.content.cloneNode(true));
  } else {
    text.textContent = 'Материал страницы недоступен.';
  }
  panel.append(eyebrow, text);
  return panel;
}

function renderControls(index) {
  return lensNavigation.update(index);
}

function scrollBehavior() {
  return prefersReducedMotion.matches ? 'auto' : 'smooth';
}

function renderPage(id, updateUrl = true) {
  const index = pages.findIndex((page) => page.id === id);
  if (index < 0) return;
  const page = pages[index];
  activePageId = page.id;
  pageView.replaceChildren();
  const article = document.createElement('article');
  article.className = `book-page layout--${page.layout}`;
  article.dataset.sourcePage = page.sourcePage;
  article.append(renderVisual(page), renderText(page), renderControls(index));
  pageView.append(article);
  document.title = `${page.number} — ${page.title} · ${project.title}`;
  if (updateUrl && window.location.hash !== `#${page.id}`) history.pushState(null, '', `#${page.id}`);
  updateChapterNavigation(menu, activePageId);
}

function focusPageHeading() {
  const heading = pageView.querySelector('.book-page__text h2');
  if (!(heading instanceof HTMLElement)) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

function openPage(id, { shouldScroll = true, updateUrl = true, focus = true } = {}) {
  setAboutExpanded(false);
  intro.hidden = true;
  introSlideshow.refresh();
  pageView.hidden = false;
  document.body.classList.add('is-reading');
  renderPage(id, updateUrl);
  if (shouldScroll) pageView.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  if (focus) requestAnimationFrame(focusPageHeading);
}

function showIntro({ updateUrl = true } = {}) {
  lightbox.close();
  intro.hidden = false;
  introSlideshow.refresh();
  pageView.hidden = true;
  document.body.classList.remove('is-reading');
  document.title = project.title;
  if (updateUrl && window.location.hash !== '#intro') history.pushState(null, '', '#intro');
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
}

document.querySelector('#start-reading').addEventListener('click', () => openPage(activePageId));
document.querySelector('.wordmark').addEventListener('click', (event) => {
  event.preventDefault();
  showIntro();
});
menuToggle.addEventListener('click', () => {
  setAboutExpanded(false);
  setExpanded(menuToggle, menu, menu.hidden);
});
aboutToggle.addEventListener('click', () => {
  const willOpen = aboutPanel.hidden;
  setExpanded(menuToggle, menu, false);
  setAboutExpanded(willOpen);
});
themeToggle.addEventListener('click', () => setDarkTheme(!document.body.classList.contains('theme-dark')));
document.addEventListener('click', (event) => {
  if (!menu.hidden && !menu.contains(event.target) && !menuToggle.contains(event.target) && !event.target.closest('.page-counter')) {
    setExpanded(menuToggle, menu, false);
  }
  if (!aboutPanel.hidden && !aboutPanel.contains(event.target) && !aboutToggle.contains(event.target)) {
    setAboutExpanded(false);
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setExpanded(menuToggle, menu, false);
    setAboutExpanded(false);
  }
  if (!lightboxRoot.hidden || pageView.hidden || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, summary, [contenteditable="true"]')) return;
  const index = pages.findIndex((page) => page.id === activePageId);
  if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault();
    openPage(pages[index - 1].id);
  }
  if (event.key === 'ArrowRight' && index < pages.length - 1) {
    event.preventDefault();
    openPage(pages[index + 1].id);
  }
});

function resolveHashPage() {
  const requestedPageId = window.location.hash.slice(1);
  const pageId = duplicatePageRedirects[requestedPageId] ?? requestedPageId;
  return pages.find((page) => page.id === pageId);
}

try {
  setDarkTheme(localStorage.getItem('hello-again-theme') === 'dark');
} catch {
  setDarkTheme(false);
}
renderChapterNavigation(menu, pages, activePageId, (selectedId) => {
  setExpanded(menuToggle, menu, false);
  openPage(selectedId);
}, (page) => {
  const sourcePage = Number(page.sourcePage);
  return sourcePage > 930 && sourcePage < 1045 ? getChapterName(page) : null;
});

const hashPage = resolveHashPage();
if (hashPage) {
  openPage(hashPage.id, { shouldScroll: false, updateUrl: false, focus: false });
} else {
  intro.hidden = false;
  pageView.hidden = true;
  document.title = project.title;
}

function syncFromLocation() {
  const page = resolveHashPage();
  if (page) {
    if (page.id !== activePageId || pageView.hidden) openPage(page.id, { shouldScroll: false, updateUrl: false, focus: false });
  } else if (!pageView.hidden) {
    showIntro({ updateUrl: false });
  }
}
window.addEventListener('popstate', syncFromLocation);
window.addEventListener('hashchange', syncFromLocation);
