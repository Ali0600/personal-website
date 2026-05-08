import type { Command } from './types';
import { pathToString } from '../filesystem';

export const pwd: Command = {
  name: 'pwd',
  description: 'print working directory',
  run(ctx) {
    const p = pathToString(ctx.cwd);
    ctx.print(p === '/' ? '/' : p);
  },
};
