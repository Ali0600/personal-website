import type { Command } from './types';

export const whoami: Command = {
  name: 'whoami',
  description: 'about me, in one line',
  run(ctx) {
    ctx.print('ali hassan — devops engineer', { cls: 'accent' });
  },
};
