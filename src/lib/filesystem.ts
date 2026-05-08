const rawFiles = import.meta.glob('/src/portfolio/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export type FileNode = { type: 'file'; name: string; content: string };
export type DirNode = { type: 'dir'; name: string; children: Record<string, FsNode> };
export type FsNode = FileNode | DirNode;

function buildRoot(): DirNode {
  const r: DirNode = { type: 'dir', name: '', children: {} };
  for (const [key, content] of Object.entries(rawFiles)) {
    const rel = key.replace(/^\/src\/portfolio\//, '');
    const parts = rel.split('/');
    let cur: DirNode = r;
    for (let i = 0; i < parts.length - 1; i++) {
      const seg = parts[i];
      const existing = cur.children[seg];
      if (!existing) {
        const dir: DirNode = { type: 'dir', name: seg, children: {} };
        cur.children[seg] = dir;
        cur = dir;
      } else if (existing.type === 'dir') {
        cur = existing;
      } else {
        throw new Error(`virtual fs path conflict at ${seg}`);
      }
    }
    const filename = parts[parts.length - 1];
    cur.children[filename] = { type: 'file', name: filename, content };
  }
  return r;
}

export const root: DirNode = buildRoot();

export function splitPath(path: string): string[] {
  return path.split('/').filter((p) => p.length > 0);
}

export function normalize(parts: string[]): string[] {
  const out: string[] = [];
  for (const p of parts) {
    if (p === '.') continue;
    if (p === '..') {
      if (out.length > 0) out.pop();
    } else {
      out.push(p);
    }
  }
  return out;
}

export function resolvePath(cwd: string[], target: string): string[] {
  const isAbsolute = target.startsWith('/');
  const startParts = isAbsolute ? [] : [...cwd];
  const targetParts = splitPath(target);
  return normalize([...startParts, ...targetParts]);
}

export function getNode(parts: string[]): FsNode | null {
  let cur: FsNode = root;
  for (const seg of parts) {
    if (cur.type !== 'dir') return null;
    const next: FsNode | undefined = cur.children[seg];
    if (!next) return null;
    cur = next;
  }
  return cur;
}

export function pathToString(parts: string[]): string {
  return '/' + parts.join('/');
}

export function listDirEntries(node: DirNode): { name: string; isDir: boolean }[] {
  return Object.values(node.children)
    .map((c) => ({ name: c.name, isDir: c.type === 'dir' }))
    .sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}
