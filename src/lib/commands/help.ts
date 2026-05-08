import type { Command } from './types';

export const help: Command = {
  name: 'help',
  description: 'show available commands',
  run(ctx) {
    const reg = ctx.registry();
    const cmds = Array.from(reg.values()).sort((a, b) => a.name.localeCompare(b.name));
    ctx.print('available commands:', { cls: 'dim' });
    ctx.print('');
    const padTo = Math.max(...cmds.map((c) => c.name.length)) + 2;
    for (const c of cmds) {
      ctx.print(`  ${c.name.padEnd(padTo)}${c.description}`);
    }
    ctx.print('');
    ctx.print('try: ls, cat about.md, open homelab, theme dracula', { cls: 'dim' });
  },
};
