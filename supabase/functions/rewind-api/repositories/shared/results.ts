

export function safeId(value: string, label: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error(`${label} is outside the safe JSON integer range.`);
  return id;
}

export function pageResult<T>(content: T[], total: string | number, page: number, size: number) {
  const totalElements = Number(total);
  return { content, totalPages: Math.ceil(totalElements / size), totalElements, number: page };
}
