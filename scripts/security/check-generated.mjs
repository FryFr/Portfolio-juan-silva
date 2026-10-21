import { MAX_BATCH_BYTES, validateInput } from './validate-batch.mjs';

// Bounded stdin only; no filesystem writes, network access, MDX execution or publication.
const chunks = [];
let size = 0;
for await (const chunk of process.stdin) {
  size += chunk.length;
  if (size > MAX_BATCH_BYTES) break;
  chunks.push(chunk);
}
const result =
  size > MAX_BATCH_BYTES
    ? { version: 1, ok: false, accepted: 0, findings: [{ file: null, code: 'BATCH_TOO_LARGE' }] }
    : validateInput(Buffer.concat(chunks).toString('utf8'));
process.stdout.write(`${JSON.stringify(result)}\n`);
process.exitCode = result.ok ? 0 : 1;
