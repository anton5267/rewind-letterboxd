export const getLastPageIndex = (totalPages: number) => Math.max(0, totalPages - 1);

export const isPageOutOfRange = (page: number, totalPages: number) => page > getLastPageIndex(totalPages);
