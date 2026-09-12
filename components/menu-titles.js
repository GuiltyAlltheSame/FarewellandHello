// Keep initials and author ellipses intact; shorten only at a word boundary.
export function formatMenuTitle(value) {
  const title = value.replace(/\s+/gu, ' ').trim().replace(/(?<!\.)\.$/u, '');
  if (title.length <= 76) return title;
  const prefix = title.slice(0, 73);
  const boundary = /\s/u.test(title[73]) ? prefix.length : prefix.lastIndexOf(' ');
  const shortened = boundary > 0 ? prefix.slice(0, boundary) : prefix;
  return `${shortened.replace(/[\s,;:—–-]+$/gu, '')}…`;
}
