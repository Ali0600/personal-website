import type { Command } from './types';

export const echo: Command = {
  name: 'echo',
  description: 'print arguments',
  run(ctx) {
    ctx.print(ctx.args.join(' '));
  },
};
