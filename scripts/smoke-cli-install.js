import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function quoteCmd(value) {
  const text = String(value);
  if (!/[\s"]/u.test(text)) return text;
  return `"${text.replaceAll('"', '""')}"`;
}

function spawnTarget(command, args) {
  if (process.platform === 'win32' && command.toLowerCase().endsWith('.cmd')) {
    return {
      command: process.env.ComSpec ?? 'cmd.exe',
      args: ['/d', '/s', '/c', [command, ...args].map(quoteCmd).join(' ')]
    };
  }
  return { command, args };
}

function run(command, args, options = {}) {
  const target = spawnTarget(command, args);
  const result = spawnSync(target.command, target.args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    ...options
  });
  if (result.error || result.status !== 0) {
    const details = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`${command} ${args.join(' ')} failed${result.error ? `: ${result.error.message}` : ''}${details ? `:\n${details}` : ''}`);
  }
  return result;
}

function parsePackOutput(stdout) {
  const match = stdout.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/);
  if (!match) throw new Error(`Could not find npm pack JSON in output:\n${stdout}`);
  return JSON.parse(match[0]);
}

function packageBin(prefix) {
  return process.platform === 'win32'
    ? path.join(prefix, 'presentationkit.cmd')
    : path.join(prefix, 'bin', 'presentationkit');
}

const tempDir = await mkdtemp(path.join(tmpdir(), 'presentationkit-cli-'));

try {
  const pack = run(npmCommand, ['pack', '--json', '--pack-destination', tempDir], { capture: true });
  const [packed] = parsePackOutput(pack.stdout);
  const tarball = path.join(tempDir, packed.filename);
  const packedFiles = new Set(packed.files.map((file) => file.path));

  if (!packedFiles.has('dist/cli.js')) {
    throw new Error('npm pack did not include dist/cli.js; the presentationkit binary would not install.');
  }

  run(npmCommand, ['exec', '--yes', '--package', tarball, '--', 'presentationkit', '--help']);

  const prefix = path.join(tempDir, 'prefix');
  run(npmCommand, ['install', '--global', '--prefix', prefix, tarball, '--no-audit', '--no-fund']);

  const bin = packageBin(prefix);
  if (!existsSync(bin)) {
    throw new Error(`Expected npm to create the presentationkit command at ${bin}`);
  }

  run(bin, ['--help']);
  run(bin, ['validate', 'examples/operational-ai-support.deck.json']);

  const deckOut = path.join(tempDir, 'out', 'smoke.pptx');
  const diagramDir = path.join(tempDir, 'out', 'diagrams');
  const manifestOut = path.join(tempDir, 'out', 'render-manifest.json');
  run(bin, [
    'build',
    'examples/operational-ai-support.deck.json',
    '--out',
    deckOut,
    '--diagrams',
    diagramDir,
    '--manifest-out',
    manifestOut,
    '--deterministic'
  ]);

  for (const requiredPath of [deckOut, manifestOut]) {
    if (!existsSync(requiredPath)) throw new Error(`Expected CLI smoke output was not written: ${requiredPath}`);
  }

  console.log('CLI install smoke passed.');
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
