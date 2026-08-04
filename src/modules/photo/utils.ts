/** "2026-05-02" → "02.05.2026" */
export function formatPhotoDate(date: string) {
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return date;
  return `${day}.${month}.${year}`;
}

export function formatWeight(weight: string | null) {
  if (!weight) return "No weight logged";

  const numeric = Number.parseFloat(weight);
  if (Number.isNaN(numeric)) return `${weight}`;

  return `${numeric} kg`;
}
