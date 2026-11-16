import type { Confidence, Field } from '../types';

export const f = <T = string>(value: T, confidence: Confidence, source?: string, note?: string): Field<T> => ({
  value,
  confidence,
  ...(source ? { source } : {}),
  ...(note ? { note } : {}),
});
export const hi = <T = string>(value: T, source?: string, note?: string) => f(value, 'high', source, note);
export const med = <T = string>(value: T, source?: string, note?: string) => f(value, 'medium', source, note);
export const lo = <T = string>(value: T, source?: string, note?: string) => f(value, 'low', source, note);

export function isField(x: unknown): x is Field<unknown> {
  return !!x && typeof x === 'object' && 'value' in (x as object) && 'confidence' in (x as object);
}
