import type { Command } from './types';
import { listThemes } from '../themes';

export const theme: Command = {
  name: 'theme',
  description: 'switch color theme',
  usage: 'theme [name]',
  run(ctx) {
    if (ctx.args.length === 0) {
      ctx.print(`themes: ${listThemes().join(', ')}`);
      ctx.print('usage: theme <name>', { cls: 'dim' });
      return;
    }
    const name = ctx.args[0];
    const ok = ctx.setTheme(name);
    if (!ok) {
      ctx.print(`theme: ${name}: unknown theme`, { cls: 'err' });
      ctx.print(`available: ${listThemes().join(', ')}`, { cls: 'dim' });
      return;
    }
    ctx.print(`theme set to ${name}`, { cls: 'accent' });
  },
};
