import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

import { generateERC20Options } from './erc20';
import { buildGeneric } from '../build-generic';
import { printContract } from '../print';

function* generateSources(): Generator<string> {
  for (const opts of generateERC20Options()) {
    yield printContract(buildGeneric({ kind: 'ERC20', ...opts }));
  }
}

export async function writeGeneratedSources(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });

  for (const source of generateSources()) {
    const name = crypto
      .createHash('sha1')
      .update(source)
      .digest()
      .toString('hex');

    await fs.writeFile(path.format({ dir, name, ext: '.sol' }), source);
  }
}
