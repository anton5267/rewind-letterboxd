export const journalCategories = ["News", "Awards", "Community", "Interviews", "Platform", "Podcasts", "Newsletter"] as const;

export function isJournalCategory(value: string): boolean {
  return journalCategories.some(category => category === value);
}
