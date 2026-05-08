import type { Command } from './types';

export const resume: Command = {
  name: 'resume',
  description: 'open resume PDF in a new tab',
  run(ctx) {
    const url = '/resume.pdf';
    ctx.print(`opening ${url} ...`);
    window.open(url, '_blank', 'noopener,noreferrer');
  },
};
