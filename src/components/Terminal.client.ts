import { buildRegistry, PATH_COMMANDS } from '../lib/commands';
import type { CommandContext } from '../lib/commands/types';
import { applyTheme, loadInitialTheme } from '../lib/themes';
import { resolvePath, getNode, listDirEntries } from '../lib/filesystem';
import { escapeHtml } from '../lib/commands/util';

const HISTORY_KEY = 'terminal-history';
const HISTORY_MAX = 200;

export function mountTerminal(rootEl: HTMLElement): void {
  rootEl.innerHTML = '';
  rootEl.classList.add('term');

  const output = document.createElement('div');
  output.className = 'term-output';
  rootEl.appendChild(output);

  const promptLine = document.createElement('div');
  promptLine.className = 'term-prompt-line';

  const promptSpan = document.createElement('span');
  promptSpan.className = 'term-prompt';
  promptLine.appendChild(promptSpan);

  const input = document.createElement('input');
  input.className = 'term-input';
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('autocapitalize', 'off');
  input.setAttribute('autocorrect', 'off');
  input.setAttribute('aria-label', 'terminal input');
  promptLine.appendChild(input);
  rootEl.appendChild(promptLine);

  let cwd: string[] = [];
  const registry = buildRegistry();
  let history: string[] = loadHistory();
  let historyIndex = history.length;
  let stash = '';

  loadInitialTheme();
  updatePrompt();

  function loadHistory(): string[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(-HISTORY_MAX);
    } catch {
      /* ignore */
    }
    return [];
  }

  function saveHistory(): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-HISTORY_MAX)));
    } catch {
      /* ignore */
    }
  }

  function cwdString(): string {
    return cwd.length === 0 ? '/' : '/' + cwd.join('/');
  }

  function updatePrompt(): void {
    promptSpan.textContent = `ali@portfolio:${cwdString()}$ `;
  }

  function appendOutput(html: string, cls?: string): void {
    const div = document.createElement('div');
    div.className = 'term-line';
    if (cls) div.classList.add(`term-${cls}`);
    div.innerHTML = html;
    output.appendChild(div);
  }

  function printLine(line: string, opts: { html?: boolean; cls?: string } = {}): void {
    appendOutput(opts.html ? line : escapeHtml(line), opts.cls);
  }

  function clearScreen(): void {
    output.innerHTML = '';
  }

  function scrollToBottom(): void {
    rootEl.scrollTop = rootEl.scrollHeight;
  }

  function recordCommandLine(line: string): void {
    appendOutput(
      `<span class="term-prompt">ali@portfolio:${escapeHtml(cwdString())}$ </span><span>${escapeHtml(line)}</span>`,
    );
  }

  function ctxFor(args: string[], raw: string): CommandContext {
    return {
      cwd: [...cwd],
      setCwd: (parts) => {
        cwd = parts;
        updatePrompt();
      },
      print: printLine,
      clear: clearScreen,
      args,
      raw,
      registry: () => registry,
      setTheme: (name) => applyTheme(name),
      buildCommitSha: import.meta.env.PUBLIC_COMMIT_SHA ?? 'dev',
    };
  }

  function tokenize(s: string): string[] {
    return s
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  async function runCommand(line: string): Promise<void> {
    recordCommandLine(line);
    const tokens = tokenize(line);
    if (tokens.length === 0) return;
    const [name, ...args] = tokens;
    const cmd = registry.get(name);
    if (!cmd) {
      printLine(`${name}: command not found. try \`help\`.`, { cls: 'err' });
      return;
    }
    try {
      await cmd.run(ctxFor(args, line));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      printLine(`error: ${msg}`, { cls: 'err' });
    }
  }

  function commonPrefix(strs: string[]): string {
    if (strs.length === 0) return '';
    let p = strs[0];
    for (let i = 1; i < strs.length; i++) {
      while (!strs[i].startsWith(p)) {
        p = p.slice(0, -1);
        if (p.length === 0) return '';
      }
    }
    return p;
  }

  function completePaths(prefix: string): string[] {
    const slashIdx = prefix.lastIndexOf('/');
    const dirPart = slashIdx === -1 ? '.' : prefix.slice(0, slashIdx + 1) || '/';
    const filePart = slashIdx === -1 ? prefix : prefix.slice(slashIdx + 1);
    const baseParts = resolvePath(cwd, dirPart);
    const node = getNode(baseParts);
    if (!node || node.type !== 'dir') return [];
    return listDirEntries(node)
      .filter((e) => e.name.startsWith(filePart))
      .map((e) => e.name + (e.isDir ? '/' : ''));
  }

  function handleTab(): void {
    const value = input.value;
    const cursor = input.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const lastSpace = before.lastIndexOf(' ');
    const lastToken = before.slice(lastSpace + 1);
    const beforeToken = before.slice(0, lastSpace + 1);
    const isFirstToken = beforeToken.trim().length === 0;

    if (isFirstToken) {
      const candidates = Array.from(registry.keys()).filter((n) => n.startsWith(lastToken));
      if (candidates.length === 0) return;
      if (candidates.length === 1) {
        const replaced = beforeToken + candidates[0] + ' ';
        input.value = replaced + after;
        input.setSelectionRange(replaced.length, replaced.length);
        return;
      }
      const prefix = commonPrefix(candidates);
      if (prefix.length > lastToken.length) {
        const replaced = beforeToken + prefix;
        input.value = replaced + after;
        input.setSelectionRange(replaced.length, replaced.length);
      }
      recordCommandLine(input.value);
      appendOutput(escapeHtml(candidates.sort().join('  ')));
      scrollToBottom();
      return;
    }

    const firstTok = tokenize(beforeToken)[0];
    if (!firstTok || !PATH_COMMANDS.has(firstTok)) return;

    const matches = completePaths(lastToken);
    if (matches.length === 0) return;
    const slashIdx = lastToken.lastIndexOf('/');
    const dirPart = slashIdx === -1 ? '' : lastToken.slice(0, slashIdx + 1);
    const filePart = slashIdx === -1 ? lastToken : lastToken.slice(slashIdx + 1);

    if (matches.length === 1) {
      const replaced = beforeToken + dirPart + matches[0];
      input.value = replaced + after;
      input.setSelectionRange(replaced.length, replaced.length);
      return;
    }
    const prefix = commonPrefix(matches);
    if (prefix.length > filePart.length) {
      const replaced = beforeToken + dirPart + prefix;
      input.value = replaced + after;
      input.setSelectionRange(replaced.length, replaced.length);
    }
    recordCommandLine(input.value);
    appendOutput(escapeHtml(matches.join('  ')));
    scrollToBottom();
  }

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const line = input.value;
      input.value = '';
      if (line.trim().length > 0) {
        history.push(line);
        if (history.length > HISTORY_MAX) history = history.slice(-HISTORY_MAX);
        saveHistory();
      }
      historyIndex = history.length;
      stash = '';
      await runCommand(line);
      scrollToBottom();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      if (historyIndex === history.length) stash = input.value;
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex] ?? '';
      requestAnimationFrame(() => {
        input.setSelectionRange(input.value.length, input.value.length);
      });
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < history.length) {
        historyIndex += 1;
        input.value = historyIndex === history.length ? stash : (history[historyIndex] ?? '');
        requestAnimationFrame(() => {
          input.setSelectionRange(input.value.length, input.value.length);
        });
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      handleTab();
      return;
    }
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      clearScreen();
      return;
    }
    if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      recordCommandLine(input.value);
      input.value = '';
      historyIndex = history.length;
      scrollToBottom();
      return;
    }
  });

  rootEl.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') return;
    input.focus();
  });

  const banner = [
    '',
    '  ali.dev portfolio terminal',
    '  type `help` for commands, or try `ls`, `cat about.md`, `open homelab`',
    '',
  ];
  for (const line of banner) appendOutput(escapeHtml(line), 'dim');

  input.focus();
  scrollToBottom();
}
