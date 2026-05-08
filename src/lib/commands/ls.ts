import type { Command } from './types';
import { resolvePath, getNode, listDirEntries } from '../filesystem';

export const ls: Command = {
  name: 'ls',
  description: 'list directory contents',
  usage: 'ls [path]',
  run(ctx) {
    const target = ctx.args[0] ?? '.';
    const parts = resolvePath(ctx.cwd, target);
    const node = getNode(parts);
    if (!node) {
      ctx.print(`ls: ${target}: no such file or directory`, { cls: 'err' });
      return;
    }
    if (node.type === 'file') {
      ctx.print(node.name);
      return;
    }
    const entries = listDirEntries(node);
    if (entries.length === 0) {
      ctx.print('(empty)', { cls: 'dim' });
      return;
    }
    const formatted = entries
      .map((e) => (e.isDir ? `<span class="dir">${e.name}/</span>` : e.name))
      .join('  ');
    ctx.print(formatted, { html: true });
  },
};
