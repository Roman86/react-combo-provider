export function makeProp<K extends string, V>(k: K, v: V): Record<K, V> {
  return {
    [k]: v,
  } as const as Record<K, V>;
}

type Pair<K, V> = readonly [K, V];
type Pairs = ReadonlyArray<Pair<string, unknown>>;

// biome-ignore lint/suspicious/noExplicitAny: doesn't matter here
type InfK<P> = P extends Pair<infer K, any> ? K : never;
// biome-ignore lint/suspicious/noExplicitAny: doesn't matter here
type InfV<P> = P extends Pair<any, infer V> ? V : never;

export type MakeFromProps<Props extends Pairs> = {
  [I in Props[number] as InfK<I>]: InfV<I>;
};

export function makeFromProps<P extends Pairs>(pairs: P): MakeFromProps<P> {
  return Object.fromEntries(pairs) as MakeFromProps<P>;
}
