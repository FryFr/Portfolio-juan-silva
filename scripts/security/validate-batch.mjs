import { isIP } from 'node:net';

export const MAX_FILE_BYTES = 128 * 1024;
export const MAX_BATCH_BYTES = 1024 * 1024;
export const MAX_FILES = 100;

const exactKeys = (value, keys) =>
  value !== null &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === [...keys].sort().join(',');

// Deliberately a restricted data format: generated Markdown is never compiled as MDX here.
const safePath = (path) =>
  typeof path === 'string' &&
  path.length <= 200 &&
  /^generated\/(?:[a-z0-9][a-z0-9_-]*\/)*[a-z0-9][a-z0-9_.-]*\.(?:md|mdx|json)$/.test(path) &&
  !path.includes('..');

const secret =
  /-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:AKIA|ASIA)[A-Z0-9]{16}\b|\b(?:gh[pousr]_|github_pat_|sk-(?:proj-)?|xox[baprs]-)[a-zA-Z0-9_-]{12,}|\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+|\b(?:password|passwd|secret|token|api[_ -]?key|authorization)\s*["']?\s*[:=]\s*["']?\S+/i;
const injection =
  /(?:ignore|disregard|override|forget|ignora|omite|olvida)[\s\S]{0,80}(?:instructions?|previous|system|rules?|instrucciones|anteriores|sistema)|(?:system|developer|assistant)\s*:|\[\/?INST\]|<\|.*?\|>|(?:reveal|exfiltrate|send|revela|envía)[\s\S]{0,60}(?:secrets?|credentials?|tokens?|contraseñas)|(?:disable|bypass|desactiva|evade)[\s\S]{0,40}(?:validation|safety|validaci[oó]n)/i;
const internal =
  /\b(?:localhost|[a-z0-9_-]+(?:\.[a-z0-9_-]+)*\.(?:local|internal|intranet|corp|lan|home|test|invalid))\b/i;
const privatePath =
  /(?:^|[\s"'(=])(?:\/(?:Users|home|etc|var|private|tmp|root|proc|sys|mnt)\/|[a-z]:[\\/]|\\\\)|(?:^|[\s/\\])\.\.(?:[\\/]|$)/im;

function scan(text, add, markdown) {
  const normalized = text.normalize('NFKC');
  if (secret.test(normalized)) add('SECRET');
  if (injection.test(normalized)) add('PROMPT_INJECTION');
  if (internal.test(normalized)) add('INTERNAL_DOMAIN');
  if (privatePath.test(normalized)) add('PRIVATE_PATH');
  if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(normalized)) add('IP_ADDRESS');
  for (const token of normalized.split(/[\s()[\]<>"',;]+/)) {
    if (isIP(token) || (token.includes(':') && isIP(token.split('%')[0]))) add('IP_ADDRESS');
  }
  // No encoded syntax or invisible controls: do not let a downstream parser reinterpret data.
  if (
    // biome-ignore lint/suspicious/noControlCharactersInRegex: this denylist intentionally covers invisible controls.
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]|%[0-9a-f]{2}|&(?:#\w+|[a-z]+);/i.test(
      normalized,
    )
  )
    add('ENCODED_CONTENT');
  if (markdown && /[{}<>\\]|^\s*(?:import|export)\b/im.test(normalized)) add('EXECUTABLE_MDX');
  if (/(?:javascript|vbscript|data|file|blob|ftp|http)\s*:|(?:^|[\s("'])\/\//im.test(normalized))
    add('DANGEROUS_LINK');
  // Every explicit URI scheme must be HTTPS, including links in JSON/frontmatter/code fences.
  for (const match of normalized.matchAll(/\b([a-z][a-z0-9+.-]*):([^\s<>"')\]]+)/gi)) {
    const [raw, scheme] = match;
    if (scheme.toLowerCase() !== 'https') {
      add('DANGEROUS_LINK');
      continue;
    }
    try {
      const url = new URL(raw);
      const host = url.hostname.replace(/^\[|\]$/g, '');
      if (isIP(host)) add('IP_ADDRESS');
      if (
        url.username ||
        url.password ||
        url.port ||
        !host.includes('.') ||
        internal.test(host) ||
        host.endsWith('.')
      )
        add('DANGEROUS_LINK');
    } catch {
      add('DANGEROUS_LINK');
    }
  }
}

/** Pure, fail-closed validation. Findings contain codes and indexes, never source values. */
export function validateBatch(batch) {
  const findings = [];
  const add = (file, code) => findings.push({ file, code });
  if (
    !exactKeys(batch, ['version', 'files']) ||
    batch.version !== 1 ||
    !Array.isArray(batch.files)
  ) {
    add(null, 'INVALID_MANIFEST');
  } else if (batch.files.length === 0 || batch.files.length > MAX_FILES) {
    add(null, 'FILE_COUNT');
  } else {
    const paths = new Set();
    let bytes = 0;
    batch.files.forEach((file, index) => {
      const report = (code) => add(index, code);
      if (!exactKeys(file, ['path', 'content']) || typeof file.content !== 'string') {
        report('INVALID_FILE');
        return;
      }
      if (!safePath(file.path)) report('OUTSIDE_GENERATED');
      if (paths.has(file.path)) report('DUPLICATE_PATH');
      paths.add(file.path);
      const size = Buffer.byteLength(file.content, 'utf8');
      bytes += size;
      if (size > MAX_FILE_BYTES) report('FILE_TOO_LARGE');
      else {
        scan(file.content, report, !String(file.path).endsWith('.json'));
        if (String(file.path).endsWith('.json')) {
          try {
            // Scan decoded strings too, preventing JSON unicode escapes from hiding attacks.
            const visit = (value, depth = 0) => {
              if (depth > 32) throw new Error('depth');
              if (typeof value === 'string') scan(value, report, true);
              else if (value && typeof value === 'object') {
                for (const [key, child] of Object.entries(value)) {
                  scan(key, report, true);
                  visit(child, depth + 1);
                }
              }
            };
            visit(JSON.parse(file.content));
          } catch {
            report('INVALID_JSON');
          }
        }
      }
    });
    if (bytes > MAX_BATCH_BYTES) add(null, 'BATCH_TOO_LARGE');
  }
  const unique = [...new Map(findings.map((item) => [`${item.file}:${item.code}`, item])).values()];
  unique.sort(
    (a, b) => (a.file ?? -1) - (b.file ?? -1) || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0),
  );
  return {
    version: 1,
    ok: unique.length === 0,
    accepted: unique.length === 0 ? batch.files.length : 0,
    findings: unique,
  };
}

export function validateInput(input) {
  const fail = (code) => ({ version: 1, ok: false, accepted: 0, findings: [{ file: null, code }] });
  if (Buffer.byteLength(input, 'utf8') > MAX_BATCH_BYTES) return fail('BATCH_TOO_LARGE');
  try {
    return validateBatch(JSON.parse(input));
  } catch {
    return fail('INVALID_MANIFEST');
  }
}
