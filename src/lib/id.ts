let n = 0;
export function uid(prefix = 'id'): string {
  n += 1;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${n}`;
}
export const nowIso = () => new Date().toISOString();
