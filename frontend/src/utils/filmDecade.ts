export function getFilmDecade(releaseDate: string | null): number | null {
  const year = releaseDate?.match(/^(\d{4})-/)?.[1];
  if (year === undefined) return null;
  return Math.floor(Number(year) / 10) * 10;
}
