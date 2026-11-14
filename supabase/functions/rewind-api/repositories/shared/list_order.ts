export function listItemOrder(listType: string, alias: "i" | "li"): string {
  return listType === "FAVORITES"
    ? `${alias}.position ASC NULLS LAST, ${alias}.added_at DESC, ${alias}.id DESC`
    : `${alias}.position ASC NULLS LAST, ${alias}.id ASC`;
}

