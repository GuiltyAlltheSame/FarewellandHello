export function renderChapterNavigation(container, pages, activeId, onSelect, getChapterName) {
  container.replaceChildren();
  const title = document.createElement('p');
  title.className = 'chapter-menu__title';
  title.textContent = 'Страницы';
  container.append(title);
  let list;
  let currentChapterName;

  pages.forEach((page) => {
    const chapterName = getChapterName(page);
    if (!list || chapterName !== currentChapterName) {
      list = document.createElement('ol');
      list.className = 'chapter-menu__list';
      list.start = Number(page.number);
      if (chapterName) {
        const heading = document.createElement('h2');
        heading.className = 'chapter-menu__heading';
        heading.id = `menu-chapter-${page.id}`;
        heading.textContent = chapterName;
        list.setAttribute('aria-labelledby', heading.id);
        container.append(heading);
      }
      container.append(list);
      currentChapterName = chapterName;
    }
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chapter-menu__item';
    button.dataset.pageId = page.id;
    const number = document.createElement('span');
    number.className = 'chapter-menu__number';
    number.textContent = page.number;
    const label = document.createElement('span');
    label.className = 'chapter-menu__label';
    label.textContent = page.menuTitle;
    button.title = page.fullTitle;
    button.append(number, ' ', label);
    button.setAttribute('aria-current', page.id === activeId ? 'page' : 'false');
    button.addEventListener('click', () => onSelect(page.id));
    item.append(button);
    list.append(item);
  });
}

export function updateChapterNavigation(container, activeId) {
  container.querySelectorAll('.chapter-menu__item').forEach((button) => {
    button.setAttribute('aria-current', button.dataset.pageId === activeId ? 'page' : 'false');
  });
}
