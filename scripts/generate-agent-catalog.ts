import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { publicAgentCatalog } from '../apps/web/src/lib/public-surfaces';

const outputPath = resolve('apps/web/public/api-ai.json');

async function main() {
  await writeFile(outputPath, `${JSON.stringify(publicAgentCatalog(), null, 2)}\n`, 'utf8');
  process.stdout.write('Generated EverythingRated public agent catalog.\n');
}

void main();
