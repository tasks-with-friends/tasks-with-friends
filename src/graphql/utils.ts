import { Maybe } from 'graphql/jsutils/Maybe';
import { Page, Pagination } from '../domain/utils';
import { PageInfo } from '../domain/v1/graph.g';

export function nullable<T>(value: Maybe<T>): T | null {
  if (value === null) return null;
  if (typeof value === 'undefined') return null;
  return value;
}

export function paginate({
  after,
  before,
  first,
  last,
}: {
  first: number | null;
  last: number | null;
  after: string | null;
  before: string | null;
}): Pagination {
  return {
    after: after || undefined,
    before: before || undefined,
    take: first || last || undefined,
  };
}

export function pageInfo<T>(page: Page<T>): PageInfo {
  return {
    endCursor: page.endCursor,
    hasNextPage: page.hasNextPage,
    hasPreviousPage: page.hasPreviousPage,
    startCursor: page.startCursor,
  };
}
