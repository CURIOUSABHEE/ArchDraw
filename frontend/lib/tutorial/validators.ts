import logger from '@/lib/logger';
export function validateAllTutorials(tutorials: { id?: string; title?: string }[]): void {
  if (process.env.NODE_ENV !== 'development') return;
  for (const t of tutorials) {
    if (!t.id) logger.warn('[validateAllTutorials] Tutorial missing id:', t);
    if (!t.title) logger.warn(`[validateAllTutorials] Tutorial "${t.id}" missing title`);
  }
}
