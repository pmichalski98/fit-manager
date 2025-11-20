export function formatWeight(weight: string | null) {
  if (!weight) return "No weight logged";

  const numeric = Number.parseFloat(weight);
  if (Number.isNaN(numeric)) return `${weight}`;

  return `${numeric} kg`;
}
