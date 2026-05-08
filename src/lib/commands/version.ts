import type { Command } from './types';

export const version: Command = {
  name: 'version',
  description: 'show build version',
  run(ctx) {
    ctx.print(`commit: ${ctx.buildCommitSha}`);
  },
};
