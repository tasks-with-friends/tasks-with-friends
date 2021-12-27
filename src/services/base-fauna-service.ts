import { Expr, query as q } from 'faunadb';
import { CursorProvider } from '../domain/cursor-provider';
import { Page, Pagination } from '../domain/utils';

export type FaunaResponse<T> = {
  before: string;
  after: string;
  take: number;
  data: T[];
};

export type FaunaPagingExpr = {
  size: number;
  before?: Expr[] | undefined;
  after?: Expr[] | undefined;
};

export abstract class BaseFaunaService<T> implements CursorProvider<T> {
  constructor(
    protected readonly collection: string,
    protected readonly defaultPageSize: number = 25,
  ) {}

  abstract getCursor(obj: T | null | undefined): string;

  protected pagingExpr(page: Pagination | undefined): FaunaPagingExpr {
    const take = (page?.take || this.defaultPageSize) + 1;
    const pageObject: { size: number; before?: Expr[]; after?: Expr[] } = {
      size: take,
    };

    if (page?.after) {
      pageObject.after = [q.Ref(q.Collection(this.collection), page.after)];
    } else if (page?.before) {
      pageObject.before = [q.Ref(q.Collection(this.collection), page.before)];
    }

    return pageObject;
  }

  protected toPage(
    page: Pagination | undefined,
    response: FaunaResponse<T>,
  ): Page<T> {
    if (page?.after) {
      const items = response.data.slice(1);
      return {
        items,
        hasNextPage: !!response.after,
        hasPreviousPage: !!response.before,
        endCursor: this.getCursor(items[items.length - 1]),
        startCursor: this.getCursor(items[0]),
      };
    } else if (page?.before) {
      const ct = response.data.length;
      const items =
        ct === response.take
          ? response.data.slice(1, response.take)
          : response.data;

      return {
        items,
        hasNextPage: ct === response.take,
        hasPreviousPage: !!response.after,
        endCursor: this.getCursor(items[items.length - 1]),
        startCursor: this.getCursor(items[0]),
      };
    } else {
      if (!response.data.length) {
        return {
          items: [],
          hasPreviousPage: false,
          startCursor: this.getCursor(null),
          endCursor: this.getCursor(null),
          hasNextPage: false,
        };
      } else if (response.data.length < response.take) {
        const items = response.data;
        return {
          items: items,
          hasPreviousPage: false,
          startCursor: this.getCursor(items[0]),
          endCursor: this.getCursor(items[items.length - 1]),
          hasNextPage: false,
        };
      } else {
        const items = response.data.slice(0, response.take - 1);
        return {
          items,
          hasPreviousPage: !!response.before,
          startCursor: this.getCursor(items[0]),
          endCursor: this.getCursor(items[items.length - 1]),
          hasNextPage: !!response.after,
        };
      }
    }
  }
}
