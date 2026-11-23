/** TMDB's department is canonical; job matching covers feeds with incomplete departments. */
export function writingCreditPredicate(alias: string): string {
  const job = `LOWER(BTRIM(${alias}.job))`;
  const department = `LOWER(BTRIM(${alias}.department))`;
  return `(${job} NOT LIKE '%storyboard%' AND ${job} NOT LIKE '%script supervisor%'
    AND ${job} NOT LIKE '%script coordinator%'
    AND (${department} = 'writing' OR ${job} LIKE '%writ%' OR ${job} LIKE '%screenplay%'
      OR ${job} LIKE '%screenstory%' OR ${job} LIKE '%teleplay%' OR ${job} LIKE '%story%'
      OR ${job} LIKE '%script%'))`;
}
