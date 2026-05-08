import type { Command } from './types';
import { help } from './help';
import { clear } from './clear';
import { whoami } from './whoami';
import { echo } from './echo';
import { pwd } from './pwd';
import { ls } from './ls';
import { cd } from './cd';
import { cat } from './cat';
import { tree } from './tree';
import { open } from './open';
import { theme } from './theme';
import { version } from './version';
import { resume } from './resume';

export const commandList: Command[] = [
  help,
  clear,
  whoami,
  echo,
  pwd,
  ls,
  cd,
  cat,
  tree,
  open,
  theme,
  version,
  resume,
];

export function buildRegistry(): Map<string, Command> {
  const m = new Map<string, Command>();
  for (const c of commandList) m.set(c.name, c);
  return m;
}

export const PATH_COMMANDS = new Set(['ls', 'cd', 'cat', 'tree', 'open']);
