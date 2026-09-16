export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatBirthday(month: number | null, day: number | null): string | null {
  if (!month || !day) return null;
  return `${MONTHS[month - 1]} ${day}`;
}
