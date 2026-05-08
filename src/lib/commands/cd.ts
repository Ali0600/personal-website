import type { Command } from './types';
import { resolvePath, getNode } from '../filesystem';

export const cd: Command = {
  name: 'cd',
  description: 'change directory',
  usage: 'cd <path>',
  run(ctx) {
    const target = ctx.args[0] ?? '/';
    const parts = resolvePath(ctx.cwd, target);
    const node = getNode(parts);
    if (!node) {
      ctx.print(`cd: ${target}: no such file or directory`, { cls: 'err' });
      return;
    }
    if (node.type !== 'dir') {
      ctx.print(`cd: ${target}: not a directory`, { cls: 'err' });
      return;
    }
    ctx.setCwd(parts);
  },
};
