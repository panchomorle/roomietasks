export function formatPoints(points: number | string, language: 'en' | 'es'): string {
  if (points === undefined || points === null) return '';

  const numericPoints = typeof points === 'string' ? parseFloat(points) : points;
  if (isNaN(numericPoints)) return '';

  return new Intl.NumberFormat(language === 'es' ? 'es-ES' : 'en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(numericPoints);
}
