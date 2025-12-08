export function normalizeObsActionType(raw: string | undefined | null): string {
  if (!raw) return '';
  // Accept PascalCase (SetCurrentProgramScene), snake_case, kebab-case, or camelCase
  // Convert to lower-case camelCase-type used in codebase (setCurrentProgramScene)
  const cleaned = String(raw).trim();
  if (cleaned.includes('_') || cleaned.includes('-')) {
    // snake_case or kebab-case -> lower camelCase words
    const parts = cleaned.replace(/-/g, '_').split('_').filter(Boolean);
    return parts.map((p, i) => i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1)).join('');
  }
  // If PascalCase, convert first char to lower-case
  if (/^[A-Z]/.test(cleaned)) {
    return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
  }
  // Already lowercased camelCase -> return as-is
  return cleaned;
}
