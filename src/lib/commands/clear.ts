import type { Command } from './types';

export const clear: Command = {
  name: 'clear',
  description: 'clear the screen',
  run(ctx) {
    ctx.clear();
  },
};
