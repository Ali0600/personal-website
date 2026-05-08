export type Theme = {
  name: string;
  bg: string;
  fg: string;
  accent: string;
  dim: string;
  selection: string;
};

export const themes: Record<string, Theme> = {
  default: {
    name: 'default',
    bg: '#0a0e0a',
    fg: '#33ff66',
    accent: '#7fffaa',
    dim: '#2a8c44',
    selection: '#33ff6633',
  },
  solarized: {
    name: 'solarized',
    bg: '#002b36',
    fg: '#93a1a1',
    accent: '#b58900',
    dim: '#586e75',
    selection: '#b5890033',
  },
  dracula: {
    name: 'dracula',
    bg: '#282a36',
    fg: '#f8f8f2',
    accent: '#bd93f9',
    dim: '#6272a4',
    selection: '#bd93f944',
  },
};

export const THEME_STORAGE_KEY = 'terminal-theme';

export function applyTheme(name: string): boolean {
  const theme = themes[name];
  if (!theme) return false;
  const root = document.documentElement;
  root.style.setProperty('--term-bg', theme.bg);
  root.style.setProperty('--term-fg', theme.fg);
  root.style.setProperty('--term-accent', theme.accent);
  root.style.setProperty('--term-dim', theme.dim);
  root.style.setProperty('--term-selection', theme.selection);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, name);
  } catch {
    /* storage may be disabled */
  }
  return true;
}

export function loadInitialTheme(): string {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && themes[saved]) {
      applyTheme(saved);
      return saved;
    }
  } catch {
    /* ignore */
  }
  applyTheme('default');
  return 'default';
}

export function listThemes(): string[] {
  return Object.keys(themes);
}
