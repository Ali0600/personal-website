import type { Command } from './types';
import { resolvePath, getNode, type DirNode } from '../filesystem';

function renderTree(node: DirNode, prefix = ''): string[] {
  const out: string[] = [];
  const entries = Object.values(node.children).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (let i = 0; i < entries.length; i++) {
    const child = entries[i];
    const isLast = i === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const label = child.type === 'dir' ? `${child.name}/` : child.name;
    out.push(prefix + connector + label);
    if (child.type === 'dir') {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      out.push(...renderTree(child, nextPrefix));
    }
  }
  return out;
}

export const tree: Command = {
  name: 'tree',
  description: 'print directory tree',
  usage: 'tree [path]',
  run(ctx) {
    const target = ctx.args[0] ?? '.';
    const parts = resolvePath(ctx.cwd, target);
    const node = getNode(parts);
    if (!node) {
      ctx.print(`tree: ${target}: no such file or directory`, { cls: 'err' });
      return;
    }
    if (node.type !== 'dir') {
      ctx.print(node.name);
      return;
    }
    ctx.print(target === '.' ? '.' : target);
    for (const line of renderTree(node)) ctx.print(line);
  },
};
