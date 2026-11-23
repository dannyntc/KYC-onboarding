// Screen wording for the stored draft mode/model codes ('fixture', 'live'). The codes stay unchanged in the database.
export function modeLabel(code: string): string {
  if (code === 'fixture') return 'template';
  if (code === 'live') return 'AI';
  return code;
}
