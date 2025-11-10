export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (mainly tests)
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
