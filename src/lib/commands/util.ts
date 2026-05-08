export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const URL_RE = /https?:\/\/[^\s<>"]+/g;

export function linkify(s: string): string {
  return s.replace(
    URL_RE,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
  );
}

export function formatLine(s: string): string {
  return linkify(escapeHtml(s));
}
