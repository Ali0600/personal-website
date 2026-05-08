import type { Command } from './types';
import { resolvePath, getNode } from '../filesystem';
import { formatLine } from './util';

export const cat: Command = {
  name: 'cat',
  description: 'print file contents',
  usage: 'cat <file>',
  run(ctx) {
    if (ctx.args.length === 0) {
      ctx.print('usage: cat <file>', { cls: 'dim' });
      return;
    }
    for (const target of ctx.args) {
      const parts = resolvePath(ctx.cwd, target);
      const node = getNode(parts);
      if (!node) {
        ctx.print(`cat: ${target}: no such file or directory`, { cls: 'err' });
        continue;
      }
      if (node.type === 'dir') {
        ctx.print(`cat: ${target}: is a directory`, { cls: 'err' });
        continue;
      }
      const lines = node.content.split('\n');
      for (const line of lines) {
        if (/^#{1,6}\s/.test(line)) {
          ctx.print(`<span class="accent">${formatLine(line)}</span>`, { html: true });
        } else {
          ctx.print(formatLine(line), { html: true });
        }
      }
    }
  },
};
