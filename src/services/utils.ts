export type Mapping<Source, Target> = {
  [P in keyof Target]:
    | keyof PickByType<Source, Target[P]>
    | ((source: Source) => Target[P]);
};

export type KeysOfType<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
}[keyof Base];

export type OmitByType<Base, Condition> = Omit<
  Base,
  KeysOfType<Base, Condition>
>;

export type PickByType<Base, Condition> = Pick<
  Base,
  KeysOfType<Base, Condition>
>;

export type MapTarget<Source> = {
  using: <Target>(mapping: Mapping<Source, Target>) => Target;
};
export type MapSource<Source> = (from: Source) => MapTarget<Source>;

export const map = <Source>(source: Source): MapTarget<Source> => ({
  using: <S, Target>(mapping: Mapping<S, Target>) => {
    const target = {} as Target;
    for (const targetKey of Object.keys(mapping)) {
      const value = mapping[targetKey];
      if (typeof value === 'string') {
        const sourceKey = value;
        target[targetKey] = source[sourceKey];
      } else if (typeof value === 'function') {
        const fn = value;
        target[targetKey] = fn(source);
      }
    }

    return target;
  },
});

export const using =
  <Source, Target>(mapping: Mapping<Source, Target>) =>
  (source: Source) =>
    map(source).using(mapping);

export function parsePage(
  defaultCount: number,
  page: {
    first?: number;
    after?: string;
    last?: number;
    before?: string;
  },
): {
  uniqueId?: string;
  direction: 'forward' | 'backward';
  count: number;
  limit: number;
} {
  if (typeof page.first === 'number' || typeof page.after === 'string') {
    const count = page.first || defaultCount;
    return {
      count,
      uniqueId: page.after,
      limit: page.after ? count + 2 : count + 1,
      direction: 'forward',
    };
  } else if (typeof page.last === 'number' || typeof page.before === 'string') {
    const count = page.last || defaultCount;
    return {
      count,
      uniqueId: page.before,
      limit: page.before ? count + 2 : count + 1,
      direction: 'backward',
    };
  }

  return {
    count: defaultCount,
    limit: defaultCount + 1,
    direction: 'forward',
  };
}

export function buildPage<T>(
  items: T[],
  count: number,
  usedCursor: boolean,
  direction: 'forward' | 'backward',
  getUniqueId: (item: T | null | undefined) => string,
): {
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
  hasNextPage: boolean;
  items: T[];
} {
  const previous = usedCursor ? items[0] : undefined;
  const next: T | undefined = usedCursor ? items[count + 1] : items[count];
  const data = usedCursor ? items.slice(1, count + 1) : items.slice(0, count);

  const first: T | undefined = data[0];
  const last: T | undefined = data[data.length - 1];

  if (direction === 'forward') {
    return {
      items: data,
      hasNextPage: !!next,
      hasPreviousPage: !!previous,
      startCursor: getUniqueId(first),
      endCursor: getUniqueId(last),
    };
  } else {
    return {
      items: data.reverse(),
      hasNextPage: !!previous,
      hasPreviousPage: !!next,
      startCursor: getUniqueId(first),
      endCursor: getUniqueId(last),
    };
  }
}
