export type PrintOpts = { html?: boolean; cls?: string };

export type CommandContext = {
  cwd: string[];
  setCwd: (parts: string[]) => void;
  print: (line: string, opts?: PrintOpts) => void;
  clear: () => void;
  args: string[];
  raw: string;
  registry: () => Map<string, Command>;
  setTheme: (name: string) => boolean;
  buildCommitSha: string;
};

export type Command = {
  name: string;
  description: string;
  usage?: string;
  run: (ctx: CommandContext) => void | Promise<void>;
};
