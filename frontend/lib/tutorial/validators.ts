export function validateAllTutorials(tutorials: { id?: string; title?: string }[]): void {
  if (process.env.NODE_ENV !== 'development') return;
  for (const t of tutorials) {
    if (!t.id) console.warn('[validateAllTutorials] Tutorial missing id:', t);
    if (!t.title) console.warn(`[validateAllTutorials] Tutorial "${t.id}" missing title`);
  }
}
