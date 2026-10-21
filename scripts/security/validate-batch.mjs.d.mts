export const MAX_BATCH_BYTES: number;
export const MAX_FILE_BYTES: number;
export function validateBatch(batch: unknown): {
  version: 1;
  ok: boolean;
  accepted: number;
  findings: Array<{ file: number | null; code: string }>;
};
export function validateInput(input: string): ReturnType<typeof validateBatch>;
