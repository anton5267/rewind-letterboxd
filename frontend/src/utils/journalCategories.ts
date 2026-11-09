export const journalCategories = ["News", "Awards", "Community", "Interviews", "Platform", "Podcasts", "Newsletter"] as const;

export function isJournalCategory(value: string): boolean {
  return journalCategories.some(category => category === value);
}

export function isNewsletterCategory(value: string): boolean {
  const category = value.trim().toLowerCase();
  return category === "newsletter" || category === "бюлетень";
}
