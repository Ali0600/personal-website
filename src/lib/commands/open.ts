import type { Command } from './types';
import { resolvePath, getNode } from '../filesystem';
import { formatLine } from './util';

export const open: Command = {
  name: 'open',
  description: 'open a project',
  usage: 'open <project-name>',
  run(ctx) {
    if (ctx.args.length === 0) {
      ctx.print('usage: open <project-name>', { cls: 'dim' });
      ctx.print('try: ls projects/', { cls: 'dim' });
      return;
    }
    const name = ctx.args[0];
    const candidates = [`projects/${name}.md`, `${name}.md`, name];
    for (const c of candidates) {
      const parts = resolvePath(ctx.cwd, c);
      const node = getNode(parts);
      if (node && node.type === 'file') {
        for (const line of node.content.split('\n')) {
          if (/^#{1,6}\s/.test(line)) {
            ctx.print(`<span class="accent">${formatLine(line)}</span>`, { html: true });
          } else {
            ctx.print(formatLine(line), { html: true });
          }
        }
        return;
      }
    }
    ctx.print(`open: ${name}: not found. try \`ls projects/\``, { cls: 'err' });
  },
};
