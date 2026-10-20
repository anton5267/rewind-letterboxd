/** Shared response envelopes used by paginated API resources. */
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}

export interface NumberedPage<T> extends Page<T> {
  number: number;
}
