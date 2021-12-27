export type Pagination = {
  before?: string;
  after?: string;
  take?: number;
};

export type Page<T> = {
  items: T[];
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string;
  endCursor: string;
};

export type IdCollection = {
  add?: Set<string>;
  remove?: Set<string>;
  set?: Set<string>;
};
